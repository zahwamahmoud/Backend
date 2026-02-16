import { AppError } from "../utils/AppError.js";

export const applyCompanyFilter = (req, res, next) => {
    if (!req.user) {
        return next();
    }

    // 1. Handle 'company' role (Main Account)
    // When a company owner logs in, their 'account' is the company itself.
    if ((req.user.role === "company" || req.user.systemRole === 'companyOwner') && !req.user.companyId) {
        req.user.companyId = req.user._id;
    }

    // 2. SuperAdmin handles everything (optional filter)
    if (req.user.role === "superAdmin" || req.user.systemRole === 'superAdmin') {
        const targetCompanyId = req.query.companyId || req.body.companyId;
        if (targetCompanyId) {
            req.companyFilter = { companyId: targetCompanyId };
            // Also set it on req.user so controllers can use req.user.companyId consistently
            req.user.companyId = targetCompanyId;
        } else {
            req.companyFilter = {};
        }
        // Even for superAdmin, if they are POSTing/PUTing without a companyId, 
        // they might hit validation errors if the model requires it.
        // But for now, we just proceed.
        next();
        return;
    }

    // 3. Strict Check for regular users
    if (!req.user.companyId) {
        return next(new AppError("User is not assigned to a company", 403));
    }

    // Attach filter for queries
    req.companyFilter = { companyId: req.user.companyId };

    // Force companyId on create/update (ensure string for validation)
    if (["POST", "PUT", "PATCH"].includes(req.method)) {
        const id = req.user.companyId;
        if (id) {
            req.body.companyId = String(id);
        }
    }

    next();
};
