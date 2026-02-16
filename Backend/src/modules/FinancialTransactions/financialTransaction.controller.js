import FinancialReceipt from "./models/financialReceipt.model.js";
import FinancialDisbursement from "./models/financialDisbursement.model.js";
import FinancialTransfer from "./models/financialTransfer.model.js";
import { safeModel } from "../Safes/safe.model.js";
import { bankAccountModel } from "../BankAccounts/bankAccount.model.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";
import { AppError } from "../../utils/AppError.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../../utils/cloudinary.js";

// Helper to get correct model
const getModel = (type) => {
    switch (type) {
        case 'receipt': return FinancialReceipt;
        case 'disbursement': return FinancialDisbursement;
        case 'transfer': return FinancialTransfer;
        default: throw new Error("Invalid transaction type");
    }
};

// Helper up update balance
const updateBalance = async (modelName, accountId, amount) => {
    const Model = modelName === 'Safe' ? safeModel : bankAccountModel;
    await Model.findByIdAndUpdate(accountId, { $inc: { balance: amount } });
};

const createFinancialTransaction = catchAsyncError(async (req, res, next) => {
    const { type, ...rest } = req.body;
    const companyId = req.user.companyId;
    const Model = getModel(type);

    // Check code uniqueness across all three models to prevent duplicates
    const checkPromises = [
        FinancialReceipt.findOne({ code: rest.code, companyId }),
        FinancialDisbursement.findOne({ code: rest.code, companyId }),
        FinancialTransfer.findOne({ code: rest.code, companyId })
    ];
    const existing = await Promise.all(checkPromises);
    if (existing.some(e => e)) return next(new AppError("رقم المعاملة موجود بالفعل", 409));

    const data = { ...rest };

    // Safely parse attachments if they come as a JSON string
    if (typeof data.attachments === 'string') {
        try {
            data.attachments = JSON.parse(data.attachments);
        } catch (e) {
            data.attachments = [];
        }
    }

    // Handle new uploads
    if (req.files && req.files.attachments) {
        const uploadPromises = req.files.attachments.map(file => uploadToCloudinary(file.buffer, 'financial_transactions'));
        const results = await Promise.all(uploadPromises);
        const newAttachments = results.map((result, index) => ({
            fileName: req.files.attachments[index].originalname,
            fileUrl: result.secure_url,
            publicId: result.public_id,
            uploadedAt: new Date()
        }));
        data.attachments = [...(data.attachments || []), ...newAttachments];
    }

    const transaction = await Model.create({
        ...data,
        companyId,
        createdBy: req.user._id
    });

    // Update balances
    if (type === 'receipt') {
        await updateBalance(transaction.accountModel, transaction.account, transaction.amount);
    } else if (type === 'disbursement') {
        await updateBalance(transaction.accountModel, transaction.account, -transaction.amount);
    } else if (type === 'transfer') {
        await updateBalance(transaction.fromAccountModel, transaction.fromAccount, -transaction.amount);
        await updateBalance(transaction.toAccountModel, transaction.toAccount, transaction.amount);
    }

    res.status(201).json({ message: "تم الإنشاء بنجاح", transaction: { ...transaction.toObject(), type } });
});

const getAllFinancialTransactions = catchAsyncError(async (req, res) => {
    const { type, search, startDate, endDate } = req.query;
    const filter = { deletedAt: null, ...req.companyFilter };

    if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = new Date(startDate);
        if (endDate) {
            const d = new Date(endDate);
            d.setHours(23, 59, 59, 999);
            filter.date.$lte = d;
        }
    }
    if (search) {
        filter.$or = [
            { code: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { externalAccount: { $regex: search, $options: 'i' } }
        ];
    }

    let transactions = [];
    if (type) {
        transactions = await getModel(type).find(filter)
            .populate('account')
            .populate('fromAccount')
            .populate('toAccount')
            .lean();
        transactions = transactions.map(t => ({ ...t, type }));
    } else {
        // Aggregate all types
        const [receipts, disbursements, transfers] = await Promise.all([
            FinancialReceipt.find(filter).populate('account').lean(),
            FinancialDisbursement.find(filter).populate('account').lean(),
            FinancialTransfer.find(filter).populate('fromAccount').populate('toAccount').lean()
        ]);

        transactions = [
            ...receipts.map(t => ({ ...t, type: 'receipt' })),
            ...disbursements.map(t => ({ ...t, type: 'disbursement' })),
            ...transfers.map(t => ({ ...t, type: 'transfer' }))
        ];
    }

    // Sort combined results
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date) || new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ results: transactions.length, transactions });
});

