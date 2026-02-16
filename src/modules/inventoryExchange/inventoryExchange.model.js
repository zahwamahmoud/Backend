import mongoose from "mongoose";

const inventoryExchangeSchema = new mongoose.Schema(
    {
        operation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Operation",
            required: true
        },

        // المخزن (المستودع الرئيسي فقط)
        warehouse: {
            type: mongoose.Schema.Types.Mixed,
            required: true
        },

        // الحساب (اختياري)
        account: {
            type: String,
            trim: true
        },

        // التاريخ
        date: {
            type: Date,
            default: Date.now
        },

        // المنتج
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },

        // الكمية
        quantity: {
            type: Number,
            required: true,
            min: 0.01
        },

        // الوصف
        description: {
            type: String,
            trim: true
        },

        // المرفقات
        attachments: [
            {
                secure_url: { type: String },
                public_id: { type: String }
            }
        ],

        // تم بواسطة
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Contact"
        },
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: true
        }
    },
    {
        timestamps: true
    }
);

export const inventoryExchangeModel = mongoose.model(
    "InventoryExchange",
    inventoryExchangeSchema
);
