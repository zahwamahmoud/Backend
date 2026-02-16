import Joi from "joi";

const currencyValidator = Joi.string()
    .valid("EGP", "USD", "EUR", "SAR", "AED", "GBP")
    .trim()
    .uppercase()
    .optional()
    .default("EGP");

export const transactionSchema = Joi.object({
    transactionNumber: Joi.string().required(),
    contact: Joi.string().hex().length(24).required(),
    issueDate: Joi.date().required(),
    dueDate: Joi.date().optional(),
    warehouse: Joi.string().optional().allow(''),
    currency: currencyValidator,

    items: Joi.array().items(
        Joi.object({
            product: Joi.string().hex().length(24).required(),
            productName: Joi.string().optional().allow(''),
            quantity: Joi.number().positive().required(),
            unitPrice: Joi.number().min(0).required(),
            discountPercent: Joi.number().min(0).max(100).optional(),
            discountAmount: Joi.number().min(0).optional(),
            taxPercent: Joi.number().min(0).optional()
        })
    ).min(1).required(),

    notes: Joi.string().optional().allow(''),
    generalDiscount: Joi.number().min(0).optional(),
    generalDiscountPercent: Joi.number().min(0).max(100).optional(),

    paidAmount: Joi.number().min(0).optional(),
    paymentMethod: Joi.string().optional()
}).unknown(true);
