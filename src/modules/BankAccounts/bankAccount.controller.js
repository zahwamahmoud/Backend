import { AppError } from "../../utils/AppError.js";
import { bankAccountModel } from "./bankAccount.model.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";


// @desc    Add a new bank account
// @route   POST /api/v1/bank-accounts
// @access  Private
const addBankAccount = catchAsyncError(async (req, res, next) => {
    const existingAccount = await bankAccountModel.findOne({ name: req.body.name, ...req.companyFilter });
    if (existingAccount) {
        return next(new AppError("Bank account with this name already exists", 409));
    }

    const bankAccount = new bankAccountModel({ ...req.body, companyId: req.user.companyId });
    await bankAccount.save();

    res.status(201).json({ message: "Bank account created successfully", bankAccount });
});

// @desc    Get all bank accounts
// @route   GET /api/v1/bank-accounts
// @access  Private
const getAllBankAccounts = catchAsyncError(async (req, res, next) => {
    const { name } = req.query;
    const filter = {};
    if (name) filter.name = { $regex: name, $options: "i" };

    const bankAccounts = await bankAccountModel.find({ ...filter, ...req.companyFilter }).populate("users", "name email role");
    res.status(200).json({ message: "Success", bankAccounts });
});

// @desc    Get a single bank account by ID
// @route   GET /api/v1/bank-accounts/:id
// @access  Private
const getBankAccountById = catchAsyncError(async (req, res, next) => {
    const bankAccount = await bankAccountModel.findOne({ _id: req.params.id, ...req.companyFilter }).populate("users", "name email role");
    if (!bankAccount) {
        return next(new AppError("Bank account not found", 404));
    }
    res.status(200).json({ message: "Success", bankAccount });
});

// @desc    Update a bank account
// @route   PUT /api/v1/bank-accounts/:id
// @access  Private
const updateBankAccount = catchAsyncError(async (req, res, next) => {
    const bankAccount = await bankAccountModel.findOneAndUpdate(
        { _id: req.params.id, ...req.companyFilter },
        req.body,
        { new: true, runValidators: true }
    );

    if (!bankAccount) {
        return next(new AppError("Bank account not found", 404));
    }

    res.status(200).json({ message: "Bank account updated successfully", bankAccount });
});

// @desc    Delete a bank account
// @route   DELETE /api/v1/bank-accounts/:id
// @access  Private
const deleteBankAccount = catchAsyncError(async (req, res, next) => {
    const bankAccount = await bankAccountModel.findOneAndDelete({ _id: req.params.id, ...req.companyFilter });
    if (!bankAccount) {
        return next(new AppError("Bank account not found", 404));
    }
    res.status(200).json({ message: "Bank account deleted successfully" });
});

export {
    addBankAccount,
    getAllBankAccounts,
    getBankAccountById,
    updateBankAccount,
    deleteBankAccount
};
