import Joi from "joi";

// Add Operation
export const addOperationSchema = Joi.object({
    type: Joi.string()
        .valid(
            "stock add process",
            "inventory exchange process",
            "transfer process",
            "inventory operation"
        )
        .required()
        .messages({
            "any.only": "نوع العملية غير صحيح",
            "any.required": "نوع العملية مطلوب"
        }),
    warehouse: Joi.alternatives().try(
        Joi.string().hex().length(24),
        Joi.string().valid("main", "secondary")
    ).allow(null, ""),
    date: Joi.any().optional(),
    account: Joi.string().allow("", null).optional(),
    totalAmount: Joi.any().optional(),
    attachments: Joi.array().items(Joi.object({
        secure_url: Joi.string().required(),
        public_id: Joi.string().required()
    })).optional(),
}).unknown(true);

// Update Operation
export const updateOperationSchema = Joi.object({
    type: Joi.string()
        .valid(
            "stock add process",
            "inventory exchange process",
            "transfer process"
        )
        .messages({
            "any.only": "نوع العملية غير صحيح"
        }),
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
