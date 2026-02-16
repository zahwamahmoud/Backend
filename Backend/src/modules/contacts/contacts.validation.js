import Joi from "joi";

export const contactSchema = Joi.object({
    name: Joi.string().required(),
    type: Joi.string().valid('individual', 'commercial').default('individual'),
    code: Joi.string().allow('').optional(),
    taxNumber: Joi.when('type', { is: 'commercial', then: Joi.string().required().min(1), otherwise: Joi.string().allow('').optional() }),
    commercialRegister: Joi.when('type', { is: 'commercial', then: Joi.string().required().min(1), otherwise: Joi.string().allow('').optional() }),
    phone: Joi.string().allow('').optional(),
    mobile: Joi.string().allow('').optional(),
    alternativePhone: Joi.string().allow('').optional(),
    email: Joi.string().email().allow('').optional(),
    address: Joi.object({
        address1: Joi.string().allow('').optional(),
        address2: Joi.string().allow('').optional(),
        neighborhood: Joi.string().allow('').optional(),
        city: Joi.string().allow('').optional(),
        province: Joi.string().allow('').optional(),
        zipCode: Joi.string().allow('').optional(),
        country: Joi.string().allow('').optional()
    }).optional(),
    additionalContacts: Joi.array().items(Joi.object({
        name: Joi.string().optional(),
        phone: Joi.string().allow('').optional(),
        email: Joi.string().email().allow('').optional(),
        title: Joi.string().optional()
    })).optional(),
    initialBalance: Joi.number().min(0).optional(),
    creditLimit: Joi.number().min(0).optional(),
    notes: Joi.string().allow('').optional(),
    isActive: Joi.boolean().optional()
}).unknown(true);
