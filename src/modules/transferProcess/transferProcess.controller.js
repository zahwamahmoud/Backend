import { transferProcessModel } from "./transferProcess.model.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";
import { AppError } from "../../utils/AppError.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../../utils/cloudinary.js";

// ================== Add Transfer Process ==================
export const addTransferProcess = catchAsyncError(async (req, res, next) => {
    const processData = {
        ...req.body,
        companyId: req.user.companyId
    };

    if (req.files && req.files.attachments) {
        const uploadPromises = req.files.attachments.map(file => uploadToCloudinary(file.buffer, 'transfer_process'));
        const results = await Promise.all(uploadPromises);
        processData.attachments = results.map(result => ({
            secure_url: result.secure_url,
            public_id: result.public_id
        }));
    }

    const process = new transferProcessModel(processData);
    await process.save();

    res.status(201).json({
        message: "تم إضافة عملية التحويل بنجاح",
        process
    });
});

// ================== Get All ==================
export const getAllTransferProcesses = catchAsyncError(async (req, res) => {
    const processes = await transferProcessModel
        .find(req.companyFilter)
        .populate("operation")
        .populate("product")
        .sort({ createdAt: -1 });

    res.status(200).json({
        message: "تم جلب عمليات التحويل بنجاح",
        processes
    });
});

// ================== Get By ID ==================
export const getTransferProcessById = catchAsyncError(async (req, res, next) => {
    const process = await transferProcessModel
        .findOne({ _id: req.params.id, ...req.companyFilter })
        .populate("operation")
        .populate("product");

    if (!process) {
        return next(
            new AppError("عملية التحويل غير موجودة", 404)
        );
    }

    res.status(200).json({
        message: "تم جلب عملية التحويل بنجاح",
        process
    });
});

// ================== Delete ==================
export const deleteTransferProcess = catchAsyncError(async (req, res, next) => {
    const process = await transferProcessModel.findOneAndDelete({ _id: req.params.id, ...req.companyFilter });

    if (!process) {
        return next(
            new AppError("عملية التحويل غير موجودة", 404)
        );
    }

    // Delete attachments
    if (process.attachments && process.attachments.length > 0) {
        const deletePromises = process.attachments.map(att => deleteFromCloudinary(att.public_id));
        await Promise.all(deletePromises);
    }

    res.status(200).json({
        message: "تم حذف عملية التحويل بنجاح",
        process
    });
});


export const updateTransferProcess = catchAsyncError(async (req, res, next) => {
    const updateData = { ...req.body };

    const existingProcess = await transferProcessModel.findOne({ _id: req.params.id, ...req.companyFilter });
    if (!existingProcess) {
        return next(
            new AppError("عملية التحويل غير موجودة", 404)
        );
    }

    if (req.files && req.files.attachments) {
        // Delete old attachments
        if (existingProcess.attachments && existingProcess.attachments.length > 0) {
            const deletePromises = existingProcess.attachments.map(att => deleteFromCloudinary(att.public_id));
            await Promise.all(deletePromises);
        }

        const uploadPromises = req.files.attachments.map(file => uploadToCloudinary(file.buffer, 'transfer_process'));
        const results = await Promise.all(uploadPromises);
        updateData.attachments = results.map(result => ({
            secure_url: result.secure_url,
            public_id: result.public_id
        }));
    }

    const process = await transferProcessModel.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
    );

    res.status(200).json({
        message: "تم تعديل عملية التحويل بنجاح",
        process
    });
});