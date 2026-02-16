import mongoose from "mongoose";

const systemBackupSchema = new mongoose.Schema(
    {
        backupDate: {
            type: Date,
            default: Date.now,
            required: true,
        },
        collections: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        totalRecords: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

export const systemBackupModel = mongoose.model("SystemBackup", systemBackupSchema);
