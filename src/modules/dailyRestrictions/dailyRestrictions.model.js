import mongoose from "mongoose";

const dailyRestrictionSchema = new mongoose.Schema({
    number: {
        type: String,
        required: true,
        trim: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    description: {
        type: String,
        trim: true
    },
    source: {
        type: String,
        trim: true
    },
    totalDebit: {
        type: Number,
        required: true,
        default: 0
    },
    totalCredit: {
        type: Number,
        required: true,
        default: 0
    },
    attachment: {
        type: String
    },
    attachmentPublicId: {
        type: String
    },
    entries: [{
        account: {
            type: String, // Storing as string specifically requested or generic until Account model is confirmed
            required: true
        },
        description: {
            type: String,
            trim: true
        },
        debit: {
            type: Number,
            default: 0
        },
        credit: {
            type: Number,
            default: 0
        }
    }],
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    }
}, {
    timestamps: true
});

dailyRestrictionSchema.pre('save', async function (next) {
    if (!this.number) {
        try {
            const date = this.date || new Date();
            const year = String(date.getFullYear()).slice(-2);
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const prefix = `${year}-${month}-`;

            const lastEntry = await this.constructor.findOne({
                companyId: this.companyId,
                number: new RegExp(`^${prefix}`)
            }).sort({ number: -1 });

            let nextSequence = 1;
            if (lastEntry && lastEntry.number) {
                const parts = lastEntry.number.split('-');
                if (parts.length === 3) {
                    const lastNum = parseInt(parts[2]);
                    if (!isNaN(lastNum)) {
                        nextSequence = lastNum + 1;
                    }
                }
            }
            this.number = `${prefix}${String(nextSequence).padStart(6, '0')}`;
        } catch (error) {
            return next(error);
        }
    }
    next();
});

dailyRestrictionSchema.index({ number: 1, companyId: 1 }, { unique: true });

export const dailyRestrictionModel = mongoose.model('DailyRestriction', dailyRestrictionSchema);
