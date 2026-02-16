import { expenseModel } from "./expense.model.js"
import { AppError } from "../../utils/AppError.js"
import { catchAsyncError } from "../../middleware/catchAsyncError.js"
import { uploadToCloudinary, deleteFromCloudinary } from "../../utils/cloudinary.js"


const addExpense = catchAsyncError(async (req, res, next) => {
    const expenseData = { ...req.body };

    // Handle multiple file uploads for attachments
    const files = req.files?.attachments || [];
    if (files.length > 0) {
        const attachments = [];
        for (const file of files) {
            const result = await uploadToCloudinary(file.buffer, 'expenses');
            attachments.push({
                url: result.secure_url,
                publicId: result.public_id,
                filename: file.originalname
            });
        }
        expenseData.attachments = attachments;
    }

    expenseData.companyId = req.user.companyId;
    const expense = new expenseModel(expenseData);
    await expense.save();
    res.status(201).json({ message: 'تم إضافة المصروف بنجاح', expense });
});

const getAllExpenses = catchAsyncError(async (req, res, next) => {
    const { search, wallet, startDate, endDate } = req.query;
    let query = {};

    // Search by description or account
    if (search) {
        query.$or = [
            { description: { $regex: search, $options: 'i' } },
            { account: { $regex: search, $options: 'i' } },
            { code: { $regex: search, $options: 'i' } }
        ];
    }

    // Filter by wallet
    if (wallet) {
        query.wallet = wallet;
    }

    // Filter by date range
    if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
    }

    const expenses = await expenseModel.find({ ...query, ...req.companyFilter }).sort({ date: -1, createdAt: -1 });
    res.status(200).json({ message: 'تم جلب المصروفات بنجاح', expenses });
});

const getExpenseById = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const expense = await expenseModel.findOne({ _id: id, ...req.companyFilter });

    if (!expense) {
        return next(new AppError('المصروف غير موجود', 404));
    }

    res.status(200).json({ message: 'تم جلب المصروف بنجاح', expense });
});

const updateExpense = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;

    // Find existing expense
    let existingExpense = await expenseModel.findOne({ _id: id, ...req.companyFilter });
    if (!existingExpense) {
        return next(new AppError('المصروف غير موجود', 404));
    }

    const updateData = { ...req.body };

    // Handle existing attachments list (to support removal)
    let finalAttachments = [];
    if (req.body.existingAttachments) {
        try {
            finalAttachments = JSON.parse(req.body.existingAttachments);
        } catch (e) {
            finalAttachments = existingExpense.attachments || [];
        }
    } else {
        finalAttachments = existingExpense.attachments || [];
    }

    // Handle new file uploads
    const files = req.files?.attachments || [];
    if (files.length > 0) {
        const newAttachments = [];
        for (const file of files) {
            const result = await uploadToCloudinary(file.buffer, 'expenses');
            newAttachments.push({
                url: result.secure_url,
                publicId: result.public_id,
                filename: file.originalname
            });
        }
        finalAttachments = [...finalAttachments, ...newAttachments];
    }

    updateData.attachments = finalAttachments;

    const expense = await expenseModel.findOneAndUpdate({ _id: id, ...req.companyFilter }, updateData, { new: true });
    res.status(200).json({ message: 'تم تحديث المصروف بنجاح', expense });
});

const deleteExpense = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const expense = await expenseModel.findOne({ _id: id, ...req.companyFilter });

    if (!expense) {
        return next(new AppError('المصروف غير موجود', 404));
    }

    // Delete all attachments from Cloudinary
    if (expense.attachments && expense.attachments.length > 0) {
        for (const attachment of expense.attachments) {
            if (attachment.publicId) {
                await deleteFromCloudinary(attachment.publicId);
            }
        }
    }

    await expenseModel.findOneAndDelete({ _id: id, ...req.companyFilter });
    res.status(200).json({ message: 'تم حذف المصروف بنجاح', expense });
});


export { addExpense, getAllExpenses, getExpenseById, updateExpense, deleteExpense }
