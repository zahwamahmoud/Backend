import Joi from "joi";

export const addTransferProcessSchema = Joi.object({
    operation: Joi.string()
        .hex()
        .length(24)
        .required()
        .messages({
            "string.hex": "Operation ID غير صحيح",
            "string.length": "Operation ID غير صحيح",
            "any.required": "Operation مطلوب"
        }),

    fromWarehouse: Joi.alternatives().try(
        Joi.string().hex().length(24),
        Joi.string().valid("main", "secondary")
    ).required(),

    toWarehouse: Joi.alternatives().try(
        Joi.string().hex().length(24),
        Joi.string().valid("main", "secondary")
    ).required(),

    date: Joi.any().optional(),

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
            "number.greater": "الكمية يجب أن تكون أكبر من صفر",
            "any.required": "الكمية مطلوبة"
        }),

    account: Joi.string().allow("", null).optional(),
    totalAmount: Joi.any().optional(),
    description: Joi.string().allow("", null).optional(),

    attachments: Joi.array()
        .items(Joi.object({
            secure_url: Joi.string().required(),
            public_id: Joi.string().required()
        }))
        .optional()
}).unknown(true);




export const updateTransferProcessSchema = Joi.object({
    id: Joi.string()
        .hex()
        .length(24)
        .required()
        .messages({
            "string.hex": "ID غير صحيح",
            "string.length": "ID غير صحيح",
            "any.required": "ID مطلوب"
        }),

    operation: Joi.string()
        .hex()
        .length(24)
        .optional(),

    fromWarehouse: Joi.alternatives().try(
        Joi.string().hex().length(24),
        Joi.string().valid("main", "secondary")
    ).optional(),

    toWarehouse: Joi.alternatives().try(
        Joi.string().hex().length(24),
        Joi.string().valid("main", "secondary")
    ).optional(),

    date: Joi.date().allow(null, ""),
    account: Joi.string().allow("", null),
    totalAmount: Joi.number().allow(null, ""),

    product: Joi.string()
        .hex()
        .length(24)
        .optional(),

    quantity: Joi.number()
        .greater(0)
        .optional(),

    description: Joi.string().allow("").optional(),

    attachments: Joi.array()
        .items(Joi.object({
            secure_url: Joi.string().required(),
            public_id: Joi.string().required()
        }))
        .optional()
});
