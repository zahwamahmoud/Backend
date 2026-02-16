import express from "express";
import {
    addBankAccount,
    deleteBankAccount,
    getAllBankAccounts,
    getBankAccountById,
    updateBankAccount
} from "./bankAccount.controller.js";
import { validation } from "../../middleware/validation.js";
import { addBankAccountSchema, updateBankAccountSchema } from "./bankAccount.validation.js";

import { protectedRoutes } from "../auth/auth.controller.js";
import { applyCompanyFilter } from "../../middleware/applyCompanyFilter.js";

const bankAccountRouter = express.Router();

bankAccountRouter.use(protectedRoutes, applyCompanyFilter);

bankAccountRouter.route("/")
    .post(validation(addBankAccountSchema), addBankAccount)
    .get(getAllBankAccounts);

bankAccountRouter.route("/:id")
    .get(getBankAccountById)
    .put(validation(updateBankAccountSchema), updateBankAccount)
    .delete(deleteBankAccount);

export default bankAccountRouter;
