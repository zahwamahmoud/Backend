import Joi from "joi";

// Add Expense validation
const addExpenseSchema = Joi.object({
    // الحقول الإلزامية
    date: Joi.date()
        .required()
        .messages({
            'date.base': 'التاريخ يجب أن يكون تاريخاً صحيحاً',
            'any.required': 'التاريخ مطلوب'
        }),

    wallet: Joi.string()
        .required()
        .valid('main', 'bank')
        .messages({
            'string.base': 'المحفظة يجب أن تكون نصاً',
            'any.only': 'المحفظة يجب أن تكون خزنة رئيسية أو بنك',
            'any.required': 'المحفظة مطلوبة'
        }),

    amount: Joi.number()
        .required()
        .min(0)
        .messages({
            'number.base': 'المبلغ يجب أن يكون رقماً',
            'number.min': 'المبلغ لا يمكن أن يكون سالباً',
            'any.required': 'المبلغ مطلوب'
        }),

    // الحقول الاختيارية
    code: Joi.string()
        .allow('', null)
        .trim()
        .max(50)
        .messages({
            'string.max': 'الكود يجب ألا يتجاوز 50 حرف'
        }),

    account: Joi.string()
        .allow('', null)
        .trim()
        .max(200)
        .messages({
            'string.max': 'الحساب يجب ألا يتجاوز 200 حرف'
        }),

    taxes: Joi.number()
        .min(0)
        .default(0)
        .messages({
            'number.base': 'الضرائب يجب أن تكون رقماً',
            'number.min': 'الضرائب لا يمكن أن تكون سالبة'
        }),

    description: Joi.string()
        .allow('', null)
        .trim()
        .max(1000)
        .messages({
            'string.max': 'الوصف يجب ألا يتجاوز 1000 حرف'
        }),

    existingAttachments: Joi.string().allow('', null)
});

// Update Expense validation
const updateExpenseSchema = Joi.object({
    date: Joi.date()
        .messages({
            'date.base': 'التاريخ يجب أن يكون تاريخاً صحيحاً'
        }),

    wallet: Joi.string()
        .valid('main', 'bank')
        .messages({
            'any.only': 'المحفظة يجب أن تكون خزنة رئيسية أو بنك'
        }),

    amount: Joi.number()
        .min(0)
        .messages({
            'number.base': 'المبلغ يجب أن يكون رقماً',
            'number.min': 'المبلغ لا يمكن أن يكون سالباً'
        }),

    code: Joi.string()
        .allow('', null)
        .trim()
        .max(50),

    account: Joi.string()
        .allow('', null)
        .trim()
        .max(200),

    taxes: Joi.number()
        .min(0),

    description: Joi.string()
        .allow('', null)
        .trim()
        .max(1000),

    id: Joi.string()
        .hex()
        .length(24)
        .required()
        .messages({
            'string.hex': 'معرف المصروف غير صحيح',
            'string.length': 'معرف المصروف غير صحيح',
            'any.required': 'معرف المصروف مطلوب'
        }),

    existingAttachments: Joi.string().allow('', null)
});

export { addExpenseSchema, updateExpenseSchema };