const getOneTransaction = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const { type } = req.query;

    if (!type) {
        const [r, d, t] = await Promise.all([
            FinancialReceipt.findOne({ _id: id, ...req.companyFilter }).populate('account').lean(),
            FinancialDisbursement.findOne({ _id: id, ...req.companyFilter }).populate('account').lean(),
            FinancialTransfer.findOne({ _id: id, ...req.companyFilter }).populate('fromAccount').populate('toAccount').lean()
        ]);
        const found = r ? { ...r, type: 'receipt' } : (d ? { ...d, type: 'disbursement' } : (t ? { ...t, type: 'transfer' } : null));
        if (!found) return next(new AppError("المعاملة غير موجودة", 404));
        return res.json({ transaction: found });
    }

    const Model = getModel(type);
    let query = Model.findOne({ _id: id, ...req.companyFilter });

    if (type === 'transfer') {
        query = query.populate('fromAccount').populate('toAccount');
    } else {
        query = query.populate('account');
    }

    const transaction = await query.lean();

    if (!transaction) return next(new AppError("المعاملة غير موجودة", 404));
    res.json({ transaction: { ...transaction, type } });
});

const updateFinancialTransaction = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const { type } = req.body; // type is required in body for refactoring
    const Model = getModel(type);

    const transaction = await Model.findOne({ _id: id, ...req.companyFilter });
    if (!transaction) return next(new AppError("المعاملة غير موجودة", 404));

    const oldData = {
        amount: transaction.amount,
        account: transaction.account,
        accountModel: transaction.accountModel,
        fromAccount: transaction.fromAccount,
        fromAccountModel: transaction.fromAccountModel,
        toAccount: transaction.toAccount,
        toAccountModel: transaction.toAccountModel
    };

    const newData = { ...req.body };

    // Safely parse attachments if they come as a JSON string
    if (typeof newData.attachments === 'string') {
        try {
            newData.attachments = JSON.parse(newData.attachments);
        } catch (e) {
            newData.attachments = [];
        }
    }

    // Reverse old balance impact
    if (type === 'receipt') {
        await updateBalance(oldData.accountModel, oldData.account, -oldData.amount);
    } else if (type === 'disbursement') {
        await updateBalance(oldData.accountModel, oldData.account, oldData.amount);
    } else if (type === 'transfer') {
        await updateBalance(oldData.fromAccountModel, oldData.fromAccount, oldData.amount);
        await updateBalance(oldData.toAccountModel, oldData.toAccount, -oldData.amount);
    }

    // Handle attachments
    if (req.files && req.files.attachments) {
        const uploadPromises = req.files.attachments.map(file => uploadToCloudinary(file.buffer, 'financial_transactions'));
        const results = await Promise.all(uploadPromises);
        const newAttachments = results.map((result, index) => ({
            fileName: req.files.attachments[index].originalname,
            fileUrl: result.secure_url,
            publicId: result.public_id,
            uploadedAt: new Date()
        }));
        newData.attachments = [...(newData.attachments || []), ...newAttachments];
    }

    if (newData.attachments && Array.isArray(newData.attachments)) {
        const existing = transaction.attachments || [];
        const newIds = new Set(newData.attachments.map(a => a.publicId).filter(Boolean));
        for (const a of existing) {
            if (a.publicId && !newIds.has(a.publicId)) {
                await deleteFromCloudinary(a.publicId);
            }
        }
    }

    Object.assign(transaction, newData);
    transaction.lastModifiedBy = req.user._id;
    await transaction.save();

    // Apply new balance impact
    if (type === 'receipt') {
        await updateBalance(transaction.accountModel, transaction.account, transaction.amount);
    } else if (type === 'disbursement') {
        await updateBalance(transaction.accountModel, transaction.account, -transaction.amount);
    } else if (type === 'transfer') {
        await updateBalance(transaction.fromAccountModel, transaction.fromAccount, -transaction.amount);
        await updateBalance(transaction.toAccountModel, transaction.toAccount, transaction.amount);
    }

    res.json({ message: "تم التعديل بنجاح", transaction: { ...transaction.toObject(), type } });
});

const deleteFinancialTransaction = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const { type } = req.query; // Need type for deletion

    if (!type) return next(new AppError("نوع المعاملة مطلوب", 400));

    const Model = getModel(type);
    const transaction = await Model.findOne({ _id: id, ...req.companyFilter });
    if (!transaction) return next(new AppError("المعاملة غير موجودة", 404));

    // Reverse balance impact
    if (type === 'receipt') {
        await updateBalance(transaction.accountModel, transaction.account, -transaction.amount);
    } else if (type === 'disbursement') {
        await updateBalance(transaction.accountModel, transaction.account, transaction.amount);
    } else if (type === 'transfer') {
        await updateBalance(transaction.fromAccountModel, transaction.fromAccount, transaction.amount);
        await updateBalance(transaction.toAccountModel, transaction.toAccount, -transaction.amount);
    }

    transaction.deletedAt = new Date();
    transaction.deletedBy = req.user._id;
    await transaction.save();

    res.json({ message: "تم الحذف بنجاح" });
});

export {
    createFinancialTransaction,
    getAllFinancialTransactions,
    getOneTransaction,
    updateFinancialTransaction,
    deleteFinancialTransaction
};
