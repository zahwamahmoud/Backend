import { catchAsyncError } from "../../middleware/catchAsyncError.js";
import { AppError } from "../../utils/AppError.js";
import Contact from "./contacts.model.js";
import Transaction from "../transaction/transaction.model.js";

const CODE_PREFIX = "1";
const CODE_PATTERN = /^(\d+)-(\d+)$/;

/**
 * Generate the next sequential contact code for a company/module (e.g. 1-000001, 1-000002).
 * Source of truth for unique codes; safe to call multiple times (re-query on each call for concurrency).
 */
async function getNextContactCode(companyId, module) {
    const existing = await Contact.find(
        { companyId, module, deletedAt: { $eq: null } },
        { code: 1 }
    ).lean();
    let maxNum = 0;
    for (const c of existing) {
        if (c.code && CODE_PATTERN.test(c.code)) {
            const num = parseInt(c.code.replace(CODE_PATTERN, "$2"), 10);
            if (num > maxNum) maxNum = num;
        }
    }
    return `${CODE_PREFIX}-${String(maxNum + 1).padStart(6, "0")}`;
}

// ========== ADD ==========
const addContact = (module) =>
    catchAsyncError(async (req, res, next) => {


        const opData = { ...req.body };

        // For individual contacts, remove taxNumber and commercialRegister entirely
        if (opData.type === 'individual' || (opData.type && opData.type.trim().toLowerCase() === 'individual')) {
            delete opData.taxNumber;
            delete opData.commercialRegister;
        }

        // Ensure companyId is set (applyCompanyFilter sets body.companyId; fallback for consistency)
        const companyId = opData.companyId ?? req.user?.companyId;
        if (!companyId && req.user?.role !== "superAdmin") {
            return next(new AppError("Company context is required to create a contact", 400));
        }

        const shouldAutoGenerateCode = !opData.code || String(opData.code).trim() === "";
        if (shouldAutoGenerateCode) {
            opData.code = await getNextContactCode(companyId, module);
        }

        const { code, taxNumber, commercialRegister, type } = opData;

        // Only check code uniqueness if user provided a custom code (not auto-generated)
        if (code && !shouldAutoGenerateCode) {
            const codeFilter = companyId ? { code, companyId } : { code };
            const existingCode = await Contact.findOne({ ...codeFilter, deletedAt: { $eq: null } });
            if (existingCode) return next(new AppError("الكود مستخدم بالفعل", 400));
        }

        // Only check uniqueness for taxNumber and commercialRegister if type is 'commercial'
        if (type === 'commercial') {
            if (taxNumber) {
                const taxFilter = companyId ? { taxNumber, companyId } : { taxNumber };
                const existingTax = await Contact.findOne(taxFilter);
                if (existingTax) return next(new AppError("الرقم الضريبي مستخدم بالفعل", 400));
            }
            if (commercialRegister) {
                const crFilter = companyId ? { commercialRegister, companyId } : { commercialRegister };
                const existingCR = await Contact.findOne(crFilter);
                if (existingCR) return next(new AppError("السجل التجاري مستخدم بالفعل", 400));
            }
        }

        const maxRetries = 3;
        let lastError;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                if (shouldAutoGenerateCode && attempt > 0) {
                    opData.code = await getNextContactCode(companyId, module);
                }



                const contact = await Contact.create({
                    ...opData,
                    module,
                    companyId,
                    createdBy: req.user?._id
                });
                return res.status(201).json({
                    message: "تم الإنشاء بنجاح",
                    contact
                });
            } catch (err) {
                lastError = err;
                console.error('AddContact Error:', err.message, err.code, err.keyPattern);
                if (err.code === 11000 && err.keyPattern?.code && shouldAutoGenerateCode) {
                    continue;
                }
                if (err.code === 11000) {
                    const field = err.keyPattern?.code ? "code" : err.keyPattern?.taxNumber ? "taxNumber" : "commercialRegister";
                    return next(new AppError(field === "code" ? "الكود مستخدم بالفعل" : field === "taxNumber" ? "الرقم الضريبي مستخدم بالفعل" : "السجل التجاري مستخدم بالفعل", 400));
                }
                throw err;
            }
        }
        return next(new AppError(lastError?.message || "الكود مستخدم بالفعل", 400));
    });

