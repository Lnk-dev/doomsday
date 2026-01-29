/**
 * Ranking Types
 * Issue #62: Implement personalized feed algorithm
 *
 * Type definitions for the personalized ranking system.
 */

import type { Post } from '@/types'

export interface UserProfile {
  userId: string
  /** Post IDs the user has liked */
  likedPosts: string[]
  /** Author username -> like count */
  likedAuthors: Map<string, number>
  /** Usernames the user follows */
  followedAuthors: string[]
  /** Posts already seen in current session */
  viewedPosts: Set<string>
  /** Topic -> affinity score (0-1) */
  topicInterests: Map<string, number>
  /** Total interactions count */
  totalInteractions: number
}

export interface RankingSignals {
  /** Base hot score from engagement/time */
  baseHotScore: number
  /** 0-1, how much user engages with author */
  authorAffinity: number
  /** 0-1, match to user interests */
  topicRelevance: number
  /** 0-1, engagement from followed users */
  socialProof: number
  /** 0-1, penalty for author repetition in feed */
  diversityPenalty: number
  /** 0-1, content quality indicators */
  qualityScore: number
  /** 0-1, boost for very recent content */
  freshnessBonus: number
}

export interface FeedContext {
  /** Author -> count in current feed */
  recentAuthors: Map<string, number>
  /** Max posts per author (default: 3) */
  maxPerAuthor: number
  /** How many posts to consider */
  diversityWindow: number
}

export interface RankingConfig {
  weights: RankingWeights
  freshContentWindow: number
  maxAgeHours: number
  coldStartThreshold: number
}

export interface RankingWeights {
  baseHotScore: number
  authorAffinity: number
  topicRelevance: number
  socialProof: number
  diversityPenalty: number
  qualityScore: number
  freshnessBonus: number
}

export const DEFAULT_WEIGHTS: RankingWeights = {
  baseHotScore: 0.35,
  authorAffinity: 0.20,
  topicRelevance: 0.15,
  socialProof: 0.10,
  diversityPenalty: 0.10,
  qualityScore: 0.05,
  freshnessBonus: 0.05,
}

export const DEFAULT_CONFIG: RankingConfig = {
  weights: DEFAULT_WEIGHTS,
  freshContentWindow: 4,
  maxAgeHours: 48,
  coldStartThreshold: 10,
}

export type ExplanationReason =
  | { type: 'following'; author: string }
  | { type: 'author_affinity'; author: string; likeCount: number }
  | { type: 'topic_interest'; topic: string }
  | { type: 'social_proof'; engagedFollowers: string[] }
  | { type: 'trending'; engagementRate: number }
  | { type: 'fresh_content'; ageMinutes: number }
  | { type: 'popular'; totalEngagement: number }

export interface RankingExplanation {
  postId: string
  primaryReason: ExplanationReason
  secondaryReasons: ExplanationReason[]
  signals: RankingSignals
}

export interface ScoredPost {
  post: Post
  score: number
  signals: RankingSignals
  explanation?: RankingExplanation
}
