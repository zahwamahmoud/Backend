import { activityModel } from "./activity.model.js";
import { AppError } from "../../utils/AppError.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";

const addActivity = catchAsyncError(async (req, res, next) => {
    const activity = new activityModel({ ...req.body, companyId: req.user.companyId });
    await activity.save();
    res.status(201).json({ message: 'Activity created successfully', activity });
});

const getAllActivities = catchAsyncError(async (req, res, next) => {
    const activities = await activityModel.find(req.companyFilter).sort({ createdAt: -1 });
    res.status(200).json({ message: 'Activities retrieved successfully', activities });
});

const getActivityById = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const activity = await activityModel.findOne({ _id: id, ...req.companyFilter });
    if (!activity) {
        return next(new AppError('Activity not found', 404));
    }
    res.status(200).json({ message: 'Activity retrieved successfully', activity });
});

const updateActivity = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const activity = await activityModel.findOneAndUpdate({ _id: id, ...req.companyFilter }, req.body, { new: true });
    if (!activity) {
        return next(new AppError('Activity not found', 404));
    }
    res.status(200).json({ message: 'Activity updated successfully', activity });
});

const deleteActivity = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const activity = await activityModel.findOneAndDelete({ _id: id, ...req.companyFilter });
    if (!activity) {
        return next(new AppError('Activity not found', 404));
    }
    res.status(200).json({ message: 'Activity deleted successfully', activity });
});

export { addActivity, getAllActivities, getActivityById, updateActivity, deleteActivity };
