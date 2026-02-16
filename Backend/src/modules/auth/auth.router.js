import express from "express";
import { signIn, signup, companySignIn } from "./auth.controller.js";
import { validation } from "../../middleware/validation.js";
import { signinVal, signupVal } from "./auth.validation.js";
import { companySignInSchema } from "../companies/company.validation.js";

const authRouter = express.Router();

authRouter.post('/signup', validation(signupVal), signup);
authRouter.post('/signIn', validation(signinVal), signIn);
authRouter.post('/company/signIn', validation(companySignInSchema), companySignIn);

export default authRouter;
