import mongoose from "mongoose";

const financialTransferSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        trim: true
    },
    date: {
        type: Date,
        default: Date.now,
        required: true
    },
    fromAccount: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'fromAccountModel',
        required: true
    },
    fromAccountModel: {
        type: String,
        enum: ['Safe', 'BankAccount'],
        required: true
    },
    toAccount: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'toAccountModel',
        required: true
    },
    toAccountModel: {
        type: String,
        enum: ['Safe', 'BankAccount'],
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    attachments: [{
        fileName: String,
        fileUrl: String,
        publicId: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: true,
        index: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
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

financialTransferSchema.index({ code: 1, companyId: 1 }, { unique: true });

const FinancialTransfer = mongoose.model("FinancialTransfer", financialTransferSchema);
export default FinancialTransfer;
