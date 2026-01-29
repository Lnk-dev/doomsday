/**
 * Audit Logger Service
 *
 * Comprehensive audit logging for regulatory compliance.
 * Features:
 * - Immutable log entries with integrity hashing
 * - Chain verification for tamper detection
 * - Who/what/when/where/why tracking
 * - Category-based filtering for reports
 */

import { createHash } from 'crypto'
import { db } from '../db'
import { auditLogs } from '../db/schema'
import { desc, eq, and, gte, lte, sql } from 'drizzle-orm'
import { logger } from './logger'

// Audit log categories
export type AuditCategory =
  | 'auth'
  | 'user'
  | 'betting'
  | 'transfer'
  | 'event'
  | 'moderation'
  | 'admin'
  | 'system'

export type AuditSeverity = 'info' | 'warning' | 'critical'

export type ActorType = 'user' | 'admin' | 'system'

export interface AuditLogEntry {
  // Who
  actorId?: string
  actorType: ActorType
  actorUsername?: string
  // What
  action: string
  category: AuditCategory
  severity?: AuditSeverity
  // Target
  resourceType?: string
  resourceId?: string
  // Where
  ipAddress?: string
  userAgent?: string
  requestId?: string
  // Details
  details?: Record<string, unknown>
  // Why
  reason?: string
}

interface AuditQueryOptions {
  actorId?: string
  category?: AuditCategory
  action?: string
  resourceType?: string
  resourceId?: string
  severity?: AuditSeverity
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}

/**
 * Generate SHA-256 hash for log entry integrity
 */
function generateIntegrityHash(
  entry: Omit<AuditLogEntry, 'severity'> & { severity: AuditSeverity; timestamp: Date; previousHash: string | null }
): string {
  const data = JSON.stringify({
    actorId: entry.actorId,
    actorType: entry.actorType,
    actorUsername: entry.actorUsername,
    action: entry.action,
    category: entry.category,
    severity: entry.severity,
    resourceType: entry.resourceType,
    resourceId: entry.resourceId,
    ipAddress: entry.ipAddress,
    userAgent: entry.userAgent,
    requestId: entry.requestId,
    details: entry.details,
    reason: entry.reason,
    timestamp: entry.timestamp.toISOString(),
    previousHash: entry.previousHash,
  })

  return createHash('sha256').update(data).digest('hex')
}

/**
 * Get the hash of the most recent audit log entry
 */
async function getLastHash(): Promise<string | null> {
  const [lastEntry] = await db
    .select({ integrityHash: auditLogs.integrityHash })
    .from(auditLogs)
    .orderBy(desc(auditLogs.timestamp))
    .limit(1)

  return lastEntry?.integrityHash ?? null
}

/**
 * Log an audit event
 */
export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    const timestamp = new Date()
    const previousHash = await getLastHash()
    const severity = entry.severity ?? 'info'

    const integrityHash = generateIntegrityHash({
      ...entry,
      severity,
      timestamp,
      previousHash,
    })

    await db.insert(auditLogs).values({
      actorId: entry.actorId,
      actorType: entry.actorType,
      actorUsername: entry.actorUsername,
      action: entry.action,
      category: entry.category,
      severity,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      requestId: entry.requestId,
      details: entry.details ? JSON.stringify(entry.details) : null,
      reason: entry.reason,
      timestamp,
      previousHash,
      integrityHash,
    })
  } catch (error) {
    // Log to pino but don't throw - audit logging shouldn't break the app
    logger.error({ error, entry }, 'Failed to write audit log')
  }
}

/**
 * Query audit logs with filters
 */
