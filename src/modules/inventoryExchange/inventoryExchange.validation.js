import Joi from "joi";

// Add Inventory Exchange
export const addInventoryExchangeSchema = Joi.object({
    operation: Joi.string()
        .hex()
        .length(24)
        .required()
        .messages({
            "string.hex": "Operation ID غير صحيح",
            "string.length": "Operation ID غير صحيح",
            "any.required": "Operation مطلوب"
        }),

    warehouse: Joi.alternatives().try(
        Joi.string().hex().length(24),
        Joi.string().valid("main", "secondary")
    ).required()
        .messages({
            "any.required": "المخزن مطلوب"
        }),

    product: Joi.string()
        .hex()
        .length(24)
        .required()
        .messages({
            "string.hex": "Product ID غير صحيح",
            "string.length": "Product ID غير صحيح",
            "any.required": "المنتج مطلوب"
        }),

    quantity: Joi.number()
        .greater(0)
        .required()
        .messages({
            "number.base": "الكمية يجب أن تكون رقم",
            "number.greater": "الكمية يجب أن تكون أكبر من صفر",
            "any.required": "الكمية مطلوبة"
        }),

    account: Joi.string().allow("", null).optional(),
    date: Joi.any().optional(),
    totalAmount: Joi.any().optional(),
    description: Joi.string().allow("", null).optional(),
    attachments: Joi.array().items(Joi.object({
        secure_url: Joi.string().required(),
        public_id: Joi.string().required()
    })).optional(),
    createdBy: Joi.string().hex().length(24).optional()
}).unknown(true);

// Update Inventory Exchange
export const updateInventoryExchangeSchema = Joi.object({
    operation: Joi.string().hex().length(24),

    warehouse: Joi.alternatives().try(
        Joi.string().hex().length(24),
        Joi.string().valid("main", "secondary")
    ),
    date: Joi.date().allow(null, ""),
    totalAmount: Joi.number().allow(null, ""),

    product: Joi.string().hex().length(24),
    quantity: Joi.number().greater(0),

    account: Joi.string().allow(""),
    description: Joi.string().allow(""),
    attachments: Joi.array().items(Joi.object({
        secure_url: Joi.string().required(),
        public_id: Joi.string().required()
    })).optional(),

    id: Joi.string()
        .hex()
        .length(24)
        .required()
        .messages({
            "string.hex": "ID غير صحيح",
            "string.length": "ID غير صحيح",
            "any.required": "ID مطلوب"
        })
});
