import express from "express";
import {
    addPayment,
    getAllPayments,
    getPaymentById,
    updatePayment,
    deletePayment,
    downloadPaymentPDF
} from "./payments.controller.js";
import { validation } from "../../middleware/validation.js";
import { paymentSchema } from "./payments.validation.js";
import { allowedTo, protectedRoutes } from "../auth/auth.controller.js";
import { applyCompanyFilter } from "../../middleware/applyCompanyFilter.js";

const router = express.Router();

router.use(protectedRoutes, applyCompanyFilter);

// ================= SALES PAYMENTS =================

router.post("/sales", validation(paymentSchema), allowedTo("superAdmin", "admin", "accountant"), addPayment("sales"));
router.get("/sales", allowedTo("superAdmin", "admin", "accountant", "employee"), getAllPayments("sales"));


// ================= PURCHASES PAYMENTS =================

router.post("/purchases", validation(paymentSchema), allowedTo("superAdmin", "admin", "accountant"), addPayment("purchases"));
router.get("/purchases", allowedTo("superAdmin", "admin", "accountant", "employee"), getAllPayments("purchases"));


// ================= SHARED =================

router.get("/:id/download", allowedTo("superAdmin", "admin", "accountant", "employee"), downloadPaymentPDF);
router.get("/:id", allowedTo("superAdmin", "admin", "accountant", "employee"), getPaymentById);
router.patch("/:id", validation(paymentSchema), allowedTo("superAdmin", "admin", "accountant"), updatePayment); // schema validation typically needed for update too? Using paymentSchema for now
router.delete("/:id", allowedTo("superAdmin", "admin"), deletePayment);

export default router;