export async function queryAuditLogs(options: AuditQueryOptions = {}) {
  const conditions = []

  if (options.actorId) {
    conditions.push(eq(auditLogs.actorId, options.actorId))
  }
  if (options.category) {
    conditions.push(eq(auditLogs.category, options.category))
  }
  if (options.action) {
    conditions.push(eq(auditLogs.action, options.action))
  }
  if (options.resourceType) {
    conditions.push(eq(auditLogs.resourceType, options.resourceType))
  }
  if (options.resourceId) {
    conditions.push(eq(auditLogs.resourceId, options.resourceId))
  }
  if (options.severity) {
    conditions.push(eq(auditLogs.severity, options.severity))
  }
  if (options.startDate) {
    conditions.push(gte(auditLogs.timestamp, options.startDate))
  }
  if (options.endDate) {
    conditions.push(lte(auditLogs.timestamp, options.endDate))
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const [logs, countResult] = await Promise.all([
    db
      .select()
      .from(auditLogs)
      .where(whereClause)
      .orderBy(desc(auditLogs.timestamp))
      .limit(options.limit ?? 100)
      .offset(options.offset ?? 0),
    db
      .select({ count: sql<number>`count(*)` })
      .from(auditLogs)
      .where(whereClause),
  ])

  return {
    logs: logs.map((log) => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null,
    })),
    total: Number(countResult[0].count),
  }
}

/**
 * Verify integrity of audit log chain
 * Returns true if chain is intact, false if tampering detected
 */
export async function verifyAuditLogIntegrity(
  startDate?: Date,
  endDate?: Date
): Promise<{ valid: boolean; errors: string[] }> {
  const conditions = []
  if (startDate) conditions.push(gte(auditLogs.timestamp, startDate))
  if (endDate) conditions.push(lte(auditLogs.timestamp, endDate))

  const logs = await db
    .select()
    .from(auditLogs)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(auditLogs.timestamp)

  const errors: string[] = []

  for (let i = 0; i < logs.length; i++) {
    const log = logs[i]
    const expectedPreviousHash = i > 0 ? logs[i - 1].integrityHash : null

    // Verify chain linkage
    if (log.previousHash !== expectedPreviousHash) {
      errors.push(
        `Chain break at log ${log.id}: expected previousHash ${expectedPreviousHash}, got ${log.previousHash}`
      )
    }

    // Verify integrity hash
    const details = log.details ? JSON.parse(log.details) : undefined
    const computedHash = generateIntegrityHash({
      actorId: log.actorId ?? undefined,
      actorType: log.actorType as ActorType,
      actorUsername: log.actorUsername ?? undefined,
      action: log.action,
      category: log.category as AuditCategory,
      severity: log.severity as AuditSeverity,
      resourceType: log.resourceType ?? undefined,
      resourceId: log.resourceId ?? undefined,
      ipAddress: log.ipAddress ?? undefined,
      userAgent: log.userAgent ?? undefined,
      requestId: log.requestId ?? undefined,
      details,
      reason: log.reason ?? undefined,
      timestamp: log.timestamp,
      previousHash: log.previousHash,
    })

    if (computedHash !== log.integrityHash) {
      errors.push(
        `Integrity hash mismatch at log ${log.id}: data may have been tampered`
      )
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Generate compliance report summary
 */
export async function generateComplianceReport(startDate: Date, endDate: Date) {
  const [
    totalLogs,
    byCategoryRaw,
    bySeverityRaw,
    criticalEvents,
    integrityCheck,
  ] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(auditLogs)
      .where(and(gte(auditLogs.timestamp, startDate), lte(auditLogs.timestamp, endDate))),
    db
      .select({
        category: auditLogs.category,
        count: sql<number>`count(*)`,
      })
      .from(auditLogs)
      .where(and(gte(auditLogs.timestamp, startDate), lte(auditLogs.timestamp, endDate)))
      .groupBy(auditLogs.category),
    db
      .select({
        severity: auditLogs.severity,
        count: sql<number>`count(*)`,
      })
      .from(auditLogs)
      .where(and(gte(auditLogs.timestamp, startDate), lte(auditLogs.timestamp, endDate)))
      .groupBy(auditLogs.severity),
    db
      .select()
      .from(auditLogs)
      .where(
        and(
          gte(auditLogs.timestamp, startDate),
          lte(auditLogs.timestamp, endDate),
          eq(auditLogs.severity, 'critical')
        )
      )
      .orderBy(desc(auditLogs.timestamp))
      .limit(100),
    verifyAuditLogIntegrity(startDate, endDate),
  ])

  const byCategory: Record<string, number> = {}
  for (const row of byCategoryRaw) {
    byCategory[row.category] = Number(row.count)
  }

  const bySeverity: Record<string, number> = {}
  for (const row of bySeverityRaw) {
    bySeverity[row.severity] = Number(row.count)
  }

  return {
    period: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    },
    summary: {
      totalEvents: Number(totalLogs[0].count),
      byCategory,
      bySeverity,
    },
    criticalEvents: criticalEvents.map((log) => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null,
    })),
    integrityVerification: integrityCheck,
    generatedAt: new Date().toISOString(),
  }
}

