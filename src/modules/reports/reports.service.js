import Invoice from "../invoices/invoices.model.js";
import { returnModel as ReturnDoc } from "../returns/returns.model.js";
import Transaction from "../transaction/transaction.model.js";
import Payment from "../payments/payments.model.js";
import Contact from "../contacts/contacts.model.js";
import { productModel } from "../product/product.model.js";
import { chartOfAccountsModel } from "../chartOfAccounts/chartOfAccounts.model.js";
import { dailyRestrictionModel } from "../dailyRestrictions/dailyRestrictions.model.js";
import { stockLogModel } from "../stockLogs/stockLog.model.js";
import mongoose from "mongoose";

/**
 * Parse YYYY-MM-DD to start of day (00:00:00) and end of day (23:59:59.999) in UTC
 */
function getDateRange(startDate, endDate) {
    if (!startDate || isNaN(new Date(startDate).getTime())) {
        const now = new Date();
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    }
    if (!endDate || isNaN(new Date(endDate).getTime())) {
        const now = new Date();
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    }
    const start = new Date(startDate + "T00:00:00.000Z");
    const end = new Date(endDate + "T23:59:59.999Z");
    return { start, end };
}

/**
 * Sales summary: by month — invoices count, clients, products, إجمالي الفواتير, إجمالي المرتجعات, إجمالي خصومات المبيعات, صافي خصومات المبيعات, صافي المبيعات.
 * Uses Transaction model (sales invoices + sales returns).
 */
export async function getSalesSummary(startDate, endDate, companyFilter) {
    if (!startDate || !endDate) return [];
    const { start, end } = getDateRange(startDate, endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];
    const baseMatch = {
        ...companyFilter,
        module: "sales",
        deletedAt: { $in: [null, undefined] },
        status: { $ne: "draft" },
        issueDate: { $gte: start, $lte: end },
    };

    const invoiceMatch = { ...baseMatch, documentType: "invoice" };
    const returnMatch = { ...baseMatch, documentType: "return" };

    const monthProject = {
        $project: {
            month: { $dateToString: { format: "%m-%Y", date: "$issueDate", timezone: "UTC" } },
        },
    };
    const monthGroup = (extra) => ({
        $group: {
            _id: "$month",
            ...extra,
        },
    });

    const invByMonth = await Transaction.aggregate([
        { $match: invoiceMatch },
        monthProject,
        {
            $group: {
                _id: "$month",
                invoices: { $sum: 1 },
                clients: { $addToSet: "$contact" },
                totalInvoices: { $sum: "$totalAmount" },
                totalPaid: { $sum: "$paidAmount" },
                totalRemaining: { $sum: "$remainingAmount" },
                totalSalesDiscounts: { $sum: "$totalDiscount" },
                itemsList: { $push: "$items" },
            },
        },
    ]);

    const retByMonth = await Transaction.aggregate([
        { $match: returnMatch },
        monthProject,
        monthGroup({
            totalReturns: { $sum: "$totalAmount" },
            totalReturnsDiscounts: { $sum: "$totalDiscount" },
        }),
    ]);

    const returnMap = Object.fromEntries((retByMonth || []).map((r) => [r._id, r]));
    const months = [...new Set([...(invByMonth || []).map((r) => r._id), ...(retByMonth || []).map((r) => r._id)])].sort();

    const data = months.map((month) => {
        const inv = (invByMonth || []).find((r) => r._id === month) || {};
        const ret = returnMap[month] || {};
        const totalInvoices = Number(inv.totalInvoices ?? 0);
        const totalReturns = Number(ret.totalReturns ?? 0);
        const totalSalesDiscounts = Number(inv.totalSalesDiscounts ?? 0);
        const totalReturnsDiscounts = Number(ret.totalReturnsDiscounts ?? 0);
        const netSalesDiscounts = totalSalesDiscounts - totalReturnsDiscounts;
        const netSales = totalInvoices - totalReturns;
        const totalPaid = Number(inv.totalPaid ?? 0);
        const totalRemaining = Number(inv.totalRemaining ?? 0);
        const allItems = (inv.itemsList || []).flat();
        const productIds = allItems.map((i) => i && i.product).filter(Boolean);
        const uniqueProducts = new Set(productIds.map((p) => p.toString())).size;
        const uniqueClients = (inv.clients || []).filter(Boolean).length;
        return {
            month,
            invoices: inv.invoices ?? 0,
            clients: uniqueClients,
            products: uniqueProducts,
            totalInvoices,
            totalReturns,
            totalSalesDiscounts,
            netSalesDiscounts,
            netSales,
            totalPaid,
            totalRemaining,
        };
    });

    const grandTotals = {
        totalInvoices: data.reduce((acc, r) => acc + r.totalInvoices, 0),
        totalReturns: data.reduce((acc, r) => acc + r.totalReturns, 0),
        totalSalesDiscounts: data.reduce((acc, r) => acc + r.totalSalesDiscounts, 0),
        netSalesDiscounts: data.reduce((acc, r) => acc + r.netSalesDiscounts, 0),
        netSales: data.reduce((acc, r) => acc + r.netSales, 0),
        totalPaid: data.reduce((acc, r) => acc + r.totalPaid, 0),
        totalRemaining: data.reduce((acc, r) => acc + r.totalRemaining, 0),
    };

    return { data, grandTotals };
}

/**
 * Purchases summary: by month — invoices, returns, orders counts; suppliers; products; totalInvoices, totalReturns, totalOrders; totalPurchasesDiscounts, totalReturnsDiscounts, netPurchasesDiscounts, netPurchases.
 * Uses Transaction model (module: purchases, documentType: invoice | return | purchaseOrder).
 */
export async function getPurchasesSummary(startDate, endDate, companyFilter) {
    if (!startDate || !endDate) return [];
    const { start, end } = getDateRange(startDate, endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];
    const baseMatch = {
        ...companyFilter,
        module: "purchases",
        deletedAt: { $in: [null, undefined] },
        status: { $ne: "draft" },
        issueDate: { $gte: start, $lte: end },
    };
    const monthProject = {
        $project: {
            month: { $dateToString: { format: "%m-%Y", date: "$issueDate", timezone: "UTC" } },
        },
    };

    const invByMonth = await Transaction.aggregate([
        { $match: { ...baseMatch, documentType: "invoice" } },
        monthProject,
        {
            $group: {
                _id: "$month",
                invoices: { $sum: 1 },
                suppliers: { $addToSet: "$contact" },
                totalInvoices: { $sum: "$totalAmount" },
                totalPurchasesDiscounts: { $sum: "$totalDiscount" },
                itemsList: { $push: "$items" },
            },
        },
    ]);

    const retByMonth = await Transaction.aggregate([
        { $match: { ...baseMatch, documentType: "return" } },
        monthProject,
        {
            $group: {
                _id: "$month",
                returns: { $sum: 1 },
                totalReturns: { $sum: "$totalAmount" },
                totalReturnsDiscounts: { $sum: "$totalDiscount" },
            },
        },
    ]);

    const ordByMonth = await Transaction.aggregate([
        { $match: { ...baseMatch, documentType: "purchaseOrder" } },
        monthProject,
        {
            $group: {
                _id: "$month",
                orders: { $sum: 1 },
                totalOrders: { $sum: "$totalAmount" },
                itemsList: { $push: "$items" },
            },
        },
    ]);

    const returnMap = Object.fromEntries((retByMonth || []).map((r) => [r._id, r]));
    const orderMap = Object.fromEntries((ordByMonth || []).map((r) => [r._id, r]));
    const months = [
        ...new Set([
            ...(invByMonth || []).map((r) => r._id),
            ...(retByMonth || []).map((r) => r._id),
            ...(ordByMonth || []).map((r) => r._id),
        ]),
    ].sort();

    const data = months.map((month) => {
        const inv = (invByMonth || []).find((r) => r._id === month) || {};
        const ret = returnMap[month] || {};
        const ord = orderMap[month] || {};
        const totalInvoices = Number(inv.totalInvoices ?? 0);
        const totalReturns = Number(ret.totalReturns ?? 0);
        const totalOrders = Number(ord.totalOrders ?? 0);
        const totalPurchasesDiscounts = Number(inv.totalPurchasesDiscounts ?? 0);
        const totalReturnsDiscounts = Number(ret.totalReturnsDiscounts ?? 0);
        const netPurchasesDiscounts = totalPurchasesDiscounts - totalReturnsDiscounts;
        const netPurchases = totalInvoices - totalReturns;
        const allItems = [...(inv.itemsList || []).flat(), ...(ord.itemsList || []).flat()];
        const productIds = allItems.map((i) => i && i.product).filter(Boolean);
        const uniqueProducts = new Set(productIds.map((p) => p.toString())).size;
        const uniqueSuppliers = (inv.suppliers || []).filter(Boolean).length;
        return {
            month,
            invoices: inv.invoices ?? 0,
            returns: ret.returns ?? 0,
            orders: ord.orders ?? 0,
            suppliers: uniqueSuppliers,
            products: uniqueProducts,
            totalInvoices,
            totalReturns,
            totalOrders,
            totalPurchasesDiscounts,
            totalReturnsDiscounts,
            netPurchasesDiscounts,
            netPurchases,
        };
    });

    const grandTotals = {
        totalInvoices: data.reduce((acc, r) => acc + r.totalInvoices, 0),
        totalReturns: data.reduce((acc, r) => acc + r.totalReturns, 0),
        totalOrders: data.reduce((acc, r) => acc + r.totalOrders, 0),
        totalPurchasesDiscounts: data.reduce((acc, r) => acc + r.totalPurchasesDiscounts, 0),
        netPurchasesDiscounts: data.reduce((acc, r) => acc + r.netPurchasesDiscounts, 0),
        netPurchases: data.reduce((acc, r) => acc + r.netPurchases, 0),
    };

    return { data, grandTotals };
}

