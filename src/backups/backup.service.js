import mongoose from "mongoose";
import { systemBackupModel } from "./backup.model.js";
import { userModel } from "../modules/user/user.model.js";
import { companyModel } from "../modules/companies/company.model.js";
import Contact from "../modules/contacts/contacts.model.js";
import { productModel } from "../modules/product/product.model.js";
import Invoice from "../modules/invoices/invoices.model.js";
import Payment from "../modules/payments/payments.model.js";
import { returnModel } from "../modules/returns/returns.model.js";
import { quoteModel } from "../modules/quotes/quotes.model.js";
import { warehouseModel } from "../modules/warehouse/warehouse.model.js";
import { categoryModel } from "../modules/category/category.model.js";
import { safeModel } from "../modules/Safes/safe.model.js";
import Transaction from "../modules/transaction/transaction.model.js";
import { operationModel } from "../modules/operations/operations.model.js";
import { branchModel } from "../modules/branch/branch.model.js";
import { chartOfAccountsModel } from "../modules/chartOfAccounts/chartOfAccounts.model.js";
import { expenseModel } from "../modules/Expenses/expense.model.js";
import { bankAccountModel } from "../modules/BankAccounts/bankAccount.model.js";

// Dynamic registry: add new models here to include in backups
const COLLECTION_REGISTRY = {
    users: userModel,
    companies: companyModel,
    contacts: Contact,
    products: productModel,
    invoices: Invoice,
    payments: Payment,
    returns: returnModel,
    quotes: quoteModel,
    warehouses: warehouseModel,
    categories: categoryModel,
    safes: safeModel,
    transactions: Transaction,
    operations: operationModel,
    branches: branchModel,
    chartOfAccounts: chartOfAccountsModel,
    expenses: expenseModel,
    bankAccounts: bankAccountModel,
};

const BACKUP_RETENTION_DAYS = 30;

const log = (message, meta = {}) => {
    const timestamp = new Date().toISOString();
    console.log(`[Backup] ${timestamp} - ${message}`, Object.keys(meta).length ? meta : "");
};

const logError = (message, err) => {
    const timestamp = new Date().toISOString();
    console.error(`[Backup ERROR] ${timestamp} - ${message}`, err?.message || err);
};

/**
 * Fetch all documents from a model using find({}).lean()
 * Works independently of applyCompanyFilter - no req context
 */
const backupCollection = async (key, Model) => {
    const docs = await Model.find({}).lean();
    return docs;
};

/**
 * Perform full system backup - all registered collections
 * Stores in SystemBackup collection
 */
export const runSystemBackup = async () => {
    const startTime = Date.now();
    log("Backup started");

    try {
        if (mongoose.connection.readyState !== 1) {
            throw new Error("Database not connected");
        }

        const collections = {};
        let totalRecords = 0;

        for (const [key, Model] of Object.entries(COLLECTION_REGISTRY)) {
            try {
                const docs = await backupCollection(key, Model);
                collections[key] = docs;
                totalRecords += docs.length;
                log(`Backed up ${key}: ${docs.length} documents`);
            } catch (err) {
                logError(`Failed to backup collection: ${key}`, err);
                collections[key] = [];
            }
        }

        const backup = new systemBackupModel({
            backupDate: new Date(),
            collections,
            totalRecords,
        });
        await backup.save();

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        log("Backup completed", {
            totalRecords,
            durationSeconds: duration,
            backupId: backup._id.toString(),
        });

        return { backupId: backup._id, totalRecords, duration: parseFloat(duration) };
    } catch (err) {
        logError("Backup failed", err);
        throw err;
    }
};

/**
 * Delete backups older than retention period
 */
export const cleanupOldBackups = async () => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - BACKUP_RETENTION_DAYS);

    try {
        const result = await systemBackupModel.deleteMany({ backupDate: { $lt: cutoff } });
        if (result.deletedCount > 0) {
            log(`Cleanup: deleted ${result.deletedCount} backup(s) older than ${BACKUP_RETENTION_DAYS} days`);
        }
    } catch (err) {
        logError("Cleanup failed", err);
    }
};

/**
 * Restore from a backup by ID
 * Safely restores collections - uses bulkWrite where possible
 */
export const restoreFromBackup = async (backupId) => {
    const startTime = Date.now();
    log("Restore started", { backupId });

    try {
        const backup = await systemBackupModel.findById(backupId).lean();
        if (!backup) {
            throw new Error("Backup not found");
        }

        const collections = backup.collections || {};
        let totalRestored = 0;

        for (const [key, docs] of Object.entries(collections)) {
            const Model = COLLECTION_REGISTRY[key];
            if (!Model || !Array.isArray(docs) || docs.length === 0) continue;

            try {
                const operations = docs.map((doc) => {
                    const id = doc._id ? new mongoose.Types.ObjectId(doc._id) : new mongoose.Types.ObjectId();
                    const { _id, __v, ...rest } = doc;
                    return {
                        replaceOne: {
                            filter: { _id: id },
                            replacement: { _id: id, ...rest },
                            upsert: true,
                        },
                    };
                });

                if (operations.length > 0) {
                    await Model.bulkWrite(operations);
                    totalRestored += docs.length;
                    log(`Restored ${key}: ${docs.length} documents`);
                }
            } catch (err) {
                logError(`Failed to restore collection: ${key}`, err);
            }
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        log("Restore completed", { totalRestored, durationSeconds: duration });

        return { totalRestored, duration: parseFloat(duration) };
    } catch (err) {
        logError("Restore failed", err);
        throw err;
    }
};

/**
 * List backups (for admin UI)
 */
export const listBackups = async (limit = 20) => {
    const backups = await systemBackupModel
        .find({})
        .sort({ backupDate: -1 })
        .limit(limit)
        .select("backupDate totalRecords createdAt")
        .lean();
    return backups;
};
