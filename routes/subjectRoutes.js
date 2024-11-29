import express from 'express';
import checkAuth from '../middlewares/authMiddleware.js';
import { safeHandler } from '../middlewares/safeHandler.js';
import ApiError from '../utils/errorClass.js';
import Subject from '../models/subject.js';
import { subjectSchema } from '../utils/zodSchemas.js';

const router = express.Router();

router.route('/')
    .get(checkAuth('admin'), safeHandler(async (req, res) => {
        const subjects = await Subject.find();

        if (!subjects) {
            throw new ApiError(404, 'No subjects found', 'NO_SUBJECTS_FOUND');
        }
        return res.success(200, 'All subjects successfully retrieved', { subjects });
    }))
    .post(checkAuth('admin'), safeHandler(async (req, res) => {
        const { title, description, department, type, recommendedSkills } = subjectSchema.parse(req.body);
        const subject = await Subject.create({
            title,  
            description,
            department,
            type,
            recommendedSkills,
            status: 'open',
            applicants: [],
            experts: []
        });

        return res.success(201, 'Subject successfully created', { subject });
    }));