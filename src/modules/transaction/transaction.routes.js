import express from "express";
import {
    createTransaction,
    getAllTransactions,
    getOne,
    updateOne,
    deleteOne,
    downloadInvoicePDF
} from "./transaction.controller.js";
import { uploadMultiFiles, ATTACHMENT_MIMETYPES } from "../../middleware/uploadFiles.js";
import { allowedTo, protectedRoutes } from "../auth/auth.controller.js";
import { applyCompanyFilter } from "../../middleware/applyCompanyFilter.js";
import { validation } from "../../middleware/validation.js";
import { transactionSchema } from "./transaction.validation.js";

const router = express.Router();

// Middleware to parse JSON fields if they are sent as strings (e.g. from FormData)
const parseJsonFields = (fields) => (req, res, next) => {
    fields.forEach(field => {
        if (req.body[field] && typeof req.body[field] === 'string') {
            try {
                req.body[field] = JSON.parse(req.body[field]);
            } catch (e) {
                // Ignore parsing errors, let validation handle it
            }
        }
    });
    next();
};

router.use(protectedRoutes, applyCompanyFilter);

// ================= SALES =================

// Sales Invoices
router.post("/sales/invoices", uploadMultiFiles(ATTACHMENT_MIMETYPES, [{ name: 'attachments', maxCount: 5 }]), parseJsonFields(['items']), validation(transactionSchema), applyCompanyFilter, allowedTo("superAdmin", "admin", "accountant"), createTransaction("sales", "invoice"));
router.get("/sales/invoices", allowedTo("superAdmin", "admin", "accountant", "employee"), getAllTransactions("sales", "invoice"));

// Sales Returns
router.post("/sales/returns", uploadMultiFiles(ATTACHMENT_MIMETYPES, [{ name: 'attachments', maxCount: 5 }]), parseJsonFields(['items']), validation(transactionSchema), applyCompanyFilter, allowedTo("superAdmin", "admin", "accountant"), createTransaction("sales", "return"));
router.get("/sales/returns", allowedTo("superAdmin", "admin", "accountant", "employee"), getAllTransactions("sales", "return"));

// Sales Quotations
router.post("/sales/quotations", uploadMultiFiles(ATTACHMENT_MIMETYPES, [{ name: 'attachments', maxCount: 5 }]), parseJsonFields(['items']), validation(transactionSchema), applyCompanyFilter, allowedTo("superAdmin", "admin", "accountant"), createTransaction("sales", "quotation"));
router.get("/sales/quotations", allowedTo("superAdmin", "admin", "accountant", "employee"), getAllTransactions("sales", "quotation"));


// ================= PURCHASES =================

// Purchase Invoices
router.post("/purchases/invoices", uploadMultiFiles(ATTACHMENT_MIMETYPES, [{ name: 'attachments', maxCount: 5 }]), parseJsonFields(['items']), validation(transactionSchema), applyCompanyFilter, allowedTo("superAdmin", "admin", "accountant"), createTransaction("purchases", "invoice"));
router.get("/purchases/invoices", allowedTo("superAdmin", "admin", "accountant", "employee"), getAllTransactions("purchases", "invoice"));

// Purchase Returns
router.post("/purchases/returns", uploadMultiFiles(ATTACHMENT_MIMETYPES, [{ name: 'attachments', maxCount: 5 }]), parseJsonFields(['items']), validation(transactionSchema), applyCompanyFilter, allowedTo("superAdmin", "admin", "accountant"), createTransaction("purchases", "return"));
router.get("/purchases/returns", allowedTo("superAdmin", "admin", "accountant", "employee"), getAllTransactions("purchases", "return"));

// Purchase Orders
router.post("/purchases/purchaseOrder", uploadMultiFiles(ATTACHMENT_MIMETYPES, [{ name: 'attachments', maxCount: 5 }]), parseJsonFields(['items']), validation(transactionSchema), applyCompanyFilter, allowedTo("superAdmin", "admin", "accountant"), createTransaction("purchases", "purchaseOrder"));
router.get("/purchases/purchaseOrder", allowedTo("superAdmin", "admin", "accountant", "employee"), getAllTransactions("purchases", "purchaseOrder"));


// Purchase Requests
router.post("/purchases/requests", uploadMultiFiles(ATTACHMENT_MIMETYPES, [{ name: 'attachments', maxCount: 5 }]), parseJsonFields(['items']), validation(transactionSchema), applyCompanyFilter, allowedTo("superAdmin", "admin", "accountant"), createTransaction("purchases", "request"));
router.get("/purchases/requests", allowedTo("superAdmin", "admin", "accountant", "employee"), getAllTransactions("purchases", "request"));


// ================= SHARED (PDF download — must be before catch-all 404) =================
router.get("/:id/download", allowedTo("superAdmin", "admin", "accountant", "employee"), downloadInvoicePDF);
router.route("/:id")
    .get(allowedTo("superAdmin", "admin", "accountant", "employee"), getOne)
    .patch(uploadMultiFiles(ATTACHMENT_MIMETYPES, [{ name: 'attachments', maxCount: 5 }]), parseJsonFields(['items']), validation(transactionSchema), allowedTo("superAdmin", "admin", "accountant"), updateOne)
    .delete(allowedTo("superAdmin", "admin"), deleteOne);

export default router;
