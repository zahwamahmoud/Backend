import { globalErrorMiddleware } from "../middleware/globalErrorMiddleware.js"
import { AppError } from "../utils/AppError.js"
import authRouter from "./auth/auth.router.js"
import invoiceRouter from "./invoices/invoices.routes.js"
import productRouter from "./product/product.router.js"
import { userRouter } from "./user/user.router.js"
import returnsRouter from "./returns/returns.routes.js"
import quoteRouter from "./quotes/quotes.routes.js"
import paymentRouter from "./payments/payments.routes.js"
import customerRouter from "./customers/customers.routes.js"
import contactRouter from "./contacts/contacts.routes.js"
import categoryRouter from "./category/category.route.js"
import stockAddRouter from "./stockAdd/stockAdd.routes.js"
import inventoryExchangeRouter from "./inventoryExchange/inventoryExchange.routes.js";
import operationRouter from "./operations/operations.routes.js"
import transferProcessRouter from "./transferProcess/transferProcess.routes.js"
import warehouseRouter from "./warehouse/warehouse.routes.js"
import inventoryOperationRouter from "./inventoryOperation/inventoryOperation.routes.js"
import requisitionRouter from "./permissions/requisition.routes.js"
import transactionRouter from "./transaction/transaction.routes.js"
import dailyRestrictionRouter from "./dailyRestrictions/dailyRestrictions.routes.js"
import chartOfAccountsRouter from "./chartOfAccounts/chartOfAccounts.routes.js"
import branchRouter from "./branch/branch.routes.js"
import partnerListRouter from "./listOfPartners/listOfPartners.routes.js"
import activityRouter from "./activity/activity.routes.js"
import expenseRouter from "./Expenses/expense.router.js"
import bankAccountRouter from "./BankAccounts/bankAccount.routes.js"
import safeRouter from "./Safes/safe.routes.js"
import companyRouter from "./companies/company.routes.js"
import roleRouter from "./role/role.routes.js"
import reportsRouter from "./reports/reports.routes.js"
import financialTransactionRouter from "./FinancialTransactions/financialTransaction.routes.js"
import { backupRouter } from "../backups/backup.routes.js"

export function routes(app) {

    app.use('/api/v1/users', userRouter)
    app.use('/api/v1/auth', authRouter)
    app.use("/api/v1/roles", roleRouter)
    app.use("/api/v1/reports", reportsRouter)
    app.use('/api/v1/invoices', invoiceRouter)
    app.use('/api/v1/products', productRouter)
    app.use('/api/v1/customers', customerRouter)
    app.use('/api/v1/returns', returnsRouter)
    app.use('/api/v1/quotes', quoteRouter)
    app.use('/api/v1/payments', paymentRouter)
    app.use('/api/v1/contacts', contactRouter)
    app.use('/api/v1/category', categoryRouter)
    app.use('/api/v1/operations', operationRouter)
    app.use('/api/v1/stockAdd', stockAddRouter)
    app.use("/api/v1/inventory-exchange", inventoryExchangeRouter);
    app.use("/api/v1/transfer-process", transferProcessRouter);
    app.use("/api/v1/warehouses", warehouseRouter);
    app.use("/api/v1/inventory-operations", inventoryOperationRouter);
    app.use("/api/v1/transactions", transactionRouter)
    app.use("/api/v1/requisitions", requisitionRouter)
    app.use("/api/v1/daily-restrictions", dailyRestrictionRouter)
    app.use("/api/v1/chart-of-accounts", chartOfAccountsRouter)
    app.use("/api/v1/branches", branchRouter)
    app.use("/api/v1/partner-lists", partnerListRouter)
    app.use("/api/v1/activities", activityRouter)
    app.use("/api/v1/expenses", expenseRouter)
    app.use("/api/v1/bank-accounts", bankAccountRouter)
    app.use("/api/v1/safes", safeRouter)
    app.use("/api/v1/financial-transactions", financialTransactionRouter)
    app.use("/api/v1/companies", companyRouter)
    app.use("/api/v1/backups", backupRouter)









    app.use('*', (req, res, next) => {
        // res.status(404).json({message : 'Route not found'})
        next(new AppError(`Route ${req.originalUrl} not found`, 404))
    })
    // global error handling middleware
    app.use(globalErrorMiddleware)
}