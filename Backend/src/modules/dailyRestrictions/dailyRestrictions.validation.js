import Joi from "joi";

const entryItemSchema = Joi.object({
    accountId: Joi.string().required().trim().messages({
        'string.empty': 'Each entry must have an account',
        'any.required': 'Each entry must have an account'
    }),
    debit: Joi.number().min(0).default(0).messages({
        'number.min': 'Debit must be 0 or greater'
    }),
    credit: Joi.number().min(0).default(0).messages({
        'number.min': 'Credit must be 0 or greater'
    }),
    description: Joi.string().allow('').optional()
});

export const addRestrictionSchema = Joi.object({
    number: Joi.string().optional().trim(),
    date: Joi.date().required(),
    description: Joi.string().allow('').optional(),
    source: Joi.string().allow('').optional().trim(),
    totalDebit: Joi.number().optional().default(0),
    totalCredit: Joi.number().optional().default(0),
    entries: Joi.array()
        .items(entryItemSchema)
        .required()
        .min(1)
        .messages({
            'array.base': '"entries" must be an array',
            'any.required': '"entries" is required',
            'array.min': '"entries" must contain at least one row'
        })
});

export const updateRestrictionSchema = Joi.object({
    number: Joi.string().optional().trim(),
    date: Joi.date().optional(),
    description: Joi.string().allow('').optional(),
    source: Joi.string().allow('').optional().trim(),
    totalDebit: Joi.number().optional(),
    totalCredit: Joi.number().optional(),
    entries: Joi.array()
        .items(entryItemSchema.keys({
            _id: Joi.string().optional()
        }))
        .optional()
        .min(1)
        .messages({
            'array.base': '"entries" must be an array',
            'array.min': '"entries" must contain at least one row'
        })
});
