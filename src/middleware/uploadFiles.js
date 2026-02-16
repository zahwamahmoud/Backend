import multer from "multer";
import { AppError } from "../utils/AppError.js";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Allowed mimetypes for transaction attachments (images + common documents)
export const ATTACHMENT_MIMETYPES = [
    'image/', // image/jpeg, image/png, etc.
    'application/pdf',
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
];

// shared upload options
const uploadOptions = (fileTypes) => {
    const storage = multer.memoryStorage();

    const fileFilter = (req, file, cb) => {
        const isAllowed = fileTypes.some((type) =>
            type.endsWith('/') ? file.mimetype.startsWith(type) : file.mimetype === type
        );
        if (isAllowed) {
            cb(null, true);
        } else {
            cb(new AppError("File type is not allowed. Use PDF, images, Word or Excel.", 400));
        }
    };

    return multer({
        storage,
        fileFilter,
        limits: { fileSize: MAX_FILE_SIZE },
    });
};

// upload single file
export const uploadSingleFile = (fileTypes, fieldName) =>
    uploadOptions(fileTypes).single(fieldName);

// upload multiple files
export const uploadMultiFiles = (fileTypes, fields) =>
    uploadOptions(fileTypes).fields(fields);

