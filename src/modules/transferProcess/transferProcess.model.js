import mongoose from "mongoose";

const transferProcessSchema = new mongoose.Schema(
    {
        // ربط مباشر بـ Operation
        operation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Operation",
            required: true
        },

        // التاريخ
        date: {
            type: Date,
            default: Date.now
        },

        // المخزن (المستودع الرئيسي فقط)
        toWarehouse: {
            type: mongoose.Schema.Types.Mixed,
            required: true
        },
        fromWarehouse: {
            type: mongoose.Schema.Types.Mixed,
            required: true
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
            trim: true,
            default: ""
        },

        // مرفقات
        attachments: [
            {
                secure_url: { type: String },
                public_id: { type: String }
            }
        ],
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company',
            required: true
        }
    },
    { timestamps: true }
);

export const transferProcessModel =
    mongoose.models.TransferProcess ||
    mongoose.model("TransferProcess", transferProcessSchema);
