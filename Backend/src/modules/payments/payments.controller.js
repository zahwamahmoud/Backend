import Payment from "./payments.model.js";
import Transaction from "../transaction/transaction.model.js";
import Contact from "../contacts/contacts.model.js";
import { companyModel } from "../companies/company.model.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";
import { AppError } from "../../utils/AppError.js";
import QRCode from "qrcode";
import PDFDocument from "pdfkit";

const updateTransactionPaymentStatus = (transaction) => {
    if (transaction.paidAmount >= transaction.totalAmount && transaction.totalAmount > 0) {
        transaction.status = 'paid';
    } else if (transaction.paidAmount > 0) {
        transaction.status = 'partially_paid';
    } else {
        transaction.status = 'unpaid';
    }
    transaction.remainingAmount = Math.max(0, transaction.totalAmount - transaction.paidAmount);
};

// ========== ADD ==========
const addPayment = (module) =>
    catchAsyncError(async (req, res, next) => {
        const { invoice: invoiceId, amount, contact } = req.body;

        if (invoiceId && amount != null) {
            const transaction = await Transaction.findOne({ _id: invoiceId, ...req.companyFilter });
            if (!transaction) {
                return next(new AppError("Invoice not found", 404));
            }
            if (transaction.documentType !== 'invoice') {
                return next(new AppError("Payments can only be added to invoices", 400));
            }
            const remaining = transaction.remainingAmount ?? (transaction.totalAmount - transaction.paidAmount);
            if (amount > remaining) {
                return next(new AppError("Payment amount cannot exceed remaining balance", 400));
            }
        }

        const paymentData = {
            ...req.body,
            module,
            companyId: req.body.companyId,
            createdBy: req.user?._id
        };
        if (invoiceId && !paymentData.contact) {
            const txn = await Transaction.findById(invoiceId).select('contact').lean();
            if (txn?.contact) paymentData.contact = txn.contact;
        }

        const payment = await Payment.create(paymentData);

        if (invoiceId && amount != null && amount > 0) {
            const transaction = await Transaction.findOne({ _id: invoiceId, ...req.companyFilter });
            if (transaction) {
                transaction.paidAmount = (transaction.paidAmount || 0) + amount;
                updateTransactionPaymentStatus(transaction);
                await transaction.save();
            }
        }

        await payment.populate('contact', 'name email phone');
        await payment.populate('invoice', 'transactionNumber totalAmount paidAmount remainingAmount');

        res.status(201).json({
            message: "تم الإنشاء بنجاح",
            payment
        });
    });

// ========== GET ALL ==========
const getAllPayments = (module) =>
    catchAsyncError(async (req, res) => {
        const query = {
            module,
            deletedAt: null,
            ...req.companyFilter
        };

        if (req.query.invoiceId) query.invoice = req.query.invoiceId;
        if (req.query.contactId) query.contact = req.query.contactId;
        if (req.query.treasury) query.treasury = req.query.treasury;
        if (req.query.operationType) query.operationType = req.query.operationType;
        if (req.query.status) query.status = req.query.status;
        if (req.query.dateFrom || req.query.dateTo) {
            query.date = {};
            if (req.query.dateFrom) query.date.$gte = new Date(req.query.dateFrom);
            if (req.query.dateTo) {
                const d = new Date(req.query.dateTo);
                d.setHours(23, 59, 59, 999);
                query.date.$lte = d;
            }
        }
        if (req.query.amountMin != null || req.query.amountMax != null) {
            query.amount = {};
            if (req.query.amountMin != null) query.amount.$gte = parseFloat(req.query.amountMin);
            if (req.query.amountMax != null) query.amount.$lte = parseFloat(req.query.amountMax);
        }

        // Search by contact name
        if (req.query.search && req.query.search.trim()) {
            const searchTerm = req.query.search.trim();
            const contactType = module === 'sales' ? 'customer' : 'supplier';
            const contactFilter = { name: { $regex: searchTerm, $options: 'i' }, module: contactType, ...req.companyFilter };
            const matchingContacts = await Contact.find(contactFilter).select('_id').lean();
            const contactIds = matchingContacts.map(c => c._id);
            if (contactIds.length > 0) {
                query.contact = { $in: contactIds };
            } else {
                query.contact = null; // No matches -> return empty
            }
        }

        const sortBy = req.query.sortBy || 'date';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
        const sortOpt = { [sortBy]: sortOrder };
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(5, parseInt(req.query.limit, 10) || 20));
        const skip = (page - 1) * limit;

        const [payments, total] = await Promise.all([
            Payment.find(query)
                .populate('contact', 'name email phone')
                .populate('invoice', 'transactionNumber totalAmount paidAmount remainingAmount issueDate')
                .sort(sortOpt)
                .skip(skip)
                .limit(limit)
                .lean(),
            Payment.countDocuments(query)
        ]);

        res.json({
            message: "تم جلب البيانات بنجاح",
            count: payments.length,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            payments
        });
    });

