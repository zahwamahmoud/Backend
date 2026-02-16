import express from "express";
import { addPartnerList, deletePartnerList, getAllPartnerLists, getPartnerListById, updatePartnerList } from "./listOfPartners.controller.js";
import { validation } from "../../middleware/validation.js";
import { addPartnerListSchema, updatePartnerListSchema } from "./listOfPartners.validation.js";
import { protectedRoutes } from "../auth/auth.controller.js";
import { applyCompanyFilter } from "../../middleware/applyCompanyFilter.js";
const partnerListRouter = express.Router();

partnerListRouter.use(protectedRoutes, applyCompanyFilter);

partnerListRouter.post('/', validation(addPartnerListSchema), addPartnerList);
partnerListRouter.get('/', getAllPartnerLists);
partnerListRouter.get('/:id', getPartnerListById);
partnerListRouter.put('/:id', validation(updatePartnerListSchema), updatePartnerList);
partnerListRouter.delete('/:id', deletePartnerList);

export default partnerListRouter;
