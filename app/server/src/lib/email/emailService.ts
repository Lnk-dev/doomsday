/**
 * Email Service
 *
 * Handles email sending with template support.
 * In production, integrates with Resend, SendGrid, or similar.
 */

import { logger } from '../logger'

export type EmailTemplate =
  | 'welcome'
  | 'email-verification'
  | 'password-reset'
  | 'bet-outcome'
  | 'new-follower'
  | 'mention'
  | 'weekly-digest'

export interface EmailOptions {
  to: string
  subject: string
  template: EmailTemplate
  data: Record<string, unknown>
  category?: 'transactional' | 'marketing'
}

interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Email Service class
 */
class EmailService {
  private fromAddress = process.env.EMAIL_FROM || 'Doomsday <noreply@doomsday.app>'
  private apiKey = process.env.RESEND_API_KEY

  /**
   * Send an email
   */
  async send(options: EmailOptions): Promise<EmailResult> {
    const { to, subject, template, data, category = 'transactional' } = options

    logger.info({ to, subject, template, category }, 'Sending email')

    // In development without API key, just log
    if (!this.apiKey) {
      logger.info({
        to,
        subject,
        template,
        data,
      }, 'Email would be sent (no API key configured)')

      return {
        success: true,
        messageId: `dev-${Date.now()}`,
      }
    }

    try {
      // Render template
      const { html, text } = this.renderTemplate(template, data)

      // Send via Resend API
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.fromAddress,
          to: [to],
          subject,
          html,
          text,
          tags: [
            { name: 'template', value: template },
            { name: 'category', value: category },
          ],
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Resend API error: ${error}`)
      }

      const result = await response.json() as { id: string }

      logger.info({ to, messageId: result.id }, 'Email sent successfully')

      return {
        success: true,
        messageId: result.id,
      }
    } catch (error) {
      logger.error({ error, to, template }, 'Failed to send email')

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Render email template
   */
  private renderTemplate(
    template: EmailTemplate,
    data: Record<string, unknown>
  ): { html: string; text: string } {
    const templates: Record<EmailTemplate, (data: Record<string, unknown>) => { html: string; text: string }> = {
      'welcome': this.welcomeTemplate,
      'email-verification': this.verificationTemplate,
      'password-reset': this.passwordResetTemplate,
      'bet-outcome': this.betOutcomeTemplate,
      'new-follower': this.newFollowerTemplate,
      'mention': this.mentionTemplate,
      'weekly-digest': this.weeklyDigestTemplate,
    }

    const renderer = templates[template]
    if (!renderer) {
      throw new Error(`Unknown email template: ${template}`)
    }

    return renderer.call(this, data)
  }

  /**
   * Base HTML wrapper
   */
  private wrapHtml(content: string, unsubscribeUrl?: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; }
    .header { background: #000; padding: 24px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 24px; }
    .content { padding: 32px 24px; }
    .button { display: inline-block; background: #000; color: #fff !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; margin: 16px 0; }
    .footer { padding: 24px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e5e5e5; }
    .footer a { color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>Doomsday</h1></div>
    <div class="content">${content}</div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Doomsday. All rights reserved.</p>
      ${unsubscribeUrl ? `<p><a href="${unsubscribeUrl}">Unsubscribe</a></p>` : ''}
    </div>
  </div>
</body>
</html>`
  }

  // Template renderers
  private welcomeTemplate(data: Record<string, unknown>): { html: string; text: string } {
    const { username } = data as { username: string }
    const html = this.wrapHtml(`
      <h2>Welcome to Doomsday, ${username}!</h2>
      <p>You've joined the ultimate prediction platform. Make your predictions and see if the future unfolds as you expect.</p>
      <p style="text-align: center;"><a href="${process.env.APP_URL}" class="button">Start Predicting</a></p>
    `)
    const text = `Welcome to Doomsday, ${username}!\n\nYou've joined the ultimate prediction platform. Make your predictions and see if the future unfolds as you expect.\n\nStart predicting: ${process.env.APP_URL}`
    return { html, text }
  }

  private verificationTemplate(data: Record<string, unknown>): { html: string; text: string } {
    const { verificationUrl } = data as { verificationUrl: string }
    const html = this.wrapHtml(`
      <h2>Verify your email</h2>
      <p>Click the button below to verify your email address. This link expires in 24 hours.</p>
      <p style="text-align: center;"><a href="${verificationUrl}" class="button">Verify Email</a></p>
      <p style="font-size: 14px; color: #666;">If you didn't create an account, you can safely ignore this email.</p>
    `)
    const text = `Verify your email\n\nClick the link below to verify your email address:\n${verificationUrl}\n\nThis link expires in 24 hours.`
    return { html, text }
  }

  private passwordResetTemplate(data: Record<string, unknown>): { html: string; text: string } {
    const { resetUrl, expiresIn } = data as { resetUrl: string; expiresIn: string }
    const html = this.wrapHtml(`
      <h2>Reset your password</h2>
      <p>Click the button below to reset your password. This link expires in ${expiresIn}.</p>
      <p style="text-align: center;"><a href="${resetUrl}" class="button">Reset Password</a></p>
      <p style="font-size: 14px; color: #666;">If you didn't request a password reset, you can safely ignore this email.</p>
    `)
    const text = `Reset your password\n\nClick the link below to reset your password:\n${resetUrl}\n\nThis link expires in ${expiresIn}.`
    return { html, text }
  }

  private betOutcomeTemplate(data: Record<string, unknown>): { html: string; text: string } {
    const { username, eventTitle, won, payout, eventUrl, unsubscribeUrl } = data as {
      username: string
      eventTitle: string
      won: boolean
      payout: number
      eventUrl: string
      unsubscribeUrl: string
    }

    const html = this.wrapHtml(`
      <h2>${won ? 'Congratulations! You won!' : 'Prediction resolved'}</h2>
      <p>Hey ${username},</p>
      <p>${won
        ? `Your prediction on <strong>"${eventTitle}"</strong> was correct! You've earned <strong>${payout} points</strong>.`
        : `The prediction <strong>"${eventTitle}"</strong> has been resolved. Unfortunately, your prediction didn't come true this time.`
      }</p>
      <p style="text-align: center;"><a href="${eventUrl}" class="button">View Details</a></p>
    `, unsubscribeUrl)

    const text = `${won ? 'Congratulations! You won!' : 'Prediction resolved'}\n\nHey ${username},\n\n${won
      ? `Your prediction on "${eventTitle}" was correct! You've earned ${payout} points.`
      : `The prediction "${eventTitle}" has been resolved.`
    }\n\nView details: ${eventUrl}`

    return { html, text }
  }

  private newFollowerTemplate(data: Record<string, unknown>): { html: string; text: string } {
    const { username, followerName, followerUrl, unsubscribeUrl } = data as {
      username: string
      followerName: string
      followerUrl: string
      unsubscribeUrl: string
    }

    const html = this.wrapHtml(`
      <h2>New follower!</h2>
      <p>Hey ${username},</p>
      <p><strong>${followerName}</strong> started following you on Doomsday.</p>
      <p style="text-align: center;"><a href="${followerUrl}" class="button">View Profile</a></p>
    `, unsubscribeUrl)

    const text = `New follower!\n\nHey ${username},\n\n${followerName} started following you on Doomsday.\n\nView profile: ${followerUrl}`

    return { html, text }
  }

  private mentionTemplate(data: Record<string, unknown>): { html: string; text: string } {
    const { username, mentionerName, preview, postUrl, unsubscribeUrl } = data as {
      username: string
      mentionerName: string
      preview: string
      postUrl: string
      unsubscribeUrl: string
    }

    const html = this.wrapHtml(`
      <h2>You were mentioned!</h2>
      <p>Hey ${username},</p>
      <p><strong>${mentionerName}</strong> mentioned you in a post:</p>
      <blockquote style="border-left: 3px solid #ddd; padding-left: 16px; margin: 16px 0; color: #666;">${preview}</blockquote>
      <p style="text-align: center;"><a href="${postUrl}" class="button">View Post</a></p>
    `, unsubscribeUrl)

    const text = `You were mentioned!\n\nHey ${username},\n\n${mentionerName} mentioned you:\n"${preview}"\n\nView post: ${postUrl}`

    return { html, text }
  }

  private weeklyDigestTemplate(data: Record<string, unknown>): { html: string; text: string } {
    const { username, weekStart, weekEnd, stats, unsubscribeUrl } = data as {
      username: string
      weekStart: string
      weekEnd: string
      stats: { betsPlaced: number; betsWon: number; pointsEarned: number }
      unsubscribeUrl: string
    }

    const html = this.wrapHtml(`
      <h2>Your Weekly Recap</h2>
      <p style="color: #666;">${weekStart} - ${weekEnd}</p>
      <p>Hey ${username}, here's what happened this week:</p>
      <table width="100%" style="margin: 24px 0; text-align: center;">
        <tr>
          <td style="padding: 16px; background: #f9f9f9;">
            <div style="font-size: 28px; font-weight: bold;">${stats.betsPlaced}</div>
            <div style="font-size: 12px; color: #666;">Bets Placed</div>
          </td>
          <td style="padding: 16px; background: #f9f9f9;">
            <div style="font-size: 28px; font-weight: bold;">${stats.betsWon}</div>
            <div style="font-size: 12px; color: #666;">Bets Won</div>
          </td>
          <td style="padding: 16px; background: #f9f9f9;">
            <div style="font-size: 28px; font-weight: bold;">+${stats.pointsEarned}</div>
            <div style="font-size: 12px; color: #666;">Points</div>
          </td>
        </tr>
      </table>
      <p style="text-align: center;"><a href="${process.env.APP_URL}" class="button">View Full Stats</a></p>
    `, unsubscribeUrl)

    const text = `Your Weekly Recap (${weekStart} - ${weekEnd})\n\nHey ${username}, here's what happened this week:\n\n- Bets Placed: ${stats.betsPlaced}\n- Bets Won: ${stats.betsWon}\n- Points Earned: +${stats.pointsEarned}\n\nView full stats: ${process.env.APP_URL}`

    return { html, text }
  }
}

export const emailService = new EmailService()
