import mongoose from "mongoose";
import { SUPPORTED_CURRENCIES } from "../../constants/currencies.js";

const quoteSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
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
        price: {
            type: Number,
            required: true
        }
    }],
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Accepted', 'Rejected'],
        default: 'Pending'
    },
    expiryDate: {
        type: Date,
        required: true
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: [true, 'Company ID is required'],
        index: true
    },
    currency: {
        type: String,
        enum: SUPPORTED_CURRENCIES,
        default: "EGP"
    }
}, { timestamps: true });

export const quoteModel = mongoose.model("Quote", quoteSchema);
