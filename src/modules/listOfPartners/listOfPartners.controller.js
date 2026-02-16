import { partnerListModel } from "./listOfPartners.model.js";
import { AppError } from "../../utils/AppError.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";

const addPartnerList = catchAsyncError(async (req, res, next) => {
    const partnerList = new partnerListModel({
        ...req.body,
        companyId: req.user.companyId
    });
    await partnerList.save();
    res.status(201).json({ message: 'Partner List created successfully', partnerList });
});

const getAllPartnerLists = catchAsyncError(async (req, res, next) => {
    const partnerLists = await partnerListModel.find(req.companyFilter).sort({ createdAt: -1 });
    res.status(200).json({ message: 'Partner Lists retrieved successfully', partnerLists });
});

const getPartnerListById = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const partnerList = await partnerListModel.findOne({ _id: id, ...req.companyFilter });
    if (!partnerList) {
        return next(new AppError('Partner List not found', 404));
    }
    res.status(200).json({ message: 'Partner List retrieved successfully', partnerList });
});

const updatePartnerList = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const partnerList = await partnerListModel.findOneAndUpdate(
        { _id: id, ...req.companyFilter },
        req.body,
        { new: true }
    );
    if (!partnerList) {
        return next(new AppError('Partner List not found', 404));
    }
    res.status(200).json({ message: 'Partner List updated successfully', partnerList });
});

const deletePartnerList = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const partnerList = await partnerListModel.findOneAndDelete({ _id: id, ...req.companyFilter });
    if (!partnerList) {
        return next(new AppError('Partner List not found', 404));
    }
    res.status(200).json({ message: 'Partner List deleted successfully', partnerList });
});

export { addPartnerList, getAllPartnerLists, getPartnerListById, updatePartnerList, deletePartnerList };
