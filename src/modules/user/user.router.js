import express from "express"
import { addUser, deleteUser, getAllUsers, getUserById, updateUser } from "./user.controller.js";
import { allowedTo, protectedRoutes } from "../auth/auth.controller.js";
import { applyCompanyFilter } from "../../middleware/applyCompanyFilter.js";
import { uploadSingleFile } from "../../middleware/uploadFiles.js";
import { validation } from "../../middleware/validation.js";
import { addUserVal, deleteUserVal, getUserByIdVal, updateUserVal } from "./user.validation.js";

export const userRouter = express.Router();

userRouter.use(protectedRoutes, applyCompanyFilter);

userRouter.post('/', uploadSingleFile(['image'], 'image'), validation(addUserVal), applyCompanyFilter, allowedTo("superAdmin" ,"admin"), addUser)
userRouter.get('/', allowedTo("superAdmin", "admin"), getAllUsers)
userRouter.get('/:id', validation(getUserByIdVal), getUserById)
userRouter.put('/:id', uploadSingleFile(['image'], 'image'), validation(updateUserVal), applyCompanyFilter, allowedTo("superAdmin" ,"admin"), updateUser)
userRouter.delete('/:id', validation(deleteUserVal), allowedTo("superAdmin" ,"admin"), deleteUser)




