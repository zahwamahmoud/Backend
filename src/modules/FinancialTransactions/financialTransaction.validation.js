import Joi from "joi";

const receiptSchema = Joi.object({
    code: Joi.string().required(),
    date: Joi.date().required(),
    account: Joi.string().hex().length(24).required(),
    accountModel: Joi.string().valid('Safe', 'BankAccount').required(),
    externalAccount: Joi.string().allow('').optional(),
    amount: Joi.number().min(0).required(),
    taxes: Joi.string().allow('').optional(),
    description: Joi.string().allow('').optional(),
}).unknown(true);

const disbursementSchema = Joi.object({
    code: Joi.string().required(),
    date: Joi.date().required(),
    account: Joi.string().hex().length(24).required(),
    accountModel: Joi.string().valid('Safe', 'BankAccount').required(),
    externalAccount: Joi.string().allow('').optional(),
    amount: Joi.number().min(0).required(),
    taxes: Joi.string().allow('').optional(),
    description: Joi.string().allow('').optional(),
}).unknown(true);

const transferSchema = Joi.object({
    code: Joi.string().required(),
    date: Joi.date().required(),
    fromAccount: Joi.string().hex().length(24).required(),
    fromAccountModel: Joi.string().valid('Safe', 'BankAccount').required(),
    toAccount: Joi.string().hex().length(24).required(),
    toAccountModel: Joi.string().valid('Safe', 'BankAccount').required(),
    amount: Joi.number().min(0).required(),
    description: Joi.string().allow('').optional(),
}).unknown(true);

export { receiptSchema, disbursementSchema, transferSchema };
