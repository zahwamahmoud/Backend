import express from "express";
import {
    addContact,
    getAllContacts,
    getContactById,
    updateContact,
    deleteContact
} from "./contacts.controller.js";
import { validation } from "../../middleware/validation.js";
import { contactSchema } from "./contacts.validation.js";
import { allowedTo, protectedRoutes } from "../auth/auth.controller.js";
import { applyCompanyFilter } from "../../middleware/applyCompanyFilter.js";

const router = express.Router();

router.use(protectedRoutes, applyCompanyFilter);

// CUSTOMERS
router.post("/customers", validation(contactSchema), allowedTo("superAdmin", "admin", "accountant"), addContact("customer"));
router.get("/customers", getAllContacts("customer"));

// SUPPLIERS
router.post("/suppliers", validation(contactSchema), allowedTo("superAdmin", "admin", "accountant"), addContact("supplier"));
router.get("/suppliers", getAllContacts("supplier"));

// SHARED
router.get("/:id", getContactById);
router.patch("/:id", validation(contactSchema), allowedTo("superAdmin", "admin", "accountant"), updateContact);
router.delete("/:id", allowedTo("superAdmin", "admin"), deleteContact);

export default router;