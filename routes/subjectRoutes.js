import express, { application } from 'express';
import checkAuth from '../middlewares/authMiddleware.js';
import { safeHandler } from '../middlewares/safeHandler.js';
import ApiError from '../utils/errorClass.js';
import Subject from '../models/subject.js';
import { subjectSchema, subjectUpdateSchema } from '../utils/zodSchemas.js';
import { priority } from '../config/config.js';
import Candidate from '../models/candidate.js';
import { isValidObjectId } from 'mongoose';
import Expert from '../models/expert.js';
import getSelectedFields from '../utils/selectFields.js';

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
        if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid subject ID', 'INVALID_ID');
        const { candidates, experts } = req.query;

        let populateOptions = [];
        if (candidates && priority[req.user.role] >= priority['expert']) {
            populateOptions.push({
                path: 'applicants',
                select: '-password',
            });
        }
        if (experts && priority[req.user.role] >= priority['admin']) {
            populateOptions.push({
                path: 'experts',
                select: '-password',
            });
        }

        const subject = await Subject.findById(id).populate(populateOptions);

        if (!subject) {
            throw new ApiError(404, 'Subject not found', 'SUBJECT_NOT_FOUND');
        }
        return res.success(200, 'Subject found', { subject });
    }))

    .patch(checkAuth('admin'), safeHandler(async (req, res) => {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid subject ID', 'INVALID_ID');

        const updates = subjectUpdateSchema.parse(req.body);

        const filteredUpdates = Object.fromEntries(
            Object.entries(updates).filter(([_, value]) => value != null)
        );

        const subject = await Subject.findByIdAndUpdate(
            id,
            filteredUpdates,
            {
                new: true,
                runValidators: true
            }
        )

        if (!subject) {
            throw new ApiError(404, 'Subject not found', 'SUBJECT_NOT_FOUND');
        }
        return res.success(200, 'Subject updated successfully', { subject });
    }))

    .delete(checkAuth('admin'), safeHandler(async (req, res) => {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid subject ID', 'INVALID_ID');
        const subject = await Subject.findByIdAndDelete(id);

        if (!subject) {
            throw new ApiError(404, 'Subject not found', 'SUBJECT_NOT_FOUND');
        }
        return res.success(200, 'Subject deleted successfully', { subject });
    }));

router.route('/:id/candidate')

    .get(checkAuth('expert'), safeHandler(async (req, res) => { //kinda a redundant route since we can get the same data from the subject/:id route with the query parameter (candidates=true)
        const { id } = req.params;
        if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid subject ID', 'INVALID_ID');

        const { education, experience } = req.body;

        const subject = await Subject.findById(id)
            .populate({
                path: 'applicants',
                select: getSelectedFields(education, experience)
            });

        if (!subject) {
            throw new ApiError(404, 'Subject not found', 'SUBJECT_NOT_FOUND');
        }
        return res.success(200, 'All candidates retrieved', { candidates: subject.applicants });
    }))

    .post(checkAuth('candidate'), safeHandler(async (req, res) => {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid subject ID', 'INVALID_ID');

        const subject = await Subject.findById(id);

        if (!subject) {
            throw new ApiError(404, 'Subject not found', 'SUBJECT_NOT_FOUND');
        }
        const alreadyApplied = subject.applicants.some(applicant => applicant.id.equals(req.user.id));
        if (alreadyApplied) {
            throw new ApiError(400, 'Already applied', 'ALREADY_APPLIED');
        }
        const candidate = await Candidate.findById(req.user.id);
        if (!candidate) {
            throw new ApiError(404, 'Candidate not found', 'CANDIDATE_NOT_FOUND');
        }

        candidate.appliedSubjects.push(id);
        subject.applicants.push({
            id: req.user.id,
            relevancyScore: 0
        })

        await Promise.all([candidate.save(), subject.save()]);
        //send an axios here request to update the scores of experts and candidates
        return res.success(200, 'Successfully applied', { subject });
    }
    ));

router.route('/:id/expert')
    .get(checkAuth('admin'), safeHandler(async (req, res) => { //kinda a redundant route since we can get the same data from the subject/:id route with the query parameter (experts=true)
        const { id } = req.params;
        if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid subject ID', 'INVALID_ID');

        const { education, experience } = req.body;

        const subject = await Subject.findById(id)
            .populate({
                path: 'experts',
                select: getSelectedFields(education, experience)
            });

        if (!subject) {
            throw new ApiError(404, 'Subject not found', 'SUBJECT_NOT_FOUND');
        }
        return res.success(200, 'All experts retrieved', { experts: subject.experts });
    }))

    .post(checkAuth('expert'), safeHandler(async (req, res) => {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid subject ID', 'INVALID_ID');

        const subject = await Subject.findById(id);

        if (!subject) {
            throw new ApiError(404, 'Subject not found', 'SUBJECT_NOT_FOUND');
        }
        const expertAlreadyAdded = subject.experts.some(expert => expert.id.equals(req.user.id));
        if (expertAlreadyAdded) {
            throw new ApiError(400, 'Already applied', 'ALREADY_APPLIED');
        }
        const expert = await Expert.findById(req.user.id);
        if (!expert) {
            throw new ApiError(404, 'Expert not found', 'EXPERT_NOT_FOUND');
        }

        expert.appliedSubjects.push(id);
        subject.experts.push({
            id: req.user.id,
            profileScore: 0,
            relevancyScore: 0
        });

        await Promise.all([expert.save(), subject.save()]);
        //send an axios here request to update the scores of experts and candidates
        return res.success(200, 'Successfully applied', { subject });
    }));
//not completed yet
export default router;