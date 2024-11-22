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
    status: {
        type: String,
        required: true,
        enum: [
            "open",
            "closed"
        ]
    },
    applicants: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Candidate'
    },
    experts: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Expert'
    },
},
    {
        timestamps: true
    });

const Subject = mongoose.model('Subject', subjectSchema);

export default Subject;