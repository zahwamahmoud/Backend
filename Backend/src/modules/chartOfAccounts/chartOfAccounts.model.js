import mongoose from "mongoose";

const chartOfAccountsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    code: {
        type: String,
        required: true,
        trim: true
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: [true, 'Company ID is required'],
        index: true
    },
    type: {
        type: String,
        enum: ['main', 'sub'],
        required: true
    },
    parentAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChartOfAccounts',
        default: null
    },
    branches: [{
        type: String // Storing as string or ObjectId based on Branches module (assuming string/mixed for now based on UI "All Branches")
    }],
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    description: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

chartOfAccountsSchema.index({ code: 1, companyId: 1 }, { unique: true });

export const chartOfAccountsModel = mongoose.model('ChartOfAccounts', chartOfAccountsSchema);
