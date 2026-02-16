import { userModel } from "./user.model.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";
import { AppError } from "../../utils/AppError.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../../utils/cloudinary.js";

const addUser = catchAsyncError(async (req, res, next) => {
    // Remove confirmPassword before processing (should not be stored)
    const { confirmPassword, ...userData } = req.body;

    // Default type to 'user' if not provided
    userData.type = userData.type || 'user';

    // Handle Employee specific logic
    if (userData.type === 'employee') {
        // If email is missing for employee, generate a placeholder to satisfy unique index
        if (!userData.email) {
            const uniqueId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
            userData.email = `emp_${uniqueId}@system.local`;
        }
    }

    const { email } = userData;

    // Check if user exists (only if email was provided or generated)
    if (email) {
        let foundUser = await userModel.findOne({ email });
        if (foundUser) {
            return next(new AppError('User already exist', 409));
        }
    }

    // Validate companyId for non-superAdmin users
    if (userData.role !== 'superAdmin' && !userData.companyId) {
        // If req.companyFilter has a companyId, use it
        if (req.companyFilter && req.companyFilter.companyId) {
            userData.companyId = req.companyFilter.companyId;
        } else {
            return next(new AppError('Company ID is required for non-superAdmin users', 400));
        }
    }

    // Set systemRole: superAdmin stays superAdmin, others are companyOwner
    if (userData.role === 'superAdmin') {
        userData.systemRole = 'superAdmin';
        userData.companyId = undefined;
        userData.roleId = undefined;
    } else {
        userData.systemRole = userData.systemRole || 'companyOwner';
    }

    if (req.file) {
        const result = await uploadToCloudinary(req.file.buffer, 'users');
        userData.image = result.secure_url;
        userData.imagePublicId = result.public_id;
    }

    let user = new userModel(userData);
    await user.save();

    user.password = undefined;
    res.status(201).json({ message: 'User added successfully', user });
})

const getAllUsers = catchAsyncError(async (req, res, next) => {
    // Use req.companyFilter
    let users = await userModel.find(req.companyFilter);
    if (!users) {
        return next(new AppError('Users not fetched', 400));
    }
    res.status(200).json({ message: 'Users fetched successfully', users });
})


const getUserById = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    // Use req.companyFilter
    let user = await userModel.findOne({ _id: id, ...req.companyFilter });

    if (!user) {
        return next(new AppError('User not fetched', 400));
    }
    res.status(200).json({ message: 'User fetched successfully', user });
})


const updateUser = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;

    // Use req.companyFilter
    let existingUser = await userModel.findOne({ _id: id, ...req.companyFilter });
    if (!existingUser) {
        return next(new AppError('User not found', 404));
    }

    if (req.file) {
        if (existingUser.imagePublicId) {
            await deleteFromCloudinary(existingUser.imagePublicId);
        }
        const result = await uploadToCloudinary(req.file.buffer, 'users');
        req.body.image = result.secure_url;
        req.body.imagePublicId = result.public_id;
    }

    let User = await userModel.findOneAndUpdate(
        { _id: id, ...req.companyFilter },
        req.body,
        { new: true }
    );

    if (!User) {
        return next(new AppError('User not update', 400));
    }
    res.status(200).json({ message: 'User updated successfully', User });
})


const deleteUser = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;

    // Use req.companyFilter
    let user = await userModel.findOne({ _id: id, ...req.companyFilter });
    if (!user) {
        return next(new AppError('User not delete', 400));
    }

    if (user.imagePublicId) {
        await deleteFromCloudinary(user.imagePublicId);
    }

    let User = await userModel.findOneAndDelete({ _id: id, ...req.companyFilter });
    res.status(200).json({ message: 'User deleted successfully', User });
})

export { addUser, getAllUsers, getUserById, updateUser, deleteUser }