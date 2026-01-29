/**
 * User Verification Routes
 * Issue #45: Add user verification system
 *
 * Handles verification request submission and status checking
 */

import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { db } from '../db'
import { users, verificationRequests } from '../db/schema'
import { eq, desc, and } from 'drizzle-orm'
import { requireAuth } from '../middleware/auth'

const app = new Hono()

// Validation schemas
const verificationRequestSchema = z.object({
  type: z.enum(['notable', 'creator', 'business', 'official']),
  realName: z.string().min(2).max(100),
  category: z.string().min(2).max(50),
  description: z.string().min(50).max(1000),
  evidenceUrls: z.array(z.string().url()).min(1).max(5).optional(),
  publicEmail: z.string().email().optional(),
  websiteUrl: z.string().url().optional(),
})

/**
 * GET /verification/status
 * Get current user's verification status
 */
app.get('/status', requireAuth, async (c) => {
  const userId = c.get('userId')

  // Get user's verified status
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      verified: true,
    },
  })

  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }

  // Get latest verification request
  const request = await db.query.verificationRequests.findFirst({
    where: eq(verificationRequests.userId, userId),
    orderBy: [desc(verificationRequests.createdAt)],
    columns: {
      id: true,
      type: true,
      status: true,
      category: true,
      rejectionReason: true,
      createdAt: true,
      reviewedAt: true,
    },
  })

  return c.json({
    verified: user.verified,
    request: request || null,
    canRequest: !user.verified && (!request || request.status === 'rejected'),
  })
})

/**
 * POST /verification/request
 * Submit a verification request
 */
app.post(
  '/request',
  requireAuth,
  zValidator('json', verificationRequestSchema),
  async (c) => {
    const userId = c.get('userId')
    const body = c.req.valid('json')

    // Check if user is already verified
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        verified: true,
        username: true,
      },
    })

    if (!user) {
      return c.json({ error: 'User not found' }, 404)
    }

    if (user.verified) {
      return c.json({ error: 'Account is already verified' }, 400)
    }

    // Check for existing pending request
    const existingRequest = await db.query.verificationRequests.findFirst({
      where: and(
        eq(verificationRequests.userId, userId),
        eq(verificationRequests.status, 'pending')
      ),
    })

    if (existingRequest) {
      return c.json({ error: 'You already have a pending verification request' }, 400)
    }

    // Create verification request
    const [request] = await db.insert(verificationRequests).values({
      userId,
      type: body.type,
      realName: body.realName,
      category: body.category,
      description: body.description,
      evidenceUrls: body.evidenceUrls ? JSON.stringify(body.evidenceUrls) : null,
      publicEmail: body.publicEmail,
      websiteUrl: body.websiteUrl,
    }).returning()

    return c.json({
      success: true,
      request: {
        id: request.id,
        type: request.type,
        status: request.status,
        createdAt: request.createdAt,
      },
    }, 201)
  }
)

/**
 * DELETE /verification/request
 * Cancel a pending verification request
 */
app.delete('/request', requireAuth, async (c) => {
  const userId = c.get('userId')

  // Find pending request
  const request = await db.query.verificationRequests.findFirst({
    where: and(
      eq(verificationRequests.userId, userId),
      eq(verificationRequests.status, 'pending')
    ),
  })

  if (!request) {
    return c.json({ error: 'No pending request found' }, 404)
  }

  // Delete the request
  await db.delete(verificationRequests).where(eq(verificationRequests.id, request.id))

  return c.json({ success: true })
})

export const verificationRouter = app
