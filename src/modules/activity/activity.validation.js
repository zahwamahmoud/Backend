import Joi from "joi";

export const addActivitySchema = Joi.object({
    name: Joi.string().required().trim(),
    description: Joi.string().allow('').optional()
});

export const updateActivitySchema = Joi.object({
    name: Joi.string().optional().trim(),
    description: Joi.string().allow('').optional()
});
