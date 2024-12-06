import multer from "multer";
import path from "path";
import { fileURLToPath } from 'url';
import config from "../config/config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const createStorage = (folder) => multer.diskStorage({
    destination: (_, __, cb) => cb(null, path.join(__dirname, `../public/${folder}`)),
    filename: (_, file, cb) => cb(null, `${file.originalname}-${Date.now()}${path.extname(file.originalname)}`)
});

export const imageUpload = multer({ storage: createStorage('images') });
export const resumeUpload = multer({ storage: createStorage(config.paths.resume.temporary) });