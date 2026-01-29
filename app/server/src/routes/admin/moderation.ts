/**
 * Admin Moderation Routes
 *
 * Endpoints for managing content reports and user moderation
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, and, gt, desc, count, sql } from 'drizzle-orm'
import { db } from '../../db'
import {
  adminUsers,
  adminSessions,
  reports,
  posts,
  users,
  userWarnings,
  userRestrictions,
  appeals,
  moderationLogs,
  hiddenPosts,
  type AdminUser,
} from '../../db/schema'
import type { Context } from 'hono'
import { audit } from '../../lib/auditLogger'

// Extend context for admin
type AdminContext = Context & {
  get(key: 'admin'): AdminUser
  set(key: 'admin', value: AdminUser): void
}

const adminModeration = new Hono()

// Validation schemas
const reportActionSchema = z.object({
  action: z.enum(['warning', 'hide_post', 'delete_post', 'mute_user', 'suspend_user', 'ban_user', 'no_action']),
  notes: z.string().max(1000).optional(),
  duration: z.number().int().min(1).optional(), // Duration in hours for mute/suspend
})

const userActionSchema = z.object({
  action: z.enum(['warn', 'mute', 'suspend', 'ban', 'unban']),
  reason: z.string().min(1).max(500),
  duration: z.number().int().min(1).optional(), // Hours
})

const appealActionSchema = z.object({
  approved: z.boolean(),
  notes: z.string().max(1000).optional(),
})

const querySchema = z.object({
  status: z.enum(['pending', 'under_review', 'resolved_action_taken', 'resolved_no_action', 'dismissed', 'appealed']).optional(),
  reason: z.enum(['spam', 'harassment', 'misinformation', 'hate_speech', 'violence', 'illegal_content', 'impersonation', 'self_harm', 'copyright', 'other']).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
})

/**
 * Middleware to check admin authentication and moderator+ role
 */
async function requireModerationAccess(c: AdminContext, next: () => Promise<void>) {
  const admin = await getAuthenticatedAdmin(c)

  if (!admin) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  // Only super_admin and moderator can access moderation
  if (admin.role !== 'super_admin' && admin.role !== 'moderator') {
    return c.json({ error: 'Insufficient permissions' }, 403)
  }

  c.set('admin', admin)
  await next()
}

/**
 * GET /admin/moderation/stats
 * Get moderation statistics
 */
adminModeration.get('/stats', requireModerationAccess, async (c) => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [
    pendingCount,
    todayCount,
    weekCount,
    byReasonResult,
  ] = await Promise.all([
    db.select({ count: count() }).from(reports).where(eq(reports.status, 'pending')),
    db.select({ count: count() }).from(reports).where(
      and(eq(reports.status, 'pending'), gt(reports.createdAt, today))
    ),
    db.select({ count: count() }).from(reports).where(gt(reports.createdAt, weekAgo)),
    db
      .select({
        reason: reports.reason,
        count: count(),
      })
      .from(reports)
      .where(gt(reports.createdAt, weekAgo))
      .groupBy(reports.reason),
  ])

  const byReason: Record<string, number> = {}
  for (const row of byReasonResult) {
    byReason[row.reason] = Number(row.count)
  }

  return c.json({
    pending: Number(pendingCount[0].count),
    today: Number(todayCount[0].count),
    thisWeek: Number(weekCount[0].count),
    byReason,
  })
})

/**
 * GET /admin/moderation/reports
 * Get reports with filters
 */
