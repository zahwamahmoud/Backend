import mongoose from "mongoose";

const returnSchema = new mongoose.Schema({
    invoice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Invoice",
        required: true
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        reason: String
    }],
    totalRefundAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected', 'Completed'],
        default: 'Pending'
    },
    date: {
        type: Date,
        default: Date.now
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: [true, 'Company ID is required'],
        index: true
    }
}, { timestamps: true });

export const returnModel = mongoose.model("Return", returnSchema);
