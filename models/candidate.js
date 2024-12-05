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
            "Non-Binary",
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
        type: String
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
            type: String,
            required: true
        },
        institute: {
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
    }],
    resume: {
        type: String,
        unique: true
    },
    subjects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
    }], 
    feedbacks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Feedback'
    }],
    image: {
        type: String,
        unique: true
    },
    // image is string ????? yes
    linkedIn: {
        type: String,
        unique: true
    },
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