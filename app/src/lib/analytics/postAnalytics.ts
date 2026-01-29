/**
 * Post Analytics
 * Issue #57: Add analytics dashboard for users
 *
 * Functions for calculating post performance metrics.
 */

import type { Post } from '@/types'

export interface PostAnalytics {
  totalPosts: number
  doomPosts: number
  lifePosts: number
  totalLikes: number
  totalReplies: number
  totalReposts: number
  avgLikesPerPost: number
  avgEngagementRate: number
  topPosts: Post[]
  postsOverTime: { date: string; doom: number; life: number }[]
}

export type TimeRange = '7d' | '30d' | 'all'

const TIME_RANGES: Record<TimeRange, number> = {
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
  all: Infinity,
}

/**
 * Calculate analytics for a user's posts
 */
export function calculatePostAnalytics(
  posts: Post[],
  timeRange: TimeRange
): PostAnalytics {
  const now = Date.now()
  const rangeMs = TIME_RANGES[timeRange]

  // Filter posts within time range
  const filteredPosts =
    timeRange === 'all'
      ? posts
      : posts.filter((p) => now - p.createdAt <= rangeMs)

  const doomPosts = filteredPosts.filter((p) => p.variant === 'doom')
  const lifePosts = filteredPosts.filter((p) => p.variant === 'life')

  const totalLikes = filteredPosts.reduce((sum, p) => sum + p.likes, 0)
  const totalReplies = filteredPosts.reduce((sum, p) => sum + p.replies, 0)
  const totalReposts = filteredPosts.reduce((sum, p) => sum + p.reposts, 0)

  // Top posts by total engagement
  const topPosts = [...filteredPosts]
    .sort(
      (a, b) =>
        b.likes + b.replies + b.reposts - (a.likes + a.replies + a.reposts)
    )
    .slice(0, 5)

  // Group posts by date for time series
  const postsOverTime = groupPostsByDate(filteredPosts)

  return {
    totalPosts: filteredPosts.length,
    doomPosts: doomPosts.length,
    lifePosts: lifePosts.length,
    totalLikes,
    totalReplies,
    totalReposts,
    avgLikesPerPost: filteredPosts.length
      ? Math.round((totalLikes / filteredPosts.length) * 10) / 10
      : 0,
    avgEngagementRate: filteredPosts.length
      ? Math.round(
          ((totalLikes + totalReplies + totalReposts) / filteredPosts.length) *
            10
        ) / 10
      : 0,
    topPosts,
    postsOverTime,
  }
}

/**
 * Group posts by date for time series visualization
 */
function groupPostsByDate(
  posts: Post[]
): { date: string; doom: number; life: number }[] {
  const grouped: Record<string, { doom: number; life: number }> = {}

  posts.forEach((post) => {
    const date = new Date(post.createdAt).toISOString().split('T')[0]
    if (!grouped[date]) grouped[date] = { doom: 0, life: 0 }
    grouped[date][post.variant]++
  })

  return Object.entries(grouped)
    .map(([date, counts]) => ({ date, ...counts }))
    .sort((a, b) => a.date.localeCompare(b.date))
}
