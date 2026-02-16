import express from "express";
import { protect } from "../../middleware/authMiddleware.js";
import { getSettingsController, updateSettingsController } from "./settings.controller.js";
import { updateSettingsSchema, getSettingsSchema } from "./settings.validation.js";
import { validate } from "../../middleware/validation.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get settings (optionally filtered by category)
router.get(
    "/",
    validate(getSettingsSchema),
    getSettingsController
);

// Update settings for a specific category
router.patch(
    "/:category",
    validate(updateSettingsSchema),
    updateSettingsController
);

export const settingsRouter = router;
