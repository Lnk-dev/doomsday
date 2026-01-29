/**
 * Personalized Score
 * Issue #62: Implement personalized feed algorithm
 *
 * Main function for calculating personalized post scores.
 */

import type { Post } from '@/types'
import type {
  UserProfile,
  FeedContext,
  RankingSignals,
  RankingConfig,
  ScoredPost,
  RankingExplanation,
  ExplanationReason,
} from './types'
import { DEFAULT_CONFIG } from './types'
import {
  computeBaseHotScore,
  computeAuthorAffinity,
  computeSocialProof,
  computeTopicRelevance,
  computeDiversityPenalty,
  computeFreshnessBonus,
  computeQualityScore,
  extractTopics,
} from './signals'

/**
 * Compute all ranking signals for a post
 */
export function computeSignals(
  post: Post,
  userProfile: UserProfile,
  feedContext: FeedContext,
  config: RankingConfig = DEFAULT_CONFIG
): RankingSignals {
  return {
    baseHotScore: computeBaseHotScore(post),
    authorAffinity: computeAuthorAffinity(post.author.username, userProfile),
    topicRelevance: computeTopicRelevance(post, userProfile),
    socialProof: computeSocialProof(post, userProfile),
    diversityPenalty: computeDiversityPenalty(post, feedContext),
    qualityScore: computeQualityScore(post),
    freshnessBonus: computeFreshnessBonus(
      post,
      config.freshContentWindow,
      config.maxAgeHours
    ),
  }
}

/**
 * Calculate personalized score from signals
 */
export function calculatePersonalizedScore(
  signals: RankingSignals,
  config: RankingConfig = DEFAULT_CONFIG
): number {
  const { weights } = config

  const weightedScore =
    signals.baseHotScore * weights.baseHotScore +
    signals.authorAffinity * weights.authorAffinity +
    signals.topicRelevance * weights.topicRelevance +
    signals.socialProof * weights.socialProof +
    (1 - signals.diversityPenalty) * weights.diversityPenalty +
    signals.qualityScore * weights.qualityScore +
    signals.freshnessBonus * weights.freshnessBonus

  return Math.max(0, Math.min(1, weightedScore))
}

/**
 * Check if user is in cold start phase
 */
export function isUserColdStart(
  userProfile: UserProfile,
  threshold: number = DEFAULT_CONFIG.coldStartThreshold
): boolean {
  return userProfile.totalInteractions < threshold
}

/**
 * Get cold start score for new users
 */
export function getColdStartScore(post: Post): number {
  const baseScore = computeBaseHotScore(post)
  const qualityScore = computeQualityScore(post)
  const freshnessBonus = computeFreshnessBonus(post)

  // For cold start, rely more on global popularity and quality
  return baseScore * 0.5 + qualityScore * 0.3 + freshnessBonus * 0.2
}

/**
 * Generate explanation for why a post is shown
 */
export function explainRanking(
  post: Post,
  userProfile: UserProfile,
  signals: RankingSignals
): RankingExplanation {
  const reasons: ExplanationReason[] = []

  // Check following
  if (userProfile.followedAuthors.includes(post.author.username)) {
    reasons.push({ type: 'following', author: post.author.username })
  }

  // Check author affinity
  const authorLikes = userProfile.likedAuthors.get(post.author.username) || 0
  if (authorLikes >= 3) {
    reasons.push({
      type: 'author_affinity',
      author: post.author.username,
      likeCount: authorLikes,
    })
  }

  // Check topic interest
  const topics = extractTopics(post.content)
  for (const topic of topics) {
    if ((userProfile.topicInterests.get(topic) || 0) > 0.5) {
      reasons.push({ type: 'topic_interest', topic })
      break // Only show one topic
    }
  }

  // Check social proof
  const engagedFollowers = post.likedBy.filter((id) =>
    userProfile.followedAuthors.includes(id)
  )
  if (engagedFollowers.length > 0) {
    reasons.push({
      type: 'social_proof',
      engagedFollowers: engagedFollowers.slice(0, 3),
    })
  }

  // Trending check
  if (signals.baseHotScore > 0.6) {
    reasons.push({
      type: 'trending',
      engagementRate: signals.baseHotScore,
    })
  }

  // Freshness check
  const ageMinutes = (Date.now() - post.createdAt) / (1000 * 60)
  if (ageMinutes < 60) {
    reasons.push({ type: 'fresh_content', ageMinutes: Math.round(ageMinutes) })
  }

  // Default to popular if no other reasons
  if (reasons.length === 0) {
    reasons.push({
      type: 'popular',
      totalEngagement: post.likes + post.replies,
    })
  }

  return {
    postId: post.id,
    primaryReason: reasons[0],
    secondaryReasons: reasons.slice(1),
    signals,
  }
}

