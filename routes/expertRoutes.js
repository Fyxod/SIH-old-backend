import express from 'express';
import checkAuth from '../middlewares/authMiddleware.js';
import Expert from '../models/expert.js';
import { safeHandler } from '../middlewares/safeHandler.js';
import { resumeUpload } from '../utils/multer.js';
import ApiError from '../utils/errorClass.js';
import bcrypt from 'bcrypt';
import fs from 'fs';
import FormData from 'form-data';
import { generateToken, verifyToken } from '../utils/jwtFuncs.js';
import { expertRegistrationSchema, expertLoginSchema } from '../utils/zodSchemas.js';
import path from 'path';
import config from '../config/config.js';
import getSelectedFields from '../utils/selectFields.js';
const tempResumeFolder = config.paths.resume.temporary;
const expertResumeFolder = config.paths.resume.expert;

const router = express.Router();

router.route('/')
    .get(checkAuth("admin"), safeHandler(async (req, res) => {
        const experts = await Expert.find();
        if (!experts) {
            throw new ApiError(404, "No experts found", "NO_EXPERTS_FOUND");
        }
        return res.success(200, "All experts successfully retrieved", { experts });
    }))
    .post(checkAuth("admin"), safeHandler(async (req, res) => {
        const { name, email, mobileNo, gender, bio, dateOfBirth, education, experience, currentPosition, currentDepartment, skills, linkedin, resumeToken } = expertRegistrationSchema.parse(req.body);

        const expertExists = await Expert.findOne({
            $or: [
                { email },
                { mobileNo },
                { linkedin }
            ]
        });

        if (expertExists) {
            let existingField;

            if (expertExists.email === email) existingField = 'Email';
            else if (expertExists.mobileNo === mobileNo) existingField = 'Mobile number';
            else if (expertExists.linkedin === linkedin) existingField = 'Linkedin id';

            throw new ApiError(400, `Expert already exists with this ${existingField}`, "EXPERT_ALREADY_EXISTS");
        }
        let newResumeName = null;

        if (resumeToken) {
            try {
                const payload = verifyToken(resumeToken);
                const resumeName = payload.resumeName;
                const resumePath = path.join(__dirname, `../public/${tempResumeFolder}/${resumeName}`);

                const fileExists = await fs.promises.access(resumePath).then(() => true).catch(() => false);

                if (fileExists) {
                    newResumeName = `${name.split(' ')[0]}_resume_${new Date().getTime()}.pdf`;
                    const destinationFolder = path.join(__dirname, `../public/${expertResumeFolder}`);
                    const newFilePath = path.join(destinationFolder, newResumeName);
                    await fs.promises.mkdir(destinationFolder, { recursive: true });
                    await fs.promises.rename(resumePath, newFilePath);
                }
            } catch (error) {
                console.log("Error processing resume during registration", error);
            }
        }

        const password = `${name.split(' ')[0].toUpperCase()}@${new Date(dateOfBirth).getFullYear()}`;
        const hash = await bcrypt.hash(password, 10);
        const expert = await Expert.create({
            name,
            email,
            password: hash,
            mobileNo,
            gender,
            bio,
            education,
            experience,
            currentPosition,
            currentDepartment,
            skills,
            linkedin,
            resume: newResumeName
        });

        return res.success(201, "Expert successfully created", { expert: { id: expert._id, email: expert.email, name: expert.name } });

    }))
    .delete(checkAuth("admin"), safeHandler(async (req, res) => {
        const experts = await Expert.deleteMany();
        if (!experts) {
            throw new ApiError(404, "No experts found", "NO_EXPERTS_FOUND");
        }
        return res.success(200, "All experts successfully deleted", { experts });
    }));

router.route('/:id')
    .get(checkAuth("expert"), safeHandler(async (req, res) => {
        const { id } = req.params;
        const { education, experience } = req.body;

        const expert = await Expert.findById(id).select(getSelectedFields(education, experience));

        if (!expert) {
            throw new ApiError(404, "Expert not found", "EXPERT_NOT_FOUND");
        }
        return res.success(200, "Expert found", { expert });
    }))

    .delete(checkAuth("admin"), safeHandler(async (req, res) => {
        const { id } = req.params;
        const expert = await Expert.findByIdAndDelete(id).select("-password");
        if (!expert) {
            throw new ApiError(404, "Expert not found", "EXPERT_NOT_FOUND");
        }
        return res.success(200, "Expert deleted successfully", { expert });
    }));

router.get('/parse', checkAuth("admin"), resumeUpload.single("resume"), safeHandler(async (req, res) => {
    if (!req.file) {
        throw new ApiError(400, "No file uploaded", "NO_FILE_UPLOADED");
    }
    const formData = new FormData();
    formData.append("resume", fs.createReadStream(req.file.path));

    try {
        const response = await axios.post('https://some-link-ig/parse', formData, {
            headers: {
                ...formData.getHeaders(),
            },
            timeout: 6000
        });
        const resumeToken = generateToken({ name: response.data.name, email: response.data.email, resumeName: "yaha par kaunsa naam daalna hai dekhlo" });
        res.cookie("resumeToken", resumeToken, { httpOnly: true });
        res.success(200, "Resume parsed successfully", { name: response.data.name, email: response.data.email, skills: response.data.skills });
    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            throw new ApiError(504, "Request timed out", "REQUEST_TIMEOUT");
        } else {
            throw new ApiError(500, error.data?.message || "Error parsing resume", "RESUME_PARSE_ERROR");
            // throw new ApiError(500, "Error parsing resume", "RESUME_PARSE_ERROR");
        }
    }
}));

router.post('/signin', safeHandler(async (req, res) => {
    const { email, password } = expertLoginSchema.parse(req.body);
    const expert = await Expert.findOne({ email });
    if (!expert) {
        throw new ApiError(404, "Invalid email or password", "INVALID_CREDENTIALS");
    }
    const validPassword = await bcrypt.compare(password, expert.password);
    if (!validPassword) {
        throw new ApiError(404, "Invalid email or password", "INVALID_CREDENTIALS");
    }
    const userToken = generateToken({ id: expert._id, role: expert.role });
    return res.success(200, "Successfully logged in", { userToken });
}));

export default router;
