import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({
    candidate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Candidate',
        required: true
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true
    },
    panel: {
        type: [
            {
                expert: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Expert',
                    required: true
                },
                feedback: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Feedback',
                    default: null
                }
            }
        ],
        default: []
    },
    status: {
        type: String,
        required: true,
        enum: [
            "pending",
            "shortlisted",
            "rejected",
            "accepted"
        ],
        default: "pending"
    },
    appliedOn: {
        type: Date,
        required: true,
        default: Date.now
    },
    interviewDetails: {
        date: {
            type: Date
        },
        time: {
            type: String
        },
        platform: {
            type: String,
            enum: [
                "zoom",
                "googleMeet",
                "microsofTeams",
                "offline"
            ]
        },
        link: {
            type: String,
            default: null
        },
        venue: {
            type: String,
            default: null
        },
        conducted: {
            type: Boolean,
            default: false
        },
        expertNotes: {
            type: [
                {
                    expert: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'Expert',
                        required: true
                    },
                    note: {
                        type: String,
                        default: ''
                    }
                }
            ],
            default: []
        }
    }
}, {
    timestamps: true
});

const Application = mongoose.model('Application', applicationSchema);

export default Application;