/**
 * Purchases detailed: all purchase documents (invoices, returns, purchase orders) with optional filters.
 * Returns list with _id, transactionNumber, documentType, month, supplier, amount, totalWithoutTax, discounts, date.
 */
export async function getPurchasesInvoicesDetailed(filters, companyFilter) {
    const { startDate, endDate, branch, supplier, warehouse, paymentStatus, salesResponsible, product } = filters || {};
    const query = {
        ...companyFilter,
        module: "purchases",
        documentType: { $in: ["invoice", "return", "purchaseOrder"] },
        deletedAt: { $in: [null, undefined] },
    };
    if (startDate && endDate && String(startDate).trim() && String(endDate).trim()) {
        const { start, end } = getDateRange(startDate, endDate);
        query.issueDate = { $gte: start, $lte: end };
    }
    if (warehouse && String(warehouse).trim()) query.warehouse = { $regex: String(warehouse).trim(), $options: "i" };
    if (branch && String(branch).trim()) query.warehouse = { $regex: String(branch).trim(), $options: "i" };
    if (supplier && String(supplier).trim()) {
        query.$or = [
            { "contactSnapshot.name": { $regex: String(supplier).trim(), $options: "i" } },
            { contact: supplier },
        ];
    }
    if (paymentStatus && String(paymentStatus).trim()) query.status = paymentStatus;
    if (salesResponsible && String(salesResponsible).trim()) query.createdBy = salesResponsible;
    if (product && String(product).trim()) query["items.product"] = product;

    const raw = await Transaction.find(query)
        .sort({ issueDate: -1 })
        .populate("contact", "name")
        .select("transactionNumber issueDate documentType contactSnapshot subtotal totalDiscount totalTax totalAmount status warehouse createdBy items")
        .lean();

    const data = raw.map((doc) => {
        const d = doc.issueDate ? new Date(doc.issueDate) : null;
        const month = d ? `${String(d.getUTCMonth() + 1).padStart(2, "0")}-${d.getUTCFullYear()}` : "—";
        const supplierName = doc.contact?.name ?? doc.contactSnapshot?.name ?? "—";
        const totalWithoutTax = doc.subtotal != null ? doc.subtotal : (doc.totalAmount != null && doc.totalTax != null ? doc.totalAmount - doc.totalTax : doc.totalAmount ?? 0);
        const typeLabel = doc.documentType === "invoice" ? "invoice" : doc.documentType === "return" ? "return" : "purchaseOrder";
        return {
            _id: doc._id?.toString(),
            invoiceNumber: doc.transactionNumber,
            documentType: typeLabel,
            month,
            type: typeLabel,
            supplier: supplierName,
            client: supplierName,
            amount: doc.totalAmount ?? 0,
            totalWithoutTax,
            discounts: doc.totalDiscount != null ? doc.totalDiscount : 0,
            status: doc.status,
            date: doc.issueDate,
        };
    });

    const totalAmount = data.reduce((acc, r) => acc + Number(r.amount ?? 0), 0);
    const totalWithoutTax = data.reduce((acc, r) => acc + Number(r.totalWithoutTax ?? 0), 0);
    const totalDiscount = data.reduce((acc, r) => acc + Number(r.discounts ?? 0), 0);
    return {
        success: true,
        results: data.length,
        totals: { totalAmount, totalWithoutTax, totalDiscount },
        data,
    };
}

/**
 * Purchases payments summary: total spent (purchase payments in range), total due (purchase invoices in range: sum(totalAmount - paidAmount)).
 */
export async function getPurchasesPaymentsSummary(startDate, endDate, companyFilter) {
    const { start, end } = getDateRange(startDate, endDate);
    const [spentResult] = await Payment.aggregate([
        {
            $match: {
                ...companyFilter,
                module: "purchases",
                date: { $gte: start, $lte: end },
                status: { $ne: "cancelled" },
            },
        },
        {
            $group: {
                _id: null,
                totalSpent: { $sum: { $cond: [{ $eq: ["$operationType", "spend"] }, "$amount", 0] } },
                totalReceived: { $sum: { $cond: [{ $eq: ["$operationType", "receive"] }, "$amount", 0] } }
            }
        },
    ]);
    const totalSpent = spentResult?.totalSpent ?? 0;
    const totalReceived = spentResult?.totalReceived ?? 0;

    const [dueResult] = await Transaction.aggregate([
        {
            $match: {
                ...companyFilter,
                module: "purchases",
                documentType: "invoice",
                issueDate: { $gte: start, $lte: end },
                status: { $ne: "draft" },
            },
        },
        {
            $group: {
                _id: null,
                totalDue: { $sum: { $subtract: ["$totalAmount", "$paidAmount"] } },
            },
        },
    ]);
    const totalDue = dueResult?.totalDue ?? 0;
    return { totalSpent, totalReceived, totalDue };
}

/**
 * Purchases payments detailed: supplier payment list (reference, supplier, amount, date).
 */
export async function getPurchasesPaymentsDetailed(startDate, endDate, companyFilter) {
    const { start, end } = getDateRange(startDate, endDate);
    const list = await Payment.find({
        ...companyFilter,
        module: "purchases",
        date: { $gte: start, $lte: end },
        status: { $ne: "cancelled" },
    })
        .sort({ date: -1 })
        .populate("invoice", "transactionNumber")
        .populate("contact", "name")
        .lean();
    return list.map((doc) => ({
        invoiceNumber: doc.invoice?.transactionNumber ?? doc.referenceNumber ?? "—",
        supplier: doc.contact?.name ?? "—",
        client: doc.contact?.name ?? "—",
        paymentMethod: doc.treasury === "bank" ? "bank" : "cash",
        amount: doc.amount,
        date: doc.date,
        type: doc.operationType, // 'receive' or 'spend'
    }));
}

/**
 * Sales detailed: invoice number, month, type, issue date, client, discounts, total without tax, total
 */
export async function getSalesDetailed(startDate, endDate, companyFilter) {
    const { start, end } = getDateRange(startDate, endDate);
    const list = await Invoice.find({
        ...companyFilter,
        issueDate: { $gte: start, $lte: end },
        status: { $ne: "draft" },
    })
        .sort({ issueDate: -1 })
        .select("invoiceNumber clientName total subtotal tax status issueDate invoiceDiscount")
        .lean();
    return list.map((doc) => {
        const d = doc.issueDate ? new Date(doc.issueDate) : null;
        const month = d ? `${String(d.getUTCMonth() + 1).padStart(2, "0")}-${d.getUTCFullYear()}` : "—";
        return {
            invoiceNumber: doc.invoiceNumber,
            month,
            client: doc.clientName,
            amount: doc.total,
            totalWithoutTax: doc.subtotal != null ? doc.subtotal : (doc.total != null && doc.tax != null ? doc.total - doc.tax : doc.total),
            discounts: doc.invoiceDiscount != null ? doc.invoiceDiscount : 0,
            status: doc.status,
            date: doc.issueDate,
        };
    });
}

/**
 * Sales invoices detailed (GET /reports/sales/invoices/detailed).
 * Uses the SAME Transaction model as Sales module (module: sales, documentType: invoice).
 * Filters ONLY by companyId when no query params; date range optional. No status filter that excludes new invoices.
 */
