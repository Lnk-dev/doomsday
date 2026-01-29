/**
 * Email Job Handler
 *
 * Processes email sending jobs asynchronously.
 */

import type { Job } from 'bullmq'
import { logger } from '../../logger'

export interface EmailJobData {
  type: 'welcome' | 'verification' | 'password_reset' | 'notification' | 'digest'
  to: string
  subject: string
  templateData: Record<string, unknown>
}

/**
 * Email job handler
 * In production, this would integrate with an email service like Resend, SendGrid, etc.
 */
export async function emailHandler(job: Job<EmailJobData>): Promise<void> {
  const { type, to, subject, templateData } = job.data

  logger.info({ type, to, subject }, 'Processing email job')

  // Simulate email sending (replace with actual email service)
  // In production:
  // await emailService.send({ to, subject, template: type, data: templateData })

  // For now, just log what would be sent
  logger.info({
    type,
    to,
    subject,
    templateData,
  }, 'Email would be sent')

  // Simulate processing time
  await new Promise((resolve) => setTimeout(resolve, 100))
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
    type: 'verification' as const,
    to,
    subject: 'Verify your email',
    templateData: data,
  }),

  passwordReset: (to: string, data: { resetUrl: string; expiresIn: string }) => ({
    type: 'password_reset' as const,
    to,
    subject: 'Reset your password',
    templateData: data,
  }),

  notification: (to: string, data: { title: string; message: string; actionUrl?: string }) => ({
    type: 'notification' as const,
    to,
    subject: data.title,
    templateData: data,
  }),

  digest: (to: string, data: { period: string; stats: Record<string, unknown> }) => ({
    type: 'digest' as const,
    to,
    subject: `Your ${data.period} Doomsday digest`,
    templateData: data,
  }),
}
