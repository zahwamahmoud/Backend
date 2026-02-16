import { salesCustomerModel } from "./customers.model.js";
import { AppError } from "../../utils/AppError.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";

const addCustomer = catchAsyncError(async (req, res, next) => {
    const { email } = req.body;
    const { companyFilter } = req;

    const existingCustomer = await salesCustomerModel.findOne({ email, ...companyFilter });
    if (existingCustomer) {
        return next(new AppError('Customer email already exists for this company', 409));
    }

    const customer = new salesCustomerModel({
        ...req.body,
        companyId: req.user.companyId,
        createdBy: req.user._id
    });
    await customer.save();

    res.status(201).json({ message: 'Customer added successfully', customer });
});

const getAllCustomers = catchAsyncError(async (req, res, next) => {
    const customers = await salesCustomerModel.find(req.companyFilter).sort({ createdAt: -1 });
    res.status(200).json({ message: 'Customers fetched successfully', customers });
});

const getCustomerById = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const customer = await salesCustomerModel.findOne({ _id: id, ...req.companyFilter });

    if (!customer) {
        return next(new AppError('Customer not found', 404));
    }

    res.status(200).json({ message: 'Customer fetched successfully', customer });
});

const updateCustomer = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const { email } = req.body;
    const { companyFilter } = req;

    const customerExists = await salesCustomerModel.findOne({ _id: id, ...companyFilter });
    if (!customerExists) {
        return next(new AppError('Customer not found', 404));
    }

    if (email && email !== customerExists.email) {
        const duplicateEmail = await salesCustomerModel.findOne({ email, ...companyFilter });
        if (duplicateEmail) {
            return next(new AppError('Customer email already exists for this company', 409));
        }
    }

    const customer = await salesCustomerModel.findOneAndUpdate(
        { _id: id, ...companyFilter },
        req.body,
        { new: true }
    );

    res.status(200).json({ message: 'Customer updated successfully', customer });
});

const deleteCustomer = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const customer = await salesCustomerModel.findOneAndDelete({ _id: id, ...req.companyFilter });

    if (!customer) {
        return next(new AppError('Customer not found', 404));
    }

    res.status(200).json({ message: 'Customer deleted successfully', customer });
});

export { addCustomer, getAllCustomers, getCustomerById, updateCustomer, deleteCustomer };
