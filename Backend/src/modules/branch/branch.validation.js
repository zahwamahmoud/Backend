import Joi from "joi";

export const addBranchSchema = Joi.object({
    name: Joi.string().required().trim(),
    code: Joi.string().required().trim(),
    address1: Joi.string().allow('').optional(),
    address2: Joi.string().allow('').optional(),
    city: Joi.string().allow('').optional(),
    neighborhood: Joi.string().allow('').optional(),
    postalCode: Joi.string().allow('').optional(),
    region: Joi.string().allow('').optional(),
    country: Joi.string().allow('').optional(),
    phone: Joi.string().optional().allow(''),
    commercialRegister: Joi.string().allow('').optional(),
    partners: Joi.array().items(Joi.string().trim()).optional(),
    partnerList: Joi.string().trim().optional(),
    activity: Joi.string().trim().optional(),
    status: Joi.string().valid('active', 'inactive').default('active')
});

export const updateBranchSchema = Joi.object({
    name: Joi.string().optional().trim(),
    code: Joi.string().optional().trim(),
    address1: Joi.string().allow('').optional(),
    address2: Joi.string().allow('').optional(),
    city: Joi.string().allow('').optional(),
    neighborhood: Joi.string().allow('').optional(),
    postalCode: Joi.string().allow('').optional(),
    region: Joi.string().allow('').optional(),
    country: Joi.string().allow('').optional(),
    phone: Joi.string().optional().allow(''),
    commercialRegister: Joi.string().allow('').optional(),
    partners: Joi.array().items(Joi.string().trim()).optional(),
    partnerList: Joi.string().trim().optional(),
    activity: Joi.string().trim().optional(),
    status: Joi.string().valid('active', 'inactive').optional()
});
