/**
 * Jobs Module
 *
 * Background job processing with BullMQ.
 * Initializes all queues and workers.
 */

import {
  QueueNames,
  type QueueName,
  registerWorker,
  addJob,
  addBulkJobs,
  scheduleRecurringJob,
  getAllQueueStats,
  closeAllQueues,
} from './queue'
import { emailHandler, EmailJobs, type EmailJobData } from './handlers/email'
import { notificationHandler, NotificationJobs, type NotificationJobData } from './handlers/notifications'
import { eventResolutionHandler, batchPayoutHandler, type EventResolutionJobData, type BatchPayoutJobData } from './handlers/events'
import { analyticsHandler, type AnalyticsJobData } from './handlers/analytics'
import { cleanupHandler, type CleanupJobData } from './handlers/cleanup'
import { logger } from '../logger'

/**
 * Initialize all job workers
 */
export function initializeWorkers(): void {
  logger.info('Initializing job workers...')

  // Email worker
  registerWorker<EmailJobData>(QueueNames.EMAIL, emailHandler, { concurrency: 10 })

  // Notifications worker
  registerWorker<NotificationJobData>(QueueNames.NOTIFICATIONS, notificationHandler, { concurrency: 20 })

  // Event resolution worker (lower concurrency for consistency)
  registerWorker<EventResolutionJobData>(QueueNames.EVENT_RESOLUTION, eventResolutionHandler, { concurrency: 2 })

  // Batch payouts worker
  registerWorker<BatchPayoutJobData>(QueueNames.BATCH_PAYOUTS, batchPayoutHandler, { concurrency: 5 })

  // Analytics worker
  registerWorker<AnalyticsJobData>(QueueNames.ANALYTICS, analyticsHandler, { concurrency: 1 })

  // Cleanup worker
  registerWorker<CleanupJobData>(QueueNames.CLEANUP, cleanupHandler, { concurrency: 1 })

  logger.info('All job workers initialized')
}

/**
 * Schedule recurring maintenance jobs
 */
export async function scheduleRecurringJobs(): Promise<void> {
  logger.info('Scheduling recurring jobs...')

  // Daily stats aggregation at 1 AM
  await scheduleRecurringJob(QueueNames.ANALYTICS, 'aggregate-daily', {
    type: 'aggregate_daily',
  } as AnalyticsJobData, '0 1 * * *')

  // Weekly stats aggregation at 2 AM on Sundays
  await scheduleRecurringJob(QueueNames.ANALYTICS, 'aggregate-weekly', {
    type: 'aggregate_weekly',
  } as AnalyticsJobData, '0 2 * * 0')

  // Update leaderboard every 5 minutes
  await scheduleRecurringJob(QueueNames.ANALYTICS, 'update-leaderboard', {
    type: 'update_leaderboard',
    period: 'daily',
  } as AnalyticsJobData, '*/5 * * * *')

  // Calculate trends every 15 minutes
  await scheduleRecurringJob(QueueNames.ANALYTICS, 'calculate-trends', {
    type: 'calculate_trends',
  } as AnalyticsJobData, '*/15 * * * *')

  // Clean expired sessions every hour
  await scheduleRecurringJob(QueueNames.CLEANUP, 'cleanup-sessions', {
    type: 'expired_sessions',
  } as CleanupJobData, '0 * * * *')

  // Clean old jobs every 6 hours
  await scheduleRecurringJob(QueueNames.CLEANUP, 'cleanup-jobs', {
    type: 'old_jobs',
  } as CleanupJobData, '0 */6 * * *')

  logger.info('Recurring jobs scheduled')
}

// Re-export for convenience
export {
  QueueNames,
  addJob,
  addBulkJobs,
  scheduleRecurringJob,
  getAllQueueStats,
  closeAllQueues,
  EmailJobs,
  NotificationJobs,
}
export type { QueueName, EmailJobData, NotificationJobData, EventResolutionJobData, BatchPayoutJobData, AnalyticsJobData, CleanupJobData }
