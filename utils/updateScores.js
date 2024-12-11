import Subject from "../models/subject.js";
import Expert from "../models/expert.js";
import Candidate from "../models/candidate.js";
// I am not returning when there are no candidates found in any function. In that case, there should be some relevancy score but the profile score should be 0
// The Api calls can be separated into two different functions for better readability but I don't want to risk messing with the logic

export async function calculateSingleExpertScoresSingleSubject(subjectId, expertId) { // Calculate the scores of a single expert for a single subject ---> when a new expert is added to a subject
    console.log("inside calculateSingleExpertScoresSingleSubject");
    const [subject, expert] = await Promise.all([Subject.findById(subjectId).populate('candidates'), Expert.findById(expertId)]);
    if (!subject) {
        console.log(`Subject not found for id ${subjectId} in calculateSingleExpertScoresSingleSubject`);
        return;
    }
    if (!expert) {
        console.log(`Expert not found for ${expertId} in calculateSingleExpertScoresSingleSubject`);
        return;
    }
    const candidates = subject.candidates;
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
        // const response = await axios.post('https://some-link-ig/compare', { candidateData, expertData, subjectData });
        const response = { data: { profileScore: 1, relevancyScore: 2 } }; // Dummy data
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
    console.log("inside calculateSingleExpertScoresMultipleSubjects");
    const expert = await Expert.findById(expertId).populate({
        path: 'subjects',
        populate: {
            path: 'candidates',
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
        const candidates = subject.candidates;
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
            // const response = await axios.post('https://some-link-ig/compare', { candidateData, expertData, subjectData });
            const response = { data: { profileScore: 1, relevancyScore: 2 } }; // Dummy data
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
    console.log("inside calculateAllExpertScoresSingleSubject");
    const subject = await Subject.findById(subjectId).populate('experts candidates');
    if (!subject) {
        console.log(`Subject not found for id ${subjectId} in calculateAllExpertScoresSingleSubject`);
        return;
    }

    const candidates = subject.candidates;
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
            // const response = await axios.post('https://some-link-ig/compare', { candidateData, expertData, subjectData });
            const response = { data: { profileScore: 2, relevancyScore: 4 } }; // Dummy data
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
    console.log("inside calculateAllExpertsScoresMultipleSubjects");
    let subjects;
    if (subjectIds && subjectIds.length != 0) {
        subjects = await Subject.find({ _id: { $in: subjectIds } }).populate('experts candidates');
    }
    else {
        subjects = await Subject.find().populate('experts candidates');
    }

    if (!subjects || subjects.length === 0) {
        console.log("No subjects found for the subjectIds in calculateAllExpertsScoresMultipleSubjects");
        return;
    }

    const subjectPromises = subjects.map(async subject => {
        const candidates = subject.candidates
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
                // const response = await axios.post('https://some-link-ig/compare', { candidateData, expertData, subjectData });
                const response = { data: { profileScore: 6, relevancyScore: 7 } }; // Dummy data
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
    console.log("inside calculateSingleCandidateScoreSingleSubject");
    const [subject, candidate] = await Promise.all([Subject.findById(subjectId), Candidate.findById(candidateId)]);
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
        // const response = await axios.post('https://some-link-ig/compare', { candidateData, subjectData });
        const response = { data: { relevancyScore: 5 } }; // Dummy data
        const { data } = response;
        relevancyScore = data.relevancyScore;
    } catch (error) {
        console.error(`Error calculating score for candidate ${candidateId}:`, error);
    }
    subject.candidates.forEach(candidate => {
        if (candidate.id.equals(candidateId)) {
            candidate.relevancyScore = relevancyScore || candidate.relevancyScore || 0;
        }
    });
    await subject.save();
}

export async function calculateSingleCandidateScoreMultipleSubjects(candidateId) { // Calculate the score of a single candidate across multiple subjects ---> when the skills of a candidate are updated
    console.log("inside calculateSingleCandidateScoreMultipleSubjects");
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
            // const response = await axios.post('https://some-link-ig/compare', { candidateData, subjectData });
            const response = { data: { relevancyScore: 5 } }; // Dummy data
            const { data } = response;
            relevancyScore = data.relevancyScore;
        } catch (error) {
            console.error(`Error calculating score for candidate ${candidateId}:`, error);
        }
        subject.candidates.forEach(candidate => {
            if (candidate.id.equals(candidateId)) {
                candidate.relevancyScore = relevancyScore || candidate.relevancyScore || 0;
            }
        });
        await subject.save();
    });
    await Promise.all(scorePromises);
}

export async function calculateAllCandidateScoresSingleSubject(subjectId) { // Calculate the scores of all candidates for a single subject ---> when the recommended skills of a subject are updated
    console.log("inside calculateAllCandidateScoresSingleSubject");
    const subject = await Subject.findById(subjectId).populate('candidates');
    if (!subject) {
        console.log(`Subject not found for id ${subjectId} in calculateAllCandidateScoresSingleSubject`);
        return;
    }

    const candidates = subject.candidates;
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
            // const response = await axios.post('https://some-link-ig/compare', { candidateData, subjectData });
            const response = { data: { relevancyScore: 5 } }; // Dummy data
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
    console.log("inside calculateAllCandidatesScoresMultipleSubjects");
    let subjects;
    if (subjectIds && subjectIds.length != 0) {
        subjects = await Subject.find({ _id: { $in: subjectIds } }).populate('candidates');
    }
    else {
        subjects = await Subject.find().populate('candidates');
    }

    if (!subjects || subjects.length === 0) {
        console.log("No subjects found for the subjectIds in calculateAllCandidatesScoresMultipleSubjects");
        return;
    }

    const subjectPromises = subjects.map(async subject => {
        const candidates = subject.candidates;
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
                // const response = await axios.post('https://some-link-ig/compare', { candidateData, subjectData });
                const response = { data: { relevancyScore: 5 } }; // Dummy data
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

export async function calculateAverageScoresSingleExpert(expertId){
    const expert = await Expert.findById(expertId).populate('subjects');
    if(!expert){
        console.log(`Expert not found for id ${expertId} in calculateAverageScores`);
        return;
    }
    const subjects = expert.subjects;
    if(!subjects || subjects.length === 0){
        console.log(`No subjects found for expert ${expertId} in calculateAverageScores`);
        return;
    }
    let totalProfileScore = 0;
    let totalRelevancyScore = 0;
    subjects.forEach(subject => {
        const expertData = subject.experts.find(exp => exp.id.equals(expertId));
        totalProfileScore += expertData.profileScore;
        totalRelevancyScore += expertData.relevancyScore;
    });
    const averageProfileScore = totalProfileScore / subjects.length;
    const averageRelevancyScore = totalRelevancyScore / subjects.length;
    expert.averageProfileScore = averageProfileScore;
    expert.averageRelevancyScore = averageRelevancyScore;
    await expert.save();
}

export async function calculateAverageScoresAllExperts(){     
    const experts = await Expert.find().populate('subjects');
    if(!experts || experts.length === 0){
        console.log("No experts found in calculateAverageScoresAllExperts");
        return;
    }
    const expertPromises = experts.map(async expert => {
        const subjects = expert.subjects;
        if(!subjects || subjects.length === 0){
            console.log(`No subjects found for expert ${expert._id} in calculateAverageScoresAllExperts`);
            return;
        }
        let totalProfileScore = 0;
        let totalRelevancyScore = 0;
        subjects.forEach(subject => {
            const expertData = subject.experts.find(exp => exp.id.equals(expert._id));
            totalProfileScore += expertData.profileScore;
            totalRelevancyScore += expertData.relevancyScore;
        });
        const averageProfileScore = totalProfileScore / subjects.length;
        const averageRelevancyScore = totalRelevancyScore / subjects.length;
        expert.averageProfileScore = averageProfileScore;
        expert.averageRelevancyScore = averageRelevancyScore;
        await expert.save();
    });
    await Promise.all(expertPromises);
}

// calcluate average relevancy for candidate

export async function calculateAverageRelevancyScoreAllCandidates(){
    const candidates = await Candidate.find().populate('subjects');
    if(!candidates || candidates.length === 0){
        console.log("No candidates found in calculateAverageRelevancyScoreAllCandidate");
        return;
    }
    const candidatePromises = candidates.map(async candidate => {
        const subjects = candidate.subjects;
        if(!subjects || subjects.length === 0){
            console.log(`No subjects found for candidate ${candidate._id} in calculateAverageRelevancyScoreAllCandidate`);
            return;
        }
        let totalRelevancyScore = 0;
        subjects.forEach(subject => {
            const candidateData = subject.candidates.find(cand => cand.id.equals(candidate._id));
            totalRelevancyScore += candidateData.relevancyScore;
        });
        const averageRelevancyScore = totalRelevancyScore / subjects.length;
        candidate.averageRelevancyScore = averageRelevancyScore;
        await candidate.save();
    });
    await Promise.all(candidatePromises);
}

export async function calculateAverageRelevancyScoreSingleCandidate(candidateId){
    const candidate = await Candidate.findById(candidateId).populate('subjects');
    if(!candidate){
        console.log(`Candidate not found for id ${candidateId} in calculateAverageRelevancyScoreSingleCandidate`);
        return;
    }
    const subjects = candidate.subjects;
    if(!subjects || subjects.length === 0){
        console.log(`No subjects found for candidate ${candidateId} in calculateAverageRelevancyScoreSingleCandidate`);
        return;
    }
    let totalRelevancyScore = 0;
    subjects.forEach(subject => {
        const candidateData = subject.candidates.find(cand => cand.id.equals(candidateId));
        totalRelevancyScore += candidateData.relevancyScore;
    });
    const averageRelevancyScore = totalRelevancyScore / subjects.length;
    candidate.averageRelevancyScore = averageRelevancyScore;
    await candidate.save();
}

// calculate average feedback score for expert

// export async function calculateAverageFeedbackScoreAllExperts(){
//     const experts = await Expert.find().populate('subjects');
//     if(!experts || experts.length === 0){
//         console.log("No experts found in calculateAverageFeedbackScoreAllExperts");
//         return;
//     }
//     const expertPromises = experts.map(async expert => {
//         const subjects = expert.subjects;
//         if(!subjects || subjects.length === 0){
//             console.log(`No subjects found for expert ${expert._id} in calculateAverageFeedbackScoreAllExperts`);
//             return;
//         }
//         let totalFeedbackScore = 0;
//         let totalFeedbackCount = 0;
//         subjects.forEach(subject => {
//             const expertData = subject.experts.find(exp => exp.id.equals(expert._id));
//             if(expertData.feedback){
//                 totalFeedbackScore += expertData.feedback.score;
//                 totalFeedbackCount++;
//             }
//         });
//         const averageFeedbackScore = totalFeedbackScore / totalFeedbackCount;
//         expert.averageFeedbackScore = averageFeedbackScore;
//         await expert.save();
//     });
//     await Promise.all(expertPromises);
// }