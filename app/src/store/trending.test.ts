/**
 * Trending Store Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useTrendingStore } from './trending'
import type { Post, ID } from '@/types'

describe('trending store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useTrendingStore.setState({
      trendingHashtags: [],
      trendingPosts: [],
      lastUpdated: 0,
    })
  })

  describe('initial state', () => {
    it('should have empty trending hashtags', () => {
      const state = useTrendingStore.getState()
      expect(state.trendingHashtags).toEqual([])
    })

    it('should have empty trending posts', () => {
      const state = useTrendingStore.getState()
      expect(state.trendingPosts).toEqual([])
    })

    it('should have suggested users', () => {
      const state = useTrendingStore.getState()
      expect(state.suggestedUsers.length).toBeGreaterThan(0)
    })

    it('should have lastUpdated as 0', () => {
      const state = useTrendingStore.getState()
      expect(state.lastUpdated).toBe(0)
    })
  })

  describe('extractHashtags', () => {
    it('should extract single hashtag', () => {
      const { extractHashtags } = useTrendingStore.getState()
      const result = extractHashtags('Hello #world')
      expect(result).toEqual(['#world'])
    })

    it('should extract multiple hashtags', () => {
      const { extractHashtags } = useTrendingStore.getState()
      const result = extractHashtags('Hello #world and #test')
      expect(result).toEqual(['#world', '#test'])
    })

    it('should return empty array when no hashtags', () => {
      const { extractHashtags } = useTrendingStore.getState()
      const result = extractHashtags('Hello world')
      expect(result).toEqual([])
    })

    it('should lowercase hashtags', () => {
      const { extractHashtags } = useTrendingStore.getState()
      const result = extractHashtags('Hello #WORLD #Test')
      expect(result).toEqual(['#world', '#test'])
    })

    it('should handle hashtags with underscores', () => {
      const { extractHashtags } = useTrendingStore.getState()
      const result = extractHashtags('#hello_world')
      expect(result).toEqual(['#hello_world'])
    })

    it('should handle hashtags with numbers', () => {
      const { extractHashtags } = useTrendingStore.getState()
      const result = extractHashtags('#test123')
      expect(result).toEqual(['#test123'])
    })
  })

  describe('calculateScore', () => {
    it('should return positive score for recent post', () => {
      const { calculateScore } = useTrendingStore.getState()
      const score = calculateScore(100, Date.now())
      expect(score).toBeGreaterThan(0)
    })

    it('should decay score for older posts', () => {
      const { calculateScore } = useTrendingStore.getState()
      const now = Date.now()
      const sixHoursAgo = now - 6 * 60 * 60 * 1000

      const recentScore = calculateScore(100, now)
      const olderScore = calculateScore(100, sixHoursAgo)

      expect(recentScore).toBeGreaterThan(olderScore)
    })

    it('should scale with engagement', () => {
      const { calculateScore } = useTrendingStore.getState()
      const now = Date.now()

      const lowEngagement = calculateScore(10, now)
      const highEngagement = calculateScore(100, now)

      expect(highEngagement).toBeGreaterThan(lowEngagement)
    })
  })

  describe('updateTrending', () => {
    const createMockPost = (id: string, content: string, likes: number, createdAt: number): Post => ({
      id: id as ID,
      content,
      author: { address: null, username: 'testuser', verified: false },
      likes,
      replies: 0,
      reposts: 0,
      createdAt,
      variant: 'doom',
      likedBy: [],
      isLiked: false,
    })

    it('should update trending hashtags from posts', () => {
      const { updateTrending } = useTrendingStore.getState()
      const posts: Record<ID, Post> = {
        '1': createMockPost('1', 'Hello #test', 10, Date.now()),
        '2': createMockPost('2', 'World #test', 5, Date.now()),
      } as Record<ID, Post>

      updateTrending(posts)

      const state = useTrendingStore.getState()
      expect(state.trendingHashtags.length).toBeGreaterThan(0)
      expect(state.trendingHashtags.find(h => h.tag === '#test')).toBeDefined()
    })

    it('should count hashtag occurrences', () => {
      const { updateTrending } = useTrendingStore.getState()
      const posts: Record<ID, Post> = {
        '1': createMockPost('1', '#doom post', 10, Date.now()),
        '2': createMockPost('2', '#doom again', 5, Date.now()),
        '3': createMockPost('3', '#life post', 3, Date.now()),
      } as Record<ID, Post>

      updateTrending(posts)

      const state = useTrendingStore.getState()
      const doomHashtag = state.trendingHashtags.find(h => h.tag === '#doom')
      expect(doomHashtag?.count).toBe(2)
    })

    it('should update trending posts with engagement', () => {
      const { updateTrending } = useTrendingStore.getState()
      const posts: Record<ID, Post> = {
        '1': createMockPost('1', 'Popular post', 100, Date.now()),
      } as Record<ID, Post>

      updateTrending(posts)

      const state = useTrendingStore.getState()
      expect(state.trendingPosts.length).toBe(1)
      expect(state.trendingPosts[0].likes).toBe(100)
    })

    it('should sort posts by score', () => {
      const { updateTrending } = useTrendingStore.getState()
      const now = Date.now()
      const posts: Record<ID, Post> = {
        '1': createMockPost('1', 'Less popular', 10, now),
        '2': createMockPost('2', 'More popular', 100, now),
      } as Record<ID, Post>

      updateTrending(posts)

      const state = useTrendingStore.getState()
      expect(state.trendingPosts[0].likes).toBe(100)
    })

    it('should update lastUpdated timestamp', () => {
      const { updateTrending } = useTrendingStore.getState()
      const before = Date.now()
      const posts: Record<ID, Post> = {} as Record<ID, Post>

      updateTrending(posts)

      const state = useTrendingStore.getState()
      expect(state.lastUpdated).toBeGreaterThanOrEqual(before)
    })
  })

  describe('getTopHashtags', () => {
    it('should return limited hashtags', () => {
      useTrendingStore.setState({
        trendingHashtags: Array.from({ length: 20 }, (_, i) => ({
          tag: `#tag${i}`,
          count: 20 - i,
          score: 20 - i,
          samplePosts: [],
        })),
      })

      const { getTopHashtags } = useTrendingStore.getState()
      expect(getTopHashtags(5)).toHaveLength(5)
    })

    it('should default to 10 hashtags', () => {
      useTrendingStore.setState({
        trendingHashtags: Array.from({ length: 20 }, (_, i) => ({
          tag: `#tag${i}`,
          count: 20 - i,
          score: 20 - i,
          samplePosts: [],
        })),
      })

      const { getTopHashtags } = useTrendingStore.getState()
      expect(getTopHashtags()).toHaveLength(10)
    })
  })

  describe('getTopPosts', () => {
    it('should return limited posts', () => {
      useTrendingStore.setState({
        trendingPosts: Array.from({ length: 20 }, (_, i) => ({
          postId: `post${i}` as ID,
          author: { address: null, username: `user${i}`, verified: false },
          content: `Content ${i}`,
          score: 20 - i,
          likes: 20 - i,
          replies: 0,
          reposts: 0,
          createdAt: Date.now(),
        })),
      })

      const { getTopPosts } = useTrendingStore.getState()
      expect(getTopPosts(5)).toHaveLength(5)
    })

    it('should default to 10 posts', () => {
      useTrendingStore.setState({
        trendingPosts: Array.from({ length: 20 }, (_, i) => ({
          postId: `post${i}` as ID,
          author: { address: null, username: `user${i}`, verified: false },
          content: `Content ${i}`,
          score: 20 - i,
          likes: 20 - i,
          replies: 0,
          reposts: 0,
          createdAt: Date.now(),
        })),
      })

      const { getTopPosts } = useTrendingStore.getState()
      expect(getTopPosts()).toHaveLength(10)
    })
  })

  describe('getSuggestedUsers', () => {
    it('should return suggested users', () => {
      const { getSuggestedUsers } = useTrendingStore.getState()
      const users = getSuggestedUsers()
      expect(users.length).toBeGreaterThan(0)
    })

    it('should limit to specified count', () => {
      const { getSuggestedUsers } = useTrendingStore.getState()
      const users = getSuggestedUsers(3)
      expect(users.length).toBeLessThanOrEqual(3)
    })

    it('should default to 6 users', () => {
      const { getSuggestedUsers } = useTrendingStore.getState()
      const users = getSuggestedUsers()
      expect(users.length).toBeLessThanOrEqual(6)
    })

    it('should include user details', () => {
      const { getSuggestedUsers } = useTrendingStore.getState()
      const users = getSuggestedUsers(1)
      expect(users[0].author).toBeDefined()
      expect(users[0].reason).toBeDefined()
      expect(users[0].score).toBeDefined()
      expect(users[0].postCount).toBeDefined()
    })
  })
})
