import express from "express";
import { addProduct, deleteProduct, getAllProducts, getProductById, updateProduct } from "./product.controller.js";
import { validation } from "../../middleware/validation.js";
import { addProductSchema, updateProductSchema } from "./product.validation.js";
import { uploadSingleFile } from "../../middleware/uploadFiles.js";
import { allowedTo, protectedRoutes } from "../auth/auth.controller.js";
import { applyCompanyFilter } from "../../middleware/applyCompanyFilter.js";

const productRouter = express.Router();

productRouter.use(protectedRoutes, applyCompanyFilter);

productRouter.post('/', uploadSingleFile(['image/'], 'image'), validation(addProductSchema), applyCompanyFilter, allowedTo("superAdmin", "admin", "accountant"), addProduct)
productRouter.get('/', allowedTo("superAdmin", "admin", "accountant", "employee"), getAllProducts)
productRouter.get('/:id', allowedTo("superAdmin", "admin", "accountant", "employee"), getProductById)
productRouter.put('/:id', uploadSingleFile(['image/'], 'image'), validation(updateProductSchema), applyCompanyFilter, allowedTo("superAdmin", "admin", "accountant"), updateProduct)
productRouter.delete('/:id', allowedTo("superAdmin", "admin"), deleteProduct)

export default productRouter;
