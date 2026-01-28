import { describe, it, expect } from 'vitest'
import { fuzzyScore, searchPosts, searchEvents, searchUsers, searchAll } from './search'
import type { Post, PredictionEvent, Author } from '@/types'

describe('Search utilities', () => {
  describe('fuzzyScore', () => {
    it('should return 1 for exact match', () => {
      expect(fuzzyScore('doom', 'doom')).toBe(1)
    })

    it('should return high score for contains match', () => {
      expect(fuzzyScore('doom', 'doomsday')).toBe(0.9)
    })

    it('should return 0 for no match', () => {
      expect(fuzzyScore('xyz', 'doom')).toBe(0)
    })

    it('should be case insensitive', () => {
      expect(fuzzyScore('DOOM', 'doom')).toBe(1)
      expect(fuzzyScore('doom', 'DOOM')).toBe(1)
    })

    it('should return 0 for empty inputs', () => {
      expect(fuzzyScore('', 'doom')).toBe(0)
      expect(fuzzyScore('doom', '')).toBe(0)
    })

    it('should score word starts with query', () => {
      expect(fuzzyScore('sun', 'sunshine')).toBe(0.9)
    })
  })

  describe('searchPosts', () => {
    const mockPosts: Post[] = [
      {
        id: 'p1',
        author: { address: null, username: 'doomer' },
        content: 'The doom is near',
        variant: 'doom',
        createdAt: Date.now(),
        likes: 10,
        replies: 5,
        reposts: 2,
        likedBy: [],
      },
      {
        id: 'p2',
        author: { address: null, username: 'lifelover' },
        content: 'Life is beautiful',
        variant: 'life',
        createdAt: Date.now(),
        likes: 20,
        replies: 10,
        reposts: 5,
        likedBy: [],
      },
    ]

    it('should find posts by content', () => {
      const results = searchPosts(mockPosts, 'doom')
      expect(results.length).toBeGreaterThan(0)
      expect(results[0].id).toBe('p1')
    })

    it('should find posts by author username', () => {
      const results = searchPosts(mockPosts, 'lifelover')
      expect(results.length).toBeGreaterThan(0)
      expect(results[0].id).toBe('p2')
    })

    it('should return empty array for no matches', () => {
      const results = searchPosts(mockPosts, 'xyz123')
      expect(results).toHaveLength(0)
    })
  })

  describe('searchEvents', () => {
    const mockEvents: PredictionEvent[] = [
      {
        id: 'e1',
        title: 'AI Takeover',
        description: 'Artificial intelligence becomes sentient',
        category: 'technology',
        status: 'active',
        countdownEnd: Date.now() + 1000000,
        doomStake: 100,
        lifeStake: 50,
        linkedPosts: [],
        createdAt: Date.now(),
        createdBy: { address: null, username: 'creator' },
      },
    ]

    it('should find events by title', () => {
      const results = searchEvents(mockEvents, 'AI')
      expect(results.length).toBeGreaterThan(0)
      expect(results[0].id).toBe('e1')
    })

    it('should find events by category', () => {
      const results = searchEvents(mockEvents, 'technology')
      expect(results.length).toBeGreaterThan(0)
    })
  })

  describe('searchUsers', () => {
    const mockAuthors: Author[] = [
      { address: null, username: 'doomprophet', verified: true },
      { address: null, username: 'lifeliver' },
      { address: null, username: 'doomprophet' }, // duplicate
    ]

    it('should find users by username', () => {
      const results = searchUsers(mockAuthors, 'doom')
      expect(results.length).toBeGreaterThan(0)
      expect(results[0].title).toContain('doomprophet')
    })

    it('should dedupe authors', () => {
      const results = searchUsers(mockAuthors, 'doom')
      // Should only have one doomprophet
      expect(results.filter((r) => r.title.includes('doomprophet'))).toHaveLength(1)
    })

    it('should show verified status in subtitle', () => {
      const verifiedAuthors: Author[] = [
        { address: null, username: 'verifieduser', verified: true },
      ]
      const results = searchUsers(verifiedAuthors, 'verified')
      expect(results[0].subtitle).toBe('Verified')
    })
  })

  describe('searchAll', () => {
    const mockPosts: Post[] = [
      {
        id: 'p1',
        author: { address: null, username: 'doomer' },
        content: 'The doom is near',
        variant: 'doom',
        createdAt: Date.now(),
        likes: 10,
        replies: 5,
        reposts: 2,
        likedBy: [],
      },
    ]

    const mockEvents: PredictionEvent[] = [
      {
        id: 'e1',
        title: 'Doom Event',
        description: 'Something doomy',
        category: 'other',
        status: 'active',
        countdownEnd: Date.now() + 1000000,
        doomStake: 100,
        lifeStake: 50,
        linkedPosts: [],
        createdAt: Date.now(),
        createdBy: { address: null, username: 'creator' },
      },
    ]

    const mockAuthors: Author[] = [
      { address: null, username: 'doomwatcher' },
    ]

    it('should search across all types', () => {
      const results = searchAll(mockPosts, mockEvents, mockAuthors, 'doom')
      expect(results.length).toBe(3) // 1 post, 1 event, 1 user
    })

    it('should sort by score (highest first)', () => {
      const results = searchAll(mockPosts, mockEvents, mockAuthors, 'doom')
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score)
      }
    })

    it('should return empty array for empty query', () => {
      const results = searchAll(mockPosts, mockEvents, mockAuthors, '')
      expect(results).toHaveLength(0)
    })
  })
})
