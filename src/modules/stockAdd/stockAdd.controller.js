import { stockAddItemModel } from "./stockAddItem.model.js";
import { stockAddModel } from "./stockAdd.model.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";
import { AppError } from "../../utils/AppError.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../../utils/cloudinary.js";

// ====== StockAdd ======
// Add
export const addStockAdd = catchAsyncError(async (req, res) => {
    const opData = {
        ...req.body,
        companyId: req.user.companyId
    };

    if (req.files && req.files.attachments) {
        const uploadPromises = req.files.attachments.map(file => uploadToCloudinary(file.buffer, 'stock_add'));
        const results = await Promise.all(uploadPromises);
        opData.attachments = results.map(result => ({
            secure_url: result.secure_url,
            public_id: result.public_id
        }));
    }

    const stockAdd = new stockAddModel(opData);
    await stockAdd.save();

    res.status(201).json({
        message: "تم إضافة StockAdd بنجاح",
        stockAdd
    });
});

// Get All
export const getAllStockAdds = catchAsyncError(async (req, res) => {
    const stockAdds = await stockAddModel.find(req.companyFilter).populate("operation").populate("createdBy").sort({ createdAt: -1 });
    res.status(200).json({
        message: "تم جلب جميع StockAdds بنجاح",
        stockAdds
    });
});

// Get By ID
export const getStockAddById = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const stockAdd = await stockAddModel.findOne({ _id: id, ...req.companyFilter }).populate("operation").populate("createdBy");
    if (!stockAdd) return next(new AppError("StockAdd غير موجود", 404));
    res.status(200).json({
        message: "تم جلب StockAdd بنجاح",
        stockAdd
    });
});

// Update
export const updateStockAdd = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const updateData = { ...req.body };

    const existingStockAdd = await stockAddModel.findOne({ _id: id, ...req.companyFilter });
    if (!existingStockAdd) return next(new AppError("StockAdd غير موجود", 404));

    if (req.files && req.files.attachments) {
        // Delete old attachments
        if (existingStockAdd.attachments && existingStockAdd.attachments.length > 0) {
            const deletePromises = existingStockAdd.attachments.map(att => deleteFromCloudinary(att.public_id));
            await Promise.all(deletePromises);
        }

        const uploadPromises = req.files.attachments.map(file => uploadToCloudinary(file.buffer, 'stock_add'));
        const results = await Promise.all(uploadPromises);
        updateData.attachments = results.map(result => ({
            secure_url: result.secure_url,
            public_id: result.public_id
        }));
    }

    const stockAdd = await stockAddModel.findOneAndUpdate({ _id: id, ...req.companyFilter }, updateData, { new: true });

    res.status(200).json({
        message: "تم تحديث StockAdd بنجاح",
        stockAdd
    });
});

// Delete
export const deleteStockAdd = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;

    const stockAdd = await stockAddModel.findOne({ _id: id, ...req.companyFilter });
    if (!stockAdd) return next(new AppError("StockAdd غير موجود", 404));

    // Delete attachments
    if (stockAdd.attachments && stockAdd.attachments.length > 0) {
        const deletePromises = stockAdd.attachments.map(att => deleteFromCloudinary(att.public_id));
        await Promise.all(deletePromises);
    }

    await stockAddModel.findOneAndDelete({ _id: id, ...req.companyFilter });

    res.status(200).json({
        message: "تم حذف StockAdd بنجاح",
        stockAdd
    });
});

// ====== StockAddItem ======
// Add
export const addStockAddItem = catchAsyncError(async (req, res) => {
    const item = new stockAddItemModel({
        ...req.body,
        companyId: req.user.companyId
    });
    await item.save();
    res.status(201).json({
        message: "تم إضافة StockAddItem بنجاح",
        item
    });
});

// Get All
export const getAllStockAddItems = catchAsyncError(async (req, res) => {
    const items = await stockAddItemModel.find(req.companyFilter).populate("stockAdd").populate("product").sort({ createdAt: -1 });
    res.status(200).json({
        message: "تم جلب جميع StockAddItems بنجاح",
        items
    });
});

// Get By ID
export const getStockAddItemById = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const item = await stockAddItemModel.findOne({ _id: id, ...req.companyFilter }).populate("stockAdd").populate("product");
    if (!item) return next(new AppError("StockAddItem غير موجود", 404));
    res.status(200).json({
        message: "تم جلب StockAddItem بنجاح",
        item
    });
});

// Update
export const updateStockAddItem = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const item = await stockAddItemModel.findOneAndUpdate({ _id: id, ...req.companyFilter }, req.body, { new: true });
    if (!item) return next(new AppError("StockAddItem غير موجود", 404));
    res.status(200).json({
        message: "تم تحديث StockAddItem بنجاح",
        item
    });
});

// Delete
export const deleteStockAddItem = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const item = await stockAddItemModel.findOneAndDelete({ _id: id, ...req.companyFilter });
    if (!item) return next(new AppError("StockAddItem غير موجود", 404));
    res.status(200).json({
        message: "تم حذف StockAddItem بنجاح",
        item
    });
});
