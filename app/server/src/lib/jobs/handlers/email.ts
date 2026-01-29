/**
 * Email Job Handler
 *
 * Processes email sending jobs asynchronously using the email service.
 */

import type { Job } from 'bullmq'
import { logger } from '../../logger'
import { emailService, type EmailTemplate } from '../../email'

export interface EmailJobData {
  type: EmailTemplate
  to: string
  subject: string
  templateData: Record<string, unknown>
  category?: 'transactional' | 'marketing'
}

/**
 * Email job handler
 */
export async function emailHandler(job: Job<EmailJobData>): Promise<void> {
  const { type, to, subject, templateData, category = 'transactional' } = job.data

  logger.info({ type, to, subject }, 'Processing email job')

  const result = await emailService.send({
    to,
    subject,
    template: type,
    data: templateData,
    category,
  })

  if (!result.success) {
    throw new Error(result.error || 'Failed to send email')
  }

  logger.info({ type, to, messageId: result.messageId }, 'Email job completed')
}

/**
 * Email job types for type-safe job creation
 */
export const EmailJobs = {
  welcome: (to: string, data: { username: string }) => ({
    type: 'welcome' as const,
    to,
    subject: 'Welcome to Doomsday!',
    templateData: data,
  }),

  verification: (to: string, data: { verificationUrl: string }) => ({
    type: 'email-verification' as const,
    to,
    subject: 'Verify your email',
    templateData: data,
  }),

  passwordReset: (to: string, data: { resetUrl: string; expiresIn: string }) => ({
    type: 'password-reset' as const,
    to,
    subject: 'Reset your password',
    templateData: data,
  }),

  betOutcome: (to: string, data: {
    username: string
    eventTitle: string
    won: boolean
    payout: number
    eventUrl: string
    unsubscribeUrl: string
  }) => ({
    type: 'bet-outcome' as const,
    to,
    subject: data.won ? 'Congratulations! You won!' : 'Prediction resolved',
    templateData: data,
  }),

  newFollower: (to: string, data: {
    username: string
    followerName: string
    followerUrl: string
    unsubscribeUrl: string
  }) => ({
    type: 'new-follower' as const,
    to,
    subject: `${data.followerName} started following you`,
    templateData: data,
  }),

  mention: (to: string, data: {
    username: string
    mentionerName: string
    preview: string
    postUrl: string
    unsubscribeUrl: string
  }) => ({
    type: 'mention' as const,
    to,
    subject: `${data.mentionerName} mentioned you`,
    templateData: data,
  }),

  weeklyDigest: (to: string, data: {
    username: string
    weekStart: string
    weekEnd: string
    stats: { betsPlaced: number; betsWon: number; pointsEarned: number }
    unsubscribeUrl: string
  }) => ({
    type: 'weekly-digest' as const,
    to,
    subject: 'Your Weekly Doomsday Recap',
    templateData: data,
    category: 'marketing' as const,
  }),
}
