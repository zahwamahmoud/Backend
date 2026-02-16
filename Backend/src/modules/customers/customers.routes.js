import express from "express";
import { addCustomer, deleteCustomer, getAllCustomers, getCustomerById, updateCustomer } from "./customers.controller.js";
import { validation } from "../../middleware/validation.js";
import { addCustomerSchema, updateCustomerSchema } from "./customers.validation.js";
import { protectedRoutes } from "../auth/auth.controller.js";
import { applyCompanyFilter } from "../../middleware/applyCompanyFilter.js";

const customerRouter = express.Router();

customerRouter.use(protectedRoutes);
customerRouter.use(applyCompanyFilter);

customerRouter.route('/')
    .post(validation(addCustomerSchema), addCustomer)
    .get(getAllCustomers);

customerRouter.route('/:id')
    .get(getCustomerById)
    .put(validation(updateCustomerSchema), updateCustomer)
    .delete(deleteCustomer);

export default customerRouter;
