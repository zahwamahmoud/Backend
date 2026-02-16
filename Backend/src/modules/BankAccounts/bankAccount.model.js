import mongoose from "mongoose";

const bankAccountSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Bank account name is required"],
            trim: true
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
        },
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: [true, 'Company ID is required'],
            index: true
        }
    },
    {
        timestamps: true
    }
);

bankAccountSchema.index({ name: 1, companyId: 1 }, { unique: true });

export const bankAccountModel =
    mongoose.models.BankAccount ||
    mongoose.model("BankAccount", bankAccountSchema);
