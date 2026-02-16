import Joi from "joi";

// Add
export const addWarehouseSchema = Joi.object({
    name: Joi.string()
        .trim()
        .required()
        .messages({
            "any.required": "اسم المستودع مطلوب"
        }),

    account: Joi.string().optional(),

    branch: Joi.string()
        .valid("main", "secondary")
        .optional(),

    users: Joi.array()
        .items(Joi.string().hex().length(24))
        .optional(),

    enableReceiving: Joi.boolean().optional(),
    enableIssuing: Joi.boolean().optional()
});

// Update
export const updateWarehouseSchema = Joi.object({
    id: Joi.string()
        .hex()
        .length(24)
        .required()
        .messages({
            "any.required": "ID مطلوب"
        }),

    name: Joi.string().trim().optional(),

    account: Joi.string().optional(),

    users: Joi.array()
        .items(Joi.string().hex().length(24))
        .optional(),

    enableReceiving: Joi.boolean().optional(),
    enableIssuing: Joi.boolean().optional()
});
