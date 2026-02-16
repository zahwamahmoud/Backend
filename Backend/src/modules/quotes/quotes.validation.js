import Joi from "joi";

const currencyValidator = Joi.string().valid("EGP", "USD", "EUR", "SAR", "AED", "GBP");

const addQuoteSchema = Joi.object({
    customer: Joi.string().hex().length(24).required(),
    items: Joi.array().items(Joi.object({
        product: Joi.string().hex().length(24).required(),
        quantity: Joi.number().min(1).required(),
        price: Joi.number().required()
    })).required(),
    totalAmount: Joi.number().required(),
    status: Joi.string().valid('Pending', 'Accepted', 'Rejected'),
    expiryDate: Joi.date().required(),
    currency: currencyValidator.optional()
});

const updateQuoteSchema = Joi.object({
    customer: Joi.string().hex().length(24),
    items: Joi.array().items(Joi.object({
        product: Joi.string().hex().length(24),
        quantity: Joi.number().min(1),
        price: Joi.number()
    })),
    totalAmount: Joi.number(),
    status: Joi.string().valid('Pending', 'Accepted', 'Rejected'),
    expiryDate: Joi.date(),
    currency: currencyValidator.optional(),
    id: Joi.string().hex().length(24).required()
});

export { addQuoteSchema, updateQuoteSchema };
