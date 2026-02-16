import Joi from "joi";

// Add Inventory Operation
export const addInventoryOperationSchema = Joi.object({
  warehouse: Joi.alternatives().try(
    Joi.string().hex().length(24),
    Joi.string().valid("main", "secondary")
  ).required()
    .messages({ "any.required": "المخزن مطلوب" }),

  account: Joi.string().allow("", null).optional(),
  totalAmount: Joi.any().optional(),

  mainBranch: Joi.string().valid("main").optional(),

  date: Joi.any().optional(),

  description: Joi.string().trim().allow("", null).optional(),
  items: Joi.array().items(
    Joi.object({
      product: Joi.string().hex().length(24).required(),
      quantity: Joi.number().min(0).required()
    })
  ).optional(),
  attachments: Joi.array().items(Joi.object({
    secure_url: Joi.string().required(),
    public_id: Joi.string().required()
  })).optional()
}).unknown(true);

// Update Inventory Operation
export const updateInventoryOperationSchema = Joi.object({
  id: Joi.string()
    .hex()
    .length(24)
    .required()
    .messages({ "any.required": "ID مطلوب" }),

  warehouse: Joi.alternatives().try(
    Joi.string().hex().length(24),
    Joi.string().valid("main", "secondary")
  ).optional(),

  account: Joi.string().allow("", null).optional(),
  totalAmount: Joi.number().allow(null, "").optional(),
  date: Joi.date().allow(null, "").optional(),

  description: Joi.string().trim().optional(),
  attachments: Joi.array().items(Joi.object({
    secure_url: Joi.string().required(),
    public_id: Joi.string().required()
  })).optional()
});
