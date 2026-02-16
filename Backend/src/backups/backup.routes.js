import express from "express";
import { allowedTo, protectedRoutes } from "../modules/auth/auth.controller.js";
import { catchAsyncError } from "../middleware/catchAsyncError.js";
import { runSystemBackup, restoreFromBackup, listBackups } from "./backup.service.js";

const router = express.Router();

// All routes require auth + superAdmin only
router.use(protectedRoutes);
router.use(allowedTo("superAdmin"));

router.post(
    "/system",
    catchAsyncError(async (req, res) => {
        const result = await runSystemBackup();
        res.status(201).json({
            message: "Backup completed successfully",
            backupId: result.backupId,
            totalRecords: result.totalRecords,
            durationSeconds: result.duration,
        });
    })
);

router.get(
    "/",
    catchAsyncError(async (req, res) => {
        const limit = parseInt(req.query.limit, 10) || 20;
        const backups = await listBackups(limit);
        res.status(200).json({ message: "Backups listed", backups });
    })
);

router.post(
    "/restore/:backupId",
    catchAsyncError(async (req, res) => {
        const { backupId } = req.params;
        const result = await restoreFromBackup(backupId);
        res.status(200).json({
            message: "Restore completed successfully",
            totalRestored: result.totalRestored,
            durationSeconds: result.duration,
        });
    })
);

export const backupRouter = router;
