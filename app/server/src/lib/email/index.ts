/**
 * Email Module
 *
 * Exports email service and preferences management.
 */

export { emailService, type EmailOptions, type EmailTemplate } from './emailService'
export {
  getEmailPreferences,
  updateEmailPreferences,
  shouldSendEmail,
  generateUnsubscribeToken,
  verifyUnsubscribeToken,
  getUnsubscribeUrl,
  handleUnsubscribe,
  type EmailPreferences,
} from './preferences'
