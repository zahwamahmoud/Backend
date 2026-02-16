import multer from "multer";
import mongoose from "mongoose";

export const globalErrorMiddleware = (err, req, res, next) => {
    const statusCode = err.statusCode || err.status || 500;
    if (statusCode >= 500) {
        console.error('[ERROR] Global Error Handler:', err);
    } else {
        console.warn(`[${statusCode}] ${req.method} ${req.url} -`, err.message);
    }

    // Handle Multer errors (file size, etc.) with clean messages
    if (err instanceof multer.MulterError) {
        const statusCode = 400;
        let message = "Upload error";
        if (err.code === "LIMIT_FILE_SIZE") {
            message = "File too large. Maximum size is 5MB.";
        } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
            message = "Unexpected field name for file upload.";
        } else {
            message = err.message || message;
        }
        return res.status(statusCode).json({ message, statusCode });
    }

    // Handle Mongoose validation errors (400 instead of 500)
    if (err instanceof mongoose.Error.ValidationError) {
        const message = Object.values(err.errors).map((e) => e.message).join("; ") || err.message;
        return res.status(400).json({ message, statusCode: 400 });
    }
    if (err instanceof mongoose.Error.CastError) {
        return res.status(400).json({ message: `Invalid value for ${err.path}: ${err.value}`, statusCode: 400 });
    }

    const code = err.statusCode || err.status || 500;
    res.status(code).json({ message: err.message || "Internal server error", statusCode: code });
};