adminModeration.get('/reports', requireModerationAccess, zValidator('query', querySchema), async (c) => {
  const query = c.req.valid('query')

  const conditions = []
  if (query.status) {
    conditions.push(eq(reports.status, query.status))
  }
  if (query.reason) {
    conditions.push(eq(reports.reason, query.reason))
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const reportsList = await db
    .select({
      report: reports,
      reportedUser: {
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
      },
    })
    .from(reports)
    .leftJoin(users, eq(reports.reportedUserId, users.id))
    .where(whereClause)
    .orderBy(desc(reports.createdAt))
    .limit(query.limit ?? 50)
    .offset(query.offset ?? 0)

  // Get post content for each report
  const postIds = reportsList
    .filter((r) => r.report.postId)
    .map((r) => r.report.postId!)

  let postMap: Record<string, { content: string; variant: string }> = {}
  if (postIds.length > 0) {
    const postsData = await db
      .select({
        id: posts.id,
        content: posts.content,
        variant: posts.variant,
      })
      .from(posts)
      .where(sql`${posts.id} IN ${postIds}`)

    postMap = Object.fromEntries(postsData.map((p) => [p.id, { content: p.content, variant: p.variant }]))
  }

  return c.json({
    reports: reportsList.map((r) => ({
      id: r.report.id,
      postId: r.report.postId,
      commentId: r.report.commentId,
      reason: r.report.reason,
      details: r.report.details,
      status: r.report.status,
      actionTaken: r.report.actionTaken,
      createdAt: r.report.createdAt.getTime(),
      reviewedAt: r.report.reviewedAt?.getTime(),
      reportedUser: r.reportedUser,
      postContent: r.report.postId ? postMap[r.report.postId] : null,
    })),
  })
})

/**
 * GET /admin/moderation/reports/:id
 * Get a specific report with full details
 */
adminModeration.get('/reports/:id', requireModerationAccess, async (c) => {
  const id = c.req.param('id')

  const report = await db.query.reports.findFirst({
    where: eq(reports.id, id),
  })

  if (!report) {
    return c.json({ error: 'Report not found' }, 404)
  }

  // Get reported user
  const reportedUser = await db.query.users.findFirst({
    where: eq(users.id, report.reportedUserId),
  })

  // Get reporter
  const reporter = await db.query.users.findFirst({
    where: eq(users.id, report.reporterId),
  })

  // Get post content if applicable
  let postContent = null
  if (report.postId) {
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, report.postId),
    })
    if (post) {
      postContent = {
        content: post.content,
        variant: post.variant,
        createdAt: post.createdAt.getTime(),
      }
    }
  }

  // Get user's report history (how many times they've been reported)
  const userReportCount = await db
    .select({ count: count() })
    .from(reports)
    .where(eq(reports.reportedUserId, report.reportedUserId))

  // Get user's warning count
  const warningCount = await db
    .select({ count: count() })
    .from(userWarnings)
    .where(eq(userWarnings.userId, report.reportedUserId))

  return c.json({
    ...report,
    createdAt: report.createdAt.getTime(),
    reviewedAt: report.reviewedAt?.getTime(),
    reportedUser: reportedUser ? {
      id: reportedUser.id,
      username: reportedUser.username,
      displayName: reportedUser.displayName,
      avatarUrl: reportedUser.avatarUrl,
      reportCount: Number(userReportCount[0].count),
      warningCount: Number(warningCount[0].count),
    } : null,
    reporter: reporter ? {
      id: reporter.id,
      username: reporter.username,
    } : null,
    postContent,
  })
})

/**
 * POST /admin/moderation/reports/:id/action
 * Take action on a report
 */