export async function getSalesInvoicesDetailed(filters, companyFilter) {
    const { startDate, endDate, branch, client, invoiceType, product, paymentStatus, warehouse, salesResponsible } = filters || {};

    const query = {
        ...companyFilter,
        module: "sales",
        documentType: "invoice",
        deletedAt: { $in: [null, undefined] },
    };

    if (startDate && endDate && String(startDate).trim() && String(endDate).trim()) {
        const { start, end } = getDateRange(startDate, endDate);
        query.issueDate = { $gte: start, $lte: end };
    }

    if (warehouse && String(warehouse).trim()) query.warehouse = { $regex: String(warehouse).trim(), $options: "i" };
    else if (branch && String(branch).trim()) query.warehouse = { $regex: String(branch).trim(), $options: "i" };
    if (client && String(client).trim()) {
        query.$or = [
            { "contactSnapshot.name": { $regex: String(client).trim(), $options: "i" } },
            { contact: client },
        ];
    }
    if (paymentStatus && String(paymentStatus).trim()) query.status = paymentStatus;
    if (salesResponsible && String(salesResponsible).trim()) query.createdBy = salesResponsible;
    if (product && String(product).trim()) query["items.product"] = product;

    const raw = await Transaction.find(query)
        .sort({ issueDate: -1 })
        .populate("contact", "name")
        .select("transactionNumber issueDate contactSnapshot subtotal totalDiscount totalTax totalAmount paidAmount remainingAmount status warehouse createdBy items")
        .lean();

    const data = raw.map((doc) => {
        const d = doc.issueDate ? new Date(doc.issueDate) : null;
        const month = d ? `${String(d.getUTCMonth() + 1).padStart(2, "0")}-${d.getUTCFullYear()}` : "—";
        const clientName = doc.contact?.name ?? doc.contactSnapshot?.name ?? "—";
        const totalWithoutTax = doc.subtotal != null ? doc.subtotal : (doc.totalAmount != null && doc.totalTax != null ? doc.totalAmount - doc.totalTax : doc.totalAmount ?? 0);
        return {
            _id: doc._id?.toString(),
            invoiceNumber: doc.transactionNumber,
            month,
            type: "invoice",
            client: clientName,
            amount: doc.totalAmount ?? 0,
            paidAmount: doc.paidAmount ?? 0,
            remainingAmount: doc.remainingAmount ?? 0,
            totalWithoutTax,
            discounts: doc.totalDiscount != null ? doc.totalDiscount : 0,
            status: doc.status,
            date: doc.issueDate,
        };
    });

    const totalAmount = data.reduce((acc, r) => acc + Number(r.amount ?? 0), 0);
    const totalWithoutTax = data.reduce((acc, r) => acc + Number(r.totalWithoutTax ?? 0), 0);
    const totalDiscount = data.reduce((acc, r) => acc + Number(r.discounts ?? 0), 0);

    console.log("[reports] getSalesInvoicesDetailed companyId:", companyFilter?.companyId ?? "(none)", "total invoices found:", raw.length, "query:", JSON.stringify(query));

    return {
        success: true,
        results: data.length,
        totals: { totalAmount, totalWithoutTax, totalDiscount },
        data,
    };
}

/**
 * Payments summary: total received (sales receive), total spent (purchase spend), total sales due, total purchase due.
 */
export async function getPaymentsSummary(startDate, endDate, companyFilter) {
    const { start, end } = getDateRange(startDate, endDate);

    // 1. Total Received (Sales)
    const [receivedResult] = await Payment.aggregate([
        {
            $match: {
                ...companyFilter,
                module: "sales",
                operationType: "receive",
                date: { $gte: start, $lte: end },
                status: { $ne: "cancelled" },
            },
        },
        { $group: { _id: null, totalReceived: { $sum: "$amount" } } },
    ]);
    const totalReceived = receivedResult?.totalReceived ?? 0;

    // 2. Total Spent (Purchases)
    const [spentResult] = await Payment.aggregate([
        {
            $match: {
                ...companyFilter,
                module: "purchases",
                operationType: "spend",
                date: { $gte: start, $lte: end },
                status: { $ne: "cancelled" },
            },
        },
        { $group: { _id: null, totalSpent: { $sum: "$amount" } } },
    ]);
    const totalSpent = spentResult?.totalSpent ?? 0;

    // 3. Total Sales Due
    const [invoiceDueResult] = await Invoice.aggregate([
        {
            $match: {
                ...companyFilter,
                issueDate: { $gte: start, $lte: end },
                status: { $ne: "draft" },
            },
        },
        {
            $group: {
                _id: null,
                totalDue: { $sum: { $subtract: ["$total", "$paidAmount"] } },
            },
        },
    ]);
    const totalInvoiceDue = invoiceDueResult?.totalDue ?? 0;

    const [transactionSalesDueResult] = await Transaction.aggregate([
        {
            $match: {
                ...companyFilter,
                module: "sales",
                documentType: "invoice",
                issueDate: { $gte: start, $lte: end },
                status: { $ne: "draft" },
                deletedAt: { $in: [null, undefined] },
            },
        },
        {
            $group: {
                _id: null,
                totalDue: { $sum: { $subtract: ["$totalAmount", "$paidAmount"] } },
            },
        },
    ]);
    const totalTransactionSalesDue = transactionSalesDueResult?.totalDue ?? 0;
    const totalSalesDue = totalInvoiceDue + totalTransactionSalesDue;

    const purchasesDueArr = await Transaction.aggregate([
        {
            $match: {
                ...companyFilter,
                module: "purchases",
                documentType: "invoice",
                issueDate: { $gte: start, $lte: end },
                status: { $ne: "draft" },
            },
        },
        {
            $group: {
                _id: null,
                totalDue: { $sum: { $subtract: ["$totalAmount", "$paidAmount"] } },
            },
        },
    ]);
    const totalPurchasesDue = purchasesDueArr[0]?.totalDue ?? 0;

    return { totalReceived, totalSpent, totalSalesDue, totalPurchasesDue };
}

/**
 * Payments detailed: invoice number, client/supplier, type (receive/spend), payment method, amount, date
 */
export async function getPaymentsDetailed(startDate, endDate, companyFilter) {
    const { start, end } = getDateRange(startDate, endDate);
    const list = await Payment.find({
        ...companyFilter,
        date: { $gte: start, $lte: end },
        status: { $ne: "cancelled" },
    })
        .sort({ date: -1 })
        .populate("invoice", "transactionNumber")
        .populate("contact", "name")
        .lean();

    return list.map((doc) => ({
        invoiceNumber: doc.invoice?.transactionNumber ?? doc.referenceNumber ?? "—",
        client: doc.contact?.name ?? "—",
        paymentMethod: doc.treasury === "bank" ? "bank" : "cash",
        amount: doc.amount,
        date: doc.date,
        type: doc.operationType, // 'receive' or 'spend'
    }));
}

/**
 * Profit summary: total profit = total sales - total cost (cost from product purchasePrice * quantity per invoice item)
 */
export async function getProfitSummary(startDate, endDate, companyFilter) {
    const { start, end } = getDateRange(startDate, endDate);
    const invoices = await Invoice.find({
        ...companyFilter,
        issueDate: { $gte: start, $lte: end },
        status: { $ne: "draft" },
    })
        .select("total items")
        .lean();
    let totalSales = 0;
    let totalCost = 0;
    const productIds = [...new Set(invoices.flatMap((inv) => inv.items || []).map((i) => i.productId).filter(Boolean))];
    const products = await productModel.find({ _id: { $in: productIds } }).select("purchasePrice").lean();
    const costByProduct = Object.fromEntries(products.map((p) => [p._id.toString(), p.purchasePrice ?? 0]));

    for (const inv of invoices) {
        totalSales += inv.total ?? 0;
        for (const item of inv.items || []) {
            const costPerUnit = item.productId ? costByProduct[item.productId.toString()] ?? 0 : 0;
            totalCost += (item.quantity ?? 0) * costPerUnit;
        }
    }
    const totalProfit = totalSales - totalCost;
    return { totalSales, totalCost, totalProfit };
}

/**
 * Profit detailed: per invoice - sales amount, cost, net profit
 */
