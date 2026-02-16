import mongoose from "mongoose";

const contactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'الاسم مطلوب'],
        trim: true
    },

    module: {
        type: String,
        enum: ['customer', 'supplier'],
        required: true
    },

    type: {
        type: String,
        enum: ['individual', 'commercial'],
        default: 'individual'
    },

    code: {
        type: String,
        trim: true,
        sparse: true
    },

    taxNumber: {
        type: String,
        trim: true,
        sparse: true,
    },

    commercialRegister: {
        type: String,
        trim: true,
        sparse: true,
    },

    phone: {
        type: String,
        trim: true,
        default: null
    },

    mobile: {
        type: String,
        trim: true,
        default: null
    },

    alternativePhone: {
        type: String,
        trim: true,
        default: null
    },

    email: {
        type: String,
        trim: true,
        lowercase: true,
        default: null,
        match: [/^(\S+@\S+\.\S+)?$/, 'البريد الإلكتروني غير صحيح']
    },

    address: {
        address1: {
            type: String,
            trim: true,
            default: null
        },
        address2: {
            type: String,
            trim: true,
            default: null
        },
        neighborhood: {
            type: String,
            trim: true,
            default: null
        },
        city: {
            type: String,
            trim: true,
            default: null
        },
        province: {
            type: String,
            trim: true,
            default: null
        },
        zipCode: {
            type: String,
            trim: true,
            default: null
        },
        country: {
            type: String,
            trim: true,
            default: null
        }
    },

    additionalContacts: [{
        name: String,
        phone: String,
        email: String,
        title: String
    }],

    initialBalance: {
        type: Number,
        default: 0,
        min: 0
    },

    currentBalance: {
        type: Number,
        default: 0
    },

    creditLimit: {
        type: Number,
        default: 0,
        min: 0
    },

    notes: {
        type: String,
        trim: true,
        default: null
    },

    isActive: {
        type: Boolean,
        default: true,
        index: true
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: [true, 'Company ID is required']
    },

    lastModifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    deletedAt: Date,
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }

}, { timestamps: true });

contactSchema.index({ code: 1, companyId: 1 }, { unique: true, partialFilterExpression: { code: { $exists: true } } });
contactSchema.index({ taxNumber: 1, companyId: 1 }, { unique: true, partialFilterExpression: { taxNumber: { $exists: true } } });
contactSchema.index({ commercialRegister: 1, companyId: 1 }, { unique: true, partialFilterExpression: { commercialRegister: { $exists: true } } });


// Pre-save
contactSchema.pre('save', function (next) {
    if (this.isNew && this.initialBalance) {
        this.currentBalance = this.initialBalance;
    }
    next();
});

const Contact = mongoose.model("Contact", contactSchema);
export default Contact;