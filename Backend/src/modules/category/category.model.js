import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'اسم التصنيف مطلوب'],
        trim: true,
        minLength: [2, 'اسم التصنيف يجب أن يكون على الأقل حرفين'],
        maxLength: [200, 'اسم التصنيف يجب ألا يتجاوز 200 حرف']
    },
    description: {
        type: String,
        trim: true,
        default: '',
        maxLength: [1000, 'الوصف يجب ألا يتجاوز 1000 حرف']
    },
    parentCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
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

categorySchema.index({ name: 1, companyId: 1 });

export const categoryModel = mongoose.model('Category', categorySchema);
