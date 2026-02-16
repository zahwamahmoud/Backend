import Joi from "joi";

// Add Category validation
const addCategorySchema = Joi.object({
    name: Joi.string()
        .required()
        .trim()
        .min(2)
        .max(200)
        .messages({
            'string.base': 'اسم التصنيف يجب أن يكون نصاً',
            'string.empty': 'اسم التصنيف مطلوب',
            'string.min': 'اسم التصنيف يجب أن يكون على الأقل حرفين',
            'string.max': 'اسم التصنيف يجب ألا يتجاوز 200 حرف',
            'any.required': 'اسم التصنيف مطلوب'
        }),
    description: Joi.string()
        .allow('', null)
        .trim()
        .max(1000)
        .messages({
            'string.max': 'الوصف يجب ألا يتجاوز 1000 حرف'
        }),
    parentCategory: Joi.string()
        .hex()
        .length(24)
        .allow(null)
        .messages({
            'string.hex': 'التصنيف الرئيسي غير صحيح',
            'string.length': 'التصنيف الرئيسي غير صحيح'
        })
});

// Update Category validation
const updateCategorySchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(2)
        .max(200),
    description: Joi.string()
        .allow('', null)
        .trim()
        .max(1000),
    parentCategory: Joi.string()
        .hex()
        .length(24)
        .allow(null),
    id: Joi.string()
        .hex()
        .length(24)
        .required()
        .messages({
            'string.hex': 'معرف التصنيف غير صحيح',
            'string.length': 'معرف التصنيف غير صحيح',
            'any.required': 'معرف التصنيف مطلوب'
        })
});

export { addCategorySchema, updateCategorySchema };
