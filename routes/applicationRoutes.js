import express from 'express';
import { safeHandler } from '../middlewares/safeHandler.js';
import checkAuth from '../middlewares/authMiddleware.js';
import Application from '../models/application.js';
import Subject from '../models/subject.js';
import Candidate from '../models/candidate.js';
import Expert from '../models/expert.js';
import ApiError from '../utils/errorClass.js';
import { isValidObjectId } from 'mongoose';
import Feedback from '../models/feedback.js';
import { applicationRegistrationSchema } from '../utils/zodSchemas.js';
import { calculateAllExpertScoresSingleSubject, calculateAllExpertsScoresMultipleSubjects, calculateSingleCandidateScoreSingleSubject } from '../utils/updateScores.js';
// Also place the update functions here at appropriate places
const router = express.Router();

router.route('/')
    .get(checkAuth('admin'), safeHandler(async (req, res) => {
        const { candidate, subject, panel, feedback } = req.query; // Boolean fields

        const populateFields = [];
        if (candidate === "true" || candidate === true) populateFields.push('candidate');
        if (subject === "true" || subject === true) populateFields.push('subject');
        if (panel === "true" || panel === true) populateFields.push('panel.expert');
        if (feedback === "true" || feedback === true) populateFields.push('panel.feedback');

        const applications = await Application.find().populate(populateFields);
        return res.success(200, "Applications fetched successfully", { applications });
    }))

    .post(checkAuth('admin'), safeHandler(async (req, res) => {
        const { subjectId, candidateId } = req.body;
        if (!isValidObjectId(subjectId)) throw new ApiError(400, 'Invalid subject id', 'INVALID_ID');
        if (!isValidObjectId(candidateId)) throw new ApiError(400, 'Invalid candidate id', 'INVALID_ID');
        const [subject, candidate] = await Promise.all([Subject.findById(subjectId), Candidate.findById(candidateId)]);

        if (!subject) {
            throw new ApiError(404, 'Subject not found', 'SUBJECT_NOT_FOUND');
        }
        if (!candidate) {
            throw new ApiError(404, 'Candidate not found', 'CANDIDATE_NOT_FOUND');
        }

        const alreadyApplied = subject.candidates.some(candidate => candidate.id.equals(candidateId));
        if (alreadyApplied) {
            throw new ApiError(400, 'Already applied', 'ALREADY_APPLIED');
        }

        subject.candidates.push({
            id: candidateId,
            relevancyScore: 0
        });

        candidate.subjects.push(subjectId);
        const application = await Application.create({
            subject: subjectId,
            candidate: candidateId,
            status: 'pending'
        });
        subject.applications.push(application._id);
        candidate.applications.push(application._id);

        await Promise.all([subject.save(), candidate.save()]);
        calculateSingleCandidateScoreSingleSubject(subjectId, candidateId);
        calculateAllExpertScoresSingleSubject(subjectId);

        return res.success(201, "Application created successfully", { application });
    }))

// .delete(checkAuth('admin'), safeHandler(async (req, res) => {

// }));


//Since there are fewer routes and more niche operations to be done on applications, I have seperated the routes so this might not fully follow RESTful conventions

router.route('/:id')
    .get(checkAuth('candidate'), safeHandler(async (req, res) => {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid application id', 'INVALID_ID');

        const { candidate, subject, panel, feedback } = req.query; // Boolean fields

        const populateFields = [];
        if (candidate === "true" || candidate === true) populateFields.push('candidate');
        if (subject === "true" || subject === true) populateFields.push('subject');
        if (panel === "true" || panel === true) populateFields.push('panel.expert');
        if (feedback === "true" || feedback === true) populateFields.push('panel.feedback');

        const application = await Application.findById(id).populate(populateFields);
        if (!application) {
            throw new ApiError(404, 'Application not found', 'APPLICATION_NOT_FOUND');
        }

        return res.success(200, "Application fetched successfully", { application });
    }))

    .patch(checkAuth('expert'), safeHandler(async (req, res) => { // To update the status of an application
        const { id } = req.params;
        if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid application id', 'INVALID_ID');

        const { status } = req.body;

        if (!['pending', 'shortlisted', 'rejected', 'accepted'].includes(status)) {
            throw new ApiError(400, 'Invalid status', 'INVALID_STATUS');
        }

        const application = await Application.findById(id);
        if (req.user.role === 'expert' && !application.panel.some(expert => expert.expert.equals(req.user.id))) {
            throw new ApiError(403, 'Unauthorized', 'UNAUTHORIZED');
        }

        application.status = status;
        // if (status === 'rejected' || status === 'accepted') {
        //     const subject = await Subject.findById(application.subject);
        //     const candidate = await Candidate.findById(application.candidate);

        //     subject.candidates = subject.candidates.filter(applicant => !applicant.id.equals(application.candidate));
        //     candidate.subjects = candidate.subjects.filter(subject => !subject.equals(application.subject));

        //     await Promise.all([subject.save(), candidate.save()]);
        // }
        await application.save();
        return res.success(200, "Application updated successfully", { application });
    }))

    .delete(checkAuth('admin'), safeHandler(async (req, res) => {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid application id', 'INVALID_ID');

        const application = await Application.findByIdAndDelete(id);
        if (!application) {
            throw new ApiError(404, 'Application not found', 'APPLICATION_NOT_FOUND');
        }

        await Subject.findByIdAndUpdate(application.subject, {
            $pull: {
                candidates: { id: application.candidate },
                applications: application._id
            }
        });

        const candidate = await Candidate.findByIdAndUpdate(application.candidate, {
            $pull: {
                subjects: application.subject,
                applications: application._id
            }
        });

        calculateAllExpertsScoresMultipleSubjects(candidate.subjects);

        return res.success(200, "Application deleted successfully", { application });
    }));

