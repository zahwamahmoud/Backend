import express from "express";
import { validation } from "../../middleware/validation.js";
import { reportQuerySchema, salesInvoicesDetailedQuerySchema, purchasesInvoicesDetailedQuerySchema, inventorySummaryQuerySchema, inventoryMovementsQuerySchema, accountingReportQuerySchema, balanceSheetQuerySchema, generalLedgerQuerySchema } from "./reports.validation.js";
import { protectedRoutes } from "../auth/auth.controller.js";
import { applyCompanyFilter } from "../../middleware/applyCompanyFilter.js";
import {
    getSalesSummary,
    getSalesDetailed,
    getSalesInvoicesDetailed,
    getPaymentsSummary,
    getPaymentsDetailed,
    getProfitSummary,
    getProfitDetailed,
    getPurchasesSummary,
    getPurchasesInvoicesDetailed,
    getPurchasesPaymentsSummary,
    getPurchasesPaymentsDetailed,
    getInventorySummary,
    getInventoryMovementsDetailed,
    getCustomersSummary,
    getCustomersDetailed,
    getClientGeneralLedger,
    getAgedReceivable,
    getSuppliersSummary,
    getSuppliersDetailed,
    getSupplierGeneralLedger,
    getTrialBalance,
    getBalanceSheet,
    getIncomeStatement,
    getGeneralLedger,
    getTaxSummary,
    getTaxDetailed,
} from "./reports.controller.js";

const router = express.Router();
router.use(protectedRoutes, applyCompanyFilter);

router.get("/sales/summary", validation(reportQuerySchema), getSalesSummary);
router.get("/sales/detailed", validation(reportQuerySchema), getSalesDetailed);
router.get("/sales/invoices/detailed", validation(salesInvoicesDetailedQuerySchema), getSalesInvoicesDetailed);
router.get("/payments/summary", validation(reportQuerySchema), getPaymentsSummary);
router.get("/payments/detailed", validation(reportQuerySchema), getPaymentsDetailed);
router.get("/profit/summary", validation(reportQuerySchema), getProfitSummary);
router.get("/profit/detailed", validation(reportQuerySchema), getProfitDetailed);

router.get("/purchases/summary", validation(reportQuerySchema), getPurchasesSummary);
router.get("/purchases/invoices/detailed", validation(purchasesInvoicesDetailedQuerySchema), getPurchasesInvoicesDetailed);
router.get("/purchases/payments/summary", validation(reportQuerySchema), getPurchasesPaymentsSummary);
router.get("/purchases/payments/detailed", validation(reportQuerySchema), getPurchasesPaymentsDetailed);

router.get("/inventory/summary", validation(inventorySummaryQuerySchema), getInventorySummary);
router.get("/inventory/movements/detailed", validation(inventoryMovementsQuerySchema), getInventoryMovementsDetailed);

router.get("/customers/summary", validation(reportQuerySchema), getCustomersSummary);
router.get("/customers/detailed", validation(reportQuerySchema), getCustomersDetailed);
router.get("/customers/general-ledger", validation(reportQuerySchema), getClientGeneralLedger);
router.get("/customers/aged-receivable", validation(reportQuerySchema), getAgedReceivable);

router.get("/suppliers/summary", validation(reportQuerySchema), getSuppliersSummary);
router.get("/suppliers/detailed", validation(reportQuerySchema), getSuppliersDetailed);
router.get("/suppliers/general-ledger", validation(reportQuerySchema), getSupplierGeneralLedger);

router.get("/accounting/trial-balance", validation(accountingReportQuerySchema), getTrialBalance);
router.get("/accounting/balance-sheet", validation(balanceSheetQuerySchema), getBalanceSheet);
router.get("/accounting/income-statement", validation(accountingReportQuerySchema), getIncomeStatement);
router.get("/accounting/general-ledger", validation(generalLedgerQuerySchema), getGeneralLedger);
router.get("/accounting/tax-summary", validation(reportQuerySchema), getTaxSummary);
router.get("/accounting/tax-detailed", validation(reportQuerySchema), getTaxDetailed);

export default router;
