/**
 * Admin Fraud Monitoring Routes
 *
 * Endpoints for viewing and managing fraud alerts
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, and, gt, desc, gte, lte } from 'drizzle-orm'
import { db } from '../../db'
import { adminUsers, adminSessions, fraudAlerts, userRiskProfiles, type AdminUser } from '../../db/schema'
import type { Context } from 'hono'

// Extend context for admin
type AdminContext = Context & {
  get(key: 'admin'): AdminUser
  set(key: 'admin', value: AdminUser): void
}
import {
  getPendingAlerts,
  getUserAlerts,
  updateAlertStatus,
  getFraudStats,
  getUserRiskProfile,
} from '../../lib/fraudDetection'
import { audit } from '../../lib/auditLogger'

const adminFraud = new Hono()

// Validation schemas
const updateStatusSchema = z.object({
  status: z.enum(['investigating', 'confirmed', 'dismissed', 'resolved']),
  resolution: z.string().optional(),
  actionTaken: z.string().optional(),
})

const alertTypeValues = [
  'rapid_betting',
  'large_bet',
  'pattern_anomaly',
  'coordinated_betting',
  'bot_activity',
  'account_takeover',
  'wash_trading',
] as const

const querySchema = z.object({
  status: z.enum(['pending', 'investigating', 'confirmed', 'dismissed', 'resolved']).optional(),
  alertType: z.enum(alertTypeValues).optional(),
  userId: z.string().uuid().optional(),
  minRiskScore: z.coerce.number().min(0).max(100).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
})

/**
 * Middleware to check admin authentication and moderator+ role
 */
async function requireFraudAccess(c: AdminContext, next: () => Promise<void>) {
  const admin = await getAuthenticatedAdmin(c)

  if (!admin) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  // Only super_admin and moderator can access fraud monitoring
  if (admin.role !== 'super_admin' && admin.role !== 'moderator') {
    return c.json({ error: 'Insufficient permissions' }, 403)
  }

  c.set('admin', admin)
  await next()
}

/**
 * GET /admin/fraud/stats
 * Get fraud monitoring statistics
 */
adminFraud.get('/stats', requireFraudAccess, async (c) => {
  const stats = await getFraudStats()
  return c.json(stats)
})

/**
 * GET /admin/fraud/alerts
 * Get fraud alerts with filters
 */
