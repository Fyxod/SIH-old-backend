import mongoose from "mongoose";

const candidateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    mobileNo: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    dob: {
        type: Date,
        required: true
    },
    skills: [{
        type: String
    }],
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
        type: String
    },
    subjects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
    }], 
    image: {
        type: String,
        required: true
    },
    linkedIn: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: [
            "active",
            "inactive"
        ]
    },
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