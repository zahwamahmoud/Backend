import express from "express";
import { addAccount, deleteAccount, getAccountById, getAllAccounts, updateAccount } from "./chartOfAccounts.controller.js";
import { validation } from "../../middleware/validation.js";
import { addAccountSchema, updateAccountSchema } from "./chartOfAccounts.validation.js";
import { protectedRoutes } from "../auth/auth.controller.js";
import { applyCompanyFilter } from "../../middleware/applyCompanyFilter.js";

const chartOfAccountsRouter = express.Router();

chartOfAccountsRouter.use(protectedRoutes);
chartOfAccountsRouter.use(applyCompanyFilter);

chartOfAccountsRouter.post('/', validation(addAccountSchema), addAccount);
chartOfAccountsRouter.get('/', getAllAccounts);
chartOfAccountsRouter.get('/:id', getAccountById);
chartOfAccountsRouter.put('/:id', validation(updateAccountSchema), updateAccount);
chartOfAccountsRouter.delete('/:id', deleteAccount);

export default chartOfAccountsRouter;
