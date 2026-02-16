import Joi from "joi";

export const addAccountSchema = Joi.object({
    name: Joi.string().required().trim(),
    code: Joi.string().required().trim(),
    type: Joi.string().valid('main', 'sub').required(),
    parentAccount: Joi.string().allow(null, '').optional(),
    branches: Joi.array().items(Joi.string()).optional(),
    status: Joi.string().valid('active', 'inactive').default('active'),
    description: Joi.string().allow('').optional()
});

export const updateAccountSchema = Joi.object({
    name: Joi.string().optional().trim(),
    code: Joi.string().optional().trim(),
    type: Joi.string().valid('main', 'sub').optional(),
    parentAccount: Joi.string().allow(null, '').optional(),
    branches: Joi.array().items(Joi.string()).optional(),
    status: Joi.string().valid('active', 'inactive').optional(),
    description: Joi.string().allow('').optional()
});
