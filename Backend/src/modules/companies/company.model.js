import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { SUPPORTED_CURRENCIES } from "../../constants/currencies.js";

const companySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Company name is required'],
        trim: true,
        unique: [true, 'Company name already in use'],
        minLength: [2, 'Company name must be at least 2 characters long']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        unique: [true, 'Email already in use'],
        lowercase: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please fill a valid email address'
        ]
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minLength: [6, 'Password must be at least 6 characters']
    },
    phone: {
        type: String,
        trim: true
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true
    },
    logo: {
        url: {
            type: String,
            default: ''
        },
        publicId: {
            type: String,
            default: ''
        }
    },
    subscriptionStatus: {
        type: String,
        enum: ['active', 'expired'],
        default: 'active'
    },
    subscriptionEndDate: {
        type: Date
    },
    defaultCurrency: {
        type: String,
        enum: SUPPORTED_CURRENCIES,
        default: "EGP"
    }
}, {
    timestamps: true
});

// Pre-save hook for password hashing and slug generation
companySchema.pre('save', function (next) {
    // Hash password if modified
    if (this.isModified('password')) {
        this.password = bcrypt.hashSync(this.password, 10);
    }

    // Generate unique slug from name only on create (keeps link stable on update)
    if (this.isNew && !this.slug) {
        let baseSlug = this.name
            .toLowerCase()
            .replace(/[^\w\u0621-\u064A\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/^-+|-+$/g, '') || 'company';
        this.slug = baseSlug + '-' + Math.random().toString(36).slice(2, 8);
    }

    next();
});

export const companyModel = mongoose.model('Company', companySchema);