export async function getProfitDetailed(startDate, endDate, companyFilter) {
    const { start, end } = getDateRange(startDate, endDate);
    const invoices = await Invoice.find({
        ...companyFilter,
        issueDate: { $gte: start, $lte: end },
        status: { $ne: "draft" },
    })
        .select("invoiceNumber total items")
        .lean();
    const productIds = [...new Set(invoices.flatMap((inv) => inv.items || []).map((i) => i.productId).filter(Boolean))];
    const products = await productModel.find({ _id: { $in: productIds } }).select("purchasePrice").lean();
    const costByProduct = Object.fromEntries(products.map((p) => [p._id.toString(), p.purchasePrice ?? 0]));

    const detailed = [];
    for (const inv of invoices) {
        let cost = 0;
        for (const item of inv.items || []) {
            const costPerUnit = item.productId ? costByProduct[item.productId.toString()] ?? 0 : 0;
            cost += (item.quantity ?? 0) * costPerUnit;
        }
        const salesAmount = inv.total ?? 0;
        detailed.push({
            invoiceNumber: inv.invoiceNumber,
            salesAmount,
            cost,
            netProfit: salesAmount - cost,
        });
    }
    return detailed;
}

// ========== CUSTOMERS REPORTS ==========

/**
 * Customers summary: total invoices, total returns, total payments received, total outstanding
 */
export async function getCustomersSummary(startDate, endDate, companyFilter, customerId) {
    const { start, end } = getDateRange(startDate, endDate);

    // Normalize companyFilter to ensure companyId is an ObjectId for aggregation
    const matchCompany = { ...companyFilter };
    if (matchCompany.companyId && typeof matchCompany.companyId === 'string') {
        matchCompany.companyId = new mongoose.Types.ObjectId(matchCompany.companyId);
    }

    const commonMatch = {
        ...matchCompany,
        issueDate: { $gte: start, $lte: end },
        status: { $ne: "draft" },
        deletedAt: { $in: [null, undefined] },
    };

    if (customerId && customerId !== 'all') {
        const cid = new mongoose.Types.ObjectId(customerId);

        // 1. Total Invoices
        const txnInvoiceResult = await Transaction.aggregate([
            { $match: { ...commonMatch, module: "sales", documentType: "invoice", contact: cid } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } },
        ]);
        const accInvoiceResult = await Invoice.aggregate([
            { $match: { ...commonMatch, clientId: cid } },
            { $group: { _id: null, total: { $sum: "$total" } } },
        ]);
        const totalInvoices = (txnInvoiceResult[0]?.total ?? 0) + (accInvoiceResult[0]?.total ?? 0);

        // 2. Total Returns
        const txnReturnResult = await Transaction.aggregate([
            { $match: { ...commonMatch, module: "sales", documentType: "return", contact: cid } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } },
        ]);
        const accReturnResult = await ReturnDoc.aggregate([
            {
                $match: {
                    ...matchCompany,
                    date: { $gte: start, $lte: end },
                    status: { $nin: ["Rejected", "cancelled"] }
                }
            },
            { $lookup: { from: "invoices", localField: "invoice", foreignField: "_id", as: "inv" } },
            { $unwind: "$inv" },
            { $match: { "inv.clientId": cid } },
            { $group: { _id: null, total: { $sum: "$totalRefundAmount" } } },
        ]);
        const totalReturns = (txnReturnResult[0]?.total ?? 0) + (accReturnResult[0]?.total ?? 0);

        // 3. Total Payments Received
        const pyMatch = {
            ...matchCompany,
            module: "sales",
            operationType: "receive",
            date: { $gte: start, $lte: end },
            status: { $ne: "cancelled" },
            deletedAt: { $in: [null, undefined] },
            contact: cid
        };
        const [paymentsResult] = await Payment.aggregate([
            { $match: pyMatch },
            { $group: { _id: null, total: { $sum: "$amount" } } },
        ]);
        const totalPaid = paymentsResult?.total ?? 0;

        return {
            totalInvoices,
            totalReturns,
            totalPaid,
            outstandingAmount: totalInvoices - totalReturns - totalPaid
        };
    } else {
        // --- ALL CUSTOMERS ---
        const txnInvoiceResult = await Transaction.aggregate([
            { $match: { ...commonMatch, module: "sales", documentType: "invoice" } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } },
        ]);
        const accInvoiceResult = await Invoice.aggregate([
            { $match: commonMatch },
            { $group: { _id: null, total: { $sum: "$total" } } },
        ]);
        const totalInvoices = (txnInvoiceResult[0]?.total ?? 0) + (accInvoiceResult[0]?.total ?? 0);

        const txnReturnResult = await Transaction.aggregate([
            { $match: { ...commonMatch, module: "sales", documentType: "return" } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } },
        ]);
        const accReturnResult = await ReturnDoc.aggregate([
            {
                $match: {
                    ...matchCompany,
                    date: { $gte: start, $lte: end },
                    status: { $nin: ["Rejected", "cancelled"] }
                }
            },
            { $group: { _id: null, total: { $sum: "$totalRefundAmount" } } },
        ]);
        const totalReturns = (txnReturnResult[0]?.total ?? 0) + (accReturnResult[0]?.total ?? 0);

        const [paymentsResult] = await Payment.aggregate([
            {
                $match: {
                    ...matchCompany,
                    module: "sales",
                    operationType: "receive",
                    date: { $gte: start, $lte: end },
                    status: { $ne: "cancelled" },
                    deletedAt: { $in: [null, undefined] }
                }
            },
            { $group: { _id: null, total: { $sum: "$amount" } } },
        ]);
        const totalPaid = paymentsResult?.total ?? 0;

        return {
            totalInvoices,
            totalReturns,
            totalPaid,
            outstandingAmount: totalInvoices - totalReturns - totalPaid
        };
    }
}

/**
 * Customers detailed: per customer - total invoices, total returns, total paid, outstanding
 */
export async function getCustomersDetailed(startDate, endDate, companyFilter) {
    const { start, end } = getDateRange(startDate, endDate);

    // Normalize companyFilter
    const matchCompany = { ...companyFilter };
    if (matchCompany.companyId && typeof matchCompany.companyId === 'string') {
        matchCompany.companyId = new mongoose.Types.ObjectId(matchCompany.companyId);
    }

    const commonMatch = {
        ...matchCompany,
        issueDate: { $gte: start, $lte: end },
        status: { $ne: "draft" },
        deletedAt: { $in: [null, undefined] },
    };

    // 1. Total Invoices per Customer (Transaction + Invoice)
    const txnInvoices = await Transaction.aggregate([
        { $match: { ...commonMatch, module: "sales", documentType: "invoice" } },
        { $group: { _id: "$contact", total: { $sum: "$totalAmount" } } },
    ]);

    const accInvoices = await Invoice.aggregate([
        { $match: { ...commonMatch } }, // Invoice uses clientId, but for "all" we don't match clientId yet
        { $group: { _id: "$clientId", total: { $sum: "$total" } } },
    ]);

    // 2. Total Returns per Customer (Transaction + ReturnDoc)
    const txnReturns = await Transaction.aggregate([
        { $match: { ...commonMatch, module: "sales", documentType: "return" } },
        { $group: { _id: "$contact", total: { $sum: "$totalAmount" } } },
    ]);

    const accReturns = await ReturnDoc.aggregate([
        {
            $match: {
                ...matchCompany,
                date: { $gte: start, $lte: end },
                status: { $nin: ["Rejected", "cancelled"] }
            }
        },
        { $lookup: { from: "invoices", localField: "invoice", foreignField: "_id", as: "inv" } },
        { $unwind: "$inv" },
        { $group: { _id: "$inv.clientId", total: { $sum: "$totalRefundAmount" } } },
    ]);

    // 3. Total Payments Received per Customer
    const txnPayments = await Payment.aggregate([
        {
            $match: {
                ...matchCompany,
                module: "sales",
                operationType: "receive",
                date: { $gte: start, $lte: end },
                status: { $ne: "cancelled" },
                deletedAt: { $in: [null, undefined] }
            }
        },
        { $group: { _id: "$contact", total: { $sum: "$amount" } } },
    ]);

    // Build Maps
    const combine = (arr, map = {}) => {
        arr.forEach(r => {
            if (!r._id) return;
            const id = r._id.toString();
            map[id] = (map[id] || 0) + (r.total || r.totalInvoices || r.totalReturns || r.totalPaid || 0);
        });
        return map;
    };

    const invoicesMap = {};
    combine(txnInvoices, invoicesMap);
    combine(accInvoices, invoicesMap);

    const returnsMap = {};
    combine(txnReturns, returnsMap);
    combine(accReturns, returnsMap);

    const paymentsMap = {};
    combine(txnPayments, paymentsMap);

    // Fetch ALL customers
    const customers = await Contact.find({
        ...matchCompany,
        module: "customer",
        deletedAt: { $in: [null, undefined] },
    }).select("name code").sort({ name: 1 }).lean();

    const data = customers.map(customer => {
        const cid = customer._id.toString();
        const totalInvoices = invoicesMap[cid] ?? 0;
        const totalReturns = returnsMap[cid] ?? 0;
        const totalPaid = paymentsMap[cid] ?? 0;

        return {
            customerId: cid,
            customerName: customer.name ?? "—",
            code: customer.code ?? "—",
            totalInvoices,
            totalReturns,
            totalPaid,
            outstanding: totalInvoices - totalReturns - totalPaid,
        };
    });

    return {
        success: true,
        results: data.length,
        data,
    };
}