// ========== GET ONE ==========
const getPaymentById = catchAsyncError(async (req, res, next) => {
    const payment = await Payment.findOne({ _id: req.params.id, ...req.companyFilter })
        .populate('contact', 'name email phone')
        .populate('invoice', 'transactionNumber totalAmount issueDate');

    if (!payment || payment.deletedAt) {
        return next(new AppError("غير موجود", 404));
    }

    res.json({
        message: "تم جلب البيانات بنجاح",
        payment
    });
});

// ========== UPDATE ==========
const updatePayment = catchAsyncError(async (req, res, next) => {
    const payment = await Payment.findOne({ _id: req.params.id, ...req.companyFilter });

    if (!payment || payment.deletedAt) {
        return next(new AppError("غير موجود", 404));
    }

    Object.assign(payment, req.body);
    // Ensure companyId isn't changed if present in body?
    // Middleware might set it again, or we can just ignore it since Object.assign overwrites.
    // Ideally we should prevent changing companyId unless superAdmin, but usually updates don't change tenant.
    if (req.companyFilter.companyId) {
        payment.companyId = req.companyFilter.companyId;
    }

    payment.lastModifiedBy = req.user?._id;

    await payment.save();
    await payment.populate('contact', 'name email phone');
    await payment.populate('invoice', 'transactionNumber totalAmount issueDate');

    res.json({
        message: "تم التعديل بنجاح",
        payment
    });
});

// ========== DELETE ==========
const deletePayment = catchAsyncError(async (req, res, next) => {
    const payment = await Payment.findOne({ _id: req.params.id, ...req.companyFilter });
    if (!payment) {
        return next(new AppError("غير موجود", 404));
    }

    if (payment.invoice && payment.amount > 0) {
        const transaction = await Transaction.findOne({ _id: payment.invoice, ...req.companyFilter });
        if (transaction) {
            transaction.paidAmount = Math.max(0, (transaction.paidAmount || 0) - payment.amount);
            updateTransactionPaymentStatus(transaction);
            await transaction.save();
        }
    }

    await Payment.findByIdAndDelete(payment._id);

    res.json({
        message: "تم الحذف بنجاح",
        payment
    });
});

