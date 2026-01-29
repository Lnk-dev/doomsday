/**
 * Admin Audit Log Routes
 *
 * Endpoints for querying audit logs and generating compliance reports
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, and, gt } from 'drizzle-orm'
import { db } from '../../db'
import { adminUsers, adminSessions } from '../../db/schema'
import type { Context } from 'hono'
import {
  queryAuditLogs,
  verifyAuditLogIntegrity,
  generateComplianceReport,
  type AuditCategory,
  type AuditSeverity,
} from '../../lib/auditLogger'

const adminAudit = new Hono()

// Validation schemas
const querySchema = z.object({
  actorId: z.string().uuid().optional(),
  category: z.enum(['auth', 'user', 'betting', 'transfer', 'event', 'moderation', 'admin', 'system']).optional(),
  action: z.string().optional(),
  resourceType: z.string().optional(),
  resourceId: z.string().uuid().optional(),
  severity: z.enum(['info', 'warning', 'critical']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().min(1).max(1000).optional(),
  offset: z.coerce.number().min(0).optional(),
})

const reportSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
})

const integritySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

/**
 * Middleware to check admin authentication and super_admin/analyst role
 */
async function requireAuditAccess(c: Context, next: () => Promise<void>) {
  const admin = await getAuthenticatedAdmin(c)

  if (!admin) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  // Only super_admin and analyst can access audit logs
  if (admin.role !== 'super_admin' && admin.role !== 'analyst') {
    return c.json({ error: 'Insufficient permissions' }, 403)
  }

  c.set('admin', admin)
  await next()
}

/**
 * GET /admin/audit/logs
 * Query audit logs with filters
 */
adminAudit.get('/logs', requireAuditAccess, zValidator('query', querySchema), async (c) => {
  const query = c.req.valid('query')

  const result = await queryAuditLogs({
    actorId: query.actorId,
    category: query.category as AuditCategory,
    action: query.action,
    resourceType: query.resourceType,
    resourceId: query.resourceId,
    severity: query.severity as AuditSeverity,
    startDate: query.startDate ? new Date(query.startDate) : undefined,
    endDate: query.endDate ? new Date(query.endDate) : undefined,
    limit: query.limit,
    offset: query.offset,
  })

  return c.json(result)
})

/**
 * GET /admin/audit/logs/:id
 * Get a single audit log entry
 */
adminAudit.get('/logs/:id', requireAuditAccess, async (c) => {
  const id = c.req.param('id')

  const result = await queryAuditLogs({
    limit: 1,
  })

  // Find by filtering - in real implementation would query by ID
  const log = result.logs.find((l) => l.id === id)

  if (!log) {
    return c.json({ error: 'Audit log not found' }, 404)
  }

  return c.json(log)
})

/**
 * POST /admin/audit/verify-integrity
 * Verify integrity of audit log chain
 */
adminAudit.post('/verify-integrity', requireAuditAccess, zValidator('json', integritySchema), async (c) => {
  const { startDate, endDate } = c.req.valid('json')

  const result = await verifyAuditLogIntegrity(
    startDate ? new Date(startDate) : undefined,
    endDate ? new Date(endDate) : undefined
  )

  return c.json({
    valid: result.valid,
    errorCount: result.errors.length,
    errors: result.errors.slice(0, 100), // Limit errors returned
    verifiedAt: new Date().toISOString(),
  })
})

/**
 * POST /admin/audit/compliance-report
 * Generate a compliance report for a date range
 */
adminAudit.post('/compliance-report', requireAuditAccess, zValidator('json', reportSchema), async (c) => {
  const { startDate, endDate } = c.req.valid('json')

  const start = new Date(startDate)
  const end = new Date(endDate)

  // Validate date range (max 1 year)
  const maxRange = 365 * 24 * 60 * 60 * 1000
  if (end.getTime() - start.getTime() > maxRange) {
    return c.json({ error: 'Date range cannot exceed 1 year' }, 400)
  }

  const report = await generateComplianceReport(start, end)

  return c.json(report)
})

/**
 * GET /admin/audit/stats
 * Get quick stats about audit logs
 */
adminAudit.get('/stats', requireAuditAccess, async (c) => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [todayLogs, weekLogs, monthLogs, criticalLogs] = await Promise.all([
    queryAuditLogs({ startDate: today, limit: 0 }),
    queryAuditLogs({ startDate: weekAgo, limit: 0 }),
    queryAuditLogs({ startDate: monthAgo, limit: 0 }),
    queryAuditLogs({ severity: 'critical', startDate: monthAgo, limit: 10 }),
  ])

  return c.json({
    counts: {
      today: todayLogs.total,
      thisWeek: weekLogs.total,
      thisMonth: monthLogs.total,
    },
    recentCritical: criticalLogs.logs,
  })
})

// Helper function
async function getAuthenticatedAdmin(c: Context) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.slice(7)

  const session = await db.query.adminSessions.findFirst({
    where: and(
      eq(adminSessions.token, token),
      gt(adminSessions.expiresAt, new Date())
    ),
  })

  if (!session) {
    return null
  }

  return db.query.adminUsers.findFirst({
    where: eq(adminUsers.id, session.adminId),
  })
}

export default adminAudit
