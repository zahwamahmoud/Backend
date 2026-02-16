import Transaction from "./transaction.model.js";
import Contact from "../contacts/contacts.model.js";
import { companyModel } from "../companies/company.model.js";
import { SUPPORTED_CURRENCIES } from "../../constants/currencies.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";
import { AppError } from "../../utils/AppError.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../../utils/cloudinary.js";
import QRCode from "qrcode";
import PDFDocument from "pdfkit";

import * as inventoryService from "../product/inventory.service.js";

const createTransaction = (module, documentType) =>
    catchAsyncError(async (req, res, next) => {
        console.log(`[DEBUG] createTransaction called for ${module}/${documentType}`);
        const opData = { ...req.body };
        const companyId = req.user.companyId;
        const company = companyId ? await companyModel.findById(companyId).select("defaultCurrency").lean() : null;
        const defaultCurrency = company?.defaultCurrency || "EGP";
        opData.currency = SUPPORTED_CURRENCIES.includes(opData.currency) ? opData.currency : defaultCurrency;

        // Check transactionNumber uniqueness per company
        if (opData.transactionNumber) {
            const existing = await Transaction.findOne({
                transactionNumber: opData.transactionNumber,
                companyId: companyId
            });
            if (existing) {
                return next(new AppError("رقم المعاملة موجود بالفعل", 409));
            }
        }

        // Handle file uploads
        if (req.files && req.files.attachments) {
            const uploadPromises = req.files.attachments.map(file => uploadToCloudinary(file.buffer, 'transactions'));
            const results = await Promise.all(uploadPromises);
            opData.attachments = results.map((result, index) => ({
                fileName: req.files.attachments[index].originalname,
                fileUrl: result.secure_url,
                publicId: result.public_id,
                uploadedAt: new Date()
            }));
        }

        // Parse items if they are sent as a JSON string (using FormData)
        if (typeof opData.items === 'string') {
            try {
                opData.items = JSON.parse(opData.items);
            } catch (e) {
                console.error("Error parsing items JSON:", e);
            }
        }

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const transaction = await Transaction.create([{
                ...opData,
                module,
                documentType,
                companyId,
                createdBy: req.user?._id
            }], { session });

            const txn = transaction[0];

            // Automated Stock Updates
            if (txn.status !== 'draft' && (txn.documentType === 'invoice' || txn.documentType === 'return')) {
                const isSales = txn.module === 'sales';
                const isReturn = txn.documentType === 'return';

                // Purchases Invoice: IN, Purchases Return: OUT
                // Sales Invoice: OUT, Sales Return: IN
                const stockType = isSales ? (isReturn ? 'in' : 'out') : (isReturn ? 'out' : 'in');

                for (const item of txn.items || []) {
                    await inventoryService.updateProductStock({
                        productId: item.product,
                        companyId,
                        quantity: item.quantity,
                        type: stockType,
                        permissionId: txn._id,
                        userId: req.user?._id,
                        // For purchases invoices, use the actual unit price to update WAC
                        purchasePrice: (txn.module === 'purchases' && txn.documentType === 'invoice') ? item.unitPrice : null,
                        session
                    });
                }
            }

            await session.commitTransaction();
            res.status(201).json({
                message: "تم الإنشاء بنجاح",
                transaction: txn
            });
        } catch (error) {
            await session.abortTransaction();
            next(error);
        } finally {
            session.endSession();
        }
    });

