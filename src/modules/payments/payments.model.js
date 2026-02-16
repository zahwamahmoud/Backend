import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    date: {
        type: Date,
        default: Date.now,
        required: true
    },

    module: {
        type: String,
        enum: ['sales', 'purchases'],
        required: true
    },

    treasury: {
        type: String,
        enum: ['main', 'bank'],
        required: true
    },

    operationType: {
        type: String,
        enum: ['receive', 'spend'],
        required: true
    },

    contact: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contact',
        required: true
    },

    invoice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
        sparse: true
    },

    invoiceType: {
        type: String,
        enum: ['automatic', 'custom'],
        default: 'automatic'
    },

    amount: {
        type: Number,
        required: true,
        min: 0
    },

    notes: {
        type: String,
        trim: true,
        default: ''
    },

    referenceNumber: {
        type: String,
        trim: true,
        default: ''
    },

    status: {
        type: String,
        enum: ['completed', 'pending', 'cancelled'],
        default: 'completed'
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: [true, 'Company ID is required'],
        index: true
    },

    lastModifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    deletedAt: Date,
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }

}, { timestamps: true });

// Indexes
paymentSchema.index({ date: -1 });
paymentSchema.index({ module: 1 });
paymentSchema.index({ contact: 1 });
paymentSchema.index({ treasury: 1 });
paymentSchema.index({ operationType: 1 });

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;