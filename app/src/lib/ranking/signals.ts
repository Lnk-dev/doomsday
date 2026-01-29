/**
 * Ranking Signals
 * Issue #62: Implement personalized feed algorithm
 *
 * Functions for computing individual ranking signals.
 */

import type { Post } from '@/types'
import type { UserProfile, FeedContext } from './types'

// Topic keywords for content classification
const TOPIC_KEYWORDS: Record<string, string[]> = {
  technology: ['ai', 'tech', 'software', 'digital', 'robot', 'algorithm', 'crypto', 'blockchain', 'nft'],
  economic: ['economy', 'market', 'inflation', 'recession', 'stock', 'finance', 'money', 'debt'],
  climate: ['climate', 'warming', 'environment', 'carbon', 'weather', 'pollution', 'green'],
  social: ['society', 'culture', 'political', 'government', 'democracy', 'election', 'policy'],
  health: ['virus', 'pandemic', 'health', 'disease', 'medical', 'vaccine', 'outbreak'],
  doom: ['doom', 'apocalypse', 'collapse', 'crisis', 'disaster', 'end', 'catastrophe'],
}

/**
 * Calculate base hot score (engagement / time decay)
 */
export function computeBaseHotScore(post: Post): number {
  const ageHours = (Date.now() - post.createdAt) / (1000 * 60 * 60)
  const engagement = post.likes + post.replies * 2

  // Decay factor: older posts rank lower
  const rawScore = engagement / Math.pow(ageHours + 2, 1.5)

  // Normalize to 0-1 range (assuming max ~100 engagement in first hour)
  return Math.min(1, rawScore / 50)
}

/**
 * Compute author affinity based on user's past engagement
 */
export function computeAuthorAffinity(
  authorUsername: string,
  userProfile: UserProfile
): number {
  const likeCount = userProfile.likedAuthors.get(authorUsername) || 0
  const isFollowed = userProfile.followedAuthors.includes(authorUsername)

  // Logarithmic scaling to prevent over-fitting to single authors
  const likeAffinity = Math.log10(likeCount + 1) / 2 // 0-~0.5 scale
  const followBonus = isFollowed ? 0.4 : 0

  return Math.min(1, likeAffinity + followBonus)
}

/**
 * Compute social proof from followed users' engagement
 */
export function computeSocialProof(
  post: Post,
  userProfile: UserProfile
): number {
  // Check if followed users have engaged with this post
  const followedLikers = post.likedBy.filter((userId) =>
    userProfile.followedAuthors.some(
      (author) => author.toLowerCase() === userId.toLowerCase()
    )
  )

  // More weight if multiple followed users engaged
  return Math.min(1, followedLikers.length * 0.25)
}

/**
 * Extract topics from post content
 */
export function extractTopics(content: string): string[] {
  const contentLower = content.toLowerCase()

  return Object.entries(TOPIC_KEYWORDS)
    .filter(([, keywords]) => keywords.some((kw) => contentLower.includes(kw)))
    .map(([topic]) => topic)
}

/**
 * Compute topic relevance based on user interests
 */
export function computeTopicRelevance(
  post: Post,
  userProfile: UserProfile
): number {
  const postTopics = extractTopics(post.content)

  if (postTopics.length === 0) {
    return 0.3 // Neutral score for unclassified content
  }

  // Calculate average topic affinity
  const topicScore =
    postTopics.reduce((score, topic) => {
      return score + (userProfile.topicInterests.get(topic) || 0.2)
    }, 0) / postTopics.length

  return Math.min(1, topicScore)
}

/**
 * Compute diversity penalty to prevent author spam
 */
export function computeDiversityPenalty(
  post: Post,
  feedContext: FeedContext
): number {
  const authorCount = feedContext.recentAuthors.get(post.author.username) || 0

  if (authorCount >= feedContext.maxPerAuthor) {
    return 1 // Full penalty - post will rank much lower
  }

  // Gradual penalty as author appears more
  return authorCount / feedContext.maxPerAuthor
}

/**
 * Update feed context after selecting a post
 */
export function updateFeedContext(
  feedContext: FeedContext,
  selectedPost: Post
): void {
  const currentCount =
    feedContext.recentAuthors.get(selectedPost.author.username) || 0
  feedContext.recentAuthors.set(selectedPost.author.username, currentCount + 1)
}

/**
 * Compute freshness bonus for recent content
 */
export function computeFreshnessBonus(
  post: Post,
  freshContentWindow: number = 4,
  maxAgeHours: number = 48
): number {
  const ageHours = (Date.now() - post.createdAt) / (1000 * 60 * 60)

  if (ageHours > maxAgeHours) {
    return 0
  }

  if (ageHours < freshContentWindow) {
    // Linear decay within fresh window
    return 1 - ageHours / freshContentWindow
  }

  // Gradual decay for older content
  return Math.max(0, 1 - ageHours / maxAgeHours)
}

/**
 * Compute quality score for content
 */
export function computeQualityScore(post: Post): number {
  let score = 1.0

  // Content length penalty (too short = low effort)
  if (post.content.length < 20) {
    score *= 0.5
  } else if (post.content.length < 50) {
    score *= 0.8
  }

  // Suspicious engagement pattern (too many likes too fast)
  const ageHours = Math.max(
    0.1,
    (Date.now() - post.createdAt) / (1000 * 60 * 60)
  )
  const likesPerHour = post.likes / ageHours
  if (likesPerHour > 100) {
    score *= 0.5 // Potential bot activity
  }

  // All caps penalty (shouting)
  const capsRatio =
    (post.content.match(/[A-Z]/g) || []).length / post.content.length
  if (capsRatio > 0.7 && post.content.length > 10) {
    score *= 0.7
  }

  return Math.max(0, Math.min(1, score))
}
