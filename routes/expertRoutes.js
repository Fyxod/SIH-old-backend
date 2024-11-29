import express from 'express';
import checkAuth from '../middlewares/checkAuth.js';
import Expert from '../models/expert.js';
import { safeHandler } from '../middlewares/safeHandler.js';
import { resumeUpload } from '../utils/multer.js';
import ApiError from '../utils/errorClass.js';
import FormData from 'form-data';
import { generateToken } from '../utils/jwtFuncs.js';

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
        const { name, email, mobileNo, gender, education, experience, department, skills, linkedin,  } = req.body;
        
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
        const expert = null;
        if(education && experience) {
            expert = await Expert.findById(id).select("-password");
        }
        else if(education) {
            expert = await Expert.findById(id).select("-password -experience");
        }
        else if(experience) {
            expert = await Expert.findById(id).select("-password -education");
        }
        else {
            expert = await Expert.findById(id).select("-password -education -experience");
        }
        if (!expert) {
            throw new ApiError(404, "Expert not found", "EXPERT_NOT_FOUND");
        }
        return res.success(200, "Expert found", { expert });
    }))

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