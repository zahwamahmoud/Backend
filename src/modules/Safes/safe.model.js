import mongoose from "mongoose";

const safeSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Safe name is required"],
            trim: true
        },
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: [true, 'Company ID is required'],
            index: true
        },
        accountNumber: {
            type: String,
            trim: true,
            default: ""
        },
        branches: {
            type: [String],
            enum: ["main"],
            default: ["main"]
        },
        users: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "user"
            }
        ],
        custodians: {
            type: [String],
            default: []
        },
        enableReceiptPermissions: {
            type: Boolean,
            default: false
        },
        enablePaymentPermissions: {
            type: Boolean,
            default: false
        },
        balance: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

safeSchema.index({ name: 1, companyId: 1 }, { unique: true });

export const safeModel =
    mongoose.models.Safe ||
    mongoose.model("Safe", safeSchema);
