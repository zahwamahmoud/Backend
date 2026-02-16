import mongoose from "mongoose";

const activitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: [true, 'Company ID is required'],
        index: true
    }
}, {
    timestamps: true
});

activitySchema.index({ name: 1, companyId: 1 }, { unique: true });

export const activityModel = mongoose.model('Activity', activitySchema);
