import { getSettings, updateSettings } from "./settings.service.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";
import { AppError } from "../../utils/AppError.js";

/**
 * Get settings for the authenticated company
 */
export const getSettingsController = catchAsyncError(async (req, res, next) => {
    const { category } = req.query;
    const companyId = req.user.companyId;
    
    const result = await getSettings(companyId, category);
    
    res.status(200).json({
        status: 'success',
        data: result
    });
});

/**
 * Update settings for the authenticated company
 */
export const updateSettingsController = catchAsyncError(async (req, res, next) => {
    const { category } = req.params;
    const { settings } = req.body;
    const companyId = req.user.companyId;
    
    if (!category || !['general', 'sales', 'purchases', 'customers', 'suppliers', 'accounting', 'export'].includes(category)) {
        return next(new AppError('Invalid category', 400));
    }
    
    const updated = await updateSettings(companyId, category, settings);
    
    res.status(200).json({
        status: 'success',
        message: 'Settings updated successfully',
        data: updated
    });
});
