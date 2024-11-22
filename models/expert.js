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
            "other"
        ]
    },
    mobileNo: {
        type: String,
        // required: true
    },
    email: {
        type: String,
        // required: true
    },
    currentPosition: {
        type: String,
        // required: true
    },
    currentDepartment: {
        type: String,
        // required: true
    },
    skills:[{
        type: String,
    }],
    bio: {
        type: String,
        // required: true
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
    image: {
        type: String,
        // required: true
    },
    resume: {
        type: String,
        // required: true
    },
    linkedIn: {
        type: String,
        // required: true
    },
    subjects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
    }],
},
{
    timestamps: true
});

const Expert = mongoose.model('Expert', expertSchema);

export default Expert;