import express from 'express';
import checkAuth from '../middlewares/authMiddleware.js';
import Candidate from '../models/candidate.js';
import { safeHandler } from '../middlewares/safeHandler.js';
import { resumeUpload } from '../utils/multer.js';
import ApiError from '../utils/errorClass.js';
import bcrypt from 'bcrypt';
import fs from 'fs';
import FormData from 'form-data';
import { generateToken, verifyToken } from '../utils/jwtFuncs.js';
import {candidateLoginSchema,candidateRegistrationSchema } from '../utils/zodSchemas.js';
import path from 'path';
import config from '../config/config.js';
import getSelectedFields from '../utils/selectFields.js';
const tempResumeFolder = config.paths.resume.temporary;
const candiadteResumeFolder = config.paths.resume.candidate;

const router = express.Router();
// the rout / is being used to do crud of an candidate by admin or someone of  higher level
router.route('/')
    .get(checkAuth("admin"), safeHandler(async (req, res) => {
        const candidates = await Candidate.find();
        if (!candidates) {
        throw new ApiError(404, "No candidate was found", "NO_CANDIDATES_FOUND");
        }
        return res.success(200, "All candidates successfully retrieved", { candidates });
    }))
       // to de updated 
    .post(checkAuth("admin"), safeHandler(async (req, res) => {
        const { name, email, mobileNo, dateOfBirth, education, skills, experience, linkedin, resumeToken , image } = candidateRegistrationSchema.parse(req.body);
// what is resume token and why askfor it - bugslayer01
        const candidateExists = await Candidate.findOne({
            $or: [
                { email },
                { mobileNo },
                { linkedin }
            ]
        });

        if (candidateExists) {
            let existingField;

            if (candidateExists.email === email) existingField = 'Email';
            else if (candidateExists.mobileNo === mobileNo) existingField = 'Mobile number';
            else if (candidateExists.linkedin === linkedin) existingField = 'Linkedin id';

            throw new ApiError(400, `Candidate already exists with this ${existingField}`, "CANDIDATE_ALREADY_EXISTS");
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
                    const destinationFolder = path.join(__dirname, `../public/${candidateResumeFolder}`);
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
        const candidate = await Candidate.create({
            password: hash,
            resume: newResumeName,
            name,
            email,  
            mobileNo,
            dateOfBirth,
            education, 
            skills, 
            experience,
            linkedin, 
            image
        });

        return res.success(201, "candidate successfully created", { candidate: { id: candidate._id, email: candidate.email, name: candidate.name } });

    }))


    .delete(checkAuth("admin"), safeHandler(async (req, res) => {
        const candidates = await Candidate.deleteMany();
        if (!candidates) {
            throw new ApiError(404, "No candidates found", "NO_CANDIDATES_FOUND");
        }
        return res.success(200, "All candidates successfully deleted", { candidates });
    }));

router.route('/:id')
    .get(checkAuth("candidate"), safeHandler(async (req, res) => {
        const { id } = req.params;
        const { education, experience } = req.body;
        const candidate = await Candidate.findById(id).select(getSelectedFields(education, experience));

        if (!candidate) {
            throw new ApiError(404, "Candidate not found", "CANDIDATE_NOT_FOUND");
        }
        return res.success(200, "Candidate found", { candidate });
    }))

    .delete(checkAuth("admin"), safeHandler(async (req, res) => {
        const { id } = req.params;
        const candidate = await Candidate.findByIdAndDelete(id).select("-password");
        if (!candidate) {
            throw new ApiError(404, "Candidate not found", "CANDIDATE_NOT_FOUND");
        }
        return res.success(200, "Candidate deleted successfully", { candidate });
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

// there are two diff schema for expert and candidate so we need diff end points

router.post('/signin', safeHandler(async (req, res) => {
    const { email, password } = candidateLoginSchema.parse(req.body);
    const candidate = await Candidate.findOne({ email });
    if (!candidate) {
        throw new ApiError(404, "Invalid email or password", "INVALID_CREDENTIALS");
    }
    const validPassword = await bcrypt.compare(password, candidate.password);
    if (!validPassword) {
        throw new ApiError(404, "Invalid email or password", "INVALID_CREDENTIALS");
    }
    const userToken = generateToken({ id: candidate._id, role: candidate.role });
    return res.success(200, "Successfully logged in", { userToken });
}));

export default router;
