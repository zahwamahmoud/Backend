import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    category: {
        type: String,
        enum: ['general', 'sales', 'purchases', 'customers', 'suppliers', 'accounting', 'export'],
        required: true
    },
    settings: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

// Ensure one settings document per company per category
settingsSchema.index({ companyId: 1, category: 1 }, { unique: true });

export const settingsModel = mongoose.model('Settings', settingsSchema);
