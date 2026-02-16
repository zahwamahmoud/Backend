import express from "express";
import {
    addWarehouse,
    getAllWarehouses,
    getWarehouseById,
    updateWarehouse,
    deleteWarehouse
} from "./warehouse.controller.js";

import { validation } from "../../middleware/validation.js";
import {
    addWarehouseSchema,
    updateWarehouseSchema
} from "./warehouse.validation.js";
import { allowedTo, protectedRoutes } from "../auth/auth.controller.js";
import { applyCompanyFilter } from "../../middleware/applyCompanyFilter.js";

const router = express.Router();

router.use(protectedRoutes, applyCompanyFilter);

router
    .route("/")
    .post(validation(addWarehouseSchema), allowedTo("superAdmin", "admin"), addWarehouse)
    .get(allowedTo("superAdmin", "admin", "accountant", "employee"), getAllWarehouses);

router
    .route("/:id")
    .get(allowedTo("superAdmin", "admin", "accountant", "employee"), getWarehouseById)
    .put(validation(updateWarehouseSchema), allowedTo("superAdmin", "admin"), updateWarehouse)
    .delete(allowedTo("superAdmin", "admin"), deleteWarehouse);

export default router;
