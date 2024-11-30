import express from 'express';
import checkAuth from '../middlewares/checkAuth.js';
import multer from 'multer';
import path from 'path';
import { safeHandler } from '../middlewares/safeHandler.js';

const router = express.Router();


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads/resumes'));
    },
    filename: (req, file, cb) => {
        const userName = req.body.candidateName || "unknown_user"; //don't forget to add candidateName in the request body 
        const currentDate = new Date().toISOString().slice(0, 10); 
        const fileExtension = path.extname(file.originalname);

        const customFileName = `${userName}_resume_${currentDate}${fileExtension}`;
        cb(null, customFileName);
    }
});

const upload = multer({ storage });

router.get("/parse",upload.single("resume"),safeHandler(async (req, res) => {    // resume here is the name of the form 
        console.log(req.file);
        res.send({ message: "File uploaded successfully", file: req.file });
    })
);
