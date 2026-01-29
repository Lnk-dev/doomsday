/**
 * Admin Verification Routes
 * Issue #45: Add user verification system
 *
 * Admin endpoints for reviewing and managing verification requests
 */

import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { db } from '../../db'
import { users, verificationRequests, adminUsers, adminSessions, type AdminUser } from '../../db/schema'
import { eq, desc, sql, and, gt } from 'drizzle-orm'
import { audit } from '../../lib/auditLogger'
import type { Context } from 'hono'

// Extend context for admin
type AdminContext = Context & {
  get(key: 'admin'): AdminUser
  set(key: 'admin', value: AdminUser): void
}

const adminVerification = new Hono()

// Validation schemas
const reviewSchema = z.object({
  approved: z.boolean(),
  notes: z.string().max(500).optional(),
  rejectionReason: z.string().max(500).optional(),
})

/**
 * Middleware to check admin authentication and moderator+ role
 */
async function requireModerationAccess(c: AdminContext, next: () => Promise<void>) {
  const admin = await getAuthenticatedAdmin(c)

  if (!admin) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  // Only super_admin and moderator can access verification
  if (admin.role !== 'super_admin' && admin.role !== 'moderator') {
    return c.json({ error: 'Insufficient permissions' }, 403)
  }

  c.set('admin', admin)
  await next()
}

/**
 * GET /admin/verification/stats
 * Get verification statistics
 */
adminVerification.get('/stats', requireModerationAccess, async (c) => {
  const stats = await db.select({
    status: verificationRequests.status,
    count: sql<number>`count(*)::int`,
  })
    .from(verificationRequests)
    .groupBy(verificationRequests.status)

  const statsMap = stats.reduce((acc, stat) => {
    acc[stat.status] = stat.count
    return acc
  }, {} as Record<string, number>)

  // Get verified users count
  const [verifiedCount] = await db.select({
    count: sql<number>`count(*)::int`,
  })
    .from(users)
    .where(eq(users.verified, true))

  return c.json({
    pending: statsMap.pending || 0,
    approved: statsMap.approved || 0,
    rejected: statsMap.rejected || 0,
    revoked: statsMap.revoked || 0,
    totalVerified: verifiedCount?.count || 0,
  })
})

/**
 * GET /admin/verification/requests
 * Get verification requests with optional status filter
 */
adminVerification.get('/requests', requireModerationAccess, async (c) => {
  const status = c.req.query('status') as 'pending' | 'approved' | 'rejected' | 'revoked' | undefined
  const limit = parseInt(c.req.query('limit') || '50')
  const offset = parseInt(c.req.query('offset') || '0')

  const conditions = status ? eq(verificationRequests.status, status) : undefined

  const requests = await db.query.verificationRequests.findMany({
    where: conditions,
    orderBy: [desc(verificationRequests.createdAt)],
    limit,
    offset,
    with: {
      user: {
        columns: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          createdAt: true,
        },
      },
    },
  })

  // Count total
  const [{ count }] = await db.select({
    count: sql<number>`count(*)::int`,
  })
    .from(verificationRequests)
    .where(conditions)

  return c.json({
    requests: requests.map(r => ({
      id: r.id,
      type: r.type,
      status: r.status,
      realName: r.realName,
      category: r.category,
      description: r.description,
      evidenceUrls: r.evidenceUrls ? JSON.parse(r.evidenceUrls) : [],
      publicEmail: r.publicEmail,
      websiteUrl: r.websiteUrl,
      rejectionReason: r.rejectionReason,
      createdAt: r.createdAt,
      reviewedAt: r.reviewedAt,
      user: r.user,
    })),
    total: count,
    limit,
    offset,
  })
})

/**
 * GET /admin/verification/requests/:id
 * Get a specific verification request
 */
