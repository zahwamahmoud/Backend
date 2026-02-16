import express from "express";
import {
    createInvoice,
    deleteInvoice,
    getAllInvoices,
    getInvoiceById,
    updateInvoice,
    searchInvoices,
    updateInvoiceStatus,
    getInvoiceStats
} from "./invoices.controller.js";
import { validation } from "../../middleware/validation.js";
import {
    createInvoiceSchema,
    updateInvoiceSchema,
    updateStatusSchema
} from "./invoices.validation.js";
import { allowedTo, protectedRoutes } from "../auth/auth.controller.js";
import { applyCompanyFilter } from "../../middleware/applyCompanyFilter.js";

const invoiceRouter = express.Router();

invoiceRouter.use(protectedRoutes, applyCompanyFilter);

invoiceRouter.route('/')
    .post(validation(createInvoiceSchema), allowedTo("superAdmin", "admin", "accountant"), createInvoice)
    .get(allowedTo("superAdmin", "admin", "accountant", "employee"), getAllInvoices);

invoiceRouter.get('/search', allowedTo("superAdmin", "admin", "accountant", "employee"), searchInvoices);

invoiceRouter.get('/stats', allowedTo("superAdmin", "admin", "accountant"), getInvoiceStats);

// Routes للفاتورة المحددة
invoiceRouter.route('/:id')
    .get(allowedTo("superAdmin", "admin", "accountant", "employee"), getInvoiceById)
    .put(validation(updateInvoiceSchema), allowedTo("superAdmin", "admin", "accountant"), updateInvoice)
    .delete(allowedTo("superAdmin", "admin"), deleteInvoice);

// Route لتحديث الحالة
invoiceRouter.patch('/:id/status', validation(updateStatusSchema), allowedTo("superAdmin", "admin", "accountant"), updateInvoiceStatus);

export default invoiceRouter;