import mongoose from "mongoose";
import { AppError } from "../../utils/AppError.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";
import { requisitionModel } from "./requisition.model.js";
import { productModel } from "../product/product.model.js";
import { stockLogModel } from "../stockLogs/stockLog.model.js";
import * as inventoryService from "../product/inventory.service.js";

// Add Requisition (Permission) with optional stock movement and logs
export const addRequisition = catchAsyncError(async (req, res, next) => {
    const companyId = req.user.companyId;
    const userId = req.user._id;
    const body = { ...req.body };
    delete body.companyId;
    body.companyId = companyId;

    const type = body.type || "financial";
    const items = body.items || [];

    if (type === "inventory_in" || type === "inventory_out") {
        if (!items.length) {
            return next(new AppError("البنود مطلوبة للإذن المخزني", 400));
        }
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        if (type === "inventory_out") {
            for (const item of items) {
                const product = await productModel
                    .findOne({ _id: item.product, companyId })
                    .session(session);
                if (!product) {
                    await session.abortTransaction();
                    return next(new AppError(`المنتج غير موجود`, 404));
                }
                const available = product.stockQuantity ?? 0;
                if (available < item.quantity) {
                    await session.abortTransaction();
                    return next(
                        new AppError(
                            `Insufficient stock for product ${product.name}. Available: ${available}`,
                            400
                        )
                    );
                }
            }
        }

        const requisition = new requisitionModel(body);
        await requisition.save({ session });

        const logType = type === "inventory_in" ? "in" : type === "inventory_out" ? "out" : null;
        if (logType && items.length) {
            for (const item of items) {
                const product = await productModel
                    .findOne({ _id: item.product, companyId })
                    .session(session);
                if (!product) continue;
                // Use inventoryService for centralized stock management and WAC
                await inventoryService.updateProductStock({
                    productId: item.product,
                    companyId,
                    quantity: item.quantity,
                    type: logType,
                    permissionId: requisition._id,
                    userId,
                    session
                });
            }
        }

        await session.commitTransaction();
        const populated = await requisitionModel
            .findById(requisition._id)
            .populate("items.product");
        res.status(201).json({
            message: "تم إضافة الإذن بنجاح",
            requisition: populated || requisition
        });
    } catch (err) {
        await session.abortTransaction();
        next(err);
    } finally {
        session.endSession();
    }
});

// Get All Requisitions
export const getAllRequisitions = catchAsyncError(async (req, res) => {
    const requisitions = await requisitionModel
        .find(req.companyFilter)
        .populate("items.product")
        .sort({ createdAt: -1 });

    res.status(200).json({
        message: "تم جلب الأذونات بنجاح",
        requisitions
    });
});

// Get By ID
export const getRequisitionById = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const requisition = await requisitionModel
        .findOne({ _id: id, ...req.companyFilter })
        .populate("items.product");

    if (!requisition) {
        return next(new AppError("الإذن غير موجود", 404));
    }

    res.status(200).json({
        message: "تم جلب الإذن بنجاح",
        requisition
    });
});

// Update Requisition (no stock reversal on update per spec; only delete reverses)
export const updateRequisition = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const updateBody = { ...req.body };
    delete updateBody.companyId;
    const requisition = await requisitionModel.findOneAndUpdate(
        { _id: id, ...req.companyFilter },
        updateBody,
        { new: true }
    ).populate("items.product");

    if (!requisition) {
        return next(new AppError("الإذن غير موجود", 404));
    }

    res.status(200).json({
        message: "تم تحديث الإذن بنجاح",
        requisition
    });
});

// Delete Requisition: reverse stock and remove stock logs
export const deleteRequisition = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const requisition = await requisitionModel.findOne({
        _id: id,
        ...req.companyFilter
    });
    if (!requisition) {
        return next(new AppError("الإذن غير موجود", 404));
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const type = requisition.type || "financial";
        const items = requisition.items || [];

        if (type === "inventory_in" && items.length) {
            for (const item of items) {
                const product = await productModel
                    .findOne({ _id: item.product, companyId })
                    .session(session);
                if (product) {
                    await inventoryService.updateProductStock({
                        productId: item.product,
                        companyId,
                        quantity: item.quantity,
                        type: 'out',
                        permissionId: requisition._id,
                        userId: req.user._id,
                        session
                    });
                }
            }
        } else if (type === "inventory_out" && items.length) {
            for (const item of items) {
                const product = await productModel
                    .findOne({ _id: item.product, companyId })
                    .session(session);
                if (product) {
                    await inventoryService.updateProductStock({
                        productId: item.product,
                        companyId,
                        quantity: item.quantity,
                        type: 'in',
                        permissionId: requisition._id,
                        userId: req.user._id,
                        session
                    });
                }
            }
        }

        // Logs are now automatically handled by inventoryService if we were adding them,
        // but since we are DELETING the requisition and REVERSING stock, 
        // we might want to keep the reversal logs OR just delete the original logs.
        // Spec says: "Delete Requisition: reverse stock and remove stock logs"
        await stockLogModel.deleteMany({ permission: requisition._id }).session(session);
        await requisitionModel.findOneAndDelete({ _id: id, ...req.companyFilter }).session(session);

        await session.commitTransaction();
        res.status(200).json({
            message: "تم حذف الإذن بنجاح",
            requisition
        });
    } catch (err) {
        await session.abortTransaction();
        next(err);
    } finally {
        session.endSession();
    }
});
