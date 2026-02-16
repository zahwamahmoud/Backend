import Joi from "joi";

export const addRoleSchema = Joi.object({
    name: Joi.string().trim().required(),
    companyId: Joi.string().hex().length(24).optional(),
    permissions: Joi.array().items(Joi.string().trim()).optional().default([]),
    status: Joi.string().valid("active", "inactive").optional().default("active"),
});

export const updateRoleSchema = Joi.object({
    name: Joi.string().trim().optional(),
    permissions: Joi.array().items(Joi.string().trim()).optional(),
    status: Joi.string().valid("active", "inactive").optional(),
});