adminModeration.post(
  '/reports/:id/action',
  requireModerationAccess,
  zValidator('json', reportActionSchema),
  async (c) => {
    const id = c.req.param('id')
    const { action, notes, duration } = c.req.valid('json')
    const admin = (c as AdminContext).get('admin')

    const report = await db.query.reports.findFirst({
      where: eq(reports.id, id),
    })

    if (!report) {
      return c.json({ error: 'Report not found' }, 404)
    }

    if (report.status !== 'pending' && report.status !== 'under_review') {
      return c.json({ error: 'Report already resolved' }, 400)
    }

    // Execute the action
    const reportedUser = await db.query.users.findFirst({
      where: eq(users.id, report.reportedUserId),
    })

    if (!reportedUser) {
      return c.json({ error: 'Reported user not found' }, 404)
    }

    switch (action) {
      case 'warning':
        await db.insert(userWarnings).values({
          userId: report.reportedUserId,
          reason: notes || report.reason,
          issuedBy: admin.id,
          reportId: report.id,
        })
        break

      case 'hide_post':
        if (report.postId) {
          await db.insert(hiddenPosts).values({
            postId: report.postId,
            hiddenBy: admin.id,
            reason: notes,
          }).onConflictDoNothing()
        }
        break

      case 'delete_post':
        if (report.postId) {
          await db.delete(posts).where(eq(posts.id, report.postId))
        }
        break

      case 'mute_user':
        await db.insert(userRestrictions).values({
          userId: report.reportedUserId,
          type: 'mute',
          reason: notes || report.reason,
          issuedBy: admin.id,
          reportId: report.id,
          expiresAt: duration ? new Date(Date.now() + duration * 60 * 60 * 1000) : null,
        })
        break

      case 'suspend_user':
        await db.insert(userRestrictions).values({
          userId: report.reportedUserId,
          type: 'suspend',
          reason: notes || report.reason,
          issuedBy: admin.id,
          reportId: report.id,
          expiresAt: duration ? new Date(Date.now() + duration * 60 * 60 * 1000) : null,
        })
        break

      case 'ban_user':
        await db.insert(userRestrictions).values({
          userId: report.reportedUserId,
          type: 'ban',
          reason: notes || report.reason,
          issuedBy: admin.id,
          reportId: report.id,
          expiresAt: null, // Permanent
        })
        break
    }

    // Update report status
    const newStatus = action === 'no_action' ? 'resolved_no_action' : 'resolved_action_taken'
    await db
      .update(reports)
      .set({
        status: newStatus,
        reviewedBy: admin.id,
        reviewedAt: new Date(),
        reviewNotes: notes,
        actionTaken: action,
        updatedAt: new Date(),
      })
      .where(eq(reports.id, id))

    // Create moderation log
    await db.insert(moderationLogs).values({
      action,
      moderatorId: admin.id,
      moderatorUsername: admin.username,
      postId: report.postId,
      targetUserId: report.reportedUserId,
      targetUsername: reportedUser.username,
      reportId: report.id,
      reason: notes || report.reason,
      notes,
    })

    // Audit log
    await audit.admin.actionPerformed(
      admin.id,
      admin.username,
      'moderation_action',
      { type: 'report', id: report.id },
      {
        action,
        targetUserId: report.reportedUserId,
        targetUsername: reportedUser.username,
      },
      notes
    )

    return c.json({ success: true })
  }
)

/**
 * GET /admin/moderation/users/:userId
 * Get user moderation history
 */
adminModeration.get('/users/:userId', requireModerationAccess, async (c) => {
  const userId = c.req.param('userId')

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  })

  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }

  const [warnings, restrictions, userReports, appealsResult] = await Promise.all([
    db
      .select()
      .from(userWarnings)
      .where(eq(userWarnings.userId, userId))
      .orderBy(desc(userWarnings.createdAt)),
    db
      .select()
      .from(userRestrictions)
      .where(eq(userRestrictions.userId, userId))
      .orderBy(desc(userRestrictions.createdAt)),
    db
      .select({ count: count() })
      .from(reports)
      .where(eq(reports.reportedUserId, userId)),
    db
      .select()
      .from(appeals)
      .where(eq(appeals.userId, userId))
      .orderBy(desc(appeals.createdAt)),
  ])

  // Determine current status
  const activeRestriction = restrictions.find(
    (r) => !r.revokedAt && (!r.expiresAt || r.expiresAt > new Date())
  )

  let status = 'active'
  if (activeRestriction) {
    status = activeRestriction.type === 'ban' ? 'banned' :
             activeRestriction.type === 'suspend' ? 'suspended' : 'muted'
  } else if (warnings.length > 0) {
    status = 'warned'
  }

  return c.json({
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt.getTime(),
    },
    status,
    stats: {
      reportCount: Number(userReports[0].count),
      warningCount: warnings.length,
      restrictionCount: restrictions.length,
    },
    warnings: warnings.map((w) => ({
      ...w,
      createdAt: w.createdAt.getTime(),
      acknowledgedAt: w.acknowledgedAt?.getTime(),
    })),
    restrictions: restrictions.map((r) => ({
      ...r,
      createdAt: r.createdAt.getTime(),
      expiresAt: r.expiresAt?.getTime(),
      revokedAt: r.revokedAt?.getTime(),
    })),
    appeals: appealsResult.map((a) => ({
      ...a,
      createdAt: a.createdAt.getTime(),
      reviewedAt: a.reviewedAt?.getTime(),
    })),
  })
})

/**
 * POST /admin/moderation/users/:userId/action
 * Take action on a user directly
 */
