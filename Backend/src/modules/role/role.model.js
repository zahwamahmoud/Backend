import mongoose from "mongoose";

const roleSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Role name is required"],
            trim: true,
        },
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: [true, "Company ID is required"],
            index: true,
        },
        permissions: [{
            type: String,
            trim: true,
        }],
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
        },
    },
    { timestamps: true }
);

roleSchema.index({ name: 1, companyId: 1 }, { unique: true });

export const roleModel = mongoose.model("Role", roleSchema);