// ========== GET ALL ==========
const getAllContacts = (module) =>
    catchAsyncError(async (req, res) => {
        const filter = {
            module,
            deletedAt: { $eq: null },
            ...(req.companyFilter || {})
        };
        const contacts = await Contact.find(filter);
        res.json({
            message: "تم جلب البيانات بنجاح",
            count: contacts.length,
            contacts
        });
    });

// ========== GET ONE ==========
const getContactById = catchAsyncError(async (req, res, next) => {
    const contact = await Contact.findOne({ _id: req.params.id, ...req.companyFilter });

    if (!contact || contact.deletedAt) return next(new AppError("غير موجود", 404));

    res.json({
        message: "تم جلب البيانات بنجاح",
        contact
    });
});

// ========== UPDATE ==========
const updateContact = catchAsyncError(async (req, res, next) => {
    const contact = await Contact.findOne({ _id: req.params.id, ...req.companyFilter });

    if (!contact || contact.deletedAt) return next(new AppError("غير موجود", 404));

    const opData = { ...req.body };

    // Clean up empty strings
    if (opData.code === "") delete opData.code;
    if (opData.taxNumber === "") delete opData.taxNumber;
    if (opData.commercialRegister === "") delete opData.commercialRegister;

    // For individual contacts, remove taxNumber and commercialRegister entirely
    // Use new type if provided, otherwise use existing contact type
    const contactType = opData.type || contact.type;
    if (contactType === 'individual' || (contactType && String(contactType).trim().toLowerCase() === 'individual')) {
        delete opData.taxNumber;
        delete opData.commercialRegister;
    }

    const { code, taxNumber, commercialRegister, type } = opData;
    const companyId = contact.companyId; // Use existing contact's companyId for integrity

    // Check duplicates (ignore current record)
    if (code && code !== contact.code) {
        const existingCode = await Contact.findOne({ code, companyId });
        if (existingCode) return next(new AppError("الكود مستخدم بالفعل", 400));
    }

    // Only check uniqueness for taxNumber and commercialRegister if type is 'commercial'
    // contactType is already declared above
    if (contactType === 'commercial') {
        if (taxNumber && taxNumber !== contact.taxNumber) {
            const existingTax = await Contact.findOne({ taxNumber, companyId });
            if (existingTax) return next(new AppError("الرقم الضريبي مستخدم بالفعل", 400));
        }
        if (commercialRegister && commercialRegister !== contact.commercialRegister) {
            const existingCR = await Contact.findOne({ commercialRegister, companyId });
            if (existingCR) return next(new AppError("السجل التجاري مستخدم بالفعل", 400));
        }
    }

    // Handle address update safely - merge with existing or replace if full object provided
    // Ideally frontend sends full object. We will assign opData properties.
    if (opData.address) {
        contact.address = { ...contact.address, ...opData.address };
        delete opData.address; // Handled manually
    }

    // Assign other fields
    Object.assign(contact, opData);
    contact.lastModifiedBy = req.user?._id;

    await contact.save();

    res.json({
        message: "تم التعديل بنجاح",
        contact
    });
});

// ========== DELETE ==========
const deleteContact = catchAsyncError(async (req, res, next) => {
    // Check for existing transactions first
    const hasTransactions = await Transaction.findOne({
        contact: req.params.id,
        deletedAt: null,
        companyId: req.user?.companyId
    });

    if (hasTransactions) {
        return next(new AppError("لا يمكن حذف المورد لوجود تعاملات (فواتير/طلبات) مرتبطة به. يمكنك أرشفته بدلاً من ذلك.", 400));
    }

    // Perform Soft Delete
    const contact = await Contact.findOneAndUpdate(
        { _id: req.params.id, ...req.companyFilter },
        {
            deletedAt: new Date(),
            deletedBy: req.user?._id
        },
        { new: true }
    );

    if (!contact) return next(new AppError("غير موجود", 404));

    res.json({
        message: "تم الحذف بنجاح",
        contact
    });
});

export {
    addContact,
    getAllContacts,
    getContactById,
    updateContact,
    deleteContact
};
