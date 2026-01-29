/**
 * GDPR Data Export Service
 *
 * Handles data portability requests (Article 20).
 * Exports all user data in machine-readable and human-readable formats.
 */

import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { users, posts, comments, likes, follows, bets, events } from '../../db/schema'
import { logger } from '../logger'

export interface ExportMetadata {
  generatedAt: string
  userId: string
  username: string
  exportVersion: string
  dataRange: {
    from: string
    to: string
  }
}

export interface UserDataExport {
  metadata: ExportMetadata
  profile: {
    id: string
    username: string
    displayName: string | null
    bio: string | null
    email: string | null
    emailVerified: boolean
    walletAddress: string | null
    verified: boolean
    doomBalance: number
    lifeBalance: number
    daysLiving: number
    lifePosts: number
    createdAt: string
    updatedAt: string
  }
  posts: Array<{
    id: string
    content: string
    variant: string
    likes: number
    replies: number
    reposts: number
    createdAt: string
  }>
  comments: Array<{
    id: string
    postId: string
    content: string
    likes: number
    createdAt: string
  }>
  likes: Array<{
    id: string
    postId: string | null
    commentId: string | null
    createdAt: string
  }>
  followers: Array<{
    userId: string
    username: string
    followedAt: string
  }>
  following: Array<{
    userId: string
    username: string
    followedAt: string
  }>
  bets: Array<{
    id: string
    eventId: string
    eventTitle: string
    outcome: string
    amount: number
    payout: number | null
    claimed: boolean
    createdAt: string
  }>
}

/**
 * Generate a complete data export for a user
 */
export async function generateDataExport(userId: string): Promise<UserDataExport> {
  logger.info({ userId }, 'Generating GDPR data export')

  // Get user profile
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  })

  if (!user) {
    throw new Error('User not found')
  }

  // Get all user posts
  const userPosts = await db
    .select()
    .from(posts)
    .where(eq(posts.authorId, userId))

  // Get all user comments
  const userComments = await db
    .select()
    .from(comments)
    .where(eq(comments.authorId, userId))

  // Get all user likes
  const userLikes = await db
    .select()
    .from(likes)
    .where(eq(likes.userId, userId))

  // Get followers (users who follow this user)
  const userFollowers = await db
    .select({
      id: follows.id,
      followerId: follows.followerId,
      createdAt: follows.createdAt,
      followerUsername: users.username,
    })
    .from(follows)
    .leftJoin(users, eq(follows.followerId, users.id))
    .where(eq(follows.followingId, userId))

  // Get following (users this user follows)
  const userFollowing = await db
    .select({
      id: follows.id,
      followingId: follows.followingId,
      createdAt: follows.createdAt,
      followingUsername: users.username,
    })
    .from(follows)
    .leftJoin(users, eq(follows.followingId, users.id))
    .where(eq(follows.followerId, userId))

  // Get all user bets with event details
  const userBets = await db
    .select({
      id: bets.id,
      eventId: bets.eventId,
      eventTitle: events.title,
      outcome: bets.outcome,
      amount: bets.amount,
      payout: bets.payout,
      claimed: bets.claimed,
      createdAt: bets.createdAt,
    })
    .from(bets)
    .leftJoin(events, eq(bets.eventId, events.id))
    .where(eq(bets.userId, userId))

  const now = new Date().toISOString()

  const exportData: UserDataExport = {
    metadata: {
      generatedAt: now,
      userId: user.id,
      username: user.username,
      exportVersion: '1.0',
      dataRange: {
        from: user.createdAt.toISOString(),
        to: now,
      },
    },
    profile: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      email: user.email,
      emailVerified: user.emailVerified ?? false,
      walletAddress: user.walletAddress,
      verified: user.verified ?? false,
      doomBalance: user.doomBalance ?? 0,
      lifeBalance: user.lifeBalance ?? 0,
      daysLiving: user.daysLiving ?? 0,
      lifePosts: user.lifePosts ?? 0,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    },
    posts: userPosts.map(p => ({
      id: p.id,
      content: p.content,
      variant: p.variant,
      likes: p.likes ?? 0,
      replies: p.replies ?? 0,
      reposts: p.reposts ?? 0,
      createdAt: p.createdAt.toISOString(),
    })),
    comments: userComments.map(c => ({
      id: c.id,
      postId: c.postId,
      content: c.content,
      likes: c.likes ?? 0,
      createdAt: c.createdAt.toISOString(),
    })),
    likes: userLikes.map(l => ({
      id: l.id,
      postId: l.postId,
      commentId: l.commentId,
      createdAt: l.createdAt.toISOString(),
    })),
    followers: userFollowers.map(f => ({
      userId: f.followerId,
      username: f.followerUsername ?? 'unknown',
      followedAt: f.createdAt.toISOString(),
    })),
    following: userFollowing.map(f => ({
      userId: f.followingId,
      username: f.followingUsername ?? 'unknown',
      followedAt: f.createdAt.toISOString(),
    })),
    bets: userBets.map(b => ({
      id: b.id,
      eventId: b.eventId,
      eventTitle: b.eventTitle ?? 'Unknown Event',
      outcome: b.outcome,
      amount: b.amount,
      payout: b.payout,
      claimed: b.claimed ?? false,
      createdAt: b.createdAt.toISOString(),
    })),
  }

  logger.info({
    userId,
    postsCount: exportData.posts.length,
    commentsCount: exportData.comments.length,
    betsCount: exportData.bets.length,
  }, 'Data export generated')

  return exportData
}

