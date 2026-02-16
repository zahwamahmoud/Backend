import { roleModel } from "./role.model.js";
import { AppError } from "../../utils/AppError.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";

const addRole = catchAsyncError(async (req, res, next) => {
    const { name, permissions, status } = req.body;
    const companyId = req.body.companyId || req.user?.companyId;

    if (!companyId) {
        return next(new AppError("Company ID is required for role creation", 400));
    }

    const existing = await roleModel.findOne({ name: (name || "").trim(), companyId });
    if (existing) {
        return next(new AppError("Role name already exists for this company", 400));
    }

    const role = new roleModel({
        name: (name || "").trim(),
        companyId,
        permissions: Array.isArray(permissions) ? permissions : [],
        status: status || "active",
    });
    await role.save();
    res.status(201).json({ message: "Role created successfully", role });
});

const getAllRoles = catchAsyncError(async (req, res, next) => {
    const roles = await roleModel.find(req.companyFilter).sort({ createdAt: -1 });
    res.status(200).json({ message: "Roles retrieved successfully", roles });
});

const getRoleById = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const role = await roleModel.findOne({ _id: id, ...req.companyFilter });
    if (!role) {
        return next(new AppError("Role not found", 404));
    }
    res.status(200).json({ message: "Role retrieved successfully", role });
});

const updateRole = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const { name } = req.body;

    const existing = await roleModel.findOne({ _id: id, ...req.companyFilter });
    if (!existing) {
        return next(new AppError("Role not found", 404));
    }

    if (name != null && (name || "").trim() !== existing.name) {
        const duplicate = await roleModel.findOne({
            name: (name || "").trim(),
            companyId: existing.companyId,
            _id: { $ne: id },
        });
        if (duplicate) {
            return next(new AppError("Role name already exists for this company", 400));
        }
    }

    const role = await roleModel.findOneAndUpdate(
        { _id: id, ...req.companyFilter },
        req.body,
        { new: true }
    );
    res.status(200).json({ message: "Role updated successfully", role });
});

const deleteRole = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const role = await roleModel.findOneAndDelete({ _id: id, ...req.companyFilter });
    if (!role) {
        return next(new AppError("Role not found", 404));
    }
    res.status(200).json({ message: "Role deleted successfully", role });
});

export { addRole, getAllRoles, getRoleById, updateRole, deleteRole };