adminModeration.post(
  '/users/:userId/action',
  requireModerationAccess,
  zValidator('json', userActionSchema),
  async (c) => {
    const userId = c.req.param('userId')
    const { action, reason, duration } = c.req.valid('json')
    const admin = (c as AdminContext).get('admin')

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })

    if (!user) {
      return c.json({ error: 'User not found' }, 404)
    }

    switch (action) {
      case 'warn':
        await db.insert(userWarnings).values({
          userId,
          reason,
          issuedBy: admin.id,
        })
        break

      case 'mute':
      case 'suspend':
      case 'ban':
        await db.insert(userRestrictions).values({
          userId,
          type: action === 'ban' ? 'ban' : action === 'suspend' ? 'suspend' : 'mute',
          reason,
          issuedBy: admin.id,
          expiresAt: action === 'ban' ? null :
            duration ? new Date(Date.now() + duration * 60 * 60 * 1000) : null,
        })
        break

      case 'unban':
        // Revoke all active restrictions
        await db
          .update(userRestrictions)
          .set({
            revokedAt: new Date(),
            revokedBy: admin.id,
          })
          .where(
            and(
              eq(userRestrictions.userId, userId),
              sql`${userRestrictions.revokedAt} IS NULL`
            )
          )
        break
    }

    // Create moderation log
    await db.insert(moderationLogs).values({
      action: action === 'warn' ? 'warning' :
              action === 'mute' ? 'mute_user' :
              action === 'suspend' ? 'suspend_user' :
              action === 'ban' ? 'ban_user' : 'no_action',
      moderatorId: admin.id,
      moderatorUsername: admin.username,
      targetUserId: userId,
      targetUsername: user.username,
      reason,
    })

    // Audit log
    await audit.admin.actionPerformed(
      admin.id,
      admin.username,
      `user_${action}`,
      { type: 'user', id: userId },
      { username: user.username },
      reason
    )

    return c.json({ success: true })
  }
)

/**
 * GET /admin/moderation/appeals
 * Get pending appeals
 */
adminModeration.get('/appeals', requireModerationAccess, async (c) => {
  const pendingAppeals = await db
    .select({
      appeal: appeals,
      user: {
        id: users.id,
        username: users.username,
        displayName: users.displayName,
      },
    })
    .from(appeals)
    .leftJoin(users, eq(appeals.userId, users.id))
    .where(eq(appeals.status, 'pending'))
    .orderBy(appeals.createdAt)

  return c.json({
    appeals: pendingAppeals.map((a) => ({
      ...a.appeal,
      createdAt: a.appeal.createdAt.getTime(),
      user: a.user,
    })),
  })
})

/**
 * POST /admin/moderation/appeals/:id/review
 * Review an appeal
 */
adminModeration.post(
  '/appeals/:id/review',
  requireModerationAccess,
  zValidator('json', appealActionSchema),
  async (c) => {
    const id = c.req.param('id')
    const { approved, notes } = c.req.valid('json')
    const admin = (c as AdminContext).get('admin')

    const appeal = await db.query.appeals.findFirst({
      where: eq(appeals.id, id),
    })

    if (!appeal) {
      return c.json({ error: 'Appeal not found' }, 404)
    }

    if (appeal.status !== 'pending') {
      return c.json({ error: 'Appeal already reviewed' }, 400)
    }

    // Update appeal
    await db
      .update(appeals)
      .set({
        status: approved ? 'approved' : 'denied',
        reviewedBy: admin.id,
        reviewNotes: notes,
        reviewedAt: new Date(),
      })
      .where(eq(appeals.id, id))

    // If approved, revoke the restriction
    if (approved && appeal.restrictionId) {
      await db
        .update(userRestrictions)
        .set({
          revokedAt: new Date(),
          revokedBy: admin.id,
        })
        .where(eq(userRestrictions.id, appeal.restrictionId))
    }

    // Audit log
    await audit.admin.actionPerformed(
      admin.id,
      admin.username,
      approved ? 'appeal_approved' : 'appeal_denied',
      { type: 'appeal', id },
      { userId: appeal.userId },
      notes
    )

    return c.json({ success: true })
  }
)

/**
 * GET /admin/moderation/logs
 * Get moderation logs
 */
adminModeration.get('/logs', requireModerationAccess, async (c) => {
  const logs = await db
    .select()
    .from(moderationLogs)
    .orderBy(desc(moderationLogs.createdAt))
    .limit(100)

  return c.json({
    logs: logs.map((l) => ({
      ...l,
      createdAt: l.createdAt.getTime(),
    })),
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

export default adminModeration
