/**
 * Email Routes
 *
 * Handles email preferences and unsubscribe requests.
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { users } from '../db/schema'
import { verifyToken } from '../lib/jwt'
import {
  getEmailPreferences,
  updateEmailPreferences,
  handleUnsubscribe,
  type EmailPreferences,
} from '../lib/email'

const email = new Hono()

// Schemas
const updatePreferencesSchema = z.object({
  betOutcome: z.boolean().optional(),
  newFollower: z.boolean().optional(),
  mentions: z.boolean().optional(),
  weeklyDigest: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
})

const unsubscribeSchema = z.object({
  email: z.string().email(),
  token: z.string(),
  type: z.enum(['betOutcome', 'newFollower', 'mentions', 'weeklyDigest', 'marketingEmails', 'all']).optional(),
})

const updateEmailSchema = z.object({
  email: z.string().email(),
})

/**
 * Get current user's email preferences
 */
email.get('/preferences', async (c) => {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const payload = verifyToken(auth.slice(7))
  if (!payload) {
    return c.json({ error: 'Invalid token' }, 401)
  }

  const preferences = await getEmailPreferences(payload.userId)
  return c.json({ preferences })
})

/**
 * Update current user's email preferences
 */
email.patch('/preferences', zValidator('json', updatePreferencesSchema), async (c) => {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const payload = verifyToken(auth.slice(7))
  if (!payload) {
    return c.json({ error: 'Invalid token' }, 401)
  }

  const updates = c.req.valid('json')
  const preferences = await updateEmailPreferences(payload.userId, updates as Partial<EmailPreferences>)
  return c.json({ preferences })
})

/**
 * Get current user's email address
 */
email.get('/address', async (c) => {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const payload = verifyToken(auth.slice(7))
  if (!payload) {
    return c.json({ error: 'Invalid token' }, 401)
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, payload.userId),
  })

  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }

  return c.json({
    email: user.email,
    verified: user.emailVerified,
  })
})

/**
 * Update current user's email address
 */
email.put('/address', zValidator('json', updateEmailSchema), async (c) => {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const payload = verifyToken(auth.slice(7))
  if (!payload) {
    return c.json({ error: 'Invalid token' }, 401)
  }

  const { email: newEmail } = c.req.valid('json')

  // Check if email is already in use
  const existing = await db.query.users.findFirst({
    where: eq(users.email, newEmail),
  })

  if (existing && existing.id !== payload.userId) {
    return c.json({ error: 'Email already in use' }, 400)
  }

  // Update email and mark as unverified
  await db.update(users)
    .set({ email: newEmail, emailVerified: false })
    .where(eq(users.id, payload.userId))

  // TODO: Send verification email via job queue

  return c.json({
    email: newEmail,
    verified: false,
    message: 'Email updated. Please check your inbox for verification.',
  })
})

/**
 * Handle unsubscribe request (public endpoint)
 */
email.post('/unsubscribe', zValidator('json', unsubscribeSchema), async (c) => {
  const { email: userEmail, token, type } = c.req.valid('json')

  const result = await handleUnsubscribe(userEmail, token, type)

  if (!result.success) {
    return c.json({ error: result.error }, 400)
  }

  return c.json({ success: true, message: 'Successfully unsubscribed' })
})

/**
 * Handle unsubscribe request via GET (for email links)
 */
email.get('/unsubscribe', async (c) => {
  const userEmail = c.req.query('email')
  const token = c.req.query('token')
  const type = c.req.query('type') as keyof EmailPreferences | 'all' | undefined

  if (!userEmail || !token) {
    return c.json({ error: 'Missing email or token' }, 400)
  }

  const result = await handleUnsubscribe(userEmail, token, type)

  if (!result.success) {
    return c.json({ error: result.error }, 400)
  }

  // Return HTML page for better UX
  return c.html(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Unsubscribed - Doomsday</title>
      <style>
        body { font-family: system-ui; max-width: 400px; margin: 100px auto; padding: 20px; text-align: center; }
        h1 { color: #333; }
        p { color: #666; }
        a { color: #000; }
      </style>
    </head>
    <body>
      <h1>Unsubscribed</h1>
      <p>You have been successfully unsubscribed from ${type === 'all' ? 'all emails' : `${type || 'these'} notifications`}.</p>
      <p><a href="${process.env.APP_URL || '/'}">Return to Doomsday</a></p>
    </body>
    </html>
  `)
})

export default email
