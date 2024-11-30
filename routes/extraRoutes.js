import express from 'express';
import checkAuth from '../middlewares/authMiddleware.js';
import multer from 'multer';
import path from 'path';
import { safeHandler } from '../middlewares/safeHandler.js';
import { resumeUpload } from '../utils/multer.js';

const router = express.Router();

router.post("/parse",resumeUpload.single("resume"),safeHandler(async (req, res) => {    // resume here is the name of the form 
        console.log(req.file);
        res.send({ message: "File uploaded successfully", file: req.file });
    })
);
