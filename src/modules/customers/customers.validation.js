import Joi from "joi";

const addCustomerSchema = Joi.object({
    name: Joi.string().required().trim(),
    email: Joi.string().email().required().trim(),
    phone: Joi.string().required().trim(),
    address: Joi.object({
        street: Joi.string(),
        city: Joi.string(),
        state: Joi.string(),
        zip: Joi.string(),
        country: Joi.string()
    }),
    status: Joi.string().valid('Lead', 'Active', 'Inactive')
});

const updateCustomerSchema = Joi.object({
    name: Joi.string().trim(),
    email: Joi.string().email().trim(),
    phone: Joi.string().trim(),
    address: Joi.object({
        street: Joi.string(),
        city: Joi.string(),
        state: Joi.string(),
        zip: Joi.string(),
        country: Joi.string()
    }),
    status: Joi.string().valid('Lead', 'Active', 'Inactive'),
    id: Joi.string().hex().length(24).required()
});

export { addCustomerSchema, updateCustomerSchema };
