/**
 * Cache Keys and Tags
 *
 * Centralized cache key definitions and invalidation patterns.
 */

import { cache } from './cacheService'

// Default TTLs in seconds
export const CacheTTL = {
  SHORT: 60,         // 1 minute
  MEDIUM: 300,       // 5 minutes
  LONG: 3600,        // 1 hour
  VERY_LONG: 86400,  // 24 hours
}

/**
 * Cache key generators
 */
export const CacheKeys = {
  // User-related
  user: {
    profile: (userId: string) => `user:${userId}:profile`,
    stats: (userId: string) => `user:${userId}:stats`,
    feed: (userId: string, cursor?: string) => `user:${userId}:feed:${cursor || 'initial'}`,
  },

  // Posts
  posts: {
    byId: (postId: string) => `post:${postId}`,
    feed: (variant: string, cursor?: string) => `posts:${variant}:${cursor || 'initial'}`,
    trending: () => 'posts:trending',
    count: () => 'posts:count',
  },

  // Events
  events: {
    byId: (eventId: string) => `event:${eventId}`,
    active: () => 'events:active',
    byStatus: (status: string) => `events:status:${status}`,
  },

  // Leaderboard
  leaderboard: {
    byPeriod: (period: string) => `leaderboard:${period}`,
    userRank: (userId: string, period: string) => `leaderboard:${period}:user:${userId}`,
  },

  // Moderation
  moderation: {
    pendingReports: () => 'moderation:reports:pending',
    stats: () => 'moderation:stats',
  },

  // Admin
  admin: {
    fraudStats: () => 'admin:fraud:stats',
    auditStats: () => 'admin:audit:stats',
  },
}

/**
 * Cache tag definitions for group invalidation
 */
export const CacheTags = {
  user: (userId: string) => `user:${userId}`,
  post: (postId: string) => `post:${postId}`,
  event: (eventId: string) => `event:${eventId}`,
  feed: 'feed',
  leaderboard: 'leaderboard',
  moderation: 'moderation',
}

/**
 * Invalidation helpers
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  await cache.deleteByTag(CacheTags.user(userId))
  // Also invalidate feeds that might include this user
  await cache.deleteByPattern('posts:*')
}

export async function invalidatePostCache(postId: string): Promise<void> {
  await cache.deleteByTag(CacheTags.post(postId))
  await cache.delete(CacheKeys.posts.trending())
  await cache.deleteByPattern('posts:*:*')
}

export async function invalidateEventCache(eventId: string): Promise<void> {
  await cache.deleteByTag(CacheTags.event(eventId))
  await cache.delete(CacheKeys.events.active())
}

export async function invalidateLeaderboards(): Promise<void> {
  await cache.deleteByTag(CacheTags.leaderboard)
}

export async function invalidateModerationCache(): Promise<void> {
  await cache.deleteByTag(CacheTags.moderation)
}