const getAllTransactions = (module, documentType) =>
    catchAsyncError(async (req, res) => {
        const query = {
            module,
            documentType,
            deletedAt: { $eq: null },
            ...req.companyFilter
        };
        if (req.query.currency && SUPPORTED_CURRENCIES.includes(req.query.currency)) {
            query.currency = req.query.currency;
        }
        if (req.query.contactId) {
            query.contact = req.query.contactId;
        }
        if (req.query.dateFrom || req.query.dateTo) {
            query.issueDate = {};
            if (req.query.dateFrom) query.issueDate.$gte = new Date(req.query.dateFrom);
            if (req.query.dateTo) {
                const d = new Date(req.query.dateTo);
                d.setHours(23, 59, 59, 999);
                query.issueDate.$lte = d;
            }
        }
        if (req.query.amountMin != null || req.query.amountMax != null) {
            query.totalAmount = {};
            if (req.query.amountMin != null) query.totalAmount.$gte = parseFloat(req.query.amountMin);
            if (req.query.amountMax != null) query.totalAmount.$lte = parseFloat(req.query.amountMax);
        }
        if (req.query.search && req.query.search.trim()) {
            const searchTerm = req.query.search.trim();
            const contactType = module === 'sales' ? 'customer' : 'supplier';
            const contactFilter = { name: { $regex: searchTerm, $options: 'i' }, module: contactType, ...req.companyFilter };
            const matchingContacts = await Contact.find(contactFilter).select('_id').lean();
            const contactIds = matchingContacts.map(c => c._id);
            if (contactIds.length > 0) {
                query.contact = { $in: contactIds };
            } else {
                query.contact = null;
            }
        }

        const data = await Transaction.find(query)
            .populate('contact', 'name email phone type')
            .sort({ createdAt: -1 })
            .lean();

        res.json({ results: data.length, data });
    });

const getOne = catchAsyncError(async (req, res, next) => {
    const doc = await Transaction.findOne({
        _id: req.params.id,
        deletedAt: { $in: [null, undefined] },
        ...req.companyFilter
    })
        .populate('contact', 'name email phone type address')
        .populate('items.product', 'name sellingPrice');
    if (!doc) return next(new AppError("غير موجود", 404));
    res.json(doc);
});

const updateOne = catchAsyncError(async (req, res, next) => {
    const doc = await Transaction.findOne({ _id: req.params.id, ...req.companyFilter });
    if (!doc) return next(new AppError("غير موجود", 404));

    const opData = { ...req.body };

    // Check transactionNumber uniqueness if changed
    if (opData.transactionNumber && opData.transactionNumber !== doc.transactionNumber) {
        const existing = await Transaction.findOne({
            transactionNumber: opData.transactionNumber,
            companyId: doc.companyId
        });
        if (existing) {
            return next(new AppError("رقم المعاملة موجود بالفعل", 409));
        }
    }

    // Handle file uploads
    if (req.files && req.files.attachments) {
        const uploadPromises = req.files.attachments.map(file => uploadToCloudinary(file.buffer, 'transactions'));
        const results = await Promise.all(uploadPromises);
        const newAttachments = results.map((result, index) => ({
            fileName: req.files.attachments[index].originalname,
            fileUrl: result.secure_url,
            publicId: result.public_id,
            uploadedAt: new Date()
        }));
        doc.attachments = [...(doc.attachments || []), ...newAttachments];
    }

    // Handle attachment deletion: when opData.attachments is provided, delete from Cloudinary any removed ones
    if (opData.attachments && Array.isArray(opData.attachments)) {
        const existing = doc.attachments || [];
        const newById = new Set(opData.attachments.map(a => (a.publicId || a.fileUrl)).filter(Boolean));
        for (const a of existing) {
            const id = a.publicId || a.fileUrl;
            if (id && !newById.has(id)) {
                if (a.publicId) await deleteFromCloudinary(a.publicId);
            }
        }
    }

    // Parse items if they are sent as a JSON string
    if (typeof opData.items === 'string') {
        try {
            opData.items = JSON.parse(opData.items);
        } catch (e) {
            console.error("Error parsing items JSON:", e);
        }
    }

    Object.assign(doc, opData);
    // Protect companyId
    if (req.companyFilter.companyId) {
        doc.companyId = req.companyFilter.companyId;
    }
    doc.lastModifiedBy = req.user?._id;

    await doc.save(); // ✅ يشغّل pre('save')

    res.json({
        message: "تم التعديل بنجاح",
        data: doc
    });
});

