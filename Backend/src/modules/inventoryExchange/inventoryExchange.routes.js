import express from "express";
import {
    addInventoryExchange,
    getAllInventoryExchanges,
    getInventoryExchangeById,
    updateInventoryExchange,
    deleteInventoryExchange
} from "./inventoryExchange.controller.js";

import {
    addInventoryExchangeSchema,
    updateInventoryExchangeSchema
} from "./inventoryExchange.validation.js";

import { validation } from "../../middleware/validation.js";

import { uploadMultiFiles, ATTACHMENT_MIMETYPES } from "../../middleware/uploadFiles.js";
import { protectedRoutes } from "../auth/auth.controller.js";
import { applyCompanyFilter } from "../../middleware/applyCompanyFilter.js";

const router = express.Router();

router.use(protectedRoutes, applyCompanyFilter);

router
    .route("/")
    .post(uploadMultiFiles(ATTACHMENT_MIMETYPES, [{ name: 'attachments', maxCount: 5 }]), validation(addInventoryExchangeSchema), applyCompanyFilter, addInventoryExchange)
    .get(getAllInventoryExchanges);

router
    .route("/:id")
    .get(getInventoryExchangeById)
    .put(uploadMultiFiles(ATTACHMENT_MIMETYPES, [{ name: 'attachments', maxCount: 5 }]), validation(updateInventoryExchangeSchema), applyCompanyFilter, updateInventoryExchange)
    .delete(deleteInventoryExchange);

export default router;
