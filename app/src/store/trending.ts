/**
 * Trending Store
 *
 * Zustand store for managing trending topics and posts.
 * Features:
 * - Hashtag extraction and tracking
 * - Trending post calculation with time-decay
 * - Popular topics aggregation
 */

import { create } from 'zustand'
import type { Post, ID, Author } from '@/types'

/** Hashtag with usage count and recency */
export interface TrendingHashtag {
  tag: string
  count: number
  /** Weighted score with time decay */
  score: number
  /** Sample posts containing this hashtag */
  samplePosts: ID[]
}

/** Trending post with engagement score */
export interface TrendingPost {
  postId: ID
  author: Author
  content: string
  /** Engagement score with time decay */
  score: number
  likes: number
  replies: number
  reposts: number
  createdAt: number
}

/** Suggested user based on activity */
export interface SuggestedUser {
  author: Author
  /** Reason for suggestion */
  reason: string
  /** Engagement score */
  score: number
  /** Recent post count */
  postCount: number
}

interface TrendingState {
  /** Trending hashtags sorted by score */
  trendingHashtags: TrendingHashtag[]
  /** Trending posts sorted by score */
  trendingPosts: TrendingPost[]
  /** Suggested users */
  suggestedUsers: SuggestedUser[]
  /** Last computation timestamp */
  lastUpdated: number

  // Actions
  /** Extract hashtags from post content */
  extractHashtags: (content: string) => string[]
  /** Calculate trending score with time decay */
  calculateScore: (engagement: number, createdAt: number) => number
  /** Update trending data from posts */
  updateTrending: (posts: Record<ID, Post>) => void
  /** Get top N trending hashtags */
  getTopHashtags: (limit?: number) => TrendingHashtag[]
  /** Get top N trending posts */
  getTopPosts: (limit?: number) => TrendingPost[]
  /** Get suggested users */
  getSuggestedUsers: (limit?: number) => SuggestedUser[]
}

/** Time decay half-life in hours */
const DECAY_HALF_LIFE = 6

/** Calculate time decay factor */
const getDecayFactor = (createdAt: number): number => {
  const ageHours = (Date.now() - createdAt) / (1000 * 60 * 60)
  return Math.pow(0.5, ageHours / DECAY_HALF_LIFE)
}

/** Extract hashtags from text */
const extractHashtagsFromText = (text: string): string[] => {
  const regex = /#([a-zA-Z0-9_]+)/g
  const matches = text.match(regex)
  if (!matches) return []
  return matches.map((tag) => tag.toLowerCase())
}

/** Mock suggested users - in real app would be calculated from follower graph */
const mockSuggestedUsers: SuggestedUser[] = [
  {
    author: { address: null, username: 'doomprophet', verified: true },
    reason: 'Popular in Doom',
    score: 9500,
    postCount: 156,
  },
  {
    author: { address: null, username: 'climatewatch', verified: true },
    reason: 'Climate expert',
    score: 8900,
    postCount: 89,
  },
  {
    author: { address: null, username: 'lifeliver', verified: true },
    reason: 'Top Life poster',
    score: 8200,
    postCount: 234,
  },
  {
    author: { address: null, username: 'techprophet', verified: false },
    reason: 'AI predictions',
    score: 7800,
    postCount: 67,
  },
  {
    author: { address: null, username: 'presentmoment', verified: true },
    reason: 'Inspiring content',
    score: 7500,
    postCount: 123,
  },
  {
    author: { address: null, username: 'econwatcher', verified: false },
    reason: 'Economic analysis',
    score: 7200,
    postCount: 45,
  },
]

export const useTrendingStore = create<TrendingState>()((set, get) => ({
  trendingHashtags: [],
  trendingPosts: [],
  suggestedUsers: mockSuggestedUsers,
  lastUpdated: 0,

  extractHashtags: (content) => {
    return extractHashtagsFromText(content)
  },

  calculateScore: (engagement, createdAt) => {
    const decayFactor = getDecayFactor(createdAt)
    return engagement * decayFactor
  },

  updateTrending: (posts) => {
    const hashtagMap: Map<string, { count: number; score: number; posts: ID[] }> = new Map()
    const postScores: TrendingPost[] = []

    // Process all posts
    Object.values(posts).forEach((post) => {
      // Calculate post score
      const engagement = post.likes + post.replies * 2 + post.reposts * 3
      const score = get().calculateScore(engagement, post.createdAt)

      // Add to post scores if significant engagement
      if (engagement > 0) {
        postScores.push({
          postId: post.id,
          author: post.author,
          content: post.content,
          score,
          likes: post.likes,
          replies: post.replies,
          reposts: post.reposts,
          createdAt: post.createdAt,
        })
      }

      // Extract and count hashtags
      const tags = extractHashtagsFromText(post.content)
      tags.forEach((tag) => {
        const existing = hashtagMap.get(tag) || { count: 0, score: 0, posts: [] }
        hashtagMap.set(tag, {
          count: existing.count + 1,
          score: existing.score + score,
          posts: [...existing.posts.slice(0, 4), post.id], // Keep max 5 sample posts
        })
      })
    })

    // Convert hashtag map to sorted array
    const trendingHashtags: TrendingHashtag[] = Array.from(hashtagMap.entries())
      .map(([tag, data]) => ({
        tag,
        count: data.count,
        score: data.score,
        samplePosts: data.posts,
      }))
      .sort((a, b) => b.score - a.score)

    // Sort posts by score
    const trendingPosts = postScores.sort((a, b) => b.score - a.score)

    set({
      trendingHashtags,
      trendingPosts,
      lastUpdated: Date.now(),
    })
  },

  getTopHashtags: (limit = 10) => {
    return get().trendingHashtags.slice(0, limit)
  },

  getTopPosts: (limit = 10) => {
    return get().trendingPosts.slice(0, limit)
  },

  getSuggestedUsers: (limit = 6) => {
    return get().suggestedUsers.slice(0, limit)
  },
}))
