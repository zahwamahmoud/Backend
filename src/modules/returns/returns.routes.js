import express from "express";
import { addReturn, deleteReturn, getAllReturns, getReturnById, updateReturn } from "./returns.controller.js";
import { validation } from "../../middleware/validation.js";
import { addReturnSchema, updateReturnSchema } from "./returns.validation.js";
import { allowedTo, protectedRoutes } from "../auth/auth.controller.js";
import { applyCompanyFilter } from "../../middleware/applyCompanyFilter.js";

const returnsRouter = express.Router();

returnsRouter.use(protectedRoutes, applyCompanyFilter);

returnsRouter.route('/')
    .post(validation(addReturnSchema), allowedTo("superAdmin", "admin", "accountant"), addReturn)
    .get(allowedTo("superAdmin", "admin", "accountant", "employee"), getAllReturns);

returnsRouter.route('/:id')
    .get(allowedTo("superAdmin", "admin", "accountant", "employee"), getReturnById)
    .put(validation(updateReturnSchema), allowedTo("superAdmin", "admin", "accountant"), updateReturn)
    .delete(allowedTo("superAdmin", "admin"), deleteReturn);

export default returnsRouter;
