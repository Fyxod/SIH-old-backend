import express from 'express';
import fs from 'fs';
import { safeHandler } from '../middlewares/safeHandler.js';
import { resumeUpload } from '../utils/multer.js';
import ApiError from '../utils/errorClass.js';
import FormData from 'form-data';
import axios from 'axios';
import { generateToken } from '../utils/jwtFuncs.js';

const router = express.Router();

router.get('/parse', resumeUpload.single("resume"), safeHandler(async (req, res) => {
    if (!req.file) {
        throw new ApiError(400, "No file uploaded", "NO_FILE_UPLOADED");
    }
    console.log(req.file);
    const formData = new FormData();
    formData.append("resume", fs.createReadStream(req.file.path));
    let response; // temp
    try {
        // const response = await axios.post('https://some-link-ig/parse', formData, {
        //     headers: {
        //         ...formData.getHeaders(),
        //     },
        //     timeout: 6000
        // });
        // const data = response.data;
        // const filteredData = Object.fromEntries(
        //     Object.entries(data).filter(([_, value]) => value != null)
        // );

        // if(filteredData.mobile_number) {
        //     filteredData.mobileNo = filteredData.mobile_number;
        //     delete filteredData.mobile_number;
        // }
        // if(filteredData.email) {
        //     filteredData.email = filteredData.email.toLowerCase();
        // }
        // if(filteredData.college_name) {
        //     filteredData.institute = filteredData.college_name;
        //     delete filteredData.college_name;
        // }
        // if(filteredData.company_name){
        //     filteredData.currentDepartment = filteredData.company_name;
        //     delete filteredData.company_name;
        // }
        const resumeToken = generateToken({ name: response?.data.name || "testname", email: response?.data.email || "testemail@gmail.com", resumeName: req.file.filename });
        res.cookie("resumeToken", resumeToken, { httpOnly: true });
        res.success(200, "Resume parsed successfully", { name: response?.data.name || "testname", email: response?.data.email || "testemail@gmail.com", skills: response?.data.skills || ["nodejs", "express", "react"], resumeToken });
    } catch (error) {
        console.error(error); // temp log
        if (error.code === 'ECONNABORTED') {
            throw new ApiError(504, "Request timed out", "REQUEST_TIMEOUT");
        } else {
            throw new ApiError(500, error.data?.message || "Error parsing resume", "RESUME_PARSE_ERROR");
            // throw new ApiError(500, "Error parsing resume", "RESUME_PARSE_ERROR");
        }
    }
}));

export default router;