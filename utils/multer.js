import multer from "multer";
import path from "path";
import config from "../config/config.js";

const createStorage = (folder) => multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, `../public/${folder}`)),
    filename: (req, file, cb) => cb(null, `${file.originalname}-${Date.now()}${path.extname(file.originalname)}`)
});

export const imageUpload = multer({ storage: createStorage('images') });
export const resumeUpload = multer({ storage: createStorage(config.paths.resume.temporary) });