/**
 * Generate HTML version of data export
 */
export function generateHtmlExport(data: UserDataExport): string {
  const formatDate = (iso: string) => new Date(iso).toLocaleString()

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Doomsday Data Export</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; }
    h1 { border-bottom: 2px solid #000; padding-bottom: 10px; }
    h2 { color: #333; margin-top: 30px; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f5f5f5; }
    .meta { background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 30px; }
    .count { color: #666; font-size: 14px; }
    .post, .comment, .bet { background: #f9f9f9; padding: 15px; margin: 10px 0; border-radius: 8px; }
    .post-meta, .comment-meta { color: #666; font-size: 12px; margin-top: 10px; }
  </style>
</head>
<body>
  <h1>Your Doomsday Data Export</h1>

  <div class="meta">
    <p><strong>Generated:</strong> ${formatDate(data.metadata.generatedAt)}</p>
    <p><strong>Username:</strong> ${data.metadata.username}</p>
    <p><strong>Data Range:</strong> ${formatDate(data.metadata.dataRange.from)} to ${formatDate(data.metadata.dataRange.to)}</p>
  </div>

  <h2>Profile Information</h2>
  <table>
    <tr><th>Field</th><th>Value</th></tr>
    <tr><td>Username</td><td>${data.profile.username}</td></tr>
    <tr><td>Display Name</td><td>${data.profile.displayName || '-'}</td></tr>
    <tr><td>Bio</td><td>${data.profile.bio || '-'}</td></tr>
    <tr><td>Email</td><td>${data.profile.email || '-'}</td></tr>
    <tr><td>Email Verified</td><td>${data.profile.emailVerified ? 'Yes' : 'No'}</td></tr>
    <tr><td>Wallet Address</td><td>${data.profile.walletAddress || '-'}</td></tr>
    <tr><td>DOOM Balance</td><td>${data.profile.doomBalance}</td></tr>
    <tr><td>LIFE Balance</td><td>${data.profile.lifeBalance}</td></tr>
    <tr><td>Account Created</td><td>${formatDate(data.profile.createdAt)}</td></tr>
  </table>

  <h2>Posts <span class="count">(${data.posts.length} total)</span></h2>
  ${data.posts.length === 0 ? '<p>No posts.</p>' : data.posts.map(p => `
    <div class="post">
      <p>${p.content}</p>
      <div class="post-meta">
        ${p.variant.toUpperCase()} • ${p.likes} likes • ${p.replies} replies • ${formatDate(p.createdAt)}
      </div>
    </div>
  `).join('')}

  <h2>Comments <span class="count">(${data.comments.length} total)</span></h2>
  ${data.comments.length === 0 ? '<p>No comments.</p>' : data.comments.map(c => `
    <div class="comment">
      <p>${c.content}</p>
      <div class="comment-meta">${c.likes} likes • ${formatDate(c.createdAt)}</div>
    </div>
  `).join('')}

  <h2>Bets <span class="count">(${data.bets.length} total)</span></h2>
  ${data.bets.length === 0 ? '<p>No bets.</p>' : `
    <table>
      <tr>
        <th>Event</th>
        <th>Prediction</th>
        <th>Amount</th>
        <th>Payout</th>
        <th>Date</th>
      </tr>
      ${data.bets.map(b => `
        <tr>
          <td>${b.eventTitle}</td>
          <td>${b.outcome.toUpperCase()}</td>
          <td>${b.amount}</td>
          <td>${b.payout ?? '-'}</td>
          <td>${formatDate(b.createdAt)}</td>
        </tr>
      `).join('')}
    </table>
  `}

  <h2>Followers <span class="count">(${data.followers.length} total)</span></h2>
  ${data.followers.length === 0 ? '<p>No followers.</p>' : `
    <ul>${data.followers.map(f => `<li>${f.username} (since ${formatDate(f.followedAt)})</li>`).join('')}</ul>
  `}

  <h2>Following <span class="count">(${data.following.length} total)</span></h2>
  ${data.following.length === 0 ? '<p>Not following anyone.</p>' : `
    <ul>${data.following.map(f => `<li>${f.username} (since ${formatDate(f.followedAt)})</li>`).join('')}</ul>
  `}

  <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
    <p>This export was generated in compliance with GDPR Article 20 (Right to Data Portability).</p>
    <p>Export version: ${data.metadata.exportVersion}</p>
  </footer>
</body>
</html>
  `.trim()
}
