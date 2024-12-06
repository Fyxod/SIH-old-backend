import express from 'express';
import checkAuth from '../middlewares/authMiddleware.js';
import multer from 'multer';
import path from 'path';
import { safeHandler } from '../middlewares/safeHandler.js';
import { resumeUpload } from '../utils/multer.js';
import ApiError from '../utils/errorClass.js';

const   router = express.Router();

router.get('/parse', resumeUpload.single("resume"), safeHandler(async (req, res) => {
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
        const data = response.data;
        const filteredData = Object.fromEntries(
            Object.entries(data).filter(([_, value]) => value != null)
        );

        if(filteredData.mobile_number) {
            filteredData.mobileNo = filteredData.mobile_number;
            delete filteredData.mobile_number;
        }
        if(filteredData.email) {
            filteredData.email = filteredData.email.toLowerCase();
        }
        if(filteredData.college_name) {
            filteredData.university = filteredData.college_name;
            delete filteredData.college_name;
        }
        if(filteredData.company_name){
            filteredData.currentDepartment = filteredData.company_name;
            delete filteredData.company_name;
        }
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

export default router;