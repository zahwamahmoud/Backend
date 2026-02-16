import { catchAsyncError } from "../../middleware/catchAsyncError.js";
import * as reportsService from "./reports.service.js";

export const getSalesSummary = catchAsyncError(async (req, res) => {
    const { startDate, endDate } = req.query;
    const companyFilter = req.companyFilter || {};
    const result = await reportsService.getSalesSummary(startDate, endDate, companyFilter);
    res.status(200).json({ message: "OK", ...result });
});

export const getSalesDetailed = catchAsyncError(async (req, res) => {
    const { startDate, endDate } = req.query;
    const companyFilter = req.companyFilter || {};
    const data = await reportsService.getSalesDetailed(startDate, endDate, companyFilter);
    res.status(200).json({ message: "OK", data });
});

export const getSalesInvoicesDetailed = catchAsyncError(async (req, res) => {
    const companyFilter = req.companyFilter || {};
    const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        branch: req.query.branch,
        client: req.query.client,
        invoiceType: req.query.invoiceType,
        product: req.query.product,
        paymentStatus: req.query.paymentStatus,
        warehouse: req.query.warehouse,
        salesResponsible: req.query.salesResponsible,
    };
    const result = await reportsService.getSalesInvoicesDetailed(filters, companyFilter);
    res.status(200).json(result);
});

export const getPaymentsSummary = catchAsyncError(async (req, res) => {
    const { startDate, endDate } = req.query;
    const companyFilter = req.companyFilter || {};
    const data = await reportsService.getPaymentsSummary(startDate, endDate, companyFilter);
    res.status(200).json({ message: "OK", data });
});

export const getPaymentsDetailed = catchAsyncError(async (req, res) => {
    const { startDate, endDate } = req.query;
    const companyFilter = req.companyFilter || {};
    const data = await reportsService.getPaymentsDetailed(startDate, endDate, companyFilter);
    res.status(200).json({ message: "OK", data });
});

export const getProfitSummary = catchAsyncError(async (req, res) => {
    const { startDate, endDate } = req.query;
    const companyFilter = req.companyFilter || {};
    const data = await reportsService.getProfitSummary(startDate, endDate, companyFilter);
    res.status(200).json({ message: "OK", data });
});

export const getProfitDetailed = catchAsyncError(async (req, res) => {
    const { startDate, endDate } = req.query;
    const companyFilter = req.companyFilter || {};
    const data = await reportsService.getProfitDetailed(startDate, endDate, companyFilter);
    res.status(200).json({ message: "OK", data });
});

export const getPurchasesSummary = catchAsyncError(async (req, res) => {
    const { startDate, endDate } = req.query;
    const companyFilter = req.companyFilter || {};
    const result = await reportsService.getPurchasesSummary(startDate, endDate, companyFilter);
    res.status(200).json({ message: "OK", ...result });
});

export const getPurchasesInvoicesDetailed = catchAsyncError(async (req, res) => {
    const companyFilter = req.companyFilter || {};
    const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        branch: req.query.branch,
        supplier: req.query.supplier,
        warehouse: req.query.warehouse,
        paymentStatus: req.query.paymentStatus,
        salesResponsible: req.query.salesResponsible,
        product: req.query.product,
    };
    const result = await reportsService.getPurchasesInvoicesDetailed(filters, companyFilter);
    res.status(200).json(result);
});

export const getPurchasesPaymentsSummary = catchAsyncError(async (req, res) => {
    const { startDate, endDate } = req.query;
    const companyFilter = req.companyFilter || {};
    const data = await reportsService.getPurchasesPaymentsSummary(startDate, endDate, companyFilter);
    res.status(200).json({ message: "OK", data });
});

export const getPurchasesPaymentsDetailed = catchAsyncError(async (req, res) => {
    const { startDate, endDate } = req.query;
    const companyFilter = req.companyFilter || {};
    const data = await reportsService.getPurchasesPaymentsDetailed(startDate, endDate, companyFilter);
    res.status(200).json({ message: "OK", data });
});

// Inventory
export const getInventorySummary = catchAsyncError(async (req, res) => {
    const companyFilter = req.companyFilter || {};
    const filters = {
        warehouse: req.query.warehouse,
        category: req.query.category,
        productsWithQuantityOnly: req.query.productsWithQuantityOnly,
        method: req.query.method,
    };
    const result = await reportsService.getInventorySummary(filters, companyFilter);
    res.status(200).json(result);
});

export const getInventoryMovementsDetailed = catchAsyncError(async (req, res) => {
    const companyFilter = req.companyFilter || {};
    const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        productId: req.query.productId,
        warehouse: req.query.warehouse,
    };
    const result = await reportsService.getInventoryMovementsDetailed(filters, companyFilter);
    res.status(200).json(result);
});

