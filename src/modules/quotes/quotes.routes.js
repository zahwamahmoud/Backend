import express from "express";
import { addQuote, deleteQuote, getAllQuotes, getQuoteById, updateQuote } from "./quotes.controller.js";
import { validation } from "../../middleware/validation.js";
import { addQuoteSchema, updateQuoteSchema } from "./quotes.validation.js";
import { allowedTo, protectedRoutes } from "../auth/auth.controller.js";
import { applyCompanyFilter } from "../../middleware/applyCompanyFilter.js";

const quoteRouter = express.Router();

quoteRouter.use(protectedRoutes, applyCompanyFilter);

quoteRouter.route('/')
    .post(validation(addQuoteSchema), allowedTo("superAdmin", "admin", "accountant"), addQuote)
    .get(allowedTo("superAdmin", "admin", "accountant", "employee"), getAllQuotes);

quoteRouter.route('/:id')
    .get(allowedTo("superAdmin", "admin", "accountant", "employee"), getQuoteById)
    .put(validation(updateQuoteSchema), allowedTo("superAdmin", "admin", "accountant"), updateQuote)
    .delete(allowedTo("superAdmin", "admin"), deleteQuote);

export default quoteRouter;
