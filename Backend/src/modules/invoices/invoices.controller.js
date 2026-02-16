import { AppError } from "../../utils/AppError.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";
import Invoice from "./invoices.model.js";

// إنشاء فاتورة جديدة
const createInvoice = catchAsyncError(async (req, res, next) => {
    // التحقق من وجود رقم الفاتورة
    // Ensure uniqueness within company if we enforce it, or generally.
    // If invoiceNumber is unique globally in schema, this check is still good.
    // If we want per-company uniqueness, we need schema change (compound index), but let's just check with filter here.

    // Middleware sets req.body.companyId for non-superAdmin.
    const companyId = req.body.companyId;

    if (req.body.invoiceNumber) {
        // If we want to check uniqueness, we should check with companyId if possible, 
        // but since schema has global unique index on invoiceNumber (likely), we check globally or handle the error.
        // For now, let's query with companyId to be safe on logic level, 
        // but DB might throw duplicate error if another company has same number. 
        // Refactoring to global unique check (which is safer if schema is global unique) OR check with filter.
        // Let's assume global uniqueness for invoiceNumber for now as per schema.

        const existingInvoice = await Invoice.findOne({
            invoiceNumber: req.body.invoiceNumber?.toUpperCase()
        });

        // Use companyFilter check? If it exists globally, it exists.
        if (existingInvoice) {
            return next(new AppError('رقم الفاتورة موجود بالفعل', 409));
        }
    }

    // التحقق من صحة التواريخ
    if (new Date(req.body.dueDate) < new Date(req.body.issueDate)) {
        return next(new AppError('تاريخ الاستحقاق يجب أن يكون بعد تاريخ الإصدار', 400));
    }

    // إنشاء الفاتورة (الحسابات ستتم تلقائياً في pre-save middleware)
    // companyId included in req.body
    const invoice = new Invoice(req.body);
    await invoice.save();

    res.status(201).json({
        message: 'تم إنشاء الفاتورة بنجاح',
        invoice
    });
});

// الحصول على جميع الفواتير مع البحث والفلترة
const getAllInvoices = catchAsyncError(async (req, res, next) => {
    const { search, status, startDate, endDate, page = 1, limit = 10, clientId } = req.query;

    // بناء query للبحث
    let query = { ...req.companyFilter };

    if (search) {
        query.$or = [
            { invoiceNumber: { $regex: search, $options: 'i' } },
            { clientName: { $regex: search, $options: 'i' } }
        ];
    }

    if (status) {
        query.status = status;
    }

    if (clientId) {
        query.clientId = clientId;
    }

    if (startDate || endDate) {
        query.issueDate = {};
        if (startDate) query.issueDate.$gte = new Date(startDate);
        if (endDate) query.issueDate.$lte = new Date(endDate);
    }

    // حساب pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // الحصول على الفواتير مع العدد الكلي
    const [invoices, totalCount] = await Promise.all([
        Invoice.find(query)
            .populate('clientId', 'name phone email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit)),
        Invoice.countDocuments(query)
    ]);

    res.status(200).json({
        message: 'تم جلب الفواتير بنجاح',
        invoices,
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalCount / parseInt(limit)),
            totalCount,
            limit: parseInt(limit)
        }
    });
});

// الحصول على فاتورة واحدة
const getInvoiceById = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const invoice = await Invoice.findOne({ _id: id, ...req.companyFilter }).populate('clientId');

    if (!invoice) {
        return next(new AppError('الفاتورة غير موجودة', 404));
    }

    res.status(200).json({
        message: 'تم جلب الفاتورة بنجاح',
        invoice
    });
});

// تحديث فاتورة
const updateInvoice = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;

    // التحقق من وجود الفاتورة
    const invoice = await Invoice.findOne({ _id: id, ...req.companyFilter });
    if (!invoice) {
        return next(new AppError('الفاتورة غير موجودة', 404));
    }

    // التحقق من وجود رقم الفاتورة لفاتورة أخرى
    if (req.body.invoiceNumber) {
        const existingInvoice = await Invoice.findOne({
            invoiceNumber: req.body.invoiceNumber.toUpperCase(),
            _id: { $ne: id }
        });

        if (existingInvoice) {
            return next(new AppError('رقم الفاتورة موجود بالفعل', 409));
        }
    }

    // التحقق من صحة التواريخ
    if (req.body.issueDate && req.body.dueDate) {
        if (new Date(req.body.dueDate) < new Date(req.body.issueDate)) {
            return next(new AppError('تاريخ الاستحقاق يجب أن يكون بعد تاريخ الإصدار', 400));
        }
    }

    // تحديث البيانات
    Object.assign(invoice, req.body);
    // Ensure companyId is not changed or is valid? 
    // Usually companyId shouldn't be changed. Safe to ignore or force check.
    // If strict, reset companyId to original.
    if (req.companyFilter.companyId) {
        invoice.companyId = req.companyFilter.companyId;
    }

    await invoice.save(); // سيؤدي هذا لتشغيل الـ pre-save middleware

    res.status(200).json({
        message: 'تم تحديث الفاتورة بنجاح',
        invoice
    });
});

// حذف فاتورة
const deleteInvoice = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const invoice = await Invoice.findOneAndDelete({ _id: id, ...req.companyFilter });

    if (!invoice) {
        return next(new AppError('الفاتورة غير موجودة', 404));
    }

    // هنا يمكنك إضافة حذف الملفات المرفقة من الـ storage
    // if (invoice.attachments.length > 0) {
    //     await deleteAttachments(invoice.attachments);
    // }

    res.status(200).json({
        message: 'تم حذف الفاتورة بنجاح',
        invoice
    });
});

// البحث في الفواتير
const searchInvoices = catchAsyncError(async (req, res, next) => {
    const { term } = req.query;

    if (!term) {
        return next(new AppError('يجب إدخال كلمة البحث', 400));
    }

    const invoices = await Invoice.searchInvoices(term, req.companyFilter);

    res.status(200).json({
        message: 'نتائج البحث',
        count: invoices.length,
        invoices
    });
});

// تحديث حالة الفاتورة
const updateInvoiceStatus = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['paid', 'unpaid', 'partial', 'draft'].includes(status)) {
        return next(new AppError('حالة غير صحيحة', 400));
    }

    const invoice = await Invoice.findOne({ _id: id, ...req.companyFilter });

    if (!invoice) {
        return next(new AppError('الفاتورة غير موجودة', 404));
    }

    await invoice.updateStatus(status);

    res.status(200).json({
        message: 'تم تحديث حالة الفاتورة بنجاح',
        invoice
    });
});

// إحصائيات الفواتير
const getInvoiceStats = catchAsyncError(async (req, res, next) => {
    const matchStage = { ...req.companyFilter }; // Apply filter

    const stats = await Invoice.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalAmount: { $sum: '$total' }
            }
        }
    ]);

    const totalInvoices = await Invoice.countDocuments(matchStage);

    res.status(200).json({
        message: 'إحصائيات الفواتير',
        totalInvoices,
        stats
    });
});

export {
    createInvoice,
    getAllInvoices,
    getInvoiceById,
    updateInvoice,
    deleteInvoice,
    searchInvoices,
    updateInvoiceStatus,
    getInvoiceStats
};