// Convenience methods for common audit events

export const audit = {
  // Authentication events
  auth: {
    login: (userId: string, username: string, context: { ip?: string; userAgent?: string; method?: string }) =>
      logAudit({
        actorId: userId,
        actorType: 'user',
        actorUsername: username,
        action: 'auth.login',
        category: 'auth',
        ipAddress: context.ip,
        userAgent: context.userAgent,
        details: { method: context.method ?? 'password' },
      }),

    logout: (userId: string, username: string, context: { ip?: string }) =>
      logAudit({
        actorId: userId,
        actorType: 'user',
        actorUsername: username,
        action: 'auth.logout',
        category: 'auth',
        ipAddress: context.ip,
      }),

    loginFailed: (username: string, context: { ip?: string; reason?: string }) =>
      logAudit({
        actorType: 'system',
        action: 'auth.login_failed',
        category: 'auth',
        severity: 'warning',
        ipAddress: context.ip,
        details: { attemptedUsername: username },
        reason: context.reason,
      }),

    twoFactorEnabled: (userId: string, username: string) =>
      logAudit({
        actorId: userId,
        actorType: 'user',
        actorUsername: username,
        action: 'auth.2fa_enabled',
        category: 'auth',
        severity: 'critical',
        resourceType: 'user',
        resourceId: userId,
      }),

    twoFactorDisabled: (userId: string, username: string) =>
      logAudit({
        actorId: userId,
        actorType: 'user',
        actorUsername: username,
        action: 'auth.2fa_disabled',
        category: 'auth',
        severity: 'critical',
        resourceType: 'user',
        resourceId: userId,
      }),
  },

  // Betting events
  betting: {
    placed: (
      userId: string,
      username: string,
      bet: { betId: string; eventId: string; outcome: string; amount: number },
      context: { ip?: string }
    ) =>
      logAudit({
        actorId: userId,
        actorType: 'user',
        actorUsername: username,
        action: 'bet.placed',
        category: 'betting',
        resourceType: 'bet',
        resourceId: bet.betId,
        ipAddress: context.ip,
        details: {
          eventId: bet.eventId,
          outcome: bet.outcome,
          amount: bet.amount,
        },
      }),

    claimed: (
      userId: string,
      username: string,
      bet: { betId: string; payout: number },
      context: { ip?: string }
    ) =>
      logAudit({
        actorId: userId,
        actorType: 'user',
        actorUsername: username,
        action: 'bet.claimed',
        category: 'betting',
        resourceType: 'bet',
        resourceId: bet.betId,
        ipAddress: context.ip,
        details: { payout: bet.payout },
      }),

    cancelled: (
      adminId: string,
      adminUsername: string,
      bet: { betId: string; userId: string; refundAmount: number },
      reason: string
    ) =>
      logAudit({
        actorId: adminId,
        actorType: 'admin',
        actorUsername: adminUsername,
        action: 'bet.cancelled',
        category: 'betting',
        severity: 'warning',
        resourceType: 'bet',
        resourceId: bet.betId,
        details: { userId: bet.userId, refundAmount: bet.refundAmount },
        reason,
      }),
  },

  // Transfer events
  transfer: {
    deposit: (userId: string, username: string, amount: number, token: string) =>
      logAudit({
        actorId: userId,
        actorType: 'user',
        actorUsername: username,
        action: 'transfer.deposit',
        category: 'transfer',
        resourceType: 'user',
        resourceId: userId,
        details: { amount, token },
      }),

    withdrawal: (userId: string, username: string, amount: number, token: string, destination: string) =>
      logAudit({
        actorId: userId,
        actorType: 'user',
        actorUsername: username,
        action: 'transfer.withdrawal',
        category: 'transfer',
        severity: 'critical',
        resourceType: 'user',
        resourceId: userId,
        details: { amount, token, destination },
      }),
  },

  // Event management
  event: {
    created: (
      userId: string,
      username: string,
      event: { eventId: string; title: string }
    ) =>
      logAudit({
        actorId: userId,
        actorType: 'user',
        actorUsername: username,
        action: 'event.created',
        category: 'event',
        resourceType: 'event',
        resourceId: event.eventId,
        details: { title: event.title },
      }),

    resolved: (
      adminId: string,
      adminUsername: string,
      event: { eventId: string; outcome: string; totalPayout: number },
      reason?: string
    ) =>
      logAudit({
        actorId: adminId,
        actorType: 'admin',
        actorUsername: adminUsername,
        action: 'event.resolved',
        category: 'event',
        severity: 'critical',
        resourceType: 'event',
        resourceId: event.eventId,
        details: { outcome: event.outcome, totalPayout: event.totalPayout },
        reason,
      }),

    voided: (
      adminId: string,
      adminUsername: string,
      event: { eventId: string; refundAmount: number },
      reason: string
    ) =>
      logAudit({
        actorId: adminId,
        actorType: 'admin',
        actorUsername: adminUsername,
        action: 'event.voided',
        category: 'event',
        severity: 'critical',
        resourceType: 'event',
        resourceId: event.eventId,
        details: { refundAmount: event.refundAmount },
        reason,
      }),
  },

  // User profile events
  user: {
    profileUpdated: (
      userId: string,
      username: string,
      changes: { before: Record<string, unknown>; after: Record<string, unknown> }
    ) =>
      logAudit({
        actorId: userId,
        actorType: 'user',
        actorUsername: username,
        action: 'user.profile_updated',
        category: 'user',
        resourceType: 'user',
        resourceId: userId,
        details: changes,
      }),

    banned: (
      adminId: string,
      adminUsername: string,
      user: { userId: string; username: string },
      reason: string,
      duration?: number
    ) =>
      logAudit({
        actorId: adminId,
        actorType: 'admin',
        actorUsername: adminUsername,
        action: 'user.banned',
        category: 'moderation',
        severity: 'critical',
        resourceType: 'user',
        resourceId: user.userId,
        details: { targetUsername: user.username, duration },
        reason,
      }),

    unbanned: (
      adminId: string,
      adminUsername: string,
      user: { userId: string; username: string }
    ) =>
      logAudit({
        actorId: adminId,
        actorType: 'admin',
        actorUsername: adminUsername,
        action: 'user.unbanned',
        category: 'moderation',
        resourceType: 'user',
        resourceId: user.userId,
        details: { targetUsername: user.username },
      }),

    accountDeleted: (
      requestedBy: string,
      details: {
        targetUserId: string
        originalUsername: string
        deletedRecords: {
          posts: number
          comments: number
          likes: number
          follows: number
        }
        reason?: string
      }
    ) =>
      logAudit({
        actorId: requestedBy,
        actorType: 'user',
        action: 'user.account_deleted',
        category: 'user',
        severity: 'critical',
        resourceType: 'user',
        resourceId: details.targetUserId,
        details: {
          originalUsername: details.originalUsername,
          deletedRecords: details.deletedRecords,
        },
        reason: details.reason || 'GDPR right to erasure request',
      }),
  },

  // Content moderation events
  moderation: {
    contentReported: (
      reporterId: string,
      details: { reportId: string; contentType: string; contentId: string; reason: string }
    ) =>
      logAudit({
        actorId: reporterId,
        actorType: 'user',
        action: 'moderation.content_reported',
        category: 'moderation',
        resourceType: details.contentType,
        resourceId: details.contentId,
        details: {
          reportId: details.reportId,
          reason: details.reason,
        },
      }),

    reportActioned: (
      adminId: string,
      adminUsername: string,
      details: { reportId: string; action: string; targetUserId: string; targetUsername: string },
      notes?: string
    ) =>
      logAudit({
        actorId: adminId,
        actorType: 'admin',
        actorUsername: adminUsername,
        action: 'moderation.report_actioned',
        category: 'moderation',
        severity: 'warning',
        resourceType: 'report',
        resourceId: details.reportId,
        details: {
          action: details.action,
          targetUserId: details.targetUserId,
          targetUsername: details.targetUsername,
        },
        reason: notes,
      }),

    userWarned: (
      adminId: string,
      adminUsername: string,
      user: { userId: string; username: string },
      reason: string
    ) =>
      logAudit({
        actorId: adminId,
        actorType: 'admin',
        actorUsername: adminUsername,
        action: 'moderation.user_warned',
        category: 'moderation',
        severity: 'warning',
        resourceType: 'user',
        resourceId: user.userId,
        details: { targetUsername: user.username },
        reason,
      }),

    postHidden: (
      adminId: string,
      adminUsername: string,
      postId: string,
      reason?: string
    ) =>
      logAudit({
        actorId: adminId,
        actorType: 'admin',
        actorUsername: adminUsername,
        action: 'moderation.post_hidden',
        category: 'moderation',
        resourceType: 'post',
        resourceId: postId,
        reason,
      }),

    postDeleted: (
      adminId: string,
      adminUsername: string,
      postId: string,
      reason?: string
    ) =>
      logAudit({
        actorId: adminId,
        actorType: 'admin',
        actorUsername: adminUsername,
        action: 'moderation.post_deleted',
        category: 'moderation',
        severity: 'warning',
        resourceType: 'post',
        resourceId: postId,
        reason,
      }),

    appealSubmitted: (
      userId: string,
      appealId: string,
      restrictionId?: string
    ) =>
      logAudit({
        actorId: userId,
        actorType: 'user',
        action: 'moderation.appeal_submitted',
        category: 'moderation',
        resourceType: 'appeal',
        resourceId: appealId,
        details: { restrictionId },
      }),

    appealReviewed: (
      adminId: string,
      adminUsername: string,
      appeal: { appealId: string; userId: string; approved: boolean },
      notes?: string
    ) =>
      logAudit({
        actorId: adminId,
        actorType: 'admin',
        actorUsername: adminUsername,
        action: appeal.approved ? 'moderation.appeal_approved' : 'moderation.appeal_denied',
        category: 'moderation',
        severity: 'warning',
        resourceType: 'appeal',
        resourceId: appeal.appealId,
        details: { userId: appeal.userId, approved: appeal.approved },
        reason: notes,
      }),
  },

  // Admin events
  admin: {
    login: (adminId: string, username: string, context: { ip?: string; userAgent?: string }) =>
      logAudit({
        actorId: adminId,
        actorType: 'admin',
        actorUsername: username,
        action: 'admin.login',
        category: 'admin',
        severity: 'critical',
        ipAddress: context.ip,
        userAgent: context.userAgent,
      }),

    actionPerformed: (
      adminId: string,
      adminUsername: string,
      action: string,
      target: { type: string; id: string },
      details?: Record<string, unknown>,
      reason?: string
    ) =>
      logAudit({
        actorId: adminId,
        actorType: 'admin',
        actorUsername: adminUsername,
        action: `admin.${action}`,
        category: 'admin',
        severity: 'critical',
        resourceType: target.type,
        resourceId: target.id,
        details,
        reason,
      }),
  },
}
