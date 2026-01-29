/**
 * Push Notification Routes
 *
 * Handles Web Push subscription management and notification delivery.
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { verifyToken } from '../lib/jwt'
import { logger } from '../lib/logger'

const push = new Hono()

// VAPID keys should be generated once and stored in env
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''

// In-memory subscription store (in production, use database)
const subscriptions = new Map<string, PushSubscriptionJSON>()

// Schemas
const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
})

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
})

/**
 * GET /push/vapid-key
 * Get VAPID public key for client subscription
 */
push.get('/vapid-key', (c) => {
  if (!VAPID_PUBLIC_KEY) {
    logger.warn('VAPID_PUBLIC_KEY not configured')
    return c.json({
      publicKey: '',
      configured: false,
    })
  }

  return c.json({
    publicKey: VAPID_PUBLIC_KEY,
    configured: true,
  })
})

/**
 * POST /push/subscribe
 * Subscribe to push notifications
 */
push.post('/subscribe', zValidator('json', subscriptionSchema), async (c) => {
  const auth = c.req.header('Authorization')
  let userId: string | null = null

  if (auth?.startsWith('Bearer ')) {
    const payload = verifyToken(auth.slice(7))
    if (payload) {
      userId = payload.userId
    }
  }

  const subscription = c.req.valid('json')

  // Store subscription
  const key = userId || subscription.endpoint
  subscriptions.set(key, subscription)

  logger.info({ userId, endpoint: subscription.endpoint }, 'Push subscription added')

  return c.json({ success: true })
})

/**
 * POST /push/unsubscribe
 * Unsubscribe from push notifications
 */
push.post('/unsubscribe', zValidator('json', unsubscribeSchema), async (c) => {
  const auth = c.req.header('Authorization')
  let userId: string | null = null

  if (auth?.startsWith('Bearer ')) {
    const payload = verifyToken(auth.slice(7))
    if (payload) {
      userId = payload.userId
    }
  }

  const { endpoint } = c.req.valid('json')

  // Remove subscription
  const key = userId || endpoint
  subscriptions.delete(key)

  // Also try to remove by endpoint
  for (const [k, v] of subscriptions.entries()) {
    if (v.endpoint === endpoint) {
      subscriptions.delete(k)
    }
  }

  logger.info({ userId, endpoint }, 'Push subscription removed')

  return c.json({ success: true })
})

/**
 * GET /push/status
 * Check subscription status for current user
 */
push.get('/status', async (c) => {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) {
    return c.json({ subscribed: false })
  }

  const payload = verifyToken(auth.slice(7))
  if (!payload) {
    return c.json({ subscribed: false })
  }

  const subscribed = subscriptions.has(payload.userId)

  return c.json({
    subscribed,
    configured: !!VAPID_PUBLIC_KEY,
  })
})

/**
 * Send a push notification to a user
 * Internal function for use by other services
 */
export async function sendPushNotification(
  userId: string,
  notification: {
    title: string
    body: string
    icon?: string
    badge?: string
    data?: Record<string, unknown>
    actions?: Array<{ action: string; title: string }>
  }
): Promise<boolean> {
  const subscription = subscriptions.get(userId)

  if (!subscription || !VAPID_PRIVATE_KEY) {
    return false
  }

  try {
    // In production, use web-push library:
    // import webpush from 'web-push'
    // webpush.setVapidDetails(
    //   'mailto:admin@doomsday.app',
    //   VAPID_PUBLIC_KEY,
    //   VAPID_PRIVATE_KEY
    // )
    // await webpush.sendNotification(subscription, JSON.stringify(notification))

    logger.info({ userId, title: notification.title }, 'Push notification would be sent')
    return true
  } catch (error) {
    logger.error({ error, userId }, 'Failed to send push notification')
    return false
  }
}

/**
 * Broadcast notification to all subscribers
 * Internal function for use by other services
 */
export async function broadcastNotification(
  notification: {
    title: string
    body: string
    icon?: string
    data?: Record<string, unknown>
  }
): Promise<{ sent: number; failed: number }> {
  let sent = 0
  let failed = 0

  for (const [userId] of subscriptions.entries()) {
    const success = await sendPushNotification(userId, notification)
    if (success) {
      sent++
    } else {
      failed++
    }
  }

  return { sent, failed }
}

export default push
