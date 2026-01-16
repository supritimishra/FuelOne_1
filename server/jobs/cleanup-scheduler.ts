/**
 * Cleanup Scheduler
 * 
 * Automatically runs the cleanup job for expired user data based on retention policies.
 * Runs daily at 2 AM server time.
 */

import * as cron from 'node-cron';
import { cleanupExpiredUsers } from '../../scripts/cleanup-expired-users.js';

let cleanupTask: cron.ScheduledTask | null = null;

/**
 * Start the cleanup scheduler
 * Runs daily at 2:00 AM
 */
export function startCleanupScheduler(): void {
  if (cleanupTask) {
    console.log('[CleanupScheduler] Already running');
    return;
  }

  // Schedule to run daily at 2:00 AM
  // Cron format: minute hour day month day-of-week
  // '0 2 * * *' = Every day at 2:00 AM
  cleanupTask = cron.schedule('0 2 * * *', async () => {
    console.log('[CleanupScheduler] Starting scheduled cleanup job...');
    try {
      await cleanupExpiredUsers();
      console.log('[CleanupScheduler] Cleanup job completed successfully');
    } catch (error: any) {
      console.error('[CleanupScheduler] Cleanup job failed:', error?.message || error);
    }
  }, {
    timezone: 'UTC'
  });

  console.log('[CleanupScheduler] Started - will run daily at 2:00 AM UTC');
}

/**
 * Stop the cleanup scheduler
 */
export function stopCleanupScheduler(): void {
  if (cleanupTask) {
    cleanupTask.stop();
    cleanupTask = null;
    console.log('[CleanupScheduler] Stopped');
  }
}

/**
 * Run cleanup immediately (for testing or manual triggers)
 */
export async function runCleanupNow(): Promise<void> {
  console.log('[CleanupScheduler] Running cleanup job manually...');
  try {
    await cleanupExpiredUsers();
    console.log('[CleanupScheduler] Manual cleanup job completed successfully');
  } catch (error: any) {
    console.error('[CleanupScheduler] Manual cleanup job failed:', error?.message || error);
    throw error;
  }
}

