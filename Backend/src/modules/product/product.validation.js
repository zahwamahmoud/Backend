import Joi from "joi";

// Add Product validation
const addProductSchema = Joi.object({
    // الحقول الإلزامية
    name: Joi.string()
        .required()
        .trim()
        .min(2)
        .max(200)
        .messages({
            'string.base': 'اسم المنتج يجب أن يكون نصاً',
            'string.empty': 'اسم المنتج مطلوب',
            'string.min': 'اسم المنتج يجب أن يكون على الأقل حرفين',
            'string.max': 'اسم المنتج يجب ألا يتجاوز 200 حرف',
            'any.required': 'اسم المنتج مطلوب'
        }),

    purchasePrice: Joi.number()
        .required()
        .min(0)
        .messages({
            'number.base': 'سعر الشراء يجب أن يكون رقماً',
            'number.min': 'سعر الشراء لا يمكن أن يكون سالباً',
            'any.required': 'سعر الشراء مطلوب'
        }),

    sellingPrice: Joi.number()
        .required()
        .min(0)
        .messages({
            'number.base': 'سعر البيع يجب أن يكون رقماً',
            'number.min': 'سعر البيع لا يمكن أن يكون سالباً',
            'any.required': 'سعر البيع مطلوب'
        }),

    // الحقول الاختيارية
    code: Joi.string()
        .allow('', null)
        .trim()
        .max(50)
        .messages({
            'string.max': 'الكود يجب ألا يتجاوز 50 حرف'
        }),

    category: Joi.string()
        .allow('', null)
        .trim()
        .max(100)
        .messages({
            'string.max': 'التصنيف يجب ألا يتجاوز 100 حرف'
        }),

    type: Joi.string()
        .valid('tracked', 'service')
        .default('tracked')
        .messages({
            'any.only': 'النوع يجب أن يكون منتج بمخزون أو خدمة'
        }),

    description: Joi.string()
        .allow('', null)
        .trim()
        .max(1000)
        .messages({
            'string.max': 'الوصف يجب ألا يتجاوز 1000 حرف'
        }),

    stockQuantity: Joi.number()
        .min(0)
        .default(0)
        .messages({
            'number.base': 'الكمية يجب أن تكون رقماً',
            'number.min': 'الكمية لا يمكن أن تكون سالبة'
        }),

    lowStockThreshold: Joi.number()
        .min(0)
        .default(0)
        .messages({
            'number.base': 'حد التنبيه يجب أن يكون رقماً',
            'number.min': 'حد التنبيه لا يمكن أن يكون سالباً'
        }),

    barcode: Joi.string()
        .allow('', null)
        .trim()
        .max(50)
        .messages({
            'string.max': 'الباركود يجب ألا يتجاوز 50 حرف'
        }),

    taxable: Joi.boolean()
        .default(true),

    taxRate: Joi.number()
        .min(0)
        .max(100)
        .default(14)
        .messages({
            'number.base': 'نسبة الضريبة يجب أن تكون رقماً',
            'number.min': 'نسبة الضريبة لا يمكن أن تكون سالبة',
            'number.max': 'نسبة الضريبة لا يمكن أن تتجاوز 100%'
        }),

    warehouse: Joi.string()
        .valid('main', 'secondary')
        .default('main')
        .messages({
            'any.only': 'المستودع يجب أن يكون رئيسي أو ثانوي'
        }),

    unitName: Joi.string()
        .allow('', null)
        .trim()
        .max(50)
        .messages({
            'string.max': 'اسم الوحدة يجب ألا يتجاوز 50 حرف'
        }),

    multipleUnits: Joi.boolean()
        .default(false),

    profitMargin: Joi.number()
        .min(0),

    isActive: Joi.boolean()
        .default(true),

    image: Joi.any().optional(),
    imagePublicId: Joi.any().optional()
});

// Update Product validation
const updateProductSchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(2)
        .max(200)
        .messages({
            'string.base': 'اسم المنتج يجب أن يكون نصاً',
            'string.min': 'اسم المنتج يجب أن يكون على الأقل حرفين',
            'string.max': 'اسم المنتج يجب ألا يتجاوز 200 حرف'
        }),

    code: Joi.string()
        .allow('', null)
        .trim()
        .max(50),

    category: Joi.string()
        .allow('', null)
        .trim()
        .max(100),

    type: Joi.string()
        .valid('tracked', 'service'),

    purchasePrice: Joi.number()
        .min(0)
        .messages({
            'number.base': 'سعر الشراء يجب أن يكون رقماً',
            'number.min': 'سعر الشراء لا يمكن أن يكون سالباً'
        }),

    sellingPrice: Joi.number()
        .min(0)
        .messages({
            'number.base': 'سعر البيع يجب أن يكون رقماً',
            'number.min': 'سعر البيع لا يمكن أن يكون سالباً'
        }),

    description: Joi.string()
        .allow('', null)
        .trim()
        .max(1000),

    stockQuantity: Joi.number()
        .min(0),

    lowStockThreshold: Joi.number()
        .min(0),

    barcode: Joi.string()
        .allow('', null)
        .trim()
        .max(50),

    taxable: Joi.boolean(),

    taxRate: Joi.number()
        .min(0)
        .max(100),

    warehouse: Joi.string()
        .valid('main', 'secondary'),

    unitName: Joi.string()
        .allow('', null)
        .trim()
        .max(50),

    multipleUnits: Joi.boolean(),

    profitMargin: Joi.number()
        .min(0),

    isActive: Joi.boolean(),

    id: Joi.string()
        .hex()
        .length(24)
        .required()
        .messages({
            'string.hex': 'معرف المنتج غير صحيح',
            'string.length': 'معرف المنتج غير صحيح',
            'any.required': 'معرف المنتج مطلوب'
        })
});

// Update Stock validation
const updateStockSchema = Joi.object({
    quantity: Joi.number()
        .required()
        .min(0.01)
        .messages({
            'number.base': 'الكمية يجب أن تكون رقماً',
            'number.min': 'الكمية يجب أن تكون أكبر من صفر',
            'any.required': 'الكمية مطلوبة'
        }),

    operation: Joi.string()
        .valid('add', 'subtract')
        .required()
        .messages({
            'any.only': 'العملية يجب أن تكون إضافة أو خصم',
            'any.required': 'العملية مطلوبة'
        })
});

export { addProductSchema, updateProductSchema, updateStockSchema };