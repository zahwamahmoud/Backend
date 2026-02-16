import mongoose from "mongoose";

const branchSchema = new mongoose.Schema({
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
    address1: {
        type: String,
        trim: true,
        default: ''
    },
    address2: {
        type: String,
        trim: true,
        default: ''
    },
    city: {
        type: String,
        trim: true,
        default: ''
    },
    neighborhood: {
        type: String,
        trim: true,
        default: ''
    },
    postalCode: {
        type: String,
        trim: true,
        default: ''
    },
    region: {
        type: String,
        trim: true,
        default: ''
    },
    country: {
        type: String,
        trim: true,
        default: ''
    },
    phone: {
        type: String,
        trim: true
    },
    commercialRegister: {
        type: String,
        trim: true
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: [true, 'Company ID is required'],
        index: true
    },
    partners: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "PartnerList"
    }],
    partnerList: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PartnerList",
        default: null
    },
    activity: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Activity",
        default: null
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, {
    timestamps: true
});

branchSchema.index({ code: 1, companyId: 1 }, { unique: true });

export const branchModel = mongoose.model('Branch', branchSchema);
