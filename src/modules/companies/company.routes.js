import express from "express";
import { addCompany, deleteCompany, getAllCompanies, getCompany, getCompanyBySlug, updateCompany, loginAsCompany, sendCredentials } from "./company.controller.js";
import { validation } from "../../middleware/validation.js";
import { addCompanySchema, updateCompanySchema } from "./company.validation.js";
import { uploadSingleFile } from "../../middleware/uploadFiles.js";
import { allowedTo, protectedRoutes } from "../auth/auth.controller.js";

const companyRouter = express.Router();

companyRouter.post('/', uploadSingleFile(['image'], 'logo'), validation(addCompanySchema), protectedRoutes, allowedTo('superAdmin'), addCompany);
companyRouter.get('/', protectedRoutes, allowedTo('superAdmin'), getAllCompanies);
companyRouter.get('/slug/:slug', getCompanyBySlug);
companyRouter.get('/:id', protectedRoutes, allowedTo('superAdmin'), getCompany);
companyRouter.put('/:id', uploadSingleFile(['image'], 'logo'), validation(updateCompanySchema), protectedRoutes, allowedTo('superAdmin'), updateCompany);
companyRouter.delete('/:id', protectedRoutes, allowedTo('superAdmin'), deleteCompany);
companyRouter.post('/:id/login', protectedRoutes, allowedTo('superAdmin'), loginAsCompany);
companyRouter.post('/:id/send-credentials', protectedRoutes, allowedTo('superAdmin'), sendCredentials);

export default companyRouter;
