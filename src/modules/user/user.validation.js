
import Joi from "joi";


export const addUserVal = Joi.object({
    name: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
    role: Joi.string().valid('accountant', 'admin', 'employee', 'superAdmin'),
    companyId: Joi.string().hex().length(24),
    roleId: Joi.string().hex().length(24),
    systemRole: Joi.string().valid('superAdmin', 'companyOwner'),
    phone: Joi.string(),
})

export const updateUserVal = Joi.object({
    id: Joi.string().hex().length(24).required(),
    name: Joi.string().min(3).max(30),
    email: Joi.string().email(),
    password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')),
    confirmPassword: Joi.string().valid(Joi.ref('password')),
    role: Joi.string().valid('accountant', 'admin', 'employee', 'superAdmin'),
    companyId: Joi.string().hex().length(24),
    roleId: Joi.string().hex().length(24),
    systemRole: Joi.string().valid('superAdmin', 'companyOwner'),
    phone: Joi.string(),
})

export const deleteUserVal = Joi.object({
    id: Joi.string().hex().length(24).required()
})

export const getUserByIdVal = Joi.object({
    id: Joi.string().hex().length(24).required()
})
