import Subject from "../models/subject.js";
import Expert from "../models/expert.js";
import Candidate from "../models/candidate.js";
// I am not returning when there are no candidates found in any function. In that case, there should be some relevancy score but the profile score should be 0
// The Api calls can be separated into two different functions for better readability but I don't want to risk messing with the logic

export async function calculateSingleExpertScoresSingleSubject(subjectId, expertId) { // Calculate the scores of a single expert for a single subject ---> when a new expert is added to a subject
    const [subject, expert] = await Promises.all[Subject.findById(subjectId).populate('applicants'), Expert.findById(expertId)];
    if (!subject) {
        console.log(`Subject not found for id ${subjectId} in calculateSingleExpertScoresSingleSubject`);
        return;
    }
    if (!expert) {
        console.log(`Expert not found for ${expertId} in calculateSingleExpertScoresSingleSubject`);
        return;
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
            expert.profileScore = profileScore || expert.profileScore;
            expert.relevancyScore = relevancyScore || expert.relevancyScore;
        }
    });
    await subject.save();
}

export async function calculateSingleExpertScoresMultipleSubjects(expertId) { // Calculate the scores of a single expert across multiple subjects ---> when the expert's skills are updated
    const expert = await Expert.findById(expertId).populate({
        path: 'subjects',
        populate: {
            path: 'applicants',
        },
    });

    if (!expert) {
        console.log(`Expert not found for id ${expertId} in calculateSingleExpertScoresMultipleSubjects`);
        return;
    }
    const subjects = expert.subjects;
    if (!subjects || subjects.length === 0) {
        console.log(`No subjects found for expert ${expertId} in calculateSingleExpertScoresMultipleSubjects`);
        return;
    }
    const expertData = {
        name: expert.name,
        skills: expert.skills
    };
    const scorePromises = subjects.map(async subject => {
        const candidates = subject.applicants;
        const candidateData = candidates.map(candidate => ({
            name: candidate.name,
            skills: candidate.skills
        }));
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
            if (expert.id.equals(expertId)) {
                expert.profileScore = profileScore || expert.profileScore;
                expert.relevancyScore = relevancyScore || expert.relevancyScore;
            }
        });
        await subject.save();
    });
    await Promise.all(scorePromises);
}

export async function calculateAllExpertScoresSingleSubject(subjectId) { // Calculate the scores of all experts for a single subject ---> when the recommended skills of a subject are updated ||  when a new candidate applies for a subject || when a candidate is removed from a subject
    const subject = await Subject.findById(subjectId).populate('experts applicants');
    if (!subject) {
        console.log(`Subject not found for id ${subjectId} in calculateAllExpertScoresSingleSubject`);
        return;
    }

    const candidates = subject.applicants;
    const candidateData = candidates.map(candidate => ({
        name: candidate.name,
        skills: candidate.skills,
    }));

    const experts = subject.experts;
    if (!experts || experts.length === 0) {
        console.log(`No experts found for subject ${subjectId} in calculateAllExpertScoresSingleSubject`);
        return;
    }
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
            expert.profileScore = profileScore || expert.profileScore;
            expert.relevancyScore = relevancyScore || expert.relevancyScore;
        }
    });

    await subject.save();
}

export async function calculateAllExpertsScoresMultipleSubjects(subjectIds) { // Calculate the scores of all experts across multiple subjects ---> when the skills of a candidate are updated || when a candidate(s) is deleted from the system
    let subjects;
    if (subjectIds && subjectIds.length != 0) {
        subjects = await Subject.find({ _id: { $in: subjectIds } }).populate('experts applicants');
    }
    else {
        subjects = await Subject.find().populate('experts applicants');
    }

    if (!subjects || subjects.length === 0) {
        console.log("No subjects found for the subjectIds in calculateAllExpertsScoresMultipleSubjects");
        return;
    }

    const subjectPromises = subjects.map(async subject => {
        const candidates = subject.applicants;
        const candidateData = candidates.map(candidate => ({
            name: candidate.name,
            skills: candidate.skills,
        }));

        const experts = subject.experts;
        if (!experts || experts.length === 0) {
            console.log(`No experts found for subject id ${subject._id} in calculateAllExpertsScoresMultipleSubjects`);
            return;
        }
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
                expert.profileScore = profileScore || expert.profileScore;
                expert.relevancyScore = relevancyScore || expert.relevancyScore;
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

export async function calculateSingleCandidateScoreSingleSubject(subjectId, candidateId) { // Calculate the score of a single candidate for a single subject ---> when a new candidate applies for a subject
    const [subject, candidate] = await Promises.all[Subject.findById(subjectId), Candidate.findById(candidateId)];
    if (!subject) {
        console.log(`Subject not found for subject id ${subjectId} in calculateSingleCandidateScoreSingleSubject`);
        return;
    }
    if (!candidate) {
        console.log(`Candidate not found for id ${candidateId} in calculateSingleCandidateScoreSingleSubject`);
        return;
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
            applicant.relevancyScore = relevancyScore || applicant.relevancyScore || 0;
        }
    });
    await subject.save();
}

export async function calculateSingleCandidateScoreMultipleSubjects(candidateId) { // Calculate the score of a single candidate across multiple subjects ---> when the skills of a candidate are updated
    const candidate = await Candidate.findById(candidateId).populate('subjects');
    if (!candidate) {
        console.log(`Candidate not found for id ${candidateId} in calculateSingleCandidateScoreMultipleSubjects`);
        return;
    }
    const subjects = candidate.subjects;
    if (!subjects || subjects.length === 0) {
        console.log(`No subjects found for candidate ${candidateId} in calculateSingleCandidateScoreMultipleSubjects`);
        return;
    }
    const candidateData = {
        name: candidate.name,
        skills: candidate.skills
    };
    const scorePromises = subjects.map(async subject => {
        const subjectData = {
            title: subject.title,
            recommendedSkills: subject.recommendedSkills
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
                applicant.relevancyScore = relevancyScore || applicant.relevancyScore || 0;
            }
        });
        await subject.save();
    });
    await Promise.all(scorePromises);
}

export async function calculateAllCandidateScoresSingleSubject(subjectId) { // Calculate the scores of all candidates for a single subject ---> when the recommended skills of a subject are updated
    const subject = await Subject.findById(subjectId).populate('applicants');
    if (!subject) {
        console.log(`Subject not found for id ${subjectId} in calculateAllCandidateScoresSingleSubject`);
        return;
    }

    const candidates = subject.applicants;
    if (!candidates || candidates.length === 0) {
        console.log(`No candidates found for subject ${subjectId} in calculateAllCandidateScoresSingleSubject`);
        return;
    }

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
            candidate.relevancyScore = relevancyScore || candidate.relevancyScore || 0;
        }
    });

    await subject.save();
}

export async function calculateAllCandidatesScoresMultipleSubjects(subjectIds) { // Calculate the scores of all candidates across multiple subjects ---> cause why not (might be handy in the future)
    let subjects;
    if (subjectIds && subjectIds.length != 0) {
        subjects = await Subject.find({ _id: { $in: subjectIds } }).populate('applicants');
    }
    else {
        subjects = await Subject.find().populate('applicants');
    }

    if (!subjects || subjects.length === 0) {
        console.log("No subjects found for the subjectIds in calculateAllCandidatesScoresMultipleSubjects");
        return;
    }

    const subjectPromises = subjects.map(async subject => {
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
                candidate.relevancyScore = relevancyScore || candidate.relevancyScore || 0;
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