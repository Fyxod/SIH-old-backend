import express from 'express';
import Admin from '../models/admin.js';
import bcrypt from 'bcrypt';
import { adminSchema, registerAdminSchema } from '../utils/zodSchemas';
import { safeHandler } from '../middlewares/safeHandler.js';
import ApiError from '../utils/errorClass.js';
import { generateToken } from '../utils/jwtFuncs.js';
import checkAuth from '../middlewares/authMiddleware.js';
import { isValidObjectId } from 'mongoose';

const router = express.Router();

router.get('/', checkAuth("superadmin"), safeHandler(async (req, res) => {
    const admins = await Admin.find();
    if (!admins || admins.length === 0) {
        throw new ApiError(404, "No admins found", "NO_ADMINS_FOUND");
    }
    return res.success(200, "All admins successfully retrieved", { admins });
}));

router.post('/signup', safeHandler(async (req, res) => {
    const { email, password } = adminSchema.parse(req.body);
    const admin = await Admin.findOne({ email });
    if (!admin) {
        throw new ApiError(404, "Invalid email or password", "ADMIN_NOT_FOUND");
    }
    const validPassword = await bcrypt.compare(password, admin.password);
    if (!validPassword) {
        throw new ApiError(404, "Invalid email or password", "INVALID_CREDENTIALS");
    }
    const token = generateToken({ id: admin._id, role: admin.role });
    return res.success(200, "Successfully logged in", { token });
}));

router.post('/signin', safeHandler(async (req, res) => {
    const { email, password } = registerAdminSchema.parse(req.body);
    const admin = await Admin.findOne({ email });
    if (admin) {
        throw new ApiError(400, "Admin already exists", "ADMIN_EXISTS");
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new Admin({ email, password: hashedPassword });
    await newAdmin.save();
    return res.success(201, "Admin created successfully", { email }); //also send the new id after printing newAdmin to see where the is comes
}));

router.route('/:id')
    .get(checkAuth("superadmin"), safeHandler(async (req, res) => {
        const { id } = req.params;
        if(!isValidObjectId(id)) throw new ApiError(400, "Invalid admin ID", "INVALID_ID");
        const admin = await Admin.findById(id);
        if (!admin) {
            throw new ApiError(404, "Admin not found", "ADMIN_NOT_FOUND");
        }
        return res.success(200, "Admin found", { admin });
    }))
    .put(checkAuth("superadmin"), safeHandler(async (req, res) => {
        const { id } = req.params;
        if(!isValidObjectId(id)) throw new ApiError(400, "Invalid admin ID", "INVALID_ID");
        const { email, password } = registerAdminSchema.parse(req.body);
        const { emailChange, passwordChange } = req.query; // boolean values
        const updateData = {};
        if (emailChange === 'true') {
            updateData.email = email;
        }
        if (passwordChange === 'true') {
            updateData.password = await bcrypt.hash(password, 10);
        }
        const admin = await Admin.findByIdAndUpdate(id, updateData, { new: true }).select("-password");
        if (!admin) {
            throw new ApiError(404, "Admin not found", "ADMIN_NOT_FOUND");
        }
        return res.success(200, "Admin updated successfully", { email: admin.email });
    }))
    .delete(checkAuth("superadmin"), safeHandler(async (req, res) => {
        const { id } = req.params;
        if(!isValidObjectId(id)) throw new ApiError(400, "Invalid admin ID", "INVALID_ID");
        const admin = await Admin.findByIdAndDelete(id).select("-password");
        if (!admin) {
            throw new ApiError(404, "Admin not found", "ADMIN_NOT_FOUND");
        }
        return res.success(200, "Admin deleted successfully", { email: admin.email });
    }));

export default router;