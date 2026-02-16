import { userModel } from "../user/user.model.js"
import { companyModel } from "../companies/company.model.js"
import { roleModel } from "../role/role.model.js"
import { catchAsyncError } from "../../middleware/catchAsyncError.js"
import { AppError } from "../../utils/AppError.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"




const signup = catchAsyncError(async (req, res, next) => {
    let isUserExist = await userModel.findOne({ email: req.body.email })

    if (isUserExist) {
        return next(new AppError('User already exist', 409))
    }

    // Remove confirmPassword before saving (should not be stored)
    const { confirmPassword, ...userData } = req.body;

    // Validate companyId for non-superAdmin users
    if (userData.role !== 'superAdmin' && !userData.companyId) {
        return next(new AppError('Company ID is required for non-superAdmin users', 400))
    }

    let user = new userModel(userData)
    await user.save()
    res.status(200).json({ message: 'User added successfully', user })
})



const signIn = catchAsyncError(async (req, res, next) => {
    const { email, password } = req.body;

    // 1. Check User model
    let account = await userModel.findOne({ email });
    let type = 'user';

    // 2. If not found, check Company model
    if (!account) {
        account = await companyModel.findOne({ email });
        type = 'company';
    }

    if (!account) {
        return next(new AppError('invalid email or password', 404));
    }

    // 3. Compare password
    const match = await bcrypt.compare(password, account.password);

    if (match) {
        const payload = {
            userId: account._id,
            role: type === 'company' ? 'company' : account.role,
            type: type,
            systemRole: type === 'company' ? 'companyOwner' : (account.systemRole || (account.role === 'superAdmin' ? 'superAdmin' : null)),
            roleId: type === 'user' ? (account.roleId || null) : null
        };

        if (type === 'user') {
            payload.companyId = account.companyId || null;
        } else {
            payload.companyId = account._id;
        }

        let token = jwt.sign(payload, process.env.SECRET_KEY);

        // Prepare account object for response (remove password)
        const accountResponse = account.toObject();
        delete accountResponse.password;

        // Ensure role is present for frontend
        if (type === 'company') {
            accountResponse.role = 'company';
        }

        return res.status(200).json({
            message: `${type === 'company' ? 'Company' : 'User'} login successfully`,
            isUserExist: accountResponse,
            token
        });
    }

    return next(new AppError('invalid email or password', 401));
})

// Dedicated company login (public) – returns JWT scoped to company
const companySignIn = catchAsyncError(async (req, res, next) => {
    const { email, password } = req.body;
    const company = await companyModel.findOne({ email: email?.toLowerCase?.() || email });
    if (!company) {
        return next(new AppError('Invalid email or password', 401));
    }
    const match = await bcrypt.compare(password, company.password);
    if (!match) {
        return next(new AppError('Invalid email or password', 401));
    }
    const payload = {
        userId: company._id,
        companyId: company._id,
        role: 'company',
        systemRole: 'companyOwner',
        roleId: null
    };
    const token = jwt.sign(payload, process.env.SECRET_KEY);
    const companyResponse = company.toObject();
    delete companyResponse.password;
    companyResponse.role = 'company';
    return res.status(200).json({
        message: 'Company login successful',
        company: companyResponse,
        token
    });
});

const protectedRoutes = catchAsyncError(async (req, res, next) => { // authentication 
    let { token } = req.headers;
    if (!token) {
        token = req.headers.authorization?.split(' ')[1]; // Check Bearer token too
    }

    if (!token) return next(new AppError('Token not provided', 401));

    let decoded;
    try {
        decoded = await jwt.verify(token, process.env.SECRET_KEY);
    } catch (err) {
        return next(new AppError('Invalid or expired token', 401));
    }

    // Try finding in userModel first
    let account = await userModel.findById(decoded.userId);

    // If not found, try companyModel
    if (!account) {
        account = await companyModel.findById(decoded.userId);
        if (account) {
            // Convert to object to add role if missing in schema
            account = account.toObject();
            account.role = account.role || 'company';
        }
    }

    if (!account) return next(new AppError('Account not found or invalid token', 401));

    req.user = typeof account.toObject === 'function' ? account.toObject() : account;
    if (decoded.systemRole) req.user.systemRole = decoded.systemRole;
    if (decoded.roleId) req.user.roleId = decoded.roleId;
    next();
})

const allowedTo = (...roles) => { // Authorization (role-based, backward compatible)
    return catchAsyncError(async (req, res, next) => {
        const userRole = req.user?.role;
        const isAuthorized = roles.includes(userRole) || (userRole === 'company' && roles.includes('admin'));

        if (!isAuthorized)
            return next(new AppError('you are not authorized to access this route . you are ' + (userRole || 'unknown'), 403));

        next();
    });
}

/**
 * Permission-based authorization. Allow if:
 * - systemRole is superAdmin, or
 * - systemRole is companyOwner (or role is company), or
 * - user's role (by roleId) has at least one of the given permissions and is active.
 * @param {...string} permissions - One or more permission strings; user needs at least one.
 */
const requirePermission = (...permissions) => {
    return catchAsyncError(async (req, res, next) => {
        const systemRole = req.user?.systemRole;
        const role = req.user?.role;

        if (systemRole === 'superAdmin') return next();
        if (systemRole === 'companyOwner' || role === 'company') return next();

        const roleId = req.user?.roleId;
        if (!roleId) return next(new AppError('You do not have a role assigned', 403));

        const roleDoc = await roleModel.findById(roleId);
        if (!roleDoc) return next(new AppError('Role not found', 403));
        if (roleDoc.status !== 'active') return next(new AppError('Your role is inactive', 403));

        const userPerms = roleDoc.permissions || [];
        const hasAny = permissions.some(p => userPerms.includes(p));
        if (!hasAny) return next(new AppError('Insufficient permissions', 403));

        next();
    });
};

export { signup, signIn, companySignIn, protectedRoutes, allowedTo, requirePermission }



