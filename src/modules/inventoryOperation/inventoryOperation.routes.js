import express from "express";
import {
    addInventoryOperation,
    getAllInventoryOperations,
    getInventoryOperationById,
    updateInventoryOperation,
    deleteInventoryOperation
} from "./inventoryOperation.controller.js";

import { validation } from "../../middleware/validation.js";
import {
    addInventoryOperationSchema,
    updateInventoryOperationSchema
} from "./inventoryOperation.validation.js";

import { uploadMultiFiles, ATTACHMENT_MIMETYPES } from "../../middleware/uploadFiles.js";
import { protectedRoutes } from "../auth/auth.controller.js";
import { applyCompanyFilter } from "../../middleware/applyCompanyFilter.js";

const router = express.Router();

router.use(protectedRoutes, applyCompanyFilter);

router
    .route("/")
    .post(uploadMultiFiles(ATTACHMENT_MIMETYPES, [{ name: 'attachments', maxCount: 5 }]), validation(addInventoryOperationSchema), applyCompanyFilter, addInventoryOperation)
    .get(getAllInventoryOperations);

router
    .route("/:id")
    .get(getInventoryOperationById)
    .put(uploadMultiFiles(ATTACHMENT_MIMETYPES, [{ name: 'attachments', maxCount: 5 }]), validation(updateInventoryOperationSchema), applyCompanyFilter, updateInventoryOperation)
    .delete(deleteInventoryOperation);

export default router;
