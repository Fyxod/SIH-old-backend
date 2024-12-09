import multer from "multer";
import path from "path";
import config from "../config/config.js";

import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const createStorage = (folder) => multer.diskStorage({
    destination: (_, __, cb) => cb(null, path.join(__dirname, `../public/${folder}`)),
    filename: (_, file, cb) => cb(null, `${file.originalname}-${Date.now()}${path.extname(file.originalname)}`)
});

export const expertImageUpload = multer({ storage: createStorage(config.paths.image.expert) });
export const candidateImageUpload = multer({ storage: createStorage(config.paths.image.candidate) });
export const resumeUpload = multer({ storage: createStorage(config.paths.resume.temporary) });