adminVerification.get('/requests/:id', requireModerationAccess, async (c) => {
  const requestId = c.req.param('id')

  const request = await db.query.verificationRequests.findFirst({
    where: eq(verificationRequests.id, requestId),
    with: {
      user: {
        columns: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          verified: true,
          createdAt: true,
        },
      },
    },
  })

  if (!request) {
    return c.json({ error: 'Request not found' }, 404)
  }

  // Get reviewer info if reviewed
  let reviewer = null
  if (request.reviewedBy) {
    reviewer = await db.query.adminUsers.findFirst({
      where: eq(adminUsers.id, request.reviewedBy),
      columns: {
        id: true,
        username: true,
      },
    })
  }

  return c.json({
    ...request,
    evidenceUrls: request.evidenceUrls ? JSON.parse(request.evidenceUrls) : [],
    reviewer,
  })
})

/**
 * POST /admin/verification/requests/:id/review
 * Review a verification request (approve/reject)
 */
adminVerification.post(
  '/requests/:id/review',
  requireModerationAccess,
  zValidator('json', reviewSchema),
  async (c) => {
    const requestId = c.req.param('id')
    const admin = (c as AdminContext).get('admin')
    const body = c.req.valid('json')

    // Get the request
    const request = await db.query.verificationRequests.findFirst({
      where: eq(verificationRequests.id, requestId),
      with: {
        user: {
          columns: {
            id: true,
            username: true,
          },
        },
      },
    })

    if (!request) {
      return c.json({ error: 'Request not found' }, 404)
    }

    if (request.status !== 'pending') {
      return c.json({ error: 'Request has already been reviewed' }, 400)
    }

    const newStatus = body.approved ? 'approved' : 'rejected'

    // Update the request
    await db.update(verificationRequests).set({
      status: newStatus,
      reviewedBy: admin.id,
      reviewNotes: body.notes,
      rejectionReason: body.approved ? null : body.rejectionReason,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(verificationRequests.id, requestId))

    // If approved, update user's verified status
    if (body.approved) {
      await db.update(users).set({
        verified: true,
        updatedAt: new Date(),
      }).where(eq(users.id, request.userId))
    }

    // Log the action
    await audit.admin.verificationReview(admin.id, {
      requestId,
      userId: request.userId,
      username: request.user?.username,
      approved: body.approved,
      rejectionReason: body.rejectionReason,
    })

    return c.json({
      success: true,
      status: newStatus,
    })
  }
)

/**
 * POST /admin/verification/users/:userId/revoke
 * Revoke a user's verification status
 */
adminVerification.post('/users/:userId/revoke', requireModerationAccess, async (c) => {
  const userId = c.req.param('userId')
  const admin = (c as AdminContext).get('admin')
  const { reason } = await c.req.json<{ reason?: string }>()

  // Get the user
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      id: true,
      username: true,
      verified: true,
    },
  })

  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }

  if (!user.verified) {
    return c.json({ error: 'User is not verified' }, 400)
  }

  // Update user's verified status
  await db.update(users).set({
    verified: false,
    updatedAt: new Date(),
  }).where(eq(users.id, userId))

  // Update any approved verification requests to revoked
  await db.update(verificationRequests).set({
    status: 'revoked',
    reviewNotes: reason ? `Revoked: ${reason}` : 'Verification revoked',
    updatedAt: new Date(),
  }).where(eq(verificationRequests.userId, userId))

  // Log the action
  await audit.admin.verificationRevoke(admin.id, {
    userId,
    username: user.username,
    reason,
  })

  return c.json({ success: true })
})

/**
 * Helper: Get authenticated admin from token
 */
async function getAuthenticatedAdmin(c: Context) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.slice(7)

  // Find valid session
  const session = await db.query.adminSessions.findFirst({
    where: and(
      eq(adminSessions.token, token),
      gt(adminSessions.expiresAt, new Date())
    ),
  })

  if (!session) {
    return null
  }

  // Find admin
  return db.query.adminUsers.findFirst({
    where: eq(adminUsers.id, session.adminId),
  })
}

export const adminVerificationRouter = adminVerification
