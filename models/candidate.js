import mongoose from "mongoose";

const candidateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        required: true,
        enum: [
            "male",
            "female",
            "non-binary",
            "other"
        ]
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    mobileNo: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    dateOfBirth: {
        type: Date,
        required: true
    },
    skills: [{
        skill: {
            type: String,
            required: true
        },
        duration: {
            type: Number
        }
    }],
    bio: {
        type: String
    },
    experience: [{
        position: {
            type: String,
            required: true
        },
        department: {
            type: String,
            required: true
        },
        startDate: {
            type: Date,
            required: true
        },
        endDate: {
            type: Date
        },
        companyName: {
            type: String,
        },
    }],
    education: [{
        degree: {
            type: String
        },
        field: {
            type: String
        },
        startDate: {
            type: Date
        },
        endDate: {
            type: Date
        },
        institute: {
            type: String
        },
    }],
    resume: {
        type: String,
        unique: true,
        sparse: true
    },
    subjects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
    }],
    feedbacks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Feedback'
    }],
    applications: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Application'
    }],
    image: {
        type: String,
        unique: true,
        sparse: true
    },
    // image is string ????? yes
    linkedIn: {
        type: String,
        unique: true,
        sparse: true
    },
    averageRelevancyScore: {
        type: Number,
        default: 0
    }
    // status: {
    //     type: String,
    //     enum: ["active", "inactive"], 
    //     default: "active", 
    //     // required: true,
    // }

    //extra unnecessary fields - may add if time permits
    // isBlocked: {
    //     type: Boolean,
    //     default: false
    // },
    // isVerified: {
    //     type: Boolean,
    //     default: false
    // },
    // verificationToken: {
    //     type: String,
    //     default: null
    // },
    // resetPasswordToken: {
    //     type: String,
    //     default: null
    // },
    // resetPasswordExpires: {
    //     type: Date,
    //     default: null
    // }
},
    {
        timestamps: true
    });

const Candidate = mongoose.model('Candidate', candidateSchema);

export default Candidate;