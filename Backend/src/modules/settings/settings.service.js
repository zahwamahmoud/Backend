import { settingsModel } from "./settings.model.js";

/**
 * Get settings for a company by category
 */
export const getSettings = async (companyId, category) => {
    const query = { companyId };
    if (category) {
        query.category = category;
    }
    
    const settings = await settingsModel.find(query);
    
    if (category && settings.length === 0) {
        // Return default empty settings if none exist
        return { category, settings: {} };
    }
    
    if (category) {
        return settings[0] || { category, settings: {} };
    }
    
    // Return all settings grouped by category
    const grouped = {};
    settings.forEach(setting => {
        grouped[setting.category] = setting.settings || {};
    });
    
    return grouped;
};

/**
 * Update or create settings for a company
 */
export const updateSettings = async (companyId, category, settingsData) => {
    const settings = await settingsModel.findOneAndUpdate(
        { companyId, category },
        { 
            companyId, 
            category, 
            settings: settingsData 
        },
        { 
            new: true, 
            upsert: true,
            runValidators: true 
        }
    );
    
    return settings;
};
