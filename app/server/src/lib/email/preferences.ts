/**
 * Email Preferences
 *
 * Manages user email notification preferences.
 */

import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { users } from '../../db/schema'
import { createHash } from 'crypto'

export interface EmailPreferences {
  betOutcome: boolean
  newFollower: boolean
  mentions: boolean
  weeklyDigest: boolean
  marketingEmails: boolean
}

const DEFAULT_PREFERENCES: EmailPreferences = {
  betOutcome: true,
  newFollower: true,
  mentions: true,
  weeklyDigest: true,
  marketingEmails: false,
}

/**
 * Get user's email preferences
 */
export async function getEmailPreferences(userId: string): Promise<EmailPreferences> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  })

  if (!user) {
    return DEFAULT_PREFERENCES
  }

  if (!user.emailPreferences) {
    return DEFAULT_PREFERENCES
  }

  try {
    const parsed = JSON.parse(user.emailPreferences) as Partial<EmailPreferences>
    return { ...DEFAULT_PREFERENCES, ...parsed }
  } catch {
    return DEFAULT_PREFERENCES
  }
}

/**
 * Update user's email preferences
 */
export async function updateEmailPreferences(
  userId: string,
  preferences: Partial<EmailPreferences>
): Promise<EmailPreferences> {
  const current = await getEmailPreferences(userId)
  const updated = { ...current, ...preferences }

  await db.update(users)
    .set({ emailPreferences: JSON.stringify(updated) })
    .where(eq(users.id, userId))

  return updated
}

/**
 * Check if user wants to receive a specific email type
 */
export async function shouldSendEmail(
  userId: string,
  type: keyof EmailPreferences
): Promise<boolean> {
  const prefs = await getEmailPreferences(userId)
  return prefs[type] ?? true
}

/**
 * Generate unsubscribe token for a user
 */
export function generateUnsubscribeToken(email: string): string {
  const secret = process.env.UNSUBSCRIBE_SECRET || 'dev-unsubscribe-secret'
  return createHash('sha256')
    .update(`${email}:${secret}`)
    .digest('hex')
}

/**
 * Verify unsubscribe token
 */
export function verifyUnsubscribeToken(email: string, token: string): boolean {
  const expected = generateUnsubscribeToken(email)
  return token === expected
}

/**
 * Generate unsubscribe URL
 */
export function getUnsubscribeUrl(email: string, type?: keyof EmailPreferences): string {
  const token = generateUnsubscribeToken(email)
  const baseUrl = process.env.APP_URL || 'http://localhost:5173'
  const params = new URLSearchParams({ token, email })
  if (type) {
    params.set('type', type)
  }
  return `${baseUrl}/unsubscribe?${params.toString()}`
}

/**
 * Handle unsubscribe request
 */
export async function handleUnsubscribe(
  email: string,
  token: string,
  type?: keyof EmailPreferences | 'all'
): Promise<{ success: boolean; error?: string }> {
  // Verify token
  if (!verifyUnsubscribeToken(email, token)) {
    return { success: false, error: 'Invalid unsubscribe token' }
  }

  // Find user by email
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  })

  if (!user) {
    // Still return success to not leak user existence
    return { success: true }
  }

  if (type === 'all') {
    await updateEmailPreferences(user.id, {
      betOutcome: false,
      newFollower: false,
      mentions: false,
      weeklyDigest: false,
      marketingEmails: false,
    })
  } else if (type) {
    await updateEmailPreferences(user.id, { [type]: false })
  }

  return { success: true }
}