adminFraud.get('/alerts', requireFraudAccess, zValidator('query', querySchema), async (c) => {
  const query = c.req.valid('query')

  const conditions = []

  if (query.status) {
    conditions.push(eq(fraudAlerts.status, query.status))
  }
  if (query.alertType) {
    conditions.push(eq(fraudAlerts.alertType, query.alertType))
  }
  if (query.userId) {
    conditions.push(eq(fraudAlerts.userId, query.userId))
  }
  if (query.minRiskScore !== undefined) {
    conditions.push(gte(fraudAlerts.riskScore, query.minRiskScore))
  }
  if (query.startDate) {
    conditions.push(gte(fraudAlerts.createdAt, new Date(query.startDate)))
  }
  if (query.endDate) {
    conditions.push(lte(fraudAlerts.createdAt, new Date(query.endDate)))
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const alerts = await db
    .select()
    .from(fraudAlerts)
    .where(whereClause)
    .orderBy(desc(fraudAlerts.riskScore), desc(fraudAlerts.createdAt))
    .limit(query.limit ?? 50)
    .offset(query.offset ?? 0)

  return c.json({
    alerts: alerts.map((a) => ({
      ...a,
      details: a.details ? JSON.parse(a.details) : null,
      relatedBetIds: a.relatedBetIds ? JSON.parse(a.relatedBetIds) : null,
      relatedEventIds: a.relatedEventIds ? JSON.parse(a.relatedEventIds) : null,
    })),
  })
})

/**
 * GET /admin/fraud/alerts/pending
 * Get pending alerts for review queue
 */
adminFraud.get('/alerts/pending', requireFraudAccess, async (c) => {
  const alerts = await getPendingAlerts()

  return c.json({
    alerts: alerts.map((a) => ({
      ...a,
      details: a.details ? JSON.parse(a.details) : null,
      relatedBetIds: a.relatedBetIds ? JSON.parse(a.relatedBetIds) : null,
      relatedEventIds: a.relatedEventIds ? JSON.parse(a.relatedEventIds) : null,
    })),
  })
})

/**
 * GET /admin/fraud/alerts/:id
 * Get a specific fraud alert
 */
adminFraud.get('/alerts/:id', requireFraudAccess, async (c) => {
  const id = c.req.param('id')

  const alert = await db.query.fraudAlerts.findFirst({
    where: eq(fraudAlerts.id, id),
  })

  if (!alert) {
    return c.json({ error: 'Alert not found' }, 404)
  }

  return c.json({
    ...alert,
    details: alert.details ? JSON.parse(alert.details) : null,
    relatedBetIds: alert.relatedBetIds ? JSON.parse(alert.relatedBetIds) : null,
    relatedEventIds: alert.relatedEventIds ? JSON.parse(alert.relatedEventIds) : null,
  })
})

/**
 * PATCH /admin/fraud/alerts/:id
 * Update alert status (review, dismiss, confirm, resolve)
 */
adminFraud.patch('/alerts/:id', requireFraudAccess, zValidator('json', updateStatusSchema), async (c) => {
  const id = c.req.param('id')
  const { status, resolution, actionTaken } = c.req.valid('json')
  const admin = (c as AdminContext).get('admin')

  const alert = await db.query.fraudAlerts.findFirst({
    where: eq(fraudAlerts.id, id),
  })

  if (!alert) {
    return c.json({ error: 'Alert not found' }, 404)
  }

  await updateAlertStatus(id, admin.id, status, resolution, actionTaken)

  // Audit log the status change
  await audit.admin.actionPerformed(
    admin.id,
    admin.username,
    'fraud_alert_reviewed',
    { type: 'fraud_alert', id },
    {
      previousStatus: alert.status,
      newStatus: status,
      actionTaken,
    },
    resolution
  )

  return c.json({ success: true })
})

/**
 * GET /admin/fraud/users/:userId/profile
 * Get user's risk profile
 */
adminFraud.get('/users/:userId/profile', requireFraudAccess, async (c) => {
  const userId = c.req.param('userId')

  const profile = await getUserRiskProfile(userId)

  return c.json(profile)
})

/**
 * GET /admin/fraud/users/:userId/alerts
 * Get all alerts for a specific user
 */
adminFraud.get('/users/:userId/alerts', requireFraudAccess, async (c) => {
  const userId = c.req.param('userId')

  const alerts = await getUserAlerts(userId)

  return c.json({
    alerts: alerts.map((a) => ({
      ...a,
      details: a.details ? JSON.parse(a.details) : null,
      relatedBetIds: a.relatedBetIds ? JSON.parse(a.relatedBetIds) : null,
      relatedEventIds: a.relatedEventIds ? JSON.parse(a.relatedEventIds) : null,
    })),
  })
})

/**
 * POST /admin/fraud/users/:userId/watchlist
 * Add user to watchlist
 */
adminFraud.post('/users/:userId/watchlist', requireFraudAccess, async (c) => {
  const userId = c.req.param('userId')
  const admin = (c as AdminContext).get('admin')

  await db
    .update(userRiskProfiles)
    .set({
      isWatchlisted: true,
      updatedAt: new Date(),
    })
    .where(eq(userRiskProfiles.userId, userId))

  await audit.admin.actionPerformed(
    admin.id,
    admin.username,
    'user_watchlisted',
    { type: 'user', id: userId },
    {},
    'Added to fraud watchlist'
  )

  return c.json({ success: true })
})

/**
 * DELETE /admin/fraud/users/:userId/watchlist
 * Remove user from watchlist
 */
adminFraud.delete('/users/:userId/watchlist', requireFraudAccess, async (c) => {
  const userId = c.req.param('userId')
  const admin = (c as AdminContext).get('admin')

  await db
    .update(userRiskProfiles)
    .set({
      isWatchlisted: false,
      updatedAt: new Date(),
    })
    .where(eq(userRiskProfiles.userId, userId))

  await audit.admin.actionPerformed(
    admin.id,
    admin.username,
    'user_unwatchlisted',
    { type: 'user', id: userId },
    {},
    'Removed from fraud watchlist'
  )

  return c.json({ success: true })
})

/**
 * GET /admin/fraud/high-risk-users
 * Get list of high-risk users
 */
adminFraud.get('/high-risk-users', requireFraudAccess, async (c) => {
  const users = await db
    .select()
    .from(userRiskProfiles)
    .where(eq(userRiskProfiles.isHighRisk, true))
    .orderBy(desc(userRiskProfiles.overallRiskScore))
    .limit(100)

  return c.json({ users })
})

/**
 * GET /admin/fraud/watchlist
 * Get watchlisted users
 */
adminFraud.get('/watchlist', requireFraudAccess, async (c) => {
  const users = await db
    .select()
    .from(userRiskProfiles)
    .where(eq(userRiskProfiles.isWatchlisted, true))
    .orderBy(desc(userRiskProfiles.lastAlertAt))
    .limit(100)

  return c.json({ users })
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

export default adminFraud
