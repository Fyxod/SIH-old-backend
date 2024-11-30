import express from 'express';
import checkAuth from '../middlewares/authMiddleware.js';
import { safeHandler } from '../middlewares/safeHandler.js';
import ApiError from '../utils/errorClass.js';
import Subject from '../models/subject.js';
import { subjectSchema, subjectUpdateSchema } from '../utils/zodSchemas.js';
import { priority } from '../config/config.js';

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

router.route('/:id')
    .get(checkAuth('candidate'), safeHandler(async (req, res) => {
        const { id } = req.params;
        const { candidates, experts } = req.query;

        let populateFields = '';
        if (candidates && priority[req.user.role] >= priority['expert']) {
            populateFields = populateFields + 'applicants ';
        }
        if (experts && priority[req.user.role] >= priority['admin']) {
            populateFields = populateFields + 'experts ';
        }

        const subject = await Subject.findById(id).populate(populateFields.trim());

        if (!subject) {
            throw new ApiError(404, 'Subject not found', 'SUBJECT_NOT_FOUND');
        }
        return res.success(200, 'Subject found', { subject });
    }))

    .patch(checkAuth('admin'), safeHandler(async (req, res) => {
        const { id } = req.params;
        const updates = subjectUpdateSchema.parse(req.body);

        const filteredUpdates = Object.fromEntries(
            Object.entries(updates).filter(([_, value]) => value != null)
        );

        const subject = await Subject.findByIdAndUpdate(
            id,
            filteredUpdates,
            { new: true }
        )

        if (!subject) {
            throw new ApiError(404, 'Subject not found', 'SUBJECT_NOT_FOUND');
        }
        return res.success(200, 'Subject updated successfully', { subject });
    }))

    .delete(checkAuth('admin'), safeHandler(async (req, res) => {
        const { id } = req.params;
        const subject = await Subject.findByIdAndDelete(id);

        if (!subject) {
            throw new ApiError(404, 'Subject not found', 'SUBJECT_NOT_FOUND');
        }
        return res.success(200, 'Subject deleted successfully', { subject });
    }));

router.route('/:id/candidate')
    .post(checkAuth('candidate'), safeHandler(async (req, res) => {
        const { id } = req.params;
        const subject = await Subject.findById(id);

        if (!subject) {
            throw new ApiError(404, 'Subject not found', 'SUBJECT_NOT_FOUND');
        }

        if (subject.applicants.includes(req.user.id)) {
            throw new ApiError(400, 'Already applied', 'ALREADY_APPLIED');
        }
        const candidate = await 
        subject.applicants.push(req.user.id);
        await subject.save();

        return res.success(200, 'Successfully applied', { subject });
    }
    ));