// Customers
export const getCustomersSummary = catchAsyncError(async (req, res) => {
    const { startDate, endDate, customerId } = req.query;
    const companyFilter = req.companyFilter || {};
    const result = await reportsService.getCustomersSummary(startDate, endDate, companyFilter, customerId);
    res.status(200).json({ message: "OK", ...result });
});

export const getCustomersDetailed = catchAsyncError(async (req, res) => {
    const { startDate, endDate } = req.query;
    const companyFilter = req.companyFilter || {};
    const result = await reportsService.getCustomersDetailed(startDate, endDate, companyFilter);
    res.status(200).json(result);
});

export const getClientGeneralLedger = catchAsyncError(async (req, res) => {
    const companyFilter = req.companyFilter || {};
    const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        clientId: req.query.clientId,
        branch: req.query.branch,
        journalAccount: req.query.journalAccount,
    };
    const result = await reportsService.getClientGeneralLedger(filters, companyFilter);
    res.status(200).json(result);
});

export const getAgedReceivable = catchAsyncError(async (req, res) => {
    const companyFilter = req.companyFilter || {};
    const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        clientId: req.query.clientId,
        branch: req.query.branch,
        interval: req.query.interval,
        method: req.query.method,
    };
    const result = await reportsService.getAgedReceivable(filters, companyFilter);
    res.status(200).json(result);
});

// Suppliers
export const getSuppliersSummary = catchAsyncError(async (req, res) => {
    const { startDate, endDate } = req.query;
    const companyFilter = req.companyFilter || {};
    const data = await reportsService.getSuppliersSummary(startDate, endDate, companyFilter);
    res.status(200).json({ message: "OK", data });
});

export const getSuppliersDetailed = catchAsyncError(async (req, res) => {
    const { startDate, endDate } = req.query;
    const companyFilter = req.companyFilter || {};
    const result = await reportsService.getSuppliersDetailed(startDate, endDate, companyFilter);
    res.status(200).json(result);
});

export const getSupplierGeneralLedger = catchAsyncError(async (req, res) => {
    const companyFilter = req.companyFilter || {};
    const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        supplierId: req.query.supplierId,
        branch: req.query.branch,
        journalAccount: req.query.journalAccount,
    };
    const result = await reportsService.getSupplierGeneralLedger(filters, companyFilter);
    res.status(200).json(result);
});

// Accounting Reports
export const getTrialBalance = catchAsyncError(async (req, res) => {
    const { startDate, endDate, branch, accountCodes } = req.query;
    const companyFilter = req.companyFilter || {};
    const filters = { branch, accountCodes: accountCodes ? (Array.isArray(accountCodes) ? accountCodes : [accountCodes]) : null };
    const result = await reportsService.getTrialBalance(startDate, endDate, companyFilter, filters);
    res.status(200).json(result);
});

export const getBalanceSheet = catchAsyncError(async (req, res) => {
    const { asOfDate, branch } = req.query;
    const companyFilter = req.companyFilter || {};
    const filters = { branch };
    const result = await reportsService.getBalanceSheet(asOfDate, companyFilter, filters);
    res.status(200).json(result);
});

export const getIncomeStatement = catchAsyncError(async (req, res) => {
    const { startDate, endDate, branch } = req.query;
    const companyFilter = req.companyFilter || {};
    const filters = { branch };
    const result = await reportsService.getIncomeStatement(startDate, endDate, companyFilter, filters);
    res.status(200).json(result);
});

export const getGeneralLedger = catchAsyncError(async (req, res) => {
    const { startDate, endDate, branch, accountId, accountCode } = req.query;
    const companyFilter = req.companyFilter || {};
    const filters = { branch, accountId, accountCode };
    const result = await reportsService.getGeneralLedger(startDate, endDate, companyFilter, filters);
    res.status(200).json(result);
});

export const getTaxSummary = catchAsyncError(async (req, res) => {
    const { startDate, endDate, branch } = req.query;
    const companyFilter = req.companyFilter || {};
    const filters = { branch };
    const data = await reportsService.getTaxSummary(startDate, endDate, companyFilter, filters);
    res.status(200).json({ message: "OK", data });
});

export const getTaxDetailed = catchAsyncError(async (req, res) => {
    const { startDate, endDate, branch } = req.query;
    const companyFilter = req.companyFilter || {};
    const filters = { branch };
    const data = await reportsService.getTaxDetailed(startDate, endDate, companyFilter, filters);
    res.status(200).json({ message: "OK", data });
});
