/**
 * Analytics Export
 * Issue #57: Add analytics dashboard for users
 *
 * Functions for exporting analytics data in various formats.
 */

import type { PostAnalytics } from './postAnalytics'
import type { BettingAnalytics } from './bettingAnalytics'
import type { TokenAnalytics } from './tokenAnalytics'
import type { TimeRange } from './postAnalytics'

/** Simplified post data for export */
interface ExportPost {
  id: string
  content: string
  likes: number
  replies: number
  reposts: number
  variant: 'doom' | 'life'
  createdAt: number
}

/** Sanitized post analytics for export */
interface ExportPostAnalytics extends Omit<PostAnalytics, 'topPosts'> {
  topPosts: ExportPost[]
}

interface ExportData {
  exportedAt: string
  timeRange: string
  posts: ExportPostAnalytics
  betting: BettingAnalytics
  tokens: TokenAnalytics
}

/**
 * Export analytics data as JSON file
 */
export function exportAnalyticsToJSON(
  postAnalytics: PostAnalytics,
  bettingAnalytics: BettingAnalytics,
  tokenAnalytics: TokenAnalytics,
  timeRange: TimeRange
): void {
  // Remove circular references (posts in topPosts)
  const sanitizedPostAnalytics: ExportPostAnalytics = {
    totalPosts: postAnalytics.totalPosts,
    doomPosts: postAnalytics.doomPosts,
    lifePosts: postAnalytics.lifePosts,
    totalLikes: postAnalytics.totalLikes,
    totalReplies: postAnalytics.totalReplies,
    totalReposts: postAnalytics.totalReposts,
    avgLikesPerPost: postAnalytics.avgLikesPerPost,
    avgEngagementRate: postAnalytics.avgEngagementRate,
    postsOverTime: postAnalytics.postsOverTime,
    topPosts: postAnalytics.topPosts.map((p) => ({
      id: p.id,
      content: p.content.slice(0, 100),
      likes: p.likes,
      replies: p.replies,
      reposts: p.reposts,
      variant: p.variant,
      createdAt: p.createdAt,
    })),
  }

  const data: ExportData = {
    exportedAt: new Date().toISOString(),
    timeRange,
    posts: sanitizedPostAnalytics,
    betting: bettingAnalytics,
    tokens: tokenAnalytics,
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `doomsday-analytics-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Export analytics data as CSV file
 */
export function exportAnalyticsToCSV(
  postAnalytics: PostAnalytics,
  bettingAnalytics: BettingAnalytics,
  tokenAnalytics: TokenAnalytics,
  timeRange: TimeRange
): void {
  const rows = [
    ['Doomsday Analytics Export'],
    [`Time Range: ${timeRange}`],
    [`Exported: ${new Date().toISOString()}`],
    [],
    ['=== POST ANALYTICS ==='],
    ['Total Posts', postAnalytics.totalPosts.toString()],
    ['Doom Posts', postAnalytics.doomPosts.toString()],
    ['Life Posts', postAnalytics.lifePosts.toString()],
    ['Total Likes', postAnalytics.totalLikes.toString()],
    ['Total Replies', postAnalytics.totalReplies.toString()],
    ['Total Reposts', postAnalytics.totalReposts.toString()],
    ['Avg Likes/Post', postAnalytics.avgLikesPerPost.toFixed(1)],
    ['Avg Engagement', postAnalytics.avgEngagementRate.toFixed(1)],
    [],
    ['=== BETTING ANALYTICS ==='],
    ['Total Bets', bettingAnalytics.totalBets.toString()],
    ['Active Bets', bettingAnalytics.activeBets.toString()],
    ['Resolved Bets', bettingAnalytics.resolvedBets.toString()],
    ['Wins', bettingAnalytics.wins.toString()],
    ['Losses', bettingAnalytics.losses.toString()],
    ['Win Rate', `${bettingAnalytics.winRate.toFixed(1)}%`],
    ['Total Staked', bettingAnalytics.totalStaked.toString()],
    ['Total Winnings', bettingAnalytics.totalWinnings.toFixed(2)],
    ['Net P/L', bettingAnalytics.netProfitLoss.toFixed(2)],
    ['ROI', `${bettingAnalytics.roi.toFixed(1)}%`],
    [],
    ['=== TOKEN ANALYTICS ==='],
    ['Current $DOOM', tokenAnalytics.currentDoom.toString()],
    ['Current $LIFE', tokenAnalytics.currentLife.toString()],
    ['Total $DOOM Earned', tokenAnalytics.totalEarned.doom.toString()],
    ['Total $LIFE Earned', tokenAnalytics.totalEarned.life.toString()],
    ['Total $DOOM Spent', tokenAnalytics.totalSpent.doom.toString()],
    ['Total $LIFE Spent', tokenAnalytics.totalSpent.life.toString()],
    ['Net $DOOM Flow', tokenAnalytics.netFlow.doom.toString()],
    ['Net $LIFE Flow', tokenAnalytics.netFlow.life.toString()],
  ]

  const csv = rows.map((row) => row.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `doomsday-analytics-${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
