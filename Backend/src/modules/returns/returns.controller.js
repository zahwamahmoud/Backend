import { returnModel } from "./returns.model.js";
import { AppError } from "../../utils/AppError.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";

const addReturn = catchAsyncError(async (req, res, next) => {
    // req.body.companyId comes from middleware (or superAdmin)
    const returnRequests = new returnModel({
        ...req.body,
        companyId: req.body.companyId
    });
    await returnRequests.save();

    if (!returnRequests) {
        return next(new AppError('Return request not added', 400));
    }

    res.status(201).json({ message: 'Return request added successfully', returnRequests });
});

const getAllReturns = catchAsyncError(async (req, res, next) => {
    const returns = await returnModel.find(req.companyFilter).populate('invoice');
    res.status(200).json({ message: 'Returns fetched successfully', returns });
});

const getReturnById = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const returnRequest = await returnModel.findOne({ _id: id, ...req.companyFilter }).populate('invoice');

    if (!returnRequest) {
        return next(new AppError('Return request not found', 404));
    }

    res.status(200).json({ message: 'Return request fetched successfully', returnRequest });
});

const updateReturn = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    // Use findOneAndUpdate with flter
    const returnRequest = await returnModel.findOneAndUpdate(
        { _id: id, ...req.companyFilter },
        req.body,
        { new: true }
    );

    if (!returnRequest) {
        return next(new AppError('Return request not updated', 400));
    }

    res.status(200).json({ message: 'Return request updated successfully', returnRequest });
});

const deleteReturn = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const returnRequest = await returnModel.findOneAndDelete({ _id: id, ...req.companyFilter });

    if (!returnRequest) {
        return next(new AppError('Return request not deleted', 400));
    }

    res.status(200).json({ message: 'Return request deleted successfully', returnRequest });
});

export { addReturn, getAllReturns, getReturnById, updateReturn, deleteReturn };
