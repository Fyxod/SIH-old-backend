import Subject from "../models/subject.js";
import Expert from "../models/expert.js";
import Candidate from "../models/candidate.js";
import ApiError from "./errorClass.js";

export async function calculateSingleExpertScores(subjectId, expertId) {
    const [subject, expert] = await Promises.all[Subject.findById(subjectId).populate('applicants'), Expert.findById(expertId)];
    if (!subject) {
        throw new ApiError(404, 'Subject not found', 'SUBJECT_NOT_FOUND');
    }
    if (!expert) {
        throw new ApiError(404, 'Expert not found', 'EXPERT_NOT_FOUND');
    }
    const candidates = subject.applicants;
    const candidateData = candidates.map(candidate => ({
        name: candidate.name,
        skills: candidate.skills
    }));
    const expertData = {
        name: expert.id.name,
        skills: expert.id.skills
    };
    const subjectData = {
        title: subject.title,
        recommendedSkills: subject.recommendedSkills
    };
    let profileScore, relevancyScore;
    try {
        const response = await axios.post('https://some-link-ig/compare', { candidateData, expertData, subjectData });
        const { data } = response;
        profileScore = data.profileScore;
        relevancyScore = data.relevancyScore;
    } catch (error) {
        console.error(`Error calculating scores for expert ${expertId}:`, error);
    }
    subject.experts.forEach(expert => {
        if (expert.id._id.equals(expertId)) {
            expert.profileScore = profileScore;
            expert.relevancyScore = relevancyScore;
        }
    });
    await subject.save();
}

export async function calculateSingleCandidateScore(subjectId, candidateId) {
    const [subject, candidate] = await Promises.all[Subject.findById(subjectId), Candidate.findById(candidateId)];
    if (!subject) {
        throw new ApiError(404, 'Subject not found', 'SUBJECT_NOT_FOUND');
    }
    if (!candidate) {
        throw new ApiError(404, 'Candidate not found', 'CANDIDATE_NOT_FOUND');
    }
    const subjectData = {
        title: subject.title,
        recommendedSkills: subject.recommendedSkills
    };
    const candidateData = {
        name: candidate.name,
        skills: candidate.skills
    };
    let relevancyScore;
    try {
        const response = await axios.post('https://some-link-ig/compare', { candidateData, subjectData });
        const { data } = response;
        relevancyScore = data.relevancyScore;
    } catch (error) {
        console.error(`Error calculating score for candidate ${candidateId}:`, error);
    }
    subject.applicants.forEach(applicant => {
        if (applicant.id.equals(candidateId)) {
            applicant.relevancyScore = relevancyScore;
        }
    });
    await subject.save();
}

export async function updateAllExpertScores(subjectId) {
    const subject = await Subject.findById(subjectId).populate('experts applicants');
    if (!subject) {
        throw new ApiError(404, 'Subject not found', 'SUBJECT_NOT_FOUND');
    }

    const candidates = subject.applicants;
    const candidateData = candidates.map(candidate => ({
        name: candidate.name,
        skills: candidate.skills,
    }));

    const experts = subject.experts;
    const subjectData = {
        title: subject.title,
        recommendedSkills: subject.recommendedSkills,
    };

    const scorePromises = experts.map(async expert => {
        const expertData = {
            name: expert.id.name,
            skills: expert.id.skills,
        };

        try {
            const response = await axios.post('https://some-link-ig/compare', { candidateData, expertData, subjectData });
            const { profileScore, relevancyScore } = response.data;
            return { expertId: expert.id._id, profileScore, relevancyScore };
        } catch (error) {
            console.error(`Error calculating scores for expert ${expert.id?._id}:`, error);
            return { expertId: expert.id?._id, profileScore: expert.profileScore, relevancyScore: expert.relevancyScore };
        }
    });

    const results = await Promise.all(scorePromises);   

    results.forEach(({ expertId, profileScore, relevancyScore }) => {
        const expert = experts.find(exp => exp.id._id.equals(expertId));
        if (expert) {
            expert.profileScore = profileScore;
            expert.relevancyScore = relevancyScore;
        }
    });

    await subject.save();
}

export async function updateAllCandidateScores(subjectId) {
    const subject = await Subject.findById(subjectId).populate('applicants');
    if (!subject) {
        throw new ApiError(404, 'Subject not found', 'SUBJECT_NOT_FOUND');
    }

    const candidates = subject.applicants;

    const subjectData = {
        title: subject.title,
        recommendedSkills: subject.recommendedSkills,
    };

    const scorePromises = candidates.map(async candidate => {
        const candidateData = {
            name: candidate.id.name,
            skills: candidate.id.skills,
        };

        try {
            const response = await axios.post('https://some-link-ig/compare', { candidateData, subjectData });
            const { relevancyScore } = response.data;
            return { candidateId: candidate.id._id, relevancyScore };
        } catch (error) {
            console.error(`Error calculating score for candidate ${candidate.id?._id}:`, error);
            return { candidateId: candidate.id._id, relevancyScore: candidate.relevancyScore };
        }
    });

    const results = await Promise.all(scorePromises);

    results.forEach(({ candidateId, relevancyScore }) => {
        const candidate = candidates.find(cand => cand.id._id.equals(candidateId));
        if (candidate) {
            candidate.relevancyScore = relevancyScore;
        }
    });

    await subject.save();
}

export async function updateAllExpertsScoresParallel() {
    const subjects = await Subject.find().populate('experts applicants');
    if (!subjects || subjects.length === 0) {
        throw new ApiError(404, 'No subjects found', 'NO_SUBJECTS_FOUND');
    }

    const subjectPromises = subjects.map(async subject => {
        const candidates = subject.applicants;
        const candidateData = candidates.map(candidate => ({
            name: candidate.name,
            skills: candidate.skills,
        }));

        const experts = subject.experts;
        const subjectData = {
            title: subject.title,
            recommendedSkills: subject.recommendedSkills,
        };

        const scorePromises = experts.map(async expert => {
            const expertData = {
                name: expert.id.name,
                skills: expert.id.skills,
            };

            try {
                const response = await axios.post('https://some-link-ig/compare', { candidateData, expertData, subjectData });
                const { profileScore, relevancyScore } = response.data;
                return { expertId: expert.id._id, profileScore, relevancyScore };
            } catch (error) {
                console.error(`Error calculating scores for expert ${expert.id?._id}:`, error);
                return { expertId: expert.id?._id, profileScore: expert.profileScore, relevancyScore: expert.relevancyScore };
            }
        });

        const results = await Promise.all(scorePromises);

        results.forEach(({ expertId, profileScore, relevancyScore }) => {
            const expert = experts.find(exp => exp.id._id.equals(expertId));
            if (expert) {
                expert.profileScore = profileScore;
                expert.relevancyScore = relevancyScore;
            }
        });

        try {
            await subject.save();
            console.log(`Scores updated for subject ${subject.title}`); // log kept only for now
        } catch (error) {
            console.error(`Error saving scores for subject ${subject._id}:`, error);
        }
    });

    await Promise.all(subjectPromises);
}