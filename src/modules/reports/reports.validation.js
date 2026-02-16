import Joi from "joi";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const reportQuerySchema = Joi.object({
    startDate: Joi.string().pattern(dateRegex).required().messages({
        "string.pattern.base": "startDate must be YYYY-MM-DD",
    }),
    endDate: Joi.string().pattern(dateRegex).required().messages({
        "string.pattern.base": "endDate must be YYYY-MM-DD",
    }),
    customerId: Joi.string().hex().length(24).optional().allow(""),
});

/** Optional filters for sales invoices detailed report; startDate/endDate optional — when omitted, all invoices returned */
export const salesInvoicesDetailedQuerySchema = Joi.object({
    startDate: Joi.string().pattern(dateRegex).optional().allow("").messages({
        "string.pattern.base": "startDate must be YYYY-MM-DD",
    }),
    endDate: Joi.string().pattern(dateRegex).optional().allow("").messages({
        "string.pattern.base": "endDate must be YYYY-MM-DD",
    }),
    branch: Joi.string().trim().optional().allow(""),
    client: Joi.string().trim().optional().allow(""),
    invoiceType: Joi.string().trim().optional().allow(""),
    product: Joi.string().hex().length(24).optional().allow(""),
    paymentStatus: Joi.string().trim().optional().allow(""),
    warehouse: Joi.string().trim().optional().allow(""),
    salesResponsible: Joi.string().hex().length(24).optional().allow(""),
}).unknown(true);

/** Optional filters for purchases invoices detailed report; startDate/endDate optional. */
export const purchasesInvoicesDetailedQuerySchema = Joi.object({
    startDate: Joi.string().pattern(dateRegex).optional().allow("").messages({
        "string.pattern.base": "startDate must be YYYY-MM-DD",
    }),
    endDate: Joi.string().pattern(dateRegex).optional().allow("").messages({
        "string.pattern.base": "endDate must be YYYY-MM-DD",
    }),
    branch: Joi.string().trim().optional().allow(""),
    supplier: Joi.string().trim().optional().allow(""),
    warehouse: Joi.string().trim().optional().allow(""),
    paymentStatus: Joi.string().trim().optional().allow(""),
    salesResponsible: Joi.string().hex().length(24).optional().allow(""),
    product: Joi.string().hex().length(24).optional().allow(""),
}).unknown(true);

/** Inventory summary: optional filters. */
export const inventorySummaryQuerySchema = Joi.object({
    warehouse: Joi.string().trim().optional().allow(""),
    category: Joi.string().trim().optional().allow(""),
    productsWithQuantityOnly: Joi.string().trim().optional().allow(""),
    method: Joi.string().trim().optional().allow(""),
}).unknown(true);

/** Inventory movements detailed: optional date range and filters. */
export const inventoryMovementsQuerySchema = Joi.object({
    startDate: Joi.string().pattern(dateRegex).optional().allow("").messages({
        "string.pattern.base": "startDate must be YYYY-MM-DD",
    }),
    endDate: Joi.string().pattern(dateRegex).optional().allow("").messages({
        "string.pattern.base": "endDate must be YYYY-MM-DD",
    }),
    productId: Joi.string().hex().length(24).optional().allow(""),
    warehouse: Joi.string().trim().optional().allow(""),
}).unknown(true);

/** Accounting reports: Trial Balance, Income Statement, General Ledger require date range. */
export const accountingReportQuerySchema = Joi.object({
    startDate: Joi.string().pattern(dateRegex).required().messages({
        "string.pattern.base": "startDate must be YYYY-MM-DD",
    }),
    endDate: Joi.string().pattern(dateRegex).required().messages({
        "string.pattern.base": "endDate must be YYYY-MM-DD",
    }),
    branch: Joi.string().trim().optional().allow(""),
    accountId: Joi.string().hex().length(24).optional().allow(""),
    accountCode: Joi.string().trim().optional().allow(""),
    accountCodes: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()).optional(),
}).unknown(true);

/** Balance Sheet: requires asOfDate (single date). */
export const balanceSheetQuerySchema = Joi.object({
    asOfDate: Joi.string().pattern(dateRegex).required().messages({
        "string.pattern.base": "asOfDate must be YYYY-MM-DD",
    }),
    branch: Joi.string().trim().optional().allow(""),
}).unknown(true);

/** General Ledger: optional account filter. */
export const generalLedgerQuerySchema = Joi.object({
    startDate: Joi.string().pattern(dateRegex).required().messages({
        "string.pattern.base": "startDate must be YYYY-MM-DD",
    }),
    endDate: Joi.string().pattern(dateRegex).required().messages({
        "string.pattern.base": "endDate must be YYYY-MM-DD",
    }),
    branch: Joi.string().trim().optional().allow(""),
    accountId: Joi.string().hex().length(24).optional().allow(""),
    accountCode: Joi.string().trim().optional().allow(""),
}).unknown(true);
