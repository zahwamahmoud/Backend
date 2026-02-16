import mongoose from "mongoose";

const financialReceiptSchema = new mongoose.Schema({
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
    // The internal safe or bank account receiving the money
    account: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'accountModel',
        required: true
    },
    accountModel: {
        type: String,
        enum: ['Safe', 'BankAccount'],
        required: true
    },
    // The external entity or GL account
    externalAccount: {
        type: String,
        trim: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    taxes: {
        type: String,
        default: 'none'
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

financialReceiptSchema.index({ code: 1, companyId: 1 }, { unique: true });

const FinancialReceipt = mongoose.model("FinancialReceipt", financialReceiptSchema);
export default FinancialReceipt;
