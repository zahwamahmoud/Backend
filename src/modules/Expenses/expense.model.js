import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema({
    // الكود - اختياري وفريد
    code: {
        type: String,
        trim: true,
        sparse: true,
        uppercase: true
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: [true, 'Company ID is required'],
        index: true
    },

    // التاريخ - إلزامي
    date: {
        type: Date,
        required: [true, 'تاريخ المصروف مطلوب'],
        default: Date.now
    },

    // المحفظة - إلزامي
    wallet: {
        type: String,
        required: [true, 'المحفظة مطلوبة'],
        enum: {
            values: ['main', 'bank'],
            message: 'المحفظة يجب أن تكون خزنة رئيسية أو بنك'
        }
    },

    // الحساب - اختياري
    account: {
        type: String,
        trim: true,
        default: ''
    },

    // المبلغ - إلزامي
    amount: {
        type: Number,
        required: [true, 'المبلغ مطلوب'],
        min: [0, 'المبلغ لا يمكن أن يكون سالباً']
    },

    // الضرائب - اختياري
    taxes: {
        type: Number,
        default: 0,
        min: [0, 'الضرائب لا يمكن أن تكون سالبة']
    },

    // الوصف - اختياري
    description: {
        type: String,
        trim: true,
        default: '',
        maxLength: [1000, 'الوصف يجب ألا يتجاوز 1000 حرف']
    },

    // المرفقات - اختياري
    attachments: [{
        url: {
            type: String,
            required: true
        },
        publicId: {
            type: String,
            required: true
        },
        filename: {
            type: String,
            default: ''
        }
    }],

    // معلومات الإنشاء والتعديل
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    lastModifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes للبحث السريع
expenseSchema.index({ date: -1, companyId: 1 });
expenseSchema.index({ wallet: 1, companyId: 1 });
expenseSchema.index({ createdAt: -1, companyId: 1 });
expenseSchema.index({ code: 1, companyId: 1 }, { unique: true, sparse: true });

// Virtual لحساب المبلغ الإجمالي مع الضرائب
expenseSchema.virtual('totalAmount').get(function () {
    return this.amount + (this.taxes || 0);
});

// Pre-save middleware for code generation and formatting
expenseSchema.pre('save', async function (next) {
    if (!this.code) {
        try {
            const lastExpense = await this.constructor.findOne({ companyId: this.companyId }, {}, { sort: { 'createdAt': -1 } });
            let nextNumber = 1;
            if (lastExpense && lastExpense.code) {
                const parts = lastExpense.code.split('-');
                if (parts.length === 3) {
                    const lastNum = parseInt(parts[2]);
                    if (!isNaN(lastNum)) {
                        nextNumber = lastNum + 1;
                    }
                }
            }
            const date = new Date();
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            this.code = `${day}-${month}-${String(nextNumber).padStart(6, '0')}`;
        } catch (error) {
            return next(error);
        }
    } else {
        this.code = this.code.toUpperCase();
    }
    next();
});

export const expenseModel = mongoose.model('Expense', expenseSchema);
