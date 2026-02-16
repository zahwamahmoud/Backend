import Joi from "joi";

export const addPartnerListSchema = Joi.object({
    name: Joi.string().required().trim(),
    description: Joi.string().allow('').optional()
});

export const updatePartnerListSchema = Joi.object({
    name: Joi.string().optional().trim(),
    description: Joi.string().allow('').optional()
});
