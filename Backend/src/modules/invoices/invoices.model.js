import mongoose from "mongoose";
import { SUPPORTED_CURRENCIES } from "../../constants/currencies.js";

const invoiceItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'product'
    },
    productName: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    quantity: {
        type: Number,
        min: [1, 'Quantity must be at least 1']
    },
    price: {
        type: Number,
        min: [0, 'Price cannot be negative']
    },
    discount: {
        type: Number,
        default: 0,
        min: [0, 'Discount cannot be negative']
    },
    discountType: {
        type: String,
        enum: {
            values: ["%", "fixed"],
            message: 'Discount type must be % or fixed'
        },
        default: "%"
    },
    tax: {
        type: Number,
        default: 0,
        min: [0, 'Tax cannot be negative']
    }
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
    invoiceNumber: {
        type: String,
        required: [true, 'Invoice number is required'],
        unique: true,
        trim: true,
        uppercase: true // لتوحيد الصيغة
    },

    issueDate: {
        type: Date,
        default: Date.now
    },

    dueDate: {
        type: Date,
        // required: [true, 'Due date is required'],
        validate: {
            validator: function (value) {
                return value >= this.issueDate;
            },
            message: 'Due date must be after or equal to issue date'
        }
    },

    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contact',
        required: [true, 'Client is required']
    },

    clientName: {
        type: String,
        required: [true, 'Client name is required'],
        trim: true
    },

    warehouse: {
        type: String,
        trim: true,
        default: ""
    },

    items: {
        type: [invoiceItemSchema],
        validate: {
            validator: function (arr) {
                return arr && arr.length > 0;
            },
            message: 'At least one item is required'
        }
    },

    // خصم على الفاتورة بالكامل (إضافي على خصومات المنتجات)
    invoiceDiscount: {
        type: Number,
        default: 0,
        min: [0, 'Invoice discount cannot be negative']
    },

    invoiceDiscountType: {
        type: String,
        enum: {
            values: ["%", "fixed"],
            message: 'Invoice discount type must be % or fixed'
        },
        default: "%"
    },

    subtotal: {
        type: Number,
        default: 0,
        min: [0, 'Subtotal cannot be negative']
    },

    tax: {
        type: Number,
        default: 0,
        min: [0, 'Tax cannot be negative']
    },

    total: {
        type: Number,
        default: 0,
        min: [0, 'Total cannot be negative']
    },

    paidAmount: {
        type: Number,
        default: 0,
        min: [0, 'Paid amount cannot be negative']
    },

    notes: {
        type: String,
        trim: true,
        default: ""
    },

    paymentMethod: {
        type: String,
        enum: {
            values: ["cash", "card", "bank", "check", "other"],
            message: 'Invalid payment method'
        },
        default: "cash"
    },

    // لدعم رفع الملفات المتعددة
    attachments: {
        type: [{
            filename: String,
            path: String,
            mimetype: String,
            size: Number,
            uploadedAt: {
                type: Date,
                default: Date.now
            }
        }],
        default: []
    },

    status: {
        type: String,
        enum: {
            values: ["paid", "unpaid", "partial", "draft"],
            message: 'Invalid status'
        },
        default: "unpaid"
    },

    // معلومات إضافية مفيدة
    // معلومات إضافية مفيدة
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // إذا كان لديك نظام مستخدمين
    },

    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: [true, 'Company ID is required'],
        index: true
    },

    currency: {
        type: String,
        enum: SUPPORTED_CURRENCIES,
        default: "EGP"
    },

    lastModifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual للحصول على المبلغ المتبقي
invoiceSchema.virtual('balance').get(function () {
    return this.total - this.paidAmount;
});

// Indexes للبحث السريع
// { invoiceNumber: 1 } is defined as unique but should be unique PER COMPANY?
// Mongoose unique index is global. We need compound index { invoiceNumber: 1, companyId: 1 } unique.
// But we cannot easily remove the existing unique index via code without dropping it first.
// For now, let's keep it global unique if that's the requirement, OR strictly per company.
// User said "Each Company is a tenant". Usually invoice numbers are unique per company.
// I will attempt to make it unique per company in schema definition if I can, but replacing specific lines.
// The existing `invoiceNumber` definition has `unique: true`.
// I will NOT change the unique constraint on `invoiceNumber` field definition here to avoid complex migration issues in this step,
// BUT I will add the `companyId` field.
// Ideally, we should drop the index and create a compound one.
// Let's stick to adding `companyId` and `index: true`.

invoiceSchema.index({ clientName: 1 });
invoiceSchema.index({ issueDate: -1 });
invoiceSchema.index({ status: 1 });
// companyId already indexed via field option index: true

// Virtual للحصول على عدد الأيام حتى الاستحقاق
invoiceSchema.virtual('daysUntilDue').get(function () {
    if (!this.dueDate) return null;
    const today = new Date();
    const diffTime = this.dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
});

// Pre-save middleware لحساب المجاميع تلقائياً
invoiceSchema.pre('save', function (next) {
    // إذا كانت الفاتورة مسودة، لا نحسب الحالات
    if (this.status === 'draft') return next();

    // حساب subtotal من جميع المنتجات
    let subtotal = 0;
    let totalTax = 0;

    this.items.forEach(item => {
        const itemSubtotal = (item.quantity || 1) * (item.price || 0);

        // حساب الخصم على المنتج
        const itemDiscount = item.discountType === '%'
            ? (itemSubtotal * (item.discount || 0) / 100)
            : (item.discount || 0);

        const itemTotal = itemSubtotal - itemDiscount;

        // حساب الضريبة على المنتج
        const itemTax = itemTotal * ((item.tax || 0) / 100);

        subtotal += itemTotal;
        totalTax += itemTax;
    });

    this.subtotal = subtotal;
    this.tax = totalTax;

    // حساب الخصم الإجمالي على الفاتورة
    const invoiceDiscountAmount = this.invoiceDiscountType === '%'
        ? (subtotal * (this.invoiceDiscount || 0) / 100)
        : (this.invoiceDiscount || 0);

    // المجموع النهائي
    this.total = subtotal + totalTax - invoiceDiscountAmount;

    // تحديث الحالة بناءً على المبلغ المدفوع
    if (this.paidAmount >= this.total && this.total > 0) {
        this.status = 'paid';
    } else if (this.paidAmount > 0) {
        this.status = 'partial';
    } else {
        this.status = 'unpaid';
    }

    next();
});

// Method للبحث عن الفواتير
invoiceSchema.statics.searchInvoices = function (searchTerm, filter = {}) {
    return this.find({
        ...filter, // Apply company filter
        $or: [
            { invoiceNumber: { $regex: searchTerm, $options: 'i' } },
            { clientName: { $regex: searchTerm, $options: 'i' } }
        ]
    }).sort({ createdAt: -1 });
};

// Method لتحديث حالة الفاتورة
invoiceSchema.methods.updateStatus = function (newStatus) {
    this.status = newStatus;
    return this.save();
};

const Invoice = mongoose.model("Invoice", invoiceSchema);
export default Invoice;