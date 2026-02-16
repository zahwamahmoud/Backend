import Joi from "joi";

const requisitionItemSchema = Joi.object({
    product: Joi.string().hex().length(24).required().messages({
        "any.required": "المنتج مطلوب"
    }),
    quantity: Joi.number().min(1).required().messages({
        "any.required": "الكمية مطلوبة",
        "number.min": "الكمية يجب أن تكون أكبر من صفر"
    })
});

export const addRequisitionSchema = Joi.object({
    number: Joi.string().required().messages({
        "any.required": "الرقم مطلوب"
    }),
    type: Joi.string().valid("financial", "inventory_in", "inventory_out").default("financial").messages({
        "any.only": "نوع الإذن غير صحيح"
    }),
    warehouse: Joi.alternatives().try(
        Joi.string().hex().length(24),
        Joi.string().valid("main", "secondary")
    ).required().messages({
        "any.required": "المخزن مطلوب"
    }),
    startDate: Joi.date().required().messages({
        "any.required": "تاريخ البدء مطلوب",
        "date.base": "تاريخ البدء غير صحيح"
    }),
    endDate: Joi.date().required().messages({
        "any.required": "تاريخ الانتهاء مطلوب",
        "date.base": "تاريخ الانتهاء غير صحيح"
    }),
    status: Joi.string().valid("pending", "approved", "rejected").optional(),
    createdBy: Joi.string().hex().length(24).optional(),
    items: Joi.when("type", {
        is: Joi.string().valid("inventory_in", "inventory_out"),
        then: Joi.array().items(requisitionItemSchema).min(1).required().messages({
            "array.min": "يجب إضافة بند واحد على الأقل للإذونات المخزنية",
            "any.required": "البنود مطلوبة للإذن المخزني"
        }),
        otherwise: Joi.array().items(requisitionItemSchema).optional()
    })
});

export const updateRequisitionSchema = Joi.object({
    id: Joi.string().hex().length(24).optional(),
    number: Joi.string().optional(),
    type: Joi.string().valid("financial", "inventory_in", "inventory_out").optional(),
    warehouse: Joi.alternatives().try(
        Joi.string().hex().length(24),
        Joi.string().valid("main", "secondary")
    ).optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    status: Joi.string().valid("pending", "approved", "rejected").optional(),
    createdBy: Joi.string().hex().length(24).optional(),
    items: Joi.array().items(requisitionItemSchema).optional()
});