/**
 * Client General Ledger: All transactions (invoices, returns, payments) for a specific client
 */
export async function getClientGeneralLedger(filters, companyFilter) {
    const { startDate, endDate, clientId, branch, journalAccount } = filters || {};

    const matchCompany = { ...companyFilter };
    if (matchCompany.companyId && typeof matchCompany.companyId === 'string') {
        matchCompany.companyId = new mongoose.Types.ObjectId(matchCompany.companyId);
    }

    const { start, end } = getDateRange(startDate, endDate);
    const cid = (clientId && clientId !== 'unspecified' && clientId !== 'all') ? new mongoose.Types.ObjectId(clientId) : null;

    const commonMatch = {
        ...matchCompany,
        issueDate: { $gte: start, $lte: end },
        status: { $ne: "draft" },
        deletedAt: { $in: [null, undefined] },
    };

    if (cid) commonMatch.contact = cid; // Transaction uses 'contact'

    // 1. Transactions (Sales Invoice / Return)
    const transactions = await Transaction.find(commonMatch)
        .populate("contact", "name code")
        .sort({ issueDate: 1 })
        .lean();

    // 2. Invoices (Invoice Model)
    const invoiceMatch = {
        ...matchCompany,
        issueDate: { $gte: start, $lte: end },
        status: { $ne: "draft" },
        deletedAt: { $in: [null, undefined] },
    };
    if (cid) invoiceMatch.clientId = cid;
    const accInvoices = await Invoice.find(invoiceMatch)
        .populate("clientId", "name code")
        .sort({ issueDate: 1 })
        .lean();

    // 3. Returns (ReturnDoc Model)
    // We need to filter by customer via lookup or simple match if it were there, 
    // but ReturnDoc usually references Invoice.
    let accReturns = [];
    const returnMatch = {
        ...matchCompany,
        date: { $gte: start, $lte: end },
        status: { $nin: ["Rejected", "cancelled"] }
    };
    const returnDocs = await ReturnDoc.find(returnMatch)
        .populate({
            path: "invoice",
            match: cid ? { clientId: cid } : {}
        })
        .lean();

    // Filter out if customer didn't match after populate
    accReturns = returnDocs.filter(rd => rd.invoice);

    // 4. Payments
    const paymentMatch = {
        ...matchCompany,
        module: "sales",
        operationType: "receive",
        status: { $ne: "cancelled" },
        date: { $gte: start, $lte: end },
        deletedAt: { $in: [null, undefined] }
    };
    if (cid) paymentMatch.contact = cid;
    const payments = await Payment.find(paymentMatch)
        .populate("contact", "name code")
        .sort({ date: 1 })
        .lean();

    // Combine and format
    const entries = [];

    // Map Transactions
    transactions.forEach(txn => {
        const type = txn.documentType === 'invoice' ? 'invoice' : 'return';
        entries.push({
            documentId: txn._id?.toString(),
            date: txn.issueDate,
            type,
            documentNumber: txn.transactionNumber,
            description: txn.notes || (type === 'invoice' ? 'Invoice' : 'Return'),
            debit: type === 'invoice' ? txn.totalAmount : 0,
            credit: type === 'return' ? txn.totalAmount : 0,
            customerName: txn.contact?.name || txn.contactSnapshot?.name || '—',
            journalAccount: journalAccount || '—',
        });
    });

    // Map Invoices
    accInvoices.forEach(inv => {
        entries.push({
            documentId: inv._id?.toString(),
            date: inv.issueDate,
            type: 'invoice',
            documentNumber: inv.invoiceNumber,
            description: inv.notes || 'Invoice',
            debit: inv.total || 0,
            credit: 0,
            customerName: inv.clientId?.name || '—',
            journalAccount: journalAccount || '—',
        });
    });

    // Map Returns
    accReturns.forEach(ret => {
        entries.push({
            documentId: ret._id?.toString(),
            date: ret.date,
            type: 'return',
            documentNumber: ret.returnNumber || `RET-${ret._id.toString().slice(-6)}`,
            description: ret.notes || (ret.reason ?? 'Return'),
            debit: 0,
            credit: ret.totalRefundAmount || 0,
            customerName: ret.invoice?.clientId?.name || '—',
            journalAccount: journalAccount || '—',
        });
    });

    // Map Payments
    payments.forEach(payment => {
        entries.push({
            documentId: payment._id?.toString(),
            date: payment.date,
            type: 'payment',
            documentNumber: payment.referenceNumber || `PY-${payment._id.toString().slice(-6)}`,
            description: payment.notes || 'Payment',
            debit: 0,
            credit: payment.amount,
            customerName: payment.contact?.name || '—',
            journalAccount: journalAccount || '—',
        });
    });

    // Sort by date and calculate running balance
    entries.sort((a, b) => new Date(a.date) - new Date(b.date));

    let runningBalance = 0;
    let totalDebit = 0;
    let totalCredit = 0;

    entries.forEach(entry => {
        runningBalance += (entry.debit || 0) - (entry.credit || 0);
        entry.balance = runningBalance;
        totalDebit += entry.debit || 0;
        totalCredit += entry.credit || 0;
    });

    return {
        success: true,
        results: entries.length,
        data: entries,
        totals: {
            totalDebit,
            totalCredit,
            finalBalance: runningBalance,
        },
    };
}

/**
 * Aged Receivable: Group invoices by aging periods
 */
export async function getAgedReceivable(filters, companyFilter) {
    const { startDate, endDate, clientId, branch, interval = 30, method = 'invoices', journalAccount } = filters || {};
    const intervalDays = parseInt(interval) || 30;

    const baseMatch = {
        ...companyFilter,
        module: "sales",
        documentType: method === 'invoices' ? "invoice" : "invoice",
        deletedAt: { $in: [null, undefined] },
        status: { $ne: "draft" },
    };

    if (startDate && endDate && String(startDate).trim() && String(endDate).trim()) {
        const { start, end } = getDateRange(startDate, endDate);
        baseMatch.issueDate = { $gte: start, $lte: end };
    }

    if (clientId && String(clientId).trim() && clientId !== 'unspecified') {
        baseMatch.contact = clientId;
    }

    if (branch && String(branch).trim() && branch !== 'all') {
        baseMatch.warehouse = { $regex: String(branch).trim(), $options: "i" };
    }

    // 1. Transactions (Sales Invoice)
    const txnInvoices = await Transaction.find(baseMatch)
        .populate("contact", "name code")
        .sort({ issueDate: 1 })
        .lean();

    // 2. Invoices (Invoice Model)
    const invMatch = {
        ...companyFilter,
        issueDate: baseMatch.issueDate,
        status: { $ne: "draft" },
        deletedAt: { $in: [null, undefined] },
    };
    if (clientId && String(clientId).trim() && clientId !== 'unspecified') {
        invMatch.clientId = clientId;
    }
    const accInvoices = await Invoice.find(invMatch)
        .populate("clientId", "name code")
        .sort({ issueDate: 1 })
        .lean();

    const allMatchedInvoices = [
        ...txnInvoices.map(ti => ({
            ...ti,
            _id: ti._id.toString(),
            total: ti.totalAmount,
            paid: ti.paidAmount,
            date: ti.issueDate,
            customer: ti.contact
        })),
        ...accInvoices.map(ai => ({
            ...ai,
            _id: ai._id.toString(),
            total: ai.total,
            paid: ai.paidAmount,
            date: ai.issueDate,
            customer: ai.clientId
        }))
    ];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const agedData = allMatchedInvoices.map(inv => {
        const invoiceDate = new Date(inv.date);
        invoiceDate.setHours(0, 0, 0, 0);
        const daysDiff = Math.floor((today - invoiceDate) / (1000 * 60 * 60 * 24));

        const outstanding = (inv.total || 0) - (inv.paid || 0);

        let todayAmount = 0;
        let day1_30 = 0;
        let day31_60 = 0;
        let day61_90 = 0;
        let day91Plus = 0;

        if (daysDiff < 0) {
            todayAmount = outstanding;
        } else if (daysDiff === 0) {
            todayAmount = outstanding;
        } else if (daysDiff <= intervalDays) {
            day1_30 = outstanding;
        } else if (daysDiff <= intervalDays * 2) {
            day31_60 = outstanding;
        } else if (daysDiff <= intervalDays * 3) {
            day61_90 = outstanding;
        } else {
            day91Plus = outstanding;
        }

        return {
            customerId: inv.customer?._id?.toString() || inv.customer?.toString(),
            customerName: inv.customer?.name || '—',
            journalAccount: journalAccount && journalAccount !== 'all' ? journalAccount : '—',
            today: todayAmount,
            day1_30,
            day31_60,
            day61_90,
            day91Plus,
            total: outstanding,
        };
    });

    // Group by customer and journal account
    const grouped = {};
    agedData.forEach(item => {
        const key = `${item.customerId}_${item.journalAccount}`;
        if (!grouped[key]) {
            grouped[key] = {
                customerId: item.customerId,
                customerName: item.customerName,
                journalAccount: item.journalAccount,
                today: 0,
                day1_30: 0,
                day31_60: 0,
                day61_90: 0,
                day91Plus: 0,
                total: 0,
            };
        }
        grouped[key].today += item.today;
        grouped[key].day1_30 += item.day1_30;
        grouped[key].day31_60 += item.day31_60;
        grouped[key].day61_90 += item.day61_90;
        grouped[key].day91Plus += item.day91Plus;
        grouped[key].total += item.total;
    });

    const result = Object.values(grouped);

    return {
        success: true,
        results: result.length,
        data: result,
    };
}

