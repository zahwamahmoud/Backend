import { warehouseModel } from "./warehouse.model.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";
import { AppError } from "../../utils/AppError.js";

// ================= Add =================
export const addWarehouse = catchAsyncError(async (req, res, next) => {
    // Check for duplicate name within company
    const { name } = req.body;
    const companyId = req.body.companyId; // From middleware or body

    if (name) {
        const existingWarehouse = await warehouseModel.findOne({
            name: name,
            companyId: companyId
        });
        if (existingWarehouse) {
            return next(new AppError("اسم المستودع موجود بالفعل", 409));
        }
    }

    const warehouse = new warehouseModel(req.body);
    await warehouse.save();

    res.status(201).json({
        message: "تم إضافة المستودع بنجاح",
        warehouse
    });
});

// ================= Get All =================
export const getAllWarehouses = catchAsyncError(async (req, res) => {
    // Populate users but we might need to filter checks? 
    // Usually populate works by ID so it's fine, but ensuring we only get our warehouses.
    const warehouses = await warehouseModel
        .find(req.companyFilter)
        .populate("users")
        .sort({ createdAt: -1 });

    res.status(200).json({
        message: "تم جلب المستودعات بنجاح",
        warehouses
    });
});

// ================= Get One =================
export const getWarehouseById = catchAsyncError(async (req, res, next) => {
    const warehouse = await warehouseModel
        .findOne({ _id: req.params.id, ...req.companyFilter })
        .populate("users");

    if (!warehouse) {
        return next(new AppError("المستودع غير موجود", 404));
    }

    res.status(200).json({
        message: "تم جلب المستودع بنجاح",
        warehouse
    });
});

// ================= Update =================
export const updateWarehouse = catchAsyncError(async (req, res, next) => {
    // Find first to check existence and company
    const existingWarehouse = await warehouseModel.findOne({ _id: req.params.id, ...req.companyFilter });

    if (!existingWarehouse) {
        return next(new AppError("المستودع غير موجود", 404));
    }

    // Check duplicate name if changing
    if (req.body.name && req.body.name !== existingWarehouse.name) {
        const duplicate = await warehouseModel.findOne({
            name: req.body.name,
            companyId: existingWarehouse.companyId
        });
        if (duplicate) {
            return next(new AppError("اسم المستودع موجود بالفعل", 409));
        }
    }

    // Update
    const warehouse = await warehouseModel.findOneAndUpdate(
        { _id: req.params.id, ...req.companyFilter },
        req.body,
        { new: true }
    );

    res.status(200).json({
        message: "تم تعديل المستودع بنجاح",
        warehouse
    });
});

// ================= Delete =================
export const deleteWarehouse = catchAsyncError(async (req, res, next) => {
    const warehouse = await warehouseModel.findOneAndDelete({ _id: req.params.id, ...req.companyFilter });

    if (!warehouse) {
        return next(new AppError("المستودع غير موجود", 404));
    }

    res.status(200).json({
        message: "تم حذف المستودع بنجاح",
        warehouse
    });
});
