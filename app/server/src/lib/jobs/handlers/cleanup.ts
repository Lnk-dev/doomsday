/**
 * Cleanup Job Handler
 *
 * Processes cleanup and maintenance tasks.
 */

import type { Job } from 'bullmq'
import { lt } from 'drizzle-orm'
import { db } from '../../../db'
import { adminSessions } from '../../../db/schema'
import { logger } from '../../logger'
import { cleanQueue, QueueNames } from '../queue'

export interface CleanupJobData {
  type: 'expired_sessions' | 'old_jobs' | 'stale_cache' | 'audit_archive'
  olderThan?: string // ISO date string
}

/**
 * Cleanup job handler
 */
export async function cleanupHandler(job: Job<CleanupJobData>): Promise<void> {
  const { type, olderThan } = job.data

  logger.info({ type, olderThan }, 'Processing cleanup job')

  switch (type) {
    case 'expired_sessions':
      await cleanupExpiredSessions()
      break
    case 'old_jobs':
      await cleanupOldJobs()
      break
    case 'stale_cache':
      await cleanupStaleCache()
      break
    case 'audit_archive':
      await archiveOldAuditLogs(olderThan)
      break
  }
}

/**
 * Clean up expired admin sessions
 */
async function cleanupExpiredSessions(): Promise<void> {
  const deleted = await db
    .delete(adminSessions)
    .where(lt(adminSessions.expiresAt, new Date()))
    .returning()

  logger.info({ deleted: deleted.length }, 'Cleaned up expired sessions')
}

/**
 * Clean up old completed/failed jobs from all queues
 */
async function cleanupOldJobs(): Promise<void> {
  const queueNames = Object.values(QueueNames)

  for (const name of queueNames) {
    await cleanQueue(name)
  }

  logger.info({ queues: queueNames.length }, 'Cleaned up old jobs from all queues')
}

/**
 * Clean up stale cache entries
 */
async function cleanupStaleCache(): Promise<void> {
  // Redis handles TTL automatically, but this can be used for
  // manual cleanup of specific patterns if needed
  logger.info('Cache cleanup completed (TTL handles most cleanup)')
}

/**
 * Archive old audit logs (placeholder)
 */
async function archiveOldAuditLogs(olderThan?: string): Promise<void> {
  const cutoffDate = olderThan
    ? new Date(olderThan)
    : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90 days

  logger.info({ cutoffDate }, 'Would archive audit logs older than this date')

  // In production, this would:
  // 1. Export old logs to cold storage (S3, etc.)
  // 2. Delete from main database
  // 3. Update audit log chain references

  // For now, just log
  logger.info({ cutoffDate }, 'Audit log archival placeholder')
}
