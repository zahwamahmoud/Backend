import express from "express";
import { addRestriction, deleteRestriction, getAllRestrictions, getNextNumber, getRestrictionById, updateRestriction } from "./dailyRestrictions.controller.js";
import { validation } from "../../middleware/validation.js";
import { addRestrictionSchema, updateRestrictionSchema } from "./dailyRestrictions.validation.js";
import { uploadSingleFile } from "../../middleware/uploadFiles.js";
import { allowedTo, protectedRoutes } from "../auth/auth.controller.js";
import { applyCompanyFilter } from "../../middleware/applyCompanyFilter.js";
import { parseJournalEntries } from "./parseJournalEntries.js";
const dailyRestrictionRouter = express.Router();

dailyRestrictionRouter.use(protectedRoutes, applyCompanyFilter);

dailyRestrictionRouter.post('/', uploadSingleFile(['image', 'application/pdf'], 'attachment'), parseJournalEntries, validation(addRestrictionSchema), allowedTo("superAdmin", "admin", "accountant"), addRestriction);
dailyRestrictionRouter.get('/', allowedTo("superAdmin", "admin", "accountant"), getAllRestrictions);
dailyRestrictionRouter.get('/next-number', allowedTo("superAdmin", "admin", "accountant"), getNextNumber);
dailyRestrictionRouter.get('/:id', allowedTo("superAdmin", "admin", "accountant"), getRestrictionById);
dailyRestrictionRouter.put('/:id', uploadSingleFile(['image', 'application/pdf'], 'attachment'), parseJournalEntries, validation(updateRestrictionSchema), allowedTo("superAdmin", "admin", "accountant"), updateRestriction);
dailyRestrictionRouter.delete('/:id', allowedTo("superAdmin", "admin"), deleteRestriction);

export default dailyRestrictionRouter;
