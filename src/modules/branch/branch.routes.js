import express from "express";
import { addBranch, deleteBranch, getAllBranches, getBranchById, updateBranch } from "./branch.controller.js";
import { validation } from "../../middleware/validation.js";
import { addBranchSchema, updateBranchSchema } from "./branch.validation.js";
import { protectedRoutes } from "../auth/auth.controller.js";
import { applyCompanyFilter } from "../../middleware/applyCompanyFilter.js";
const branchRouter = express.Router();

branchRouter.use(protectedRoutes);
branchRouter.use(applyCompanyFilter);

branchRouter.post('/', validation(addBranchSchema), addBranch);
branchRouter.get('/', getAllBranches);
branchRouter.get('/:id', getBranchById);
branchRouter.put('/:id', validation(updateBranchSchema), updateBranch);
branchRouter.delete('/:id', deleteBranch);

export default branchRouter;
