import express from "express";
import {
    addStockAdd,
    getAllStockAdds,
    getStockAddById,
    updateStockAdd,
    deleteStockAdd,
    addStockAddItem,
    getAllStockAddItems,
    getStockAddItemById,
    updateStockAddItem,
    deleteStockAddItem
} from "./stockAdd.controller.js";

import {
    addStockAddSchema,
    updateStockAddSchema,
    addStockAddItemSchema,
    updateStockAddItemSchema
} from "./stockAdd.validation.js";

import { validation } from "../../middleware/validation.js";
import { uploadMultiFiles, ATTACHMENT_MIMETYPES } from "../../middleware/uploadFiles.js";
import { protectedRoutes } from "../auth/auth.controller.js";
import { applyCompanyFilter } from "../../middleware/applyCompanyFilter.js";

const router = express.Router();

router.use(protectedRoutes, applyCompanyFilter);

// StockAdd routes
router.route("/")
    .post(uploadMultiFiles(ATTACHMENT_MIMETYPES, [{ name: 'attachments', maxCount: 5 }]), validation(addStockAddSchema), applyCompanyFilter, addStockAdd)
    .get(getAllStockAdds);

router.route("/:id")
    .get(getStockAddById)
    .put(uploadMultiFiles(ATTACHMENT_MIMETYPES, [{ name: 'attachments', maxCount: 5 }]), validation(updateStockAddSchema), applyCompanyFilter, updateStockAdd)
    .delete(deleteStockAdd);

// StockAddItem routes
router.route("/item")
    .post(validation(addStockAddItemSchema), addStockAddItem)
    .get(getAllStockAddItems);

router.route("/item/:id")
    .get(getStockAddItemById)
    .put(validation(updateStockAddItemSchema), updateStockAddItem)
    .delete(deleteStockAddItem);

export default router;
