import mongoose from "mongoose";
import bcrypt from "bcrypt"



const userSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        minLength: [3, 'User name must be at least 3 characters long'],
        maxLength: [30, 'User name must be at most 30 characters long']
    },

    type: {
        type: String,
        enum: ["user", "employee"],
        default: "user",
        required: true
    },
    email: {
        type: String,
        required: [
            function () { return this.type === 'user'; },
            'Email is required for users'
        ],
        trim: true,
        lowercase: true,
    },

    password: {
        type: String,
        required: [
            function () { return this.type === 'user'; },
            'Password is required for users'
        ],
        minLength: [6, 'User password must be at least 6 characters long'],
        maxLength: [30, 'User password must be at most 30 characters long']
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: [
            function () { return this.role !== 'superAdmin' && this.systemRole !== 'superAdmin'; },
            'Company ID is required for non-superAdmin users'
        ]
    },
    systemRole: {
        type: String,
        enum: ["superAdmin", "companyOwner"],
        default: null
    },
    roleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Role",
        default: null
    },
    role: {
        type: String,
        enum: ["superAdmin", "admin", "accountant", "employee"],
        default: "employee",
        required: false
    },
    image: {
        type: String,
        trim: true
    },
    imagePublicId: {
        type: String,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    }
}, { timestamps: true })

userSchema.index({ email: 1, companyId: 1 }, { unique: true });



userSchema.pre('save', function (next) {
    if (this.isModified('password')) {


        this.password = bcrypt.hashSync(this.password, 10)
    }
    next();
})

// userSchema.post('init', (doc) => {
//     doc.image = "http://localhost:4000/user/" + doc.image
// })


export const userModel = mongoose.model('user', userSchema)