import Joi from "joi";

const addBankAccountSchema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    accountNumber: Joi.string().allow(""),
    branches: Joi.array().items(Joi.string().valid("main")),
    users: Joi.array().items(Joi.string().hex().length(24)),
    custodians: Joi.array().items(Joi.string()),
    enableReceiptPermissions: Joi.boolean(),
    enablePaymentPermissions: Joi.boolean(),
    balance: Joi.number().min(0)
});

const updateBankAccountSchema = Joi.object({
    name: Joi.string().min(2).max(100),
    accountNumber: Joi.string().allow(""),
    branches: Joi.array().items(Joi.string().valid("main")),
    users: Joi.array().items(Joi.string().hex().length(24)),
    custodians: Joi.array().items(Joi.string()),
    enableReceiptPermissions: Joi.boolean(),
    enablePaymentPermissions: Joi.boolean(),
    balance: Joi.number().min(0)
});

export {
    addBankAccountSchema,
    updateBankAccountSchema
};
