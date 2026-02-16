import express from "express";
import { addCategory, deleteCategory, getAllCategories, getCategoryById, updateCategory } from "./category.controller.js";
import { validation } from "../../middleware/validation.js";
import { addCategorySchema, updateCategorySchema } from "./category.validation.js";
import { allowedTo, protectedRoutes } from "../auth/auth.controller.js";
import { applyCompanyFilter } from "../../middleware/applyCompanyFilter.js";

const categoryRouter = express.Router();

categoryRouter.use(protectedRoutes, applyCompanyFilter);

categoryRouter.post('/', validation(addCategorySchema), allowedTo("superAdmin", "admin", "accountant"), addCategory);
categoryRouter.get('/', allowedTo("superAdmin", "admin", "accountant", "employee"), getAllCategories);
categoryRouter.get('/:id', allowedTo("superAdmin", "admin", "accountant", "employee"), getCategoryById);
categoryRouter.put('/:id', validation(updateCategorySchema), allowedTo("superAdmin", "admin", "accountant"), updateCategory);
categoryRouter.delete('/:id', allowedTo("superAdmin", "admin"), deleteCategory);

export default categoryRouter;
