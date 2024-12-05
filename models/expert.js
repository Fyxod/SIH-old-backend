import mongoose from "mongoose";

const expertSchema = new mongoose.Schema({
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
    skills:[{
        type: String,
    }],
    currentPosition: {
        type: String,
        required: true
    },
    currentDepartment: {
        type: String,
        required: true
    },
    bio: {
        type: String,
    },
    experience: [{
        department: {
            type: String,
            // required: true
        },
        position: {
            type: String,
            // required: true
        },
        startDate: {
            type: Date,
            // required: true
        },
        endDate: {
            type: Date,
            // required: true
        },
        companyName: {
            type: String,
        },
    }],
    education: [{
        degree: {
            type: String,
            // required: true
        },
        field: {
            type: String,
            // required: true
        },
        startDate: {
            type: Date,
            // required: true
        },
        endDate: {
            type: Date,
            // required: true
        },
        university: {
            type: String,
        },
    }],
    resume: {
        type: String,
        unique: true,
        // sparse: true, try this if it throws error
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
    linkedIn: {
        type: String,
        unique: true
    },
},
{
    timestamps: true
});

const Expert = mongoose.model('Expert', expertSchema);

export default Expert;