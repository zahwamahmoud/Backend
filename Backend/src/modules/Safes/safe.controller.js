import { safeModel } from "./safe.model.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";
import { AppError } from "../../utils/AppError.js";

// ================= Add =================
export const addSafe = catchAsyncError(async (req, res, next) => {
    // Check for duplicate name within company
    const { name } = req.body;
    const companyId = req.body.companyId;

    if (name) {
        const existingSafe = await safeModel.findOne({
            name: name,
            companyId: companyId
        });
        if (existingSafe) {
            return next(new AppError("اسم الخزنة موجود بالفعل", 409));
        }
    }

    try {
        const safe = new safeModel(req.body);
        await safe.save();

        res.status(201).json({
            message: "تم إضافة الخزنة بنجاح",
            safe
        });
    } catch (error) {
        console.error('Mongoose Save Error:', error);
        return next(new AppError(error.message, 400));
    }
});

// ================= Get All =================
export const getAllSafes = catchAsyncError(async (req, res) => {
    const filter = { ...req.companyFilter };
    const safes = await safeModel
        .find(filter)
        .populate("users", "name email role")
        .sort({ createdAt: -1 });

    res.status(200).json({
        message: "تم جلب الخزنات بنجاح",
        safes
    });
});

// ================= Get One =================
export const getSafeById = catchAsyncError(async (req, res, next) => {
    const safe = await safeModel
        .findOne({ _id: req.params.id, ...req.companyFilter })
        .populate("users", "name email role");

    if (!safe) {
        return next(new AppError("الخزنة غير موجودة", 404));
    }

    res.status(200).json({
        message: "تم جلب الخزنة بنجاح",
        safe
    });
});

// ================= Update =================
export const updateSafe = catchAsyncError(async (req, res, next) => {
    const safe = await safeModel.findOne({ _id: req.params.id, ...req.companyFilter });

    if (!safe) {
        return next(new AppError("الخزنة غير موجودة", 404));
    }

    // Check name duplication if name is changing
    if (req.body.name && req.body.name !== safe.name) {
        const duplicate = await safeModel.findOne({
            name: req.body.name,
            companyId: safe.companyId
        });
        if (duplicate) {
            return next(new AppError("اسم الخزنة موجود بالفعل", 409));
        }
    }

    Object.assign(safe, req.body);
    // Protect companyId
    if (req.companyFilter.companyId) {
        safe.companyId = req.companyFilter.companyId;
    }
    await safe.save();

    res.status(200).json({
        message: "تم تعديل الخزنة بنجاح",
        safe
    });
});

// ================= Delete =================
export const deleteSafe = catchAsyncError(async (req, res, next) => {
    const safe = await safeModel.findOneAndDelete({ _id: req.params.id, ...req.companyFilter });

    if (!safe) {
        return next(new AppError("الخزنة غير موجودة", 404));
    }

    res.status(200).json({
        message: "تم حذف الخزنة بنجاح",
        safe
    });
});
