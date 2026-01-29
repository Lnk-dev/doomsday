/**
 * Notifications Job Handler
 *
 * Processes push notifications and in-app notifications.
 */

import type { Job } from 'bullmq'
import { logger } from '../../logger'

export interface NotificationJobData {
  type: 'push' | 'in_app' | 'both'
  userId: string
  title: string
  body: string
  data?: Record<string, unknown>
  action?: {
    type: string
    url: string
  }
}

/**
 * Notification job handler
 */
export async function notificationHandler(job: Job<NotificationJobData>): Promise<void> {
  const { type, userId, title } = job.data

  logger.info({ type, userId, title }, 'Processing notification job')

  if (type === 'push' || type === 'both') {
    // Send push notification (integrate with FCM, APNs, etc.)
    // In production: await pushService.send({ userId, title, body: job.data.body, data: job.data.data })
    logger.info({ userId, title }, 'Push notification would be sent')
  }

  if (type === 'in_app' || type === 'both') {
    // Store in-app notification in database
    // In production: await db.insert(notifications).values({ userId, title, body, data, action })
    logger.info({ userId, title }, 'In-app notification would be stored')
  }

  await new Promise((resolve) => setTimeout(resolve, 50))
}

/**
 * Notification job types
 */
export const NotificationJobs = {
  newFollower: (userId: string, followerName: string, followerUrl: string) => ({
    type: 'both' as const,
    userId,
    title: 'New follower',
    body: `${followerName} started following you`,
    action: { type: 'navigate', url: followerUrl },
  }),

  betResolved: (userId: string, eventTitle: string, won: boolean, amount: number) => ({
    type: 'both' as const,
    userId,
    title: won ? 'You won!' : 'Bet resolved',
    body: won
      ? `Your prediction on "${eventTitle}" was correct! You won ${amount} points.`
      : `The prediction "${eventTitle}" has been resolved.`,
    data: { eventTitle, won, amount },
  }),

  mention: (userId: string, mentionerName: string, postUrl: string) => ({
    type: 'both' as const,
    userId,
    title: 'You were mentioned',
    body: `${mentionerName} mentioned you in a post`,
    action: { type: 'navigate', url: postUrl },
  }),

  systemAlert: (userId: string, message: string) => ({
    type: 'in_app' as const,
    userId,
    title: 'System Alert',
    body: message,
  }),
}
