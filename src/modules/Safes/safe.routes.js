import express from "express";
import {
    addSafe,
    getAllSafes,
    getSafeById,
    updateSafe,
    deleteSafe
} from "./safe.controller.js";

import { validation } from "../../middleware/validation.js";
import { addSafeSchema, updateSafeSchema } from "./safe.validation.js";
import { allowedTo, protectedRoutes } from "../auth/auth.controller.js";
import { applyCompanyFilter } from "../../middleware/applyCompanyFilter.js";

const router = express.Router();

router.use(protectedRoutes, applyCompanyFilter);

router
    .route("/")
    .post(validation(addSafeSchema), allowedTo("superAdmin", "admin", "accountant"), addSafe)
    .get(allowedTo("superAdmin", "admin", "accountant", "employee"), getAllSafes);

router
    .route("/:id")
    .get(allowedTo("superAdmin", "admin", "accountant", "employee"), getSafeById)
    .put(validation(updateSafeSchema), allowedTo("superAdmin", "admin", "accountant"), updateSafe)
    .delete(allowedTo("superAdmin", "admin"), deleteSafe);

export default router;
