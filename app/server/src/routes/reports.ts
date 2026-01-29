/**
 * User Reports API
 *
 * Endpoints for users to report content
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { db } from '../db'
import { reports, posts, comments } from '../db/schema'
import { requireAuth, type AuthContext } from '../middleware/auth'
import { audit } from '../lib/auditLogger'
import { apiRateLimit } from '../middleware/rateLimit'

const reportsRouter = new Hono()

// Report reason values
const reportReasonValues = [
  'spam',
  'harassment',
  'misinformation',
  'hate_speech',
  'violence',
  'illegal_content',
  'impersonation',
  'self_harm',
  'copyright',
  'other',
] as const

// Validation schemas
const createReportSchema = z.object({
  postId: z.string().uuid().optional(),
  commentId: z.string().uuid().optional(),
  reason: z.enum(reportReasonValues),
  details: z.string().max(500).optional(),
}).refine(
  (data) => data.postId || data.commentId,
  { message: 'Either postId or commentId must be provided' }
)

/**
 * POST /reports
 * Create a new report
 */
reportsRouter.post(
  '/',
  apiRateLimit,
  requireAuth,
  zValidator('json', createReportSchema),
  async (c) => {
    const userId = (c as AuthContext).get('userId')
    const { postId, commentId, reason, details } = c.req.valid('json')

    // Determine what is being reported and get the reported user
    let reportedUserId: string | null = null
    let contentType: 'post' | 'comment' = 'post'

    if (postId) {
      const post = await db.query.posts.findFirst({
        where: eq(posts.id, postId),
      })
      if (!post) {
        return c.json({ error: 'Post not found' }, 404)
      }
      reportedUserId = post.authorId
      contentType = 'post'
    } else if (commentId) {
      const comment = await db.query.comments.findFirst({
        where: eq(comments.id, commentId),
      })
      if (!comment) {
        return c.json({ error: 'Comment not found' }, 404)
      }
      reportedUserId = comment.authorId
      contentType = 'comment'
    }

    if (!reportedUserId) {
      return c.json({ error: 'Invalid report target' }, 400)
    }

    // Prevent self-reporting
    if (reportedUserId === userId) {
      return c.json({ error: 'Cannot report your own content' }, 400)
    }

    // Check for duplicate reports
    const existingReport = await db.query.reports.findFirst({
      where: and(
        eq(reports.reporterId, userId),
        postId ? eq(reports.postId, postId) : eq(reports.commentId, commentId!),
        eq(reports.status, 'pending')
      ),
    })

    if (existingReport) {
      return c.json({ error: 'You have already reported this content' }, 409)
    }

    // Create the report
    const [report] = await db
      .insert(reports)
      .values({
        postId: postId || null,
        commentId: commentId || null,
        reportedUserId,
        reporterId: userId,
        reason,
        details: details?.trim() || null,
      })
      .returning()

    // Audit log
    await audit.moderation.contentReported(userId, {
      reportId: report.id,
      contentType,
      contentId: postId || commentId!,
      reason,
    })

    return c.json({
      id: report.id,
      status: report.status,
      createdAt: report.createdAt.getTime(),
    }, 201)
  }
)

/**
 * GET /reports/mine
 * Get reports submitted by the current user
 */
reportsRouter.get('/mine', requireAuth, async (c) => {
  const userId = (c as AuthContext).get('userId')

  const userReports = await db
    .select({
      id: reports.id,
      postId: reports.postId,
      commentId: reports.commentId,
      reason: reports.reason,
      status: reports.status,
      createdAt: reports.createdAt,
    })
    .from(reports)
    .where(eq(reports.reporterId, userId))
    .orderBy(reports.createdAt)
    .limit(50)

  return c.json({
    reports: userReports.map((r) => ({
      ...r,
      createdAt: r.createdAt.getTime(),
    })),
  })
})

export default reportsRouter
