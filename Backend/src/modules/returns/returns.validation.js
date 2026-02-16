import Joi from "joi";

const addReturnSchema = Joi.object({
    invoice: Joi.string().hex().length(24).required(),
    items: Joi.array().items(Joi.object({
        product: Joi.string().hex().length(24).required(),
        quantity: Joi.number().min(1).required(),
        reason: Joi.string()
    })).required(),
    totalRefundAmount: Joi.number().required(),
    status: Joi.string().valid('Pending', 'Approved', 'Rejected', 'Completed'),
    date: Joi.date()
});

const updateReturnSchema = Joi.object({
    invoice: Joi.string().hex().length(24),
    items: Joi.array().items(Joi.object({
        product: Joi.string().hex().length(24),
        quantity: Joi.number().min(1),
        reason: Joi.string()
    })),
    totalRefundAmount: Joi.number(),
    status: Joi.string().valid('Pending', 'Approved', 'Rejected', 'Completed'),
    date: Joi.date(),
    id: Joi.string().hex().length(24).required()
});

export { addReturnSchema, updateReturnSchema };