const deleteOne = catchAsyncError(async (req, res, next) => {
    const doc = await Transaction.findOne({ _id: req.params.id, ...req.companyFilter });
    if (!doc) return next(new AppError("غير موجود", 404));

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        // Reverse Stock Movements if not draft
        if (doc.status !== 'draft' && (doc.documentType === 'invoice' || doc.documentType === 'return')) {
            const isSales = doc.module === 'sales';
            const isReturn = doc.documentType === 'return';

            // Reversing: 
            // Original IN -> Subtract, Original OUT -> Add
            const stockType = isSales ? (isReturn ? 'out' : 'add') : (isReturn ? 'add' : 'out');
            const inventoryAction = (isSales ? (isReturn ? 'out' : 'in') : (isReturn ? 'in' : 'out')) === 'in' ? 'subtract' : 'add';

            // More readable logic:
            // Purchase Invoice was IN -> Subtract
            // Purchase Return was OUT -> Add
            // Sales Invoice was OUT -> Add
            // Sales Return was IN -> Subtract

            for (const item of doc.items || []) {
                const action = (doc.module === 'purchases' && doc.documentType === 'invoice') || (doc.module === 'sales' && doc.documentType === 'return') ? 'subtract' : 'add';

                await inventoryService.updateProductStock({
                    productId: item.product,
                    companyId: doc.companyId,
                    quantity: item.quantity,
                    type: action === 'add' ? 'in' : 'out',
                    permissionId: doc._id,
                    userId: req.user?._id,
                    session
                });
            }
        }

        // Soft delete
        doc.deletedAt = new Date();
        doc.deletedBy = req.user?._id;
        await doc.save({ session });

        await session.commitTransaction();
        res.json({ message: "تم الحذف" });
    } catch (error) {
        await session.abortTransaction();
        next(error);
    } finally {
        session.endSession();
    }
});

const docTypeLabel = (module, documentType) => {
    const labels = {
        sales: { invoice: "Invoice", return: "Return", quotation: "Quotation" },
        purchases: { invoice: "Purchase Invoice", return: "Purchase Return", purchaseOrder: "Purchase Order", request: "Purchase Request" }
    };
    return labels[module]?.[documentType] || "Document";
};

