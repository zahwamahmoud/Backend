import { branchModel } from "./branch.model.js";
import { partnerListModel } from "../listOfPartners/listOfPartners.model.js";
import { activityModel } from "../activity/activity.model.js";
import { AppError } from "../../utils/AppError.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";

const getDefaultPartnerListId = async (companyFilter) => {
    const defaultList = await partnerListModel
        .findOne({ ...companyFilter })
        .sort({ createdAt: 1 });
    return defaultList?._id || null;
};

const getMainActivityId = async (companyFilter) => {
    const main = await activityModel
        .findOne({ ...companyFilter, $or: [{ name: /main|رئيسي|default/i }] })
        .sort({ createdAt: 1 });
    if (main) return main._id;
    const first = await activityModel.findOne(companyFilter).sort({ createdAt: 1 });
    return first?._id || null;
};

const addBranch = catchAsyncError(async (req, res, next) => {
    const { code, partners: partnersIds, activity: activityId, ...rest } = req.body;
    const companyId = req.user.companyId;
    const companyFilter = req.companyFilter || { companyId };

    if (!companyId) {
        return next(new AppError('Branch creation requires a company context', 403));
    }

    const existingBranch = await branchModel.findOne({ code, ...companyFilter });
    if (existingBranch) {
        return next(new AppError('Branch code already exists for this company', 400));
    }

    let partnerIds = Array.isArray(partnersIds) ? partnersIds.filter(Boolean) : [];
    if (partnerIds.length === 0) {
        const defaultId = await getDefaultPartnerListId(companyFilter);
        if (defaultId) partnerIds = [defaultId];
    }
    let activity = activityId || null;
    if (!activity) {
        activity = await getMainActivityId(companyFilter);
    }

    const branchData = {
        ...rest,
        code,
        companyId,
        partners: partnerIds,
        partnerList: partnerIds.length > 0 ? partnerIds[0] : null,
        activity
    };
    const branch = new branchModel(branchData);
    await branch.save();
    const populated = await branchModel
        .findById(branch._id)
        .populate('partners', 'name status')
        .populate('partnerList', 'name status')
        .populate('activity', 'name status');
    res.status(201).json({ message: 'Branch created successfully', branch: populated || branch });
});

const getAllBranches = catchAsyncError(async (req, res, next) => {
    const branches = await branchModel
        .find(req.companyFilter)
        .populate('partners', 'name status')
        .populate('partnerList', 'name status')
        .populate('activity', 'name status')
        .sort({ createdAt: -1 });
    res.status(200).json({ message: 'Branches retrieved successfully', branches });
});

const getBranchById = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const branch = await branchModel
        .findOne({ _id: id, ...req.companyFilter })
        .populate('partners', 'name status')
        .populate('partnerList', 'name status')
        .populate('activity', 'name status');
    if (!branch) {
        return next(new AppError('Branch not found', 404));
    }
    res.status(200).json({ message: 'Branch retrieved successfully', branch });
});

const updateBranch = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const { code, partners: partnersIds, activity: activityId, ...rest } = req.body;
    const { companyFilter } = req;

    const branchExists = await branchModel.findOne({ _id: id, ...companyFilter });
    if (!branchExists) {
        return next(new AppError('Branch not found', 404));
    }

    if (code && code !== branchExists.code) {
        const duplicateCode = await branchModel.findOne({ code, ...companyFilter });
        if (duplicateCode) {
            return next(new AppError('Branch code already exists for this company', 400));
        }
    }

    const updateData = { ...rest };
    if (req.body.hasOwnProperty('code')) updateData.code = req.body.code;
    if (Array.isArray(partnersIds)) {
        const partnerIds = partnersIds.filter(Boolean);
        updateData.partners = partnerIds;
        updateData.partnerList = partnerIds.length > 0 ? partnerIds[0] : null;
    }
    if (activityId !== undefined) updateData.activity = activityId || null;

    const branch = await branchModel
        .findOneAndUpdate(
            { _id: id, ...companyFilter },
            updateData,
            { new: true }
        )
        .populate('partners', 'name status')
        .populate('partnerList', 'name status')
        .populate('activity', 'name status');
    res.status(200).json({ message: 'Branch updated successfully', branch });
});

const deleteBranch = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const branch = await branchModel.findOneAndDelete({ _id: id, ...req.companyFilter });
    if (!branch) {
        return next(new AppError('Branch not found', 404));
    }
    res.status(200).json({ message: 'Branch deleted successfully', branch });
});

export { addBranch, getAllBranches, getBranchById, updateBranch, deleteBranch };
