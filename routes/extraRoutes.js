import express from 'express';
import checkAuth from '../middlewares/checkAuth.js';
import multer from 'multer';
import path from 'path';
import { safeHandler } from '../middlewares/safeHandler.js';

const router = express.Router();



router.get('/parse', upload.single("resume") ,safeHandler(async (req, res) => {
    console.log(req.file);
}));