const generateTransactionPDF = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const baseQuery = { _id: id, deletedAt: { $in: [null, undefined] } };
    // Company-scoped: same as getOne; superAdmin can fallback without filter
    let transaction = await Transaction.findOne({ ...baseQuery, ...req.companyFilter })
        .populate("contact", "name email phone type address")
        .populate("items.product", "name sellingPrice")
        .lean();
    if (!transaction && req.user?.role === "superAdmin") {
        transaction = await Transaction.findOne(baseQuery)
            .populate("contact", "name email phone type address")
            .populate("items.product", "name sellingPrice")
            .lean();
    }
    if (!transaction) return next(new AppError("Document not found", 404));

    // Set headers only; do not send JSON — pipe PDF stream to res
    const company = await companyModel.findById(transaction.companyId).select("name logo defaultCurrency").lean();
    const companyName = company?.name || "Company";
    const companyLogoUrl = company?.logo?.url;
    const currency = transaction.currency || company?.defaultCurrency || "EGP";
    const CURRENCY_SYMBOLS = { EGP: "ج.م", USD: "$", EUR: "€", SAR: "﷼", AED: "د.إ", GBP: "£" };
    const currencySymbol = CURRENCY_SYMBOLS[currency] || currency;

    const qrPayload = {
        invoiceNumber: transaction.transactionNumber,
        companyName,
        totalAmount: transaction.totalAmount,
        date: transaction.issueDate,
        invoiceId: transaction._id.toString()
    };
    const qrDataURL = await QRCode.toDataURL(JSON.stringify(qrPayload), { width: 200, margin: 1 });

    const filename = `invoice-${(transaction.transactionNumber || id).replace(/[^a-zA-Z0-9-_]/g, "_")}.pdf`;
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
        } catch (e) {
            // if image load fails, skip
        }
        y += 55;
    }
    doc.fontSize(18).font("Helvetica-Bold").text(companyName, 40, y);
    y += 28;
    doc.fontSize(10).font("Helvetica").text(docTypeLabel(transaction.module, transaction.documentType), 40, y);
    doc.fontSize(12).text(`# ${transaction.transactionNumber}`, rightCol, y);
    y += 20;
    doc.fontSize(9).text(`Issue: ${new Date(transaction.issueDate).toLocaleDateString()}`, rightCol, y);
    doc.text(`Due: ${transaction.dueDate ? new Date(transaction.dueDate).toLocaleDateString() : "—"}`, rightCol, y + 14);
    y += 40;

    const contact = transaction.contactSnapshot || transaction.contact;
    const contactName = (contact?.name || transaction.contact?.name) || "—";
    const contactAddr = contact?.address ? (contact.address.address1 || contact.address.city || "") : "";
    doc.fontSize(10).font("Helvetica-Bold").text("Bill To", 40, y);
    y += 16;
    doc.font("Helvetica").text(contactName, 40, y);
    if (contactAddr) doc.text(contactAddr, 40, y + 14);
    y += 36;

    doc.fontSize(9).font("Helvetica-Bold");
    doc.text("Product", 40, y);
    doc.text("Qty", 220, y);
    doc.text("Price", 260, y);
    doc.text("Total", 320, y);
    y += 18;
    doc.moveTo(40, y).lineTo(pageWidth + 40, y).stroke();
    y += 10;

    doc.font("Helvetica");
    const fmt = (n) => (n ?? 0).toFixed(2);
    (transaction.items || []).forEach((item) => {
        const name = item.productName || item.product?.name || "—";
        const total = item.total ?? (item.quantity * item.unitPrice - (item.discountAmount || 0) + (item.taxAmount || 0));
        doc.fontSize(9).text(name.substring(0, 35), 40, y);
        doc.text(String(item.quantity), 220, y);
        doc.text(String(item.unitPrice ?? 0), 260, y);
        doc.text(`${fmt(total)} ${currencySymbol}`, 320, y);
        y += 18;
    });
    y += 12;

    doc.moveTo(40, y).lineTo(pageWidth + 40, y).stroke();
    y += 16;
    doc.font("Helvetica-Bold").text("Subtotal:", 260, y);
    doc.text(`${fmt(transaction.subtotal)} ${currencySymbol}`, 380, y);
    y += 14;
    if (transaction.totalDiscount > 0) {
        doc.text("Discount:", 260, y);
        doc.text(`-${fmt(transaction.totalDiscount)} ${currencySymbol}`, 380, y);
        y += 14;
    }
    doc.text("Tax:", 260, y);
    doc.text(`${fmt(transaction.totalTax)} ${currencySymbol}`, 380, y);
    y += 14;
    doc.fontSize(11).text("Total:", 260, y);
    doc.text(`${fmt(transaction.totalAmount)} ${currencySymbol}`, 380, y);
    y += 28;

    const qrBase64 = qrDataURL.replace(/^data:image\/\w+;base64,/, "");
    const qrBuffer = Buffer.from(qrBase64, "base64");
    doc.image(qrBuffer, pageWidth + 40 - 80, y, { width: 80, height: 80 });
    doc.fontSize(8).font("Helvetica").text("QR: document verification", pageWidth + 40 - 80, y + 84);

    doc.fontSize(8).text(`${companyName} — ${transaction.transactionNumber}`, 40, doc.page.height - 40);
    doc.end();
});

/** Alias for PDF download (invoice/transaction); used by route GET /:id/download */
const downloadInvoicePDF = generateTransactionPDF;

export {
    createTransaction,
    getAllTransactions,
    getOne,
    updateOne,
    deleteOne,
    generateTransactionPDF,
    downloadInvoicePDF
};
