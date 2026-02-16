import express from "express";
import {
    addOperation,
    getAllOperations,
    getOperationById,
    updateOperation,
    deleteOperation
} from "./operations.controllers.js";


import {
    addOperationSchema,
    updateOperationSchema
} from "./operations.validation.js";
import { validation } from "../../middleware/validation.js";
import { uploadMultiFiles, ATTACHMENT_MIMETYPES } from "../../middleware/uploadFiles.js";
import { allowedTo, protectedRoutes } from "../auth/auth.controller.js";
import { applyCompanyFilter } from "../../middleware/applyCompanyFilter.js";

const router = express.Router();

router.use(protectedRoutes, applyCompanyFilter);

router
    .route("/")
    .post(uploadMultiFiles(ATTACHMENT_MIMETYPES, [{ name: 'attachments', maxCount: 5 }]), validation(addOperationSchema), applyCompanyFilter, allowedTo("superAdmin", "admin", "accountant"), addOperation)
    .get(allowedTo("superAdmin", "admin", "accountant", "employee"), getAllOperations);

router
    .route("/:id")
    .get(allowedTo("superAdmin", "admin", "accountant", "employee"), getOperationById)
    .put(uploadMultiFiles(ATTACHMENT_MIMETYPES, [{ name: 'attachments', maxCount: 5 }]), validation(updateOperationSchema), applyCompanyFilter, allowedTo("superAdmin", "admin", "accountant"), updateOperation)
    .delete(allowedTo("superAdmin", "admin"), deleteOperation);

export default router;
