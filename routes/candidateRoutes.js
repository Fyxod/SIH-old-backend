import express from 'express';
import checkAuth from '../middlewares/authMiddleware.js';
import Candidate from '../models/candidate.js';
import Subject from '../models/subject.js';
import { safeHandler } from '../middlewares/safeHandler.js';
import { resumeUpload } from '../utils/multer.js';
import ApiError from '../utils/errorClass.js';
import bcrypt from 'bcrypt';
import fs from 'fs';
import FormData from 'form-data';
import { generateToken, verifyToken } from '../utils/jwtFuncs.js';
import { candidateLoginSchema, candidateRegistrationSchema, candidateUpdateSchema } from '../utils/zodSchemas.js';
import path from 'path';
import config from '../config/config.js';
import getSelectedFields from '../utils/selectFields.js';
const tempResumeFolder = config.paths.resume.temporary;
const candidateResumeFolder = config.paths.resume.candidate;

const router = express.Router();
// the rout / is being used to do crud of an candidate by admin or someone of  higher level
router.route('/')
    .get(checkAuth("admin"), safeHandler(async (req, res) => {
        const candidates = await Candidate.find();
        if (!candidates || candidates.length === 0) {
            throw new ApiError(404, "No candidate was found", "NO_CANDIDATES_FOUND");
        }
        return res.success(200, "All candidates successfully retrieved", { candidates });
    }))

    .post(checkAuth("admin"), safeHandler(async (req, res) => {
        const { name, email, password, mobileNo, dateOfBirth, education, skills, experience, linkedin, resumeToken } = candidateRegistrationSchema.parse(req.body);
        // will apply multer for image later

        const findArray = [
            { email },
            { mobileNo }
        ];
        if (linkedin) findArray.push({ linkedin });

        const candidateExists = await Candidate.findOne({
            $or: findArray
        });

        if (candidateExists) {
            let existingField;

            if (candidateExists.email === email) existingField = 'Email';
            else if (candidateExists.mobileNo === mobileNo) existingField = 'Mobile number';
            else if (candidateExists.linkedIn && candidateExists.linkedin === linkedin) existingField = 'Linkedin id';

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
            // image,
            gender
        });

        return res.success(201, "candidate successfully created", { candidate: { id: candidate._id, email: candidate.email, name: candidate.name } });

    }))

    .delete(checkAuth("admin"), safeHandler(async (req, res) => {
        const candidates = await Candidate.deleteMany();
        if (!candidates) {
            throw new ApiError(404, "No candidates found", "NO_CANDIDATES_FOUND");
        }
        await Subject.updateMany({}, { $pull: { candidates: { $in: candidates.map(c => c._id) } } });
        return res.success(200, "All candidates successfully deleted", { candidates });
    }));

router.route('/:id')
    .get(checkAuth("candidate"), safeHandler(async (req, res) => {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw new ApiError(400, "Invalid candidate ID", "INVALID_ID");
        const { education, experience } = req.body;

        const candidate = await Candidate.findById(id).select(getSelectedFields(education, experience));

        if (!candidate) {
            throw new ApiError(404, "Candidate not found", "CANDIDATE_NOT_FOUND");
        }
        return res.success(200, "Candidate found", { candidate });
    }))

    .patch(checkAuth("candidate"), safeHandler(async (req, res) => {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw new ApiError(400, "Invalid candidate ID", "INVALID_ID");

        const updates = candidateUpdateSchema.parse(req.body);

        const filteredUpdates = Object.fromEntries(
            Object.entries(updates).filter(([_, value]) => value != null)
        );

        const uniqueCheck = [];
        if (filteredUpdates.email) uniqueCheck.push({ email: filteredUpdates.email });
        if (filteredUpdates.mobileNo) uniqueCheck.push({ mobileNo: filteredUpdates.mobileNo });
        if (filteredUpdates.linkedin) uniqueCheck.push({ linkedin: filteredUpdates.linkedin });

        if (uniqueCheck.length > 0) {
            const candidateExists = await Candidate.findOne({
                $or: uniqueCheck
            });

            if (candidateExists && candidateExists._id.toString() !== id) {
                let existingField;

                if (candidateExists.email === filteredUpdates.email) existingField = 'Email';
                else if (candidateExists.mobileNo === filteredUpdates.mobileNo) existingField = 'Mobile number';
                else if (candidateExists.linkedIn && candidateExists.linkedin === filteredUpdates.linkedin) existingField = 'Linkedin id';

                throw new ApiError(400, `Candidate already exists with this ${existingField}`, "CANDIDATE_ALREADY_EXISTS");
            }
        }

        if (filteredUpdates.resumeToken) {
            try {
                const payload = verifyToken(filteredUpdates.resumeToken);
                const resumeName = payload.resumeName;
                const resumePath = path.join(__dirname, `../public/${tempResumeFolder}/${resumeName}`);

                const fileExists = await fs.promises.access(resumePath).then(() => true).catch(() => false);

                if (fileExists) {
                    const candidate = await Candidate.findById(id);
                    if (candidate.resume) {
                        try {
                            await fs.promises.unlink(path.join(__dirname, `../public/${candidateResumeFolder}/${candidate.resume}`));
                        } catch (error) {
                            if (error.code === 'ENOENT') {
                                console.log('File does not exist');
                            } else {
                                console.error('An error occurred:', error);
                            }
                        }
                    }

                    const newResumeName = `${candidate.name.split(' ')[0]}_resume_${new Date().getTime()}.pdf`;
                    const destinationFolder = path.join(__dirname, `../public/${candidateResumeFolder}`);
                    const newFilePath = path.join(destinationFolder, newResumeName);
                    await fs.promises.mkdir(destinationFolder, { recursive: true });
                    await fs.promises.rename(resumePath, newFilePath);

                    filteredUpdates.resume = newResumeName;
                }
            } catch (error) {
                console.log("Error processing resume during update", error);
            }

            delete filteredUpdates.resumeToken;
        }

        if (filteredUpdates.password) {
            filteredUpdates.password = await bcrypt.hash(filteredUpdates.password, 10);
        }

        const candidate = await Candidate.findByIdAndUpdate(
            id,
            filteredUpdates,
            {
                new: true,
                runValidators: true
            }
        ).select("-password");

        if (!candidate) {
            throw new ApiError(404, "Candidate not found", "CANDIDATE_NOT_FOUND");
        }

        return res.success(200, "Candidate updated successfully", { candidate });
    }))

    .delete (checkAuth("admin"), safeHandler(async (req, res) => {
            const { id } = req.params;
            if (!isValidObjectId(id)) throw new ApiError(400, "Invalid candidate ID", "INVALID_ID");

            const candidate = await Candidate.findByIdAndDelete(id).select("-password");
            if (!candidate) {
                throw new ApiError(404, "Candidate not found", "CANDIDATE_NOT_FOUND");
            }

            await Subject.updateMany({ _id: { $in: candidate.subjects } }, { $pull: { candidates: candidate._id } });
            return res.success(200, "Candidate deleted successfully", { candidate });
        }));

        router.get('/parse', checkAuth("candidate"), resumeUpload.single("resume"), safeHandler(async (req, res) => {
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

            const userToken = generateToken({ id: candidate._id, role: "candidate" });
            return res.success(200, "Successfully logged in", { userToken, candidate: { id: candidate._id, email: candidate.email, name: candidate.name } });
        }));

        export default router;
