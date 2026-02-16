import { inventoryOperationModel } from "./inventoryOperation.model.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";
import { AppError } from "../../utils/AppError.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../../utils/cloudinary.js";

// ================= Add =================
export const addInventoryOperation = catchAsyncError(async (req, res) => {
    const opData = { ...req.body };

    if (req.files && req.files.attachments) {
        const uploadPromises = req.files.attachments.map(file => uploadToCloudinary(file.buffer, 'inventory_operation'));
        const results = await Promise.all(uploadPromises);
        opData.attachments = results.map(result => ({
            secure_url: result.secure_url,
            public_id: result.public_id
        }));
    }

    // Parse items if they are sent as a JSON string
    if (typeof opData.items === 'string') {
        try {
            opData.items = JSON.parse(opData.items);
        } catch (e) {
            console.error("Error parsing items JSON:", e);
        }
    }
    opData.companyId = req.user.companyId;
    const operation = new inventoryOperationModel(opData);
    await operation.save();

    res.status(201).json({
        message: "تم إضافة عملية الجرد بنجاح",
        operation
    });
});

// ================= Get All =================
export const getAllInventoryOperations = catchAsyncError(async (req, res) => {
    const operations = await inventoryOperationModel
        .find(req.companyFilter)
        .populate("warehouse")
        .sort({ date: -1 });

    res.status(200).json({
        message: "تم جلب عمليات الجرد بنجاح",
        operations
    });
});

// ================= Get One =================
export const getInventoryOperationById = catchAsyncError(
    async (req, res, next) => {
        const operation = await inventoryOperationModel
            .findOne({ _id: req.params.id, ...req.companyFilter })
            .populate("warehouse");

        if (!operation) {
            return next(new AppError("عملية الجرد غير موجودة", 404));
        }

        res.status(200).json({
            message: "تم جلب عملية الجرد بنجاح",
            operation
        });
    }
);

// ================= Update =================
export const updateInventoryOperation = catchAsyncError(
    async (req, res, next) => {
        const updateData = { ...req.body };

        const existingOperation = await inventoryOperationModel.findOne({ _id: req.params.id, ...req.companyFilter });
        if (!existingOperation) {
            return next(new AppError("عملية الجرد غير موجودة", 404));
        }

        if (req.files && req.files.attachments) {
            // Delete old attachments
            if (existingOperation.attachments && existingOperation.attachments.length > 0) {
                const deletePromises = existingOperation.attachments.map(att => deleteFromCloudinary(att.public_id));
                await Promise.all(deletePromises);
            }

            const uploadPromises = req.files.attachments.map(file => uploadToCloudinary(file.buffer, 'inventory_operation'));
            const results = await Promise.all(uploadPromises);
            updateData.attachments = results.map(result => ({
                secure_url: result.secure_url,
                public_id: result.public_id
            }));
        }

        const operation = await inventoryOperationModel.findOneAndUpdate(
            { _id: req.params.id, ...req.companyFilter },
            updateData,
            { new: true }
        );

        res.status(200).json({
            message: "تم تعديل عملية الجرد بنجاح",
            operation
        });
    }
);

// ================= Delete =================
export const deleteInventoryOperation = catchAsyncError(
    async (req, res, next) => {
        const operation = await inventoryOperationModel.findOne({ _id: req.params.id, ...req.companyFilter });

        if (!operation) {
            return next(new AppError("عملية الجرد غير موجودة", 404));
        }

        // Delete attachments
        if (operation.attachments && operation.attachments.length > 0) {
            const deletePromises = operation.attachments.map(att => deleteFromCloudinary(att.public_id));
            await Promise.all(deletePromises);
        }

        await inventoryOperationModel.findOneAndDelete({ _id: req.params.id, ...req.companyFilter });

        res.status(200).json({
            message: "تم حذف عملية الجرد بنجاح",
            operation
        });
    }
);
