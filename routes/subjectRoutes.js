import express, { application } from 'express';
import checkAuth from '../middlewares/authMiddleware.js';
import { safeHandler } from '../middlewares/safeHandler.js';
import ApiError from '../utils/errorClass.js';
import Subject from '../models/subject.js';
import { subjectSchema, subjectUpdateSchema } from '../utils/zodSchemas.js';
import config from '../config/config.js';
import Candidate from '../models/candidate.js';
import { isValidObjectId } from 'mongoose';
import Expert from '../models/expert.js';
import getSelectedFields from '../utils/selectFields.js';
import { calculateAllCandidateScoresSingleSubject, calculateAllExpertScoresSingleSubject, calculateSingleCandidateScoreSingleSubject,  calculateSingleExpertScoresSingleSubject } from '../utils/updateScores.js';
import Application from '../models/application.js';

const router = express.Router();

router.route('/')
    .get(checkAuth('admin'), safeHandler(async (req, res) => {
        const subjects = await Subject.find();

        if (!subjects || subjects.length === 0) {
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
    }))

    .delete(checkAuth('admin'), safeHandler(async (req, res) => {
        const subjects = await Subject.deleteMany();
        if (!subjects) {
            throw new ApiError(404, 'No subjects found', 'NO_SUBJECTS_FOUND');
        }
        await Promise.all([
            Expert.updateMany({}, { $set: { subjects: [] } }),
            Candidate.updateMany({}, { $set: { subjects: [] } })
        ]);
        return res.success(200, 'All subjects successfully deleted', { subjects });
    }));

router.route('/:id')
    .get(checkAuth('candidate'), safeHandler(async (req, res) => {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid subject ID', 'INVALID_ID');
        const { candidates, experts } = req.query;

        let populateOptions = [];
        if (candidates && config.priority[req.user.role] >= config.priority['expert']) {
            populateOptions.push({
                path: 'applicants',
                select: '-password',
            });
        }
        if (experts && config.priority[req.user.role] >= config.priority['admin']) {
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
        if (filteredUpdates.skills) {
            calculateAllCandidateScoresSingleSubject(id);
            calculateAllExpertScoresSingleSubject(id);
        }
        return res.success(200, 'Subject updated successfully', { subject });
    }))
    .put(checkAuth('admin'), safeHandler(async (req, res) => {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid subject ID', 'INVALID_ID');

        const updates = subjectSchema.parse(req.body);

        const subject = await Subject.findByIdAndUpdate(
            id,
            updates,
            {
                new: true,
                runValidators: true
            }
        )

        if (!subject) {
            throw new ApiError(404, 'Subject not found', 'SUBJECT_NOT_FOUND');
        }

        calculateAllCandidateScoresSingleSubject(id);
        calculateAllExpertScoresSingleSubject(id);

        return res.success(200, 'Subject updated successfully', { subject });
    }))

    .delete(checkAuth('admin'), safeHandler(async (req, res) => {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid subject ID', 'INVALID_ID');

        const subject = await Subject.findByIdAndDelete(id);
        if (!subject) {
            throw new ApiError(404, 'Subject not found', 'SUBJECT_NOT_FOUND');
        }

        try {
            await Promise.all([
                Candidate.updateMany(
                    { _id: { $in: subject.applicants.map(applicant => applicant.id) } },
                    { $pull: { subjects: id } }
                ),
                Expert.updateMany(
                    { _id: { $in: subject.experts.map(expert => expert.id) } },
                    { $pull: { subjects: id } }
                ),
                Application.deleteMany({ subject: id })
            ]);

            return res.success(200, 'Subject deleted successfully', { subject });
        } catch (error) {
            throw new ApiError(500, 'Failed to update applicants or experts', 'UPDATE_ERROR');
        }
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

        candidate.subjects.push(id);

        subject.applicants.push({
            id: req.user.id,
            relevancyScore: 0
        })

        const application = await Application.create({
            candidate: req.user.id,
            subject: id,
            status: 'pending'
        });

        candidate.applications.push(application.id);
        subject.applications.push(application.id);

        await Promise.all([candidate.save(), subject.save()]);

        calculateSingleCandidateScoreSingleSubject(id, req.user.id);
        calculateAllExpertScoresSingleSubject(id);

        return res.success(200, 'Successfully applied', { subject, application });
    }));

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

    .post(checkAuth('admin'), safeHandler(async (req, res) => {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid subject ID', 'INVALID_ID');

        const subject = await Subject.findById(id);

        if (!subject) {
            throw new ApiError(404, 'Subject not found', 'SUBJECT_NOT_FOUND');
        }
        const expertAlreadyAdded = subject.experts.some(expert => expert.id.equals(req.user.id));
        if (expertAlreadyAdded) {
            throw new ApiError(400, 'Expert already added the subject', 'ALREADY_ADDED');
        }
        const expert = await Expert.findById(req.user.id);
        if (!expert) {
            throw new ApiError(404, 'Expert not found', 'EXPERT_NOT_FOUND');
        }

        expert.subjects.push(id);
        subject.experts.push({
            id: req.user.id,
            profileScore: 0,
            relevancyScore: 0
        });

        await Promise.all([expert.save(), subject.save()]);
        calculateSingleExpertScoresSingleSubject(id, req.user.id);
        return res.success(200, 'Successfully applied', { subject });
    }));

export default router;