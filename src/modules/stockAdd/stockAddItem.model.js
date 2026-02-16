import mongoose from "mongoose";

const stockAddItemSchema = new mongoose.Schema(
    {
        // العملية الرئيسية
        stockAdd: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "StockAdd",
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
            min: [0.01, "الكمية يجب أن تكون أكبر من صفر"]
        },

        // تكلفة الوحدة
        unitCost: {
            type: Number,
            required: true,
            min: [0, "التكلفة لا يمكن أن تكون سالبة"]
        },

        // الإجمالي
        totalCost: {
            type: Number,
            default: 0
        },
        // الشركة
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company',
            required: true
        }
    },
    {
        timestamps: true
    }
);

// حساب إجمالي البند
stockAddItemSchema.pre("save", function (next) {
    this.totalCost = this.quantity * this.unitCost;
    next();
});

export const stockAddItemModel = mongoose.model(
    "StockAddItem",
    stockAddItemSchema
);