// ========== SUPPLIERS REPORTS ==========

/**
 * Supplier General Ledger (Account Statement): All transactions (invoices, returns, payments) for a supplier
 */
export async function getSupplierGeneralLedger(filters, companyFilter) {
    const { startDate, endDate, supplierId, branch, journalAccount } = filters || {};

    const baseMatch = {
        ...companyFilter,
        module: "purchases",
        deletedAt: { $in: [null, undefined] },
        status: { $ne: "draft" },
    };

    if (startDate && endDate && String(startDate).trim() && String(endDate).trim()) {
        const { start, end } = getDateRange(startDate, endDate);
        baseMatch.issueDate = { $gte: start, $lte: end };
    }

    if (supplierId && String(supplierId).trim() && supplierId !== 'unspecified') {
        baseMatch.contact = supplierId;
    }

    if (branch && String(branch).trim() && branch !== 'all') {
        baseMatch.warehouse = { $regex: String(branch).trim(), $options: "i" };
    }

    const transactions = await Transaction.find(baseMatch)
        .populate("contact", "name code")
        .sort({ issueDate: 1 })
        .lean();

    const paymentMatch = {
        ...companyFilter,
        module: "purchases",
        operationType: "spend",
        status: { $ne: "cancelled" },
    };

    if (startDate && endDate && String(startDate).trim() && String(endDate).trim()) {
        const { start, end } = getDateRange(startDate, endDate);
        paymentMatch.date = { $gte: start, $lte: end };
    }

    if (supplierId && String(supplierId).trim() && supplierId !== 'unspecified') {
        paymentMatch.contact = supplierId;
    }

    const payments = await Payment.find(paymentMatch)
        .populate("contact", "name code")
        .sort({ date: 1 })
        .lean();

    const entries = [];

    transactions.forEach(txn => {
        const type = txn.documentType === 'invoice' ? 'invoice' : 'return';
        entries.push({
            documentId: txn._id?.toString(),
            date: txn.issueDate,
            type,
            documentNumber: txn.transactionNumber,
            description: txn.notes || (type === 'invoice' ? 'Invoice' : 'Return'),
            debit: type === 'invoice' ? txn.totalAmount : 0,
            credit: type === 'return' ? txn.totalAmount : 0,
            balance: 0,
            supplierName: txn.contact?.name || txn.contactSnapshot?.name || '—',
            journalAccount: journalAccount || '—',
        });
    });

    payments.forEach(payment => {
        entries.push({
            documentId: payment._id?.toString(),
            date: payment.date,
            type: 'payment',
            documentNumber: payment.referenceNumber || payment._id.toString(),
            description: payment.notes || 'Payment',
            debit: 0,
            credit: payment.amount,
            balance: 0,
            supplierName: payment.contact?.name || '—',
            journalAccount: journalAccount || '—',
        });
    });

    entries.sort((a, b) => new Date(a.date) - new Date(b.date));
    let runningBalance = 0;
    let totalDebit = 0;
    let totalCredit = 0;
    entries.forEach(entry => {
        runningBalance += entry.debit - entry.credit;
        entry.balance = runningBalance;
        totalDebit += entry.debit || 0;
        totalCredit += entry.credit || 0;
    });

    return {
        success: true,
        results: entries.length,
        data: entries,
        totals: {
            totalDebit,
            totalCredit,
            finalBalance: runningBalance,
        },
    };
}

/**
 * Suppliers summary: total purchases, total returns, total payments spent, total outstanding
 */
export async function getSuppliersSummary(startDate, endDate, companyFilter) {
    const { start, end } = getDateRange(startDate, endDate);

    // Total purchases (purchase invoices)
    const [purchasesResult] = await Transaction.aggregate([
        {
            $match: {
                ...companyFilter,
                module: "purchases",
                documentType: "invoice",
                issueDate: { $gte: start, $lte: end },
                status: { $ne: "draft" },
                deletedAt: { $in: [null, undefined] },
            },
        },
        { $group: { _id: null, totalPurchases: { $sum: "$totalAmount" } } },
    ]);
    const totalPurchases = purchasesResult?.totalPurchases ?? 0;

    // Total returns (purchase returns)
    const [returnsResult] = await Transaction.aggregate([
        {
            $match: {
                ...companyFilter,
                module: "purchases",
                documentType: "return",
                issueDate: { $gte: start, $lte: end },
                status: { $ne: "draft" },
                deletedAt: { $in: [null, undefined] },
            },
        },
        { $group: { _id: null, totalReturns: { $sum: "$totalAmount" } } },
    ]);
    const totalReturns = returnsResult?.totalReturns ?? 0;

    // Total payments spent
    const [paymentsResult] = await Payment.aggregate([
        {
            $match: {
                ...companyFilter,
                module: "purchases",
                operationType: "spend",
                date: { $gte: start, $lte: end },
                status: { $ne: "cancelled" },
            },
        },
        { $group: { _id: null, totalPaymentsSpent: { $sum: "$amount" } } },
    ]);
    const totalPaymentsSpent = paymentsResult?.totalPaymentsSpent ?? 0;

    // Total outstanding = purchases - returns - payments
    const totalOutstanding = totalPurchases - totalReturns - totalPaymentsSpent;

    return { totalPurchases, totalReturns, totalPaymentsSpent, totalOutstanding };
}

/**
 * Suppliers detailed: per supplier - total purchases, total returns, total paid, outstanding
 */
export async function getSuppliersDetailed(startDate, endDate, companyFilter) {
    const { start, end } = getDateRange(startDate, endDate);

    // Aggregate purchases per supplier
    const purchasesBySupplier = await Transaction.aggregate([
        {
            $match: {
                ...companyFilter,
                module: "purchases",
                documentType: "invoice",
                issueDate: { $gte: start, $lte: end },
                status: { $ne: "draft" },
                deletedAt: { $in: [null, undefined] },
            },
        },
        {
            $group: {
                _id: "$contact",
                totalPurchases: { $sum: "$totalAmount" },
            },
        },
    ]);

    // Aggregate returns per supplier
    const returnsBySupplier = await Transaction.aggregate([
        {
            $match: {
                ...companyFilter,
                module: "purchases",
                documentType: "return",
                issueDate: { $gte: start, $lte: end },
                status: { $ne: "draft" },
                deletedAt: { $in: [null, undefined] },
            },
        },
        {
            $group: {
                _id: "$contact",
                totalReturns: { $sum: "$totalAmount" },
            },
        },
    ]);

    // Aggregate payments per supplier
    const paymentsBySupplier = await Payment.aggregate([
        {
            $match: {
                ...companyFilter,
                module: "purchases",
                operationType: "spend",
                date: { $gte: start, $lte: end },
                status: { $ne: "cancelled" },
            },
        },
        {
            $group: {
                _id: "$contact",
                totalPaid: { $sum: "$amount" },
            },
        },
    ]);

    // Build maps for quick lookup (from transactions in date range)
    const purchasesMap = Object.fromEntries(purchasesBySupplier.map(r => [r._id?.toString(), r.totalPurchases ?? 0]));
    const returnsMap = Object.fromEntries(returnsBySupplier.map(r => [r._id?.toString(), r.totalReturns ?? 0]));
    const paymentsMap = Object.fromEntries(paymentsBySupplier.map(r => [r._id?.toString(), r.totalPaid ?? 0]));

    // Fetch ALL suppliers for the company (Contact module is "supplier").
    // New suppliers without any transactions appear with zeros; no date/transaction filter on the list.
    const supplierFilter = {
        ...companyFilter,
        module: "supplier",
        deletedAt: { $in: [null, undefined] },
    };
    const suppliers = await Contact.find(supplierFilter).select("name code").sort({ name: 1 }).lean();

    // Build result: every supplier gets a row (zeros if no transactions in range)
    const data = suppliers.map(supplier => {
        const supplierId = supplier._id.toString();
        const totalPurchases = purchasesMap[supplierId] ?? 0;
        const totalReturns = returnsMap[supplierId] ?? 0;
        const totalPaid = paymentsMap[supplierId] ?? 0;
        const outstanding = totalPurchases - totalReturns - totalPaid;

        return {
            supplierId: supplierId,
            supplierName: supplier.name ?? "—",
            code: supplier.code ?? "—",
            totalPurchases,
            totalReturns,
            totalPaid,
            outstanding,
        };
    });

    return {
        success: true,
        results: data.length,
        data,
    };
}

