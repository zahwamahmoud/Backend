import express from "express";
import {
    addRole,
    deleteRole,
    getAllRoles,
    getRoleById,
    updateRole,
} from "./role.controller.js";
import { validation } from "../../middleware/validation.js";
import { addRoleSchema, updateRoleSchema } from "./role.validation.js";
import { allowedTo, protectedRoutes } from "../auth/auth.controller.js";
import { applyCompanyFilter } from "../../middleware/applyCompanyFilter.js";

const roleRouter = express.Router();

roleRouter.use(protectedRoutes, applyCompanyFilter);

roleRouter.post(
    "/",
    validation(addRoleSchema),
    allowedTo("superAdmin", "admin"),
    addRole
);
roleRouter.get("/", allowedTo("superAdmin", "admin", "accountant", "employee"), getAllRoles);
roleRouter.get("/:id", allowedTo("superAdmin", "admin", "accountant", "employee"), getRoleById);
roleRouter.put(
    "/:id",
    validation(updateRoleSchema),
    allowedTo("superAdmin", "admin"),
    updateRole
);
roleRouter.delete("/:id", allowedTo("superAdmin", "admin"), deleteRole);

export default roleRouter;
