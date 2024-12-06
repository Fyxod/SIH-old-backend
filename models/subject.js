import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    // location: {
    //     type: String,
    //     required: true
    // },
    department: {
        type: String,
        required: true,
        // enum:[ // please decide enum later

        // ]
    },
    type: {
        type: String,
        required: true,
        // enum: [ //please decide enum later
        //     "full-time",
        //     "part-time"
        // ]
    },
    recommendedSkills: [{
        type: String,
        required: true
    }],
    status: {
        type: String,
        required: true,
        enum: [
            "open",
            "closed"
        ],
        default: "closed"
    },
    applicants: {
        type: [{
            relevancyScore: {
                type: Number,
                default: 0
            },
            id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Candidate'
            }
        }],
        default: []
    },
    experts: {
        type: [{
            profileScore: {
                type: Number,
                default: 0,
            },
            relevancyScore: {
                type: Number,
                default: 0,
            },
            id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Expert',
            },
        }],
        default: [],
    },
    feedbacks: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Feedback'
        }],
        default: []
    },
}, {
    timestamps: true
});

const Subject = mongoose.model('Subject', subjectSchema);

export default Subject;