// following routes left to be reviewed

router.route('/:id/panel')
    .get(checkAuth('admin'), safeHandler(async (req, res) => {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid application id', 'INVALID_ID');

        const application = await Application.findById(id).populate('panel.expert panel.feedback');
        if (!application) {
            throw new ApiError(404, 'Application not found', 'APPLICATION_NOT_FOUND');
        }

        return res.success(200, "Panel fetched successfully", { panel: application.panel });
    }))

    .post(checkAuth('admin'), safeHandler(async (req, res) => {
        const { id } = req.params;
        const { expertId } = req.body;
        if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid application id', 'INVALID_ID');
        if (!isValidObjectId(expertId)) throw new ApiError(400, 'Invalid expert id', 'INVALID_ID');

        const application = await Application.findById(id);
        if (!application) {
            throw new ApiError(404, 'Application not found', 'APPLICATION_NOT_FOUND');
        }

        const alreadyAdded = application.panel.some(panel => panel.expert.equals(expertId));
        if (alreadyAdded) {
            throw new ApiError(400, 'Expert already added', 'EXPERT_ALREADY_ADDED');
        }

        const expert = await Expert.findById(expertId);
        if (!expert) {
            throw new ApiError(404, 'Expert not found', 'EXPERT_NOT_FOUND');
        }

        application.panel.push({ expert: expertId, feedback: null });
        expert.applications.push(id);
        await Promise.all([application.save(), expert.save()]);

        return res.success(201, "Panel member added successfully", { panel: application.panel });
    }))

    .delete(checkAuth('admin'), safeHandler(async (req, res) => {
        const { id } = req.params;
        const { expertId } = req.body;
        if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid application id', 'INVALID_ID');
        if (!isValidObjectId(expertId)) throw new ApiError(400, 'Invalid expert id', 'INVALID_ID');

        const application = await Application.findById(id);
        if (!application) {
            throw new ApiError(404, 'Application not found', 'APPLICATION_NOT_FOUND');
        }

        const expert = await Expert.findById(expertId);
        if (!expert) {
            throw new ApiError(404, 'Expert not found', 'EXPERT_NOT_FOUND');
        }

        application.panel = application.panel.filter(panel => !panel.expert.equals(expertId));
        expert.applications = expert.applications.filter(appId => !appId.equals(id));
        await Promise.all([application.save(), expert.save()]);

        return res.success(200, "Panel member removed successfully", { panel: application.panel });
    }));

router.route('/:id/panel/:expertId')
    .get(checkAuth('admin'), safeHandler(async (req, res) => { // sorry that I am fetching all the expert Data uneccessarily But I dont have time to optimize it rn
        const { id, expertId } = req.params;
        if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid application id', 'INVALID_ID');
        if (!isValidObjectId(expertId)) throw new ApiError(400, 'Invalid expert id', 'INVALID_ID');

        const application = await Application.findById(id).populate('panel.expert panel.feedback');
        if (!application) {
            throw new ApiError(404, 'Application not found', 'APPLICATION_NOT_FOUND');
        }

        const panelMember = application.panel.find(panel => panel.expert.equals(expertId));
        if (!panelMember) {
            throw new ApiError(404, 'Panel member not found', 'EXPERT_NOT_FOUND');
        }

        return res.success(200, "Panel member fetched successfully", { panelMember });
    }))

    .patch(checkAuth('candidate'), safeHandler(async (req, res) => {
        const { id, expertId } = req.params;
        if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid application id', 'INVALID_ID');
        if (!isValidObjectId(expertId)) throw new ApiError(400, 'Invalid expert id', 'INVALID_ID');

        const { feedback } = req.body; // { score, content }
        if (!feedback || !feedback.score || !feedback.content) {
            throw new ApiError(400, 'Feedback not provided', 'FEEDBACK_NOT_PROVIDED');
        }

        feedback.score = parseInt(feedback.score);

        const application = await Application.findById(id);
        if (!application) {
            throw new ApiError(404, 'Application not found', 'APPLICATION_NOT_FOUND');
        }

        const panelMember = application.panel.find(panel => panel.expert.equals(expertId));
        if (!panelMember) {
            throw new ApiError(404, 'Panel member not found', 'EXPERT_NOT_FOUND');
        };

        const expert = await Expert.findById(expertId);
        if (!expert) {
            throw new ApiError(404, 'Expert not found', 'EXPERT_NOT_FOUND');
        }
        const subject = await Subject.findById(application.subject);
        if (!subject) {
            throw new ApiError(404, 'Subject not found', 'SUBJECT_NOT_FOUND');  
        }
        const candidate = await Candidate.findById(application.candidate);
        if (!candidate) {
            throw new ApiError(404, 'Candidate not found', 'CANDIDATE_NOT_FOUND');
        }

        if (panelMember.feedback) {
            const oldFeedback = await Feedback.findById(panelMember.feedback);
            if (!oldFeedback) {
                throw new ApiError(404, 'Feedback not found', 'FEEDBACK_NOT_FOUND');
            }
            oldFeedback.score = feedback.score;
            oldFeedback.content = feedback.content;
            await oldFeedback.save();
        }
        else {
            const newFeedback = await Feedback.create({
                application: id,
                expert: expertId,
                subject: application.subject,
                score: feedback.score,
                content: feedback.content,
                candidate: application.candidate
            });

            panelMember.feedback = newFeedback._id;
            expert.feedbacks.push(newFeedback._id);
            subject.feedbacks.push(newFeedback._id);
            candidate.feedbacks.push(newFeedback._id);
            await Promise.all[application.save(), expert.save(), subject.save(), candidate.save()];
        }

        return res.success(200, "Feedback added/updated successfully", { panel: application.panel });
    }))
 //following left
    .delete(checkAuth('candidate'), safeHandler(async (req, res) => {
        const { id, expertId } = req.params;
        if (!isValidObjectId(id) || !isValidObjectId(expertId)) throw new ApiError(400, 'Invalid id', 'INVALID_ID');

        const application = await Application.findById(id);
        if (!application) {
            throw new ApiError(404, 'Application not found', 'APPLICATION_NOT_FOUND');
        }

        const panelMember = application.panel.find(panel => panel.expert.equals(expertId));
        if (!panelMember) {
            throw new ApiError(404, 'Panel member not found', 'EXPERT_NOT_FOUND');
        }

        await Feedback.findByIdAndDelete(panelMember.feedback);
        panelMember.feedback = null;
        await application.save();

        return res.success(200, "Feedback deleted successfully", { panel: application.panel });
    }));

router.route('/:id/panel/:expertId/note')

    .get(checkAuth('expert'), safeHandler(async (req, res) => {
        const { id, expertId } = req.params;
        if (!isValidObjectId(id) || !isValidObjectId(expertId)) throw new ApiError(400, 'Invalid id', 'INVALID_ID');

        const application = await Application.findById(id);
        if (!application) {
            throw new ApiError(404, 'Application not found', 'APPLICATION_NOT_FOUND');
        }

        const panelMember = application.panel.find(panel => panel.expert.equals(expertId));
        if (!panelMember) {
            throw new ApiError(404, 'Panel member not found', 'EXPERT_NOT_FOUND');
        }

        return res.success(200, "Note fetched successfully", { expertNotes: application.interviewDetails.expertNotes });
    }))
    .patch(checkAuth('expert'), safeHandler(async (req, res) => {
        const { id, expertIdP } = req.params;
        const expertIdR = req.user.id;

        if (!isValidObjectId(id) || !isValidObjectId(expertIdP) || !isValidObjectId(expertIdR)) throw new ApiError(400, 'Invalid id', 'INVALID_ID');
        if (expertIdP !== expertIdR) throw new ApiError(403, 'Unauthorized', 'UNAUTHORIZED');

        const expertId = expertIdP;
        const { note } = req.body;

        const application = await Application.findById(id);
        if (!application) {
            throw new ApiError(404, 'Application not found', 'APPLICATION_NOT_FOUND');
        }

        const panelMember = application.panel.find(panel => panel.expert.equals(expertId));
        if (!panelMember) {
            throw new ApiError(404, 'Panel member not found', 'EXPERT_NOT_FOUND');
        }

        application.interviewDetails.expertNotes.push({
            expert: expertId,
            note
        });
        await application.save();

        return res.success(200, "Note added successfully", { expertNotes: application.interviewDetails.expertNotes });

    }));

router.route(':id/interviewdetails')
    .get(checkAuth('candidate'), safeHandler(async (req, res) => {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid id', 'INVALID_ID');

        const application = await Application.findById(id);
        if (!application) {
            throw new ApiError(404, 'Application not found', 'APPLICATION_NOT_FOUND');
        }

        return res.success(200, "Interview details fetched successfully", { interviewDetails: application.interviewDetails });
    }))

    .patch(checkAuth('expert'), safeHandler(async (req, res) => {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid id', 'INVALID_ID');

        const updates = applicationRegistrationSchema.parse(req.body);

        const filteredUpdates = Object.fromEntries(
            Object.entries(updates).filter(([_, value]) => value != null)
        );

        const application = await Application.findByIdAndUpdate(
            id,
            {
                interviewDetails: filteredUpdates
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!application) {
            throw new ApiError(404, 'Application not found', 'APPLICATION_NOT_FOUND');
        }

        return res.success(200, "Interview details updated successfully", { interviewDetails: application.interviewDetails });
    }));

export default router;