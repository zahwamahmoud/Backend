import Joi from "joi";

const updateSettingsSchema = Joi.object({
    settings: Joi.object().required()
});

const getSettingsSchema = Joi.object({
    category: Joi.string().valid('general', 'sales', 'purchases', 'customers', 'suppliers', 'accounting', 'export').optional()
});

export { updateSettingsSchema, getSettingsSchema };
