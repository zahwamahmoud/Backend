import mongoose from "mongoose";

const stockLogSchema = new mongoose.Schema(
    {
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: true,
            index: true
        },
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        permission: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: 'permissionModel'
        },
        permissionModel: {
            type: String,
            required: true,
            enum: ['Requisition', 'Transaction'],
            default: 'Requisition'
        },
        type: {
            type: String,
            enum: ["in", "out"],
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 0
        },
        previousQuantity: {
            type: Number,
            required: true,
            min: 0
        },
        newQuantity: {
            type: Number,
            required: true,
            min: 0
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    },
    { timestamps: true }
);

stockLogSchema.index({ companyId: 1, createdAt: -1 });
stockLogSchema.index({ permission: 1 });

export const stockLogModel = mongoose.model("StockLog", stockLogSchema);
