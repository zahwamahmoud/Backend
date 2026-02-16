import Joi from "joi";

export const paymentSchema = Joi.object({
    date: Joi.date().optional(),

    treasury: Joi.string()
        .valid('main', 'bank')
        .required(),

    operationType: Joi.string()
        .valid('receive', 'spend')
        .optional(),

    contact: Joi.string()
        .hex()
        .length(24)
        .optional(),

    invoice: Joi.string()
        .hex()
        .length(24)
        .optional(),

    invoiceType: Joi.string()
        .valid('automatic', 'custom')
        .default('automatic')
        .optional(),

    amount: Joi.number()
        .min(0)
        .optional(),

    notes: Joi.string()
        .trim()
        .allow('')
        .optional(),

    referenceNumber: Joi.string()
        .trim()
        .allow('')
        .optional()

}).unknown(true);