import express from "express";
import { addActivity, deleteActivity, getActivityById, getAllActivities, updateActivity } from "./activity.controller.js";
import { validation } from "../../middleware/validation.js";
import { addActivitySchema, updateActivitySchema } from "./activity.validation.js";

import { allowedTo, protectedRoutes } from "../auth/auth.controller.js";
import { applyCompanyFilter } from "../../middleware/applyCompanyFilter.js";

const activityRouter = express.Router();

activityRouter.use(protectedRoutes, applyCompanyFilter);

activityRouter.post('/', validation(addActivitySchema), allowedTo("superAdmin", "admin", "accountant"), addActivity);
activityRouter.get('/', allowedTo("superAdmin", "admin", "accountant", "employee"), getAllActivities);
activityRouter.get('/:id', allowedTo("superAdmin", "admin", "accountant", "employee"), getActivityById);
activityRouter.put('/:id', validation(updateActivitySchema), allowedTo("superAdmin", "admin", "accountant"), updateActivity);
activityRouter.delete('/:id', allowedTo("superAdmin", "admin"), deleteActivity);

export default activityRouter;
