import mongoose from "mongoose";

const requisitionItemSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        }
    },
    { _id: true }
);

const requisitionSchema = new mongoose.Schema(
    {
        number: {
            type: String,
            required: true,
            trim: true
        },
        type: {
            type: String,
            enum: ["financial", "inventory_in", "inventory_out"],
            default: "financial"
        },
        warehouse: {
            type: mongoose.Schema.Types.Mixed,
            required: true
        },
        startDate: {
            type: Date,
            required: true
        },
        endDate: {
            type: Date,
            required: true
        },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending"
        },
        items: {
            type: [requisitionItemSchema],
            default: undefined
        },
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

requisitionSchema.index({ number: 1, companyId: 1 }, { unique: true });

export const requisitionModel = mongoose.model("Requisition", requisitionSchema);
