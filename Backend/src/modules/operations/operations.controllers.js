import { AppError } from "../../utils/AppError.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";
import { operationModel } from "./operations.model.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../../utils/cloudinary.js";

// Add
export const addOperation = catchAsyncError(async (req, res, next) => {
    const opData = { ...req.body };
    // companyId from middleware
    opData.companyId = req.body.companyId;

    if (req.files && req.files.attachments) {
        const uploadPromises = req.files.attachments.map(file => uploadToCloudinary(file.buffer, 'operations'));
        const results = await Promise.all(uploadPromises);
        opData.attachments = results.map(result => ({
            secure_url: result.secure_url,
            public_id: result.public_id
        }));
    }

    const operation = new operationModel(opData);
    await operation.save();

    res.status(201).json({
        message: "تم إضافة العملية بنجاح",
        operation
    });
});

// Get All
export const getAllOperations = catchAsyncError(async (req, res) => {
    const operations = await operationModel.find(req.companyFilter).populate("warehouse").sort({ createdAt: -1 });

    res.status(200).json({
        message: "تم جلب العمليات بنجاح",
        operations
    });
});

// Get By ID
export const getOperationById = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;

    const operation = await operationModel.findOne({ _id: id, ...req.companyFilter });
    if (!operation) {
        return next(new AppError("العملية غير موجودة", 404));
    }

    res.status(200).json({
        message: "تم جلب العملية بنجاح",
        operation
    });
});

// Update
export const updateOperation = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;

    const existingOperation = await operationModel.findOne({ _id: id, ...req.companyFilter });
    if (!existingOperation) {
        return next(new AppError("العملية غير موجودة", 404));
    }

    const updateData = { ...req.body };
    if (req.companyFilter.companyId) {
        updateData.companyId = req.companyFilter.companyId; // Protect companyId
    }

    if (req.files && req.files.attachments) {
        // Delete old attachments
        if (existingOperation.attachments && existingOperation.attachments.length > 0) {
            const deletePromises = existingOperation.attachments.map(att => deleteFromCloudinary(att.public_id));
            await Promise.all(deletePromises);
        }

        const uploadPromises = req.files.attachments.map(file => uploadToCloudinary(file.buffer, 'operations'));
        const results = await Promise.all(uploadPromises);
        updateData.attachments = results.map(result => ({
            secure_url: result.secure_url,
            public_id: result.public_id
        }));
    }

    const operation = await operationModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
    );

    res.status(200).json({
        message: "تم تحديث العملية بنجاح",
        operation
    });
});

// Delete
export const deleteOperation = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;

    const operation = await operationModel.findOne({ _id: id, ...req.companyFilter });
    if (!operation) {
        return next(new AppError("العملية غير موجودة", 404));
    }

    // Delete attachments from Cloudinary
    if (operation.attachments && operation.attachments.length > 0) {
        const deletePromises = operation.attachments.map(att => deleteFromCloudinary(att.public_id));
        await Promise.all(deletePromises);
    }

    await operationModel.findOneAndDelete({ _id: id, ...req.companyFilter });

    res.status(200).json({
        message: "تم حذف العملية بنجاح",
        operation
    });
});