// ========== PDF DOWNLOAD ==========
const downloadPaymentPDF = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    let payment = await Payment.findOne({ _id: id, deletedAt: null, ...req.companyFilter })
        .populate('contact', 'name email phone')
        .populate('invoice', 'transactionNumber totalAmount paidAmount remainingAmount issueDate')
        .lean();
    if (!payment && req.user?.role === 'superAdmin') {
        payment = await Payment.findOne({ _id: id, deletedAt: null })
            .populate('contact', 'name email phone')
            .populate('invoice', 'transactionNumber totalAmount paidAmount remainingAmount')
            .lean();
    }
    if (!payment) return next(new AppError("غير موجود", 404));

    const company = await companyModel.findById(payment.companyId).select("name logo defaultCurrency").lean();
    const companyName = company?.name || "Company";
    const companyLogoUrl = company?.logo?.url;
    const CURRENCY_SYMBOLS = { EGP: "ج.م", USD: "$", EUR: "€", SAR: "﷼", AED: "د.إ", GBP: "£" };
    const currencySymbol = CURRENCY_SYMBOLS[company?.defaultCurrency || "EGP"] || "EGP";

    const qrPayload = {
        paymentId: payment._id.toString(),
        companyName,
        amount: payment.amount,
        date: payment.date,
        contact: payment.contact?.name
    };
    const qrDataURL = await QRCode.toDataURL(JSON.stringify(qrPayload), { width: 200, margin: 1 });

    const refNum = payment.referenceNumber || payment._id.toString().slice(-8);
    const filename = `payment-${refNum.replace(/[^a-zA-Z0-9-_]/g, "_")}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    const doc = new PDFDocument({ size: "A4", margin: 40 });
    doc.pipe(res);

    let y = 40;
    const pageWidth = doc.page.width - 80;
    const rightCol = 350;

    if (companyLogoUrl) {
        try {
            doc.image(companyLogoUrl, 40, y, { width: 50, height: 50 });
        } catch (_e) { /* skip */ }
        y += 55;
    }
    doc.fontSize(18).font("Helvetica-Bold").text(companyName, 40, y);
    y += 28;
    doc.fontSize(10).font("Helvetica").text(payment.module === 'sales' ? "Client Payment Receipt" : "Supplier Payment Receipt", 40, y);
    doc.fontSize(12).text(`# ${refNum}`, rightCol, y);
    y += 20;
    doc.fontSize(9).text(`Date: ${new Date(payment.date).toLocaleDateString()}`, rightCol, y);
    doc.text(`Status: ${payment.status || 'completed'}`, rightCol, y + 14);
    y += 40;

    const contactName = payment.contact?.name || "—";
    doc.fontSize(10).font("Helvetica-Bold").text(payment.module === 'sales' ? "Client" : "Supplier", 40, y);
    y += 16;
    doc.font("Helvetica").text(contactName, 40, y);
    y += 24;

    doc.fontSize(9).font("Helvetica-Bold");
    doc.text("Amount", 40, y);
    doc.text(`${(payment.amount ?? 0).toFixed(2)} ${currencySymbol}`, rightCol, y);
    y += 18;
    doc.text("Operation Type", 40, y);
    doc.text(payment.operationType === 'receive' ? "Receive" : "Spend", rightCol, y);
    y += 18;
    doc.text("Treasury", 40, y);
    doc.text(payment.treasury === 'main' ? "Main Safe" : "Bank Account", rightCol, y);
    y += 18;
    if (payment.invoice?.transactionNumber) {
        doc.text("Linked Invoice", 40, y);
        doc.text(payment.invoice.transactionNumber, rightCol, y);
        y += 18;
    }
    y += 12;
    if (payment.notes) {
        doc.font("Helvetica").text("Notes:", 40, y);
        y += 14;
        doc.text(payment.notes.substring(0, 200), 40, y);
        y += 20;
    }

    const qrBase64 = qrDataURL.replace(/^data:image\/\w+;base64,/, "");
    const qrBuffer = Buffer.from(qrBase64, "base64");
    doc.image(qrBuffer, pageWidth + 40 - 80, y, { width: 80, height: 80 });
    doc.fontSize(8).font("Helvetica").text("QR: verification", pageWidth + 40 - 80, y + 84);
    doc.fontSize(8).text(`${companyName} — Payment #${refNum}`, 40, doc.page.height - 40);
    doc.end();
});

export {
    addPayment,
    getAllPayments,
    getPaymentById,
    updatePayment,
    deletePayment,
    downloadPaymentPDF
};