import Joi from "joi";

const itemSchema = Joi.object({
    productId: Joi.string().hex().length(24).optional().allow('', null),
    productName: Joi.string().required().trim().messages({
        'string.empty': 'اسم المنتج مطلوب',
        'any.required': 'اسم المنتج مطلوب'
    }),
    description: Joi.string().required().trim().messages({
        'string.empty': 'وصف المنتج مطلوب',
        'any.required': 'وصف المنتج مطلوب'
    }),
    quantity: Joi.number().min(1).required().messages({
        'number.min': 'الكمية يجب أن تكون على الأقل 1',
        'any.required': 'الكمية مطلوبة'
    }),
    price: Joi.number().min(0).required().messages({
        'number.min': 'السعر لا يمكن أن يكون سالباً',
        'any.required': 'السعر مطلوب'
    }),
    discount: Joi.number().min(0).default(0).optional().messages({
        'number.min': 'الخصم لا يمكن أن يكون سالباً',
        'number.base': 'الخصم يجب أن يكون رقماً'
    }),
    discountType: Joi.string().valid("%", "fixed").default("%").optional().messages({
        'any.only': 'نوع الخصم يجب أن يكون % أو fixed'
    }),
    tax: Joi.number().min(0).default(0).optional().allow('', null).messages({
        'number.min': 'الضريبة لا يمكن أن تكون سالبة',
        'number.base': 'الضريبة يجب أن تكون رقماً'
    })
}).unknown(true); // ✅ السماح بالحقول الإضافية

const currencyValidator = Joi.string().valid("EGP", "USD", "EUR", "SAR", "AED", "GBP");

const createInvoiceSchema = Joi.object({
    invoiceNumber: Joi.string().required().trim().messages({
        'string.empty': 'رقم الفاتورة مطلوب',
        'any.required': 'رقم الفاتورة مطلوب'
    }),

    issueDate: Joi.date().required().messages({
        'any.required': 'تاريخ الإصدار مطلوب'
    }),

    dueDate: Joi.date().required().messages({
        'any.required': 'تاريخ الاستحقاق مطلوب'
    }),

    clientId: Joi.string().hex().length(24).required().messages({
        'string.hex': 'معرف العميل غير صحيح',
        'string.length': 'معرف العميل غير صحيح',
        'any.required': 'يجب اختيار العميل'
    }),

    clientName: Joi.string().required().trim().messages({
        'string.empty': 'اسم العميل مطلوب',
        'any.required': 'اسم العميل مطلوب'
    }),

    warehouse: Joi.string().trim().allow("").optional(),

    items: Joi.array().items(itemSchema).required().min(1).messages({
        'array.min': 'يجب إضافة منتج واحد على الأقل',
        'any.required': 'المنتجات مطلوبة'
    }),

    invoiceDiscount: Joi.number().min(0).default(0).optional().allow('', null),
    invoiceDiscountType: Joi.string().valid("%", "fixed").default("%").optional(),

    paidAmount: Joi.number().min(0).default(0).optional().allow('', null),

    // هذه الحقول اختيارية لأنها ستحسب تلقائياً
    subtotal: Joi.number().min(0).optional().allow('', null),
    tax: Joi.number().min(0).optional().allow('', null),
    total: Joi.number().min(0).optional().allow('', null),
    discount: Joi.number().min(0).optional().allow('', null), // ✅ إضافة حقل discount

    notes: Joi.string().trim().allow("").optional(),

    paymentMethod: Joi.string().valid("cash", "card", "bank", "check", "other").default("cash").optional(),

    attachments: Joi.alternatives().try(
        Joi.array().items(
            Joi.object({
                filename: Joi.string(),
                path: Joi.string(),
                mimetype: Joi.string(),
                size: Joi.number()
            })
        ),
        Joi.any() // ✅ السماح بأي نوع للـ attachments
    ).default([]).optional(),

    status: Joi.string().valid("paid", "unpaid", "partial", "draft").default("paid").optional(),

    currency: currencyValidator.default("EGP").optional(),

    createdBy: Joi.string().hex().length(24).optional(),
    lastModifiedBy: Joi.string().hex().length(24).optional(),

    // ✅ السماح بالحقول الإضافية من الفرونت
    activeTab: Joi.string().optional() // للـ activeTab من الفرونت

}).unknown(true); // ✅ السماح بأي حقول إضافية

const updateInvoiceSchema = Joi.object({
    invoiceNumber: Joi.string().trim().optional(),

    issueDate: Joi.date().optional(),

    dueDate: Joi.date().optional(),

    clientId: Joi.string().hex().length(24).optional(),

    clientName: Joi.string().trim().optional(),

    warehouse: Joi.string().trim().allow("").optional(),

    items: Joi.array().items(itemSchema).min(1).optional(),

    invoiceDiscount: Joi.number().min(0).optional().allow('', null),
    invoiceDiscountType: Joi.string().valid("%", "fixed").optional(),

    paidAmount: Joi.number().min(0).optional().allow('', null),

    subtotal: Joi.number().min(0).optional().allow('', null),
    tax: Joi.number().min(0).optional().allow('', null),
    total: Joi.number().min(0).optional().allow('', null),
    discount: Joi.number().min(0).optional().allow('', null),

    notes: Joi.string().trim().allow("").optional(),

    paymentMethod: Joi.string().valid("cash", "card", "bank", "check", "other").optional(),

    attachments: Joi.alternatives().try(
        Joi.array().items(
            Joi.object({
                filename: Joi.string(),
                path: Joi.string(),
                mimetype: Joi.string(),
                size: Joi.number()
            })
        ),
        Joi.any()
    ).optional(),

    status: Joi.string().valid("paid", "unpaid", "partial", "draft").optional(),

    currency: currencyValidator.optional(),

    lastModifiedBy: Joi.string().hex().length(24).optional(),

    activeTab: Joi.string().optional(),

    id: Joi.string().hex().length(24).required().messages({
        'string.hex': 'معرف غير صحيح',
        'string.length': 'معرف غير صحيح',
        'any.required': 'المعرف مطلوب'
    })
}).unknown(true); // ✅ السماح بأي حقول إضافية

const updateStatusSchema = Joi.object({
    status: Joi.string().valid("paid", "unpaid", "partial", "draft").required().messages({
        'any.only': 'الحالة يجب أن تكون: paid, unpaid, partial, أو draft',
        'any.required': 'الحالة مطلوبة'
    }),

    id: Joi.string().hex().length(24).required().messages({
        'string.hex': 'معرف غير صحيح',
        'string.length': 'معرف غير صحيح',
        'any.required': 'المعرف مطلوب'
    })
}).unknown(true);

export {
    createInvoiceSchema,
    updateInvoiceSchema,
    updateStatusSchema
};