import { inventoryExchangeModel } from "./inventoryExchange.model.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";
import { AppError } from "../../utils/AppError.js";
import { operationModel } from "../Operations/operations.model.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../../utils/cloudinary.js";


// Add
export const addInventoryExchange = catchAsyncError(async (req, res, next) => {
    const { operation } = req.body;

    // تحقق من العملية
    const operationDoc = await operationModel.findOne({ _id: operation, ...req.companyFilter });
    if (!operationDoc) {
        return next(new AppError("العملية غير موجودة", 404));
    }

    if (operationDoc.type !== "inventory exchange process") {
        return next(
            new AppError("نوع العملية لا يسمح بإنشاء Inventory Exchange", 400)
        );
    }

    const exchangeData = {
        ...req.body,
        companyId: req.user.companyId
    };
    if (req.files && req.files.attachments) {
        const uploadPromises = req.files.attachments.map(file => uploadToCloudinary(file.buffer, 'inventory_exchange'));
        const results = await Promise.all(uploadPromises);
        exchangeData.attachments = results.map(result => ({
            secure_url: result.secure_url,
            public_id: result.public_id
        }));
    }
    const exchange = new inventoryExchangeModel(exchangeData);
    await exchange.save();

    res.status(201).json({
        message: "تم إضافة عملية تبادل المخزون بنجاح",
        exchange
    });
});

// Get All
export const getAllInventoryExchanges = catchAsyncError(async (req, res) => {
    const exchanges = await inventoryExchangeModel
        .find(req.companyFilter)
        .populate("operation")
        .populate("product")
        .populate("createdBy")
        .sort({ createdAt: -1 });

    res.status(200).json({
        message: "تم جلب عمليات تبادل المخزون بنجاح",
        exchanges
    });
});

// Get By ID
export const getInventoryExchangeById = catchAsyncError(async (req, res, next) => {
    const exchange = await inventoryExchangeModel
        .findOne({ _id: req.params.id, ...req.companyFilter })
        .populate("operation")
        .populate("product")
        .populate("createdBy");

    if (!exchange) {
        return next(new AppError("عملية تبادل المخزون غير موجودة", 404));
    }

    res.status(200).json({
        message: "تم جلب العملية بنجاح",
        exchange
    });
});

// Update
export const updateInventoryExchange = catchAsyncError(async (req, res, next) => {
    const updateData = { ...req.body };

    const existingExchange = await inventoryExchangeModel.findOne({ _id: req.params.id, ...req.companyFilter });
    if (!existingExchange) {
        return next(new AppError("عملية تبادل المخزون غير موجودة", 404));
    }

    if (req.files && req.files.attachments) {
        // Delete old attachments
        if (existingExchange.attachments && existingExchange.attachments.length > 0) {
            const deletePromises = existingExchange.attachments.map(att => deleteFromCloudinary(att.public_id));
            await Promise.all(deletePromises);
        }

        const uploadPromises = req.files.attachments.map(file => uploadToCloudinary(file.buffer, 'inventory_exchange'));
        const results = await Promise.all(uploadPromises);
        updateData.attachments = results.map(result => ({
            secure_url: result.secure_url,
            public_id: result.public_id
        }));
    }

    const exchange = await inventoryExchangeModel.findOneAndUpdate(
        { _id: req.params.id, ...req.companyFilter },
        updateData,
        { new: true }
    );

    res.status(200).json({
        message: "تم تحديث العملية بنجاح",
        exchange
    });
});

// Delete
export const deleteInventoryExchange = catchAsyncError(async (req, res, next) => {
    const exchange = await inventoryExchangeModel.findOne({ _id: req.params.id, ...req.companyFilter });

    if (!exchange) {
        return next(new AppError("عملية تبادل المخزون غير موجودة", 404));
    }

    // Delete attachments
    if (exchange.attachments && exchange.attachments.length > 0) {
        const deletePromises = exchange.attachments.map(att => deleteFromCloudinary(att.public_id));
        await Promise.all(deletePromises);
    }

    await inventoryExchangeModel.findOneAndDelete({ _id: req.params.id, ...req.companyFilter });

    res.status(200).json({
        message: "تم حذف العملية بنجاح",
        exchange
    });
});