// ========== INVENTORY REPORTS ==========

/**
 * Inventory summary: product stock levels, values, and availability
 */
export async function getInventorySummary(filters, companyFilter) {
    const { warehouse, category, productsWithQuantityOnly, method } = filters || {};

    const query = {
        ...companyFilter,
        deletedAt: { $in: [null, undefined] },
        type: "tracked" // Only tracked products have inventory
    };

    if (warehouse && warehouse !== "all") {
        query.warehouse = { $regex: String(warehouse).trim(), $options: "i" };
    }
    if (category && category !== "all") {
        query.category = { $regex: String(category).trim(), $options: "i" };
    }
    if (productsWithQuantityOnly === "true" || productsWithQuantityOnly === true) {
        query.stockQuantity = { $gt: 0 };
    }

    const products = await productModel.find(query)
        .select("name code stockQuantity purchasePrice averageCost sellingPrice warehouse category")
        .sort({ name: 1 })
        .lean();

    const data = products.map(product => {
        const quantity = product.stockQuantity ?? 0;

        // Define cost based on selection method
        let unitCost = 0;
        if (method === "purchase_price") {
            unitCost = product.purchasePrice ?? 0;
        } else {
            // Default to average_cost
            unitCost = product.averageCost ?? product.purchasePrice ?? 0;
        }

        const inventoryValue = quantity * unitCost;
        const potentialSalesValue = quantity * (product.sellingPrice ?? 0);
        const potentialProfit = potentialSalesValue - inventoryValue;

        return {
            productId: product._id.toString(),
            productName: product.name ?? "—",
            code: product.code ?? "—",
            quantity,
            unitCost,
            inventoryValue,
            sellingPrice: product.sellingPrice ?? 0,
            potentialSalesValue,
            potentialProfit,
            warehouse: product.warehouse ?? "—",
            category: product.category ?? "—",
        };
    });

    const totals = data.reduce((acc, item) => {
        acc.totalQuantity += item.quantity;
        acc.totalInventoryValue += item.inventoryValue;
        acc.totalSalesValue += item.potentialSalesValue;
        acc.totalProfit += item.potentialProfit;
        return acc;
    }, { totalQuantity: 0, totalInventoryValue: 0, totalSalesValue: 0, totalProfit: 0 });

    return {
        success: true,
        results: data.length,
        totals,
        data,
    };
}

/**
 * Inventory movements detailed: stock in/out movements from StockLog
 */
export async function getInventoryMovementsDetailed(filters, companyFilter) {
    const { startDate, endDate, productId, product, warehouse } = filters || {};

    const query = {
        ...companyFilter,
    };

    if (startDate && endDate && String(startDate).trim() && String(endDate).trim()) {
        const { start, end } = getDateRange(startDate, endDate);
        query.createdAt = { $gte: start, $lte: end };
    }
    const effectiveProductId = productId || product;
    if (effectiveProductId) {
        query.product = effectiveProductId;
    }

    const logs = await stockLogModel.find(query)
        .sort({ createdAt: -1 })
        .populate("product", "name code")
        .populate({
            path: 'permission',
            select: 'transactionNumber number module documentType type warehouse'
        })
        .lean();

    const movements = logs.map(log => {
        // If it's a Transaction, use transactionNumber; if Requisition, use number
        const docNumber = log.permission?.transactionNumber || log.permission?.number || "—";
        const docType = log.permission?.documentType || log.permission?.type || "movement";

        return {
            date: log.createdAt,
            documentNumber: docNumber,
            docType: docType,
            productName: log.product?.name ?? "—",
            productCode: log.product?.code ?? "—",
            type: log.type, // 'in' or 'out'
            quantity: log.quantity,
            previousQuantity: log.previousQuantity,
            newQuantity: log.newQuantity,
            warehouse: log.permission?.warehouse || "—",
        };
    });

    return {
        success: true,
        results: movements.length,
        data: movements,
    };
}

// ========== ACCOUNTING REPORTS ==========

/**
 * Get account balances from journal entries (daily restrictions) for a date range.
 * Returns map: accountCode -> { openingDebit, openingCredit, periodDebit, periodCredit, closingDebit, closingCredit }
 */
async function getAccountBalances(startDate, endDate, companyFilter, accountCodes = null, branch = null) {
    const { start, end } = getDateRange(startDate, endDate);
    const query = { ...companyFilter, date: { $lte: end } };
    // Note: branch filtering not available in dailyRestrictionModel yet - can be added when model supports it
    const restrictions = await dailyRestrictionModel.find(query).select("date entries").lean();
    const balances = {};
    for (const restriction of restrictions) {
        const isBeforePeriod = restriction.date < start;
        for (const entry of restriction.entries || []) {
            const code = String(entry.account || "").trim();
            if (!code) continue;
            if (accountCodes && !accountCodes.includes(code)) continue;
            if (!balances[code]) {
                balances[code] = { openingDebit: 0, openingCredit: 0, periodDebit: 0, periodCredit: 0 };
            }
            const debit = Number(entry.debit || 0);
            const credit = Number(entry.credit || 0);
            if (isBeforePeriod) {
                balances[code].openingDebit += debit;
                balances[code].openingCredit += credit;
            } else {
                balances[code].periodDebit += debit;
                balances[code].periodCredit += credit;
            }
        }
    }
    for (const code in balances) {
        const b = balances[code];
        const openingNet = b.openingDebit - b.openingCredit;
        const periodNet = b.periodDebit - b.periodCredit;
        const closingNet = openingNet + periodNet;
        b.closingDebit = closingNet > 0 ? closingNet : 0;
        b.closingCredit = closingNet < 0 ? Math.abs(closingNet) : 0;
    }
    return balances;
}

/**
 * Build hierarchical account tree from chart of accounts.
 */
async function buildAccountTree(companyFilter, accountCodes = null) {
    const query = { ...companyFilter, status: "active" };
    const accounts = await chartOfAccountsModel.find(query).select("_id code name type parentAccount").lean();
    const accountMap = {};
    const roots = [];
    for (const acc of accounts) {
        if (accountCodes && !accountCodes.includes(acc.code)) continue;
        accountMap[acc._id.toString()] = { ...acc, children: [] };
    }
    for (const acc of accounts) {
        if (accountCodes && !accountCodes.includes(acc.code)) continue;
        const node = accountMap[acc._id.toString()];
        if (acc.parentAccount && accountMap[acc.parentAccount.toString()]) {
            accountMap[acc.parentAccount.toString()].children.push(node);
        } else {
            roots.push(node);
        }
    }
    return roots.sort((a, b) => a.code.localeCompare(b.code));
}

/**
 * Trial Balance: All accounts with opening balance, period movements, closing balance.
 */
