import cron from "node-cron";
import { runSystemBackup, cleanupOldBackups } from "./backup.service.js";

const CRON_SCHEDULE = "0 2 * * *"; // 2:00 AM every day
const CLEANUP_SCHEDULE = "0 3 * * *"; // 3:00 AM every day (after backup)

let isScheduled = false;

const runBackupJob = async () => {
    try {
        await runSystemBackup();
        console.log("[Backup Cron] Scheduled backup completed successfully");
    } catch (err) {
        console.error("[Backup Cron] Scheduled backup failed:", err.message);
    }
};

const runCleanupJob = async () => {
    try {
        await cleanupOldBackups();
        console.log("[Backup Cron] Cleanup completed");
    } catch (err) {
        console.error("[Backup Cron] Cleanup failed:", err.message);
    }
};

/**
 * Start backup cron jobs - call after DB connection is ready
 * Does not block app startup
 */
export const startBackupCron = () => {
    if (isScheduled) return;

    cron.schedule(CRON_SCHEDULE, runBackupJob, {
        scheduled: true,
        timezone: "UTC",
    });
    console.log("[Backup Cron] Scheduled: daily backup at 2:00 AM UTC");

    cron.schedule(CLEANUP_SCHEDULE, runCleanupJob, {
        scheduled: true,
        timezone: "UTC",
    });
    console.log("[Backup Cron] Scheduled: cleanup at 3:00 AM UTC (backups older than 30 days)");

    isScheduled = true;
};