/**
 * Get human-readable explanation text
 */
export function getExplanationText(reason: ExplanationReason): string {
  switch (reason.type) {
    case 'following':
      return `You follow @${reason.author}`
    case 'author_affinity':
      return `You've liked ${reason.likeCount} posts from @${reason.author}`
    case 'topic_interest':
      return `Based on your interest in ${reason.topic}`
    case 'social_proof':
      if (reason.engagedFollowers.length === 1) {
        return `@${reason.engagedFollowers[0]} liked this`
      }
      return `@${reason.engagedFollowers[0]} and ${reason.engagedFollowers.length - 1} others you follow liked this`
    case 'trending':
      return 'Trending now'
    case 'fresh_content':
      return reason.ageMinutes < 5 ? 'Just posted' : `Posted ${reason.ageMinutes}m ago`
    case 'popular':
      return 'Popular post'
    default:
      return 'Recommended for you'
  }
}

/**
 * Rank posts for a user's personalized feed
 */
export function rankPosts(
  posts: Post[],
  userProfile: UserProfile,
  config: RankingConfig = DEFAULT_CONFIG
): ScoredPost[] {
  const feedContext: FeedContext = {
    recentAuthors: new Map(),
    maxPerAuthor: 3,
    diversityWindow: 20,
  }

  const isColdStart = isUserColdStart(userProfile, config.coldStartThreshold)

  // Score all posts
  const scoredPosts: ScoredPost[] = posts.map((post) => {
    if (isColdStart) {
      const score = getColdStartScore(post)
      return {
        post,
        score,
        signals: {
          baseHotScore: computeBaseHotScore(post),
          authorAffinity: 0,
          topicRelevance: 0.3,
          socialProof: 0,
          diversityPenalty: 0,
          qualityScore: computeQualityScore(post),
          freshnessBonus: computeFreshnessBonus(post),
        },
      }
    }

    const signals = computeSignals(post, userProfile, feedContext, config)
    const score = calculatePersonalizedScore(signals, config)
    const explanation = explainRanking(post, userProfile, signals)

    return { post, score, signals, explanation }
  })

  // Sort by score
  scoredPosts.sort((a, b) => b.score - a.score)

  // Apply diversity constraints by reordering
  const result: ScoredPost[] = []
  const authorCounts = new Map<string, number>()
  const remaining = [...scoredPosts]

  while (remaining.length > 0 && result.length < posts.length) {
    // Find best post that doesn't violate diversity
    let selectedIndex = -1

    for (let i = 0; i < remaining.length; i++) {
      const post = remaining[i].post
      const count = authorCounts.get(post.author.username) || 0

      if (count < feedContext.maxPerAuthor) {
        selectedIndex = i
        break
      }
    }

    // If all remaining posts violate diversity, take the best one anyway
    if (selectedIndex === -1) {
      selectedIndex = 0
    }

    const selected = remaining.splice(selectedIndex, 1)[0]
    result.push(selected)

    // Update author count
    const count = authorCounts.get(selected.post.author.username) || 0
    authorCounts.set(selected.post.author.username, count + 1)
  }

  return result
}