export async function getTrialBalance(startDate, endDate, companyFilter, filters = {}) {
    const { branch, accountCodes } = filters;
    const balances = await getAccountBalances(startDate, endDate, companyFilter, accountCodes, branch);
    const tree = await buildAccountTree(companyFilter, accountCodes);
    const flatten = (nodes, level = 0) => {
        const result = [];
        for (const node of nodes) {
            const code = node.code;
            const bal = balances[code] || { openingDebit: 0, openingCredit: 0, periodDebit: 0, periodCredit: 0, closingDebit: 0, closingCredit: 0 };
            result.push({
                id: node._id.toString(),
                code,
                name: node.name,
                type: node.type,
                level,
                initialDebit: bal.openingDebit,
                initialCredit: bal.openingCredit,
                transactionDebit: bal.periodDebit,
                transactionCredit: bal.periodCredit,
                endDebit: bal.closingDebit,
                endCredit: bal.closingCredit,
                children: node.children.length > 0 ? flatten(node.children, level + 1) : [],
            });
        }
        return result;
    };
    const data = flatten(tree);
    const totals = data.reduce((acc, r) => {
        acc.initialDebit += r.initialDebit;
        acc.initialCredit += r.initialCredit;
        acc.transactionDebit += r.transactionDebit;
        acc.transactionCredit += r.transactionCredit;
        acc.endDebit += r.endDebit;
        acc.endCredit += r.endCredit;
        return acc;
    }, { initialDebit: 0, initialCredit: 0, transactionDebit: 0, transactionCredit: 0, endDebit: 0, endCredit: 0 });
    return { data, totals };
}

/**
 * Balance Sheet: Assets, Liabilities, Equity as of a specific date.
 */
export async function getBalanceSheet(asOfDate, companyFilter, filters = {}) {
    const { branch } = filters;
    const endDate = asOfDate || new Date().toISOString().split("T")[0];
    const balances = await getAccountBalances("2000-01-01", endDate, companyFilter, null, branch);
    const tree = await buildAccountTree(companyFilter);
    const getAccountType = (code) => {
        if (code.startsWith("1")) return "asset";
        if (code.startsWith("2")) return "liability";
        if (code.startsWith("3")) return "equity";
        return "other";
    };
    const categorize = (nodes) => {
        const assets = { fixed: [], current: [], total: 0 };
        const liabilities = { current: [], longTerm: [], total: 0 };
        const equity = { items: [], total: 0 };
        const processNode = (node, bal) => {
            const type = getAccountType(node.code);
            const amount = (bal?.closingDebit || 0) - (bal?.closingCredit || 0);
            if (type === "asset") {
                if (node.code.startsWith("11")) assets.fixed.push({ code: node.code, name: node.name, amount });
                else assets.current.push({ code: node.code, name: node.name, amount });
            } else if (type === "liability") {
                liabilities.current.push({ code: node.code, name: node.name, amount: Math.abs(amount) });
            } else if (type === "equity") {
                equity.items.push({ code: node.code, name: node.name, amount });
            }
            for (const child of node.children || []) {
                processNode(child, balances[child.code]);
            }
        };
        for (const root of tree) {
            processNode(root, balances[root.code]);
        }
        assets.total = [...assets.fixed, ...assets.current].reduce((sum, a) => sum + Math.max(0, a.amount), 0);
        liabilities.total = liabilities.current.reduce((sum, l) => sum + l.amount, 0);
        equity.total = equity.items.reduce((sum, e) => sum + e.amount, 0);
        const totalLiabilitiesAndEquity = liabilities.total + equity.total;
        return { assets, liabilities, equity, totalLiabilitiesAndEquity };
    };
    return categorize(tree);
}

/**
 * Income Statement: Revenue and Expenses for a period.
 */
export async function getIncomeStatement(startDate, endDate, companyFilter, filters = {}) {
    const { branch } = filters;
    const balances = await getAccountBalances(startDate, endDate, companyFilter, null, branch);
    const tree = await buildAccountTree(companyFilter);
    const getAccountType = (code) => {
        if (code.startsWith("4")) return "revenue";
        if (code.startsWith("5")) return "expense";
        return null;
    };
    const categorize = (nodes) => {
        const revenue = [];
        const expenses = [];
        const processNode = (node) => {
            const type = getAccountType(node.code);
            const bal = balances[node.code] || { periodDebit: 0, periodCredit: 0 };
            const amount = type === "revenue" ? bal.periodCredit - bal.periodDebit : bal.periodDebit - bal.periodCredit;
            if (type === "revenue") revenue.push({ code: node.code, name: node.name, amount: Math.max(0, amount) });
            else if (type === "expense") expenses.push({ code: node.code, name: node.name, amount: Math.max(0, amount) });
            for (const child of node.children || []) processNode(child);
        };
        for (const root of tree) processNode(root);
        const totalRevenue = revenue.reduce((sum, r) => sum + r.amount, 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        const netIncome = totalRevenue - totalExpenses;
        return { revenue, expenses, totalRevenue, totalExpenses, netIncome };
    };
    return categorize(tree);
}

/**
 * General Ledger: Detailed transactions for specific account(s) in a period.
 */
export async function getGeneralLedger(startDate, endDate, companyFilter, filters = {}) {
    const { branch, accountId, accountCode } = filters;
    const { start, end } = getDateRange(startDate, endDate);
    const query = { ...companyFilter, date: { $gte: start, $lte: end } };
    // Note: branch filtering not available in dailyRestrictionModel yet
    const restrictions = await dailyRestrictionModel.find(query).sort({ date: 1, createdAt: 1 }).select("number date description source entries").lean();
    const accounts = accountCode ? [accountCode] : (accountId ? await chartOfAccountsModel.find({ _id: accountId, ...companyFilter }).select("code").lean().then(list => list.map(a => a.code)) : null);
    const entries = [];
    let runningBalance = 0;
    for (const restriction of restrictions) {
        for (const entry of restriction.entries || []) {
            const code = String(entry.account || "").trim();
            if (!code) continue;
            if (accounts && !accounts.includes(code)) continue;
            const debit = Number(entry.debit || 0);
            const credit = Number(entry.credit || 0);
            runningBalance += debit - credit;
            entries.push({
                date: restriction.date,
                description: entry.description || restriction.description || "",
                accountCode: code,
                debit,
                credit,
                balance: runningBalance,
                restrictionNumber: restriction.number,
                source: restriction.source || "",
            });
        }
    }
    const account = accountCode ? await chartOfAccountsModel.findOne({ code: accountCode, ...companyFilter }).select("name code").lean() : null;
    return { account: account ? { name: account.name, code: account.code } : null, entries, totalEntries: entries.length };
}

/**
 * Tax Reports: Summary and detailed tax calculations from transactions.
 */
export async function getTaxSummary(startDate, endDate, companyFilter, filters = {}) {
    const { branch } = filters;
    const { start, end } = getDateRange(startDate, endDate);
    const query = {
        ...companyFilter,
        $or: [{ module: "sales" }, { module: "purchases" }],
        documentType: { $in: ["invoice", "return"] },
        issueDate: { $gte: start, $lte: end },
        status: { $ne: "draft" },
        deletedAt: { $in: [null, undefined] },
    };
    if (branch && branch !== "all") query.warehouse = branch;
    const transactions = await Transaction.find(query).select("module documentType totalTax totalAmount issueDate").lean();
    let totalSalesTax = 0;
    let totalPurchaseTax = 0;
    let totalSalesAmount = 0;
    let totalPurchaseAmount = 0;
    for (const txn of transactions) {
        const tax = Number(txn.totalTax || 0);
        const amount = Number(txn.totalAmount || 0);
        if (txn.module === "sales") {
            totalSalesTax += tax;
            totalSalesAmount += amount;
        } else {
            totalPurchaseTax += tax;
            totalPurchaseAmount += amount;
        }
    }
    const netTaxPayable = totalSalesTax - totalPurchaseTax;
    return { totalSalesTax, totalPurchaseTax, totalSalesAmount, totalPurchaseAmount, netTaxPayable };
}

/**
 * Tax Detailed: Per-transaction tax breakdown.
 */
export async function getTaxDetailed(startDate, endDate, companyFilter, filters = {}) {
    const { branch } = filters;
    const { start, end } = getDateRange(startDate, endDate);
    const query = {
        ...companyFilter,
        $or: [{ module: "sales" }, { module: "purchases" }],
        documentType: { $in: ["invoice", "return"] },
        issueDate: { $gte: start, $lte: end },
        status: { $ne: "draft" },
        deletedAt: { $in: [null, undefined] },
    };
    if (branch && branch !== "all") query.warehouse = branch;
    const transactions = await Transaction.find(query)
        .sort({ issueDate: 1 })
        .populate("contact", "name")
        .select("transactionNumber module documentType totalTax totalAmount issueDate contactSnapshot")
        .lean();
    return transactions.map((txn) => ({
        date: txn.issueDate,
        documentNumber: txn.transactionNumber,
        type: txn.module === "sales" ? (txn.documentType === "return" ? "sales_return" : "sales_invoice") : (txn.documentType === "return" ? "purchase_return" : "purchase_invoice"),
        contactName: txn.contact?.name || txn.contactSnapshot?.name || "—",
        amount: txn.totalAmount || 0,
        tax: txn.totalTax || 0,
    }));
}
