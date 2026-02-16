import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: [true, 'Company ID is required'],
        index: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        street: String,
        city: String,
        state: String,
        zip: String,
        country: String
    },
    status: {
        type: String,
        enum: ['Lead', 'Active', 'Inactive'],
        default: 'Lead'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User" // Assuming User model exists
    }
}, { timestamps: true });

customerSchema.index({ email: 1, companyId: 1 }, { unique: true });

export const salesCustomerModel = mongoose.model("SalesCustomer", customerSchema);
