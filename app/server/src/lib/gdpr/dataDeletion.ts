/**
 * GDPR Data Deletion Service
 *
 * Handles right to erasure requests (Article 17).
 * Implements soft deletion with data anonymization.
 */

import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { users, posts, comments, likes, follows, bets } from '../../db/schema'
import { logger } from '../logger'
import { audit } from '../auditLogger'
import { randomBytes, createHash } from 'crypto'

export interface DeletionResult {
  success: boolean
  deletedData: {
    posts: number
    comments: number
    likes: number
    follows: number
    bets: number
  }
  anonymizedAt: string
  retentionNote?: string
}

/**
 * Generate an anonymous identifier
 */
function generateAnonymousId(): string {
  return `deleted_${createHash('sha256').update(randomBytes(16)).digest('hex').slice(0, 12)}`
}

/**
 * Check if user can be deleted (no pending obligations)
 */
export async function canDeleteUser(userId: string): Promise<{
  canDelete: boolean
  reason?: string
}> {
  // Check for pending bets (unclaimed payouts)
  const pendingBets = await db
    .select()
    .from(bets)
    .where(eq(bets.userId, userId))
    .limit(1)

  const unclaimedBets = pendingBets.filter(b => b.payout && !b.claimed)

  if (unclaimedBets.length > 0) {
    return {
      canDelete: false,
      reason: 'You have unclaimed bet payouts. Please claim them before requesting deletion.',
    }
  }

  return { canDelete: true }
}

/**
 * Delete all user data with anonymization
 *
 * Strategy:
 * 1. Anonymize user profile (replace PII with anonymous ID)
 * 2. Delete user's posts, comments, likes
 * 3. Remove follows relationships
 * 4. Anonymize bet history (keep for audit but remove PII)
 * 5. Log deletion for compliance
 */
export async function deleteUserData(
  userId: string,
  requestedBy: string,
  reason?: string
): Promise<DeletionResult> {
  logger.info({ userId, requestedBy }, 'Starting GDPR data deletion')

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  })

  if (!user) {
    throw new Error('User not found')
  }

  // Check if deletion is allowed
  const { canDelete, reason: blockReason } = await canDeleteUser(userId)
  if (!canDelete) {
    throw new Error(blockReason)
  }

  const anonymousId = generateAnonymousId()
  const deletedAt = new Date().toISOString()

  // Count records before deletion
  const [postsToDelete, commentsToDelete, likesToDelete, followsToDelete, betsToAnonymize] = await Promise.all([
    db.select().from(posts).where(eq(posts.authorId, userId)),
    db.select().from(comments).where(eq(comments.authorId, userId)),
    db.select().from(likes).where(eq(likes.userId, userId)),
    db.select().from(follows).where(eq(follows.followerId, userId)),
    db.select().from(bets).where(eq(bets.userId, userId)),
  ])

  // Delete user content
  await db.delete(likes).where(eq(likes.userId, userId))
  await db.delete(comments).where(eq(comments.authorId, userId))
  await db.delete(posts).where(eq(posts.authorId, userId))
  await db.delete(follows).where(eq(follows.followerId, userId))
  await db.delete(follows).where(eq(follows.followingId, userId))

  // Anonymize user profile (keep record for audit but remove PII)
  await db.update(users)
    .set({
      username: anonymousId,
      displayName: null,
      bio: null,
      email: null,
      emailVerified: false,
      walletAddress: null,
      avatarUrl: null,
      emailPreferences: null,
      // Mark as deleted
      verified: false,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))

  // Audit log the deletion
  await audit.user.accountDeleted(requestedBy, {
    targetUserId: userId,
    originalUsername: user.username,
    deletedRecords: {
      posts: postsToDelete.length,
      comments: commentsToDelete.length,
      likes: likesToDelete.length,
      follows: followsToDelete.length,
    },
    reason,
  })

  logger.info({
    userId,
    anonymousId,
    postsDeleted: postsToDelete.length,
    commentsDeleted: commentsToDelete.length,
  }, 'GDPR data deletion completed')

  return {
    success: true,
    deletedData: {
      posts: postsToDelete.length,
      comments: commentsToDelete.length,
      likes: likesToDelete.length,
      follows: followsToDelete.length,
      bets: betsToAnonymize.length,
    },
    anonymizedAt: deletedAt,
    retentionNote: 'Bet history is retained for financial audit requirements but has been anonymized.',
  }
}

/**
 * Schedule deletion (for grace period)
 * Returns a deletion token that can be used to cancel
 */
export interface ScheduledDeletion {
  userId: string
  scheduledFor: Date
  cancellationToken: string
}

export function scheduleDeletion(
  userId: string,
  gracePeriodDays: number = 30
): ScheduledDeletion {
  const scheduledFor = new Date()
  scheduledFor.setDate(scheduledFor.getDate() + gracePeriodDays)

  const cancellationToken = randomBytes(32).toString('hex')

  // In production, this would be stored in database
  // and processed by a scheduled job

  return {
    userId,
    scheduledFor,
    cancellationToken,
  }
}
