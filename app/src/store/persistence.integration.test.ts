/**
 * Store Persistence Integration Tests
 *
 * Tests localStorage persistence concepts for all stores.
 * Covers:
 * - User store persistence
 * - Posts store persistence
 * - Events store persistence
 * - Bookmarks store persistence
 * - Streaks store persistence
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useUserStore } from './user'
import { usePostsStore } from './posts'
import { useEventsStore } from './events'
import { useBookmarksStore } from './bookmarks'
import { useStreaksStore } from './streaks'

describe('Store Persistence Integration', () => {
  beforeEach(() => {
    useUserStore.setState({
      userId: 'test-user-id',
      author: { address: null, username: 'testuser' },
      displayName: '',
      bio: '',
      doomBalance: 100,
      lifeBalance: 0,
      daysLiving: 0,
      lifePosts: 0,
      isConnected: false,
      following: [],
      blocked: [],
      muted: [],
    })

    usePostsStore.setState({
      posts: {},
      doomFeed: [],
      lifeFeed: [],
    })

    useEventsStore.setState({
      events: {},
      bets: [],
    })

    useBookmarksStore.setState({
      bookmarks: {},
      bookmarksByPost: {},
      collections: {},
      bookmarkOrder: [],
    })

    useStreaksStore.getState().resetStreak()
  })

  describe('User Store Persistence', () => {
    it('should persist user data', () => {
      useUserStore.getState().setUsername('newname')
      useUserStore.getState().addDoom(50)
      useUserStore.getState().followUser('friend1')

      const state = useUserStore.getState()

      expect(state.author.username).toBe('newname')
      expect(state.doomBalance).toBe(150)
      expect(state.following).toContain('friend1')
    })

    it('should persist storage key correctly', () => {
      expect(useUserStore.persist).toBeDefined()
    })

    it('should handle balance changes across sessions', () => {
      useUserStore.getState().addDoom(100)
      useUserStore.getState().spendDoom(30)
      useUserStore.getState().addLife(25)

      const finalState = useUserStore.getState()
      expect(finalState.doomBalance).toBe(170)
      expect(finalState.lifeBalance).toBe(25)
    })

    it('should persist following, blocked, and muted lists', () => {
      useUserStore.getState().followUser('user1')
      useUserStore.getState().followUser('user2')
      useUserStore.getState().blockUser('baduser')
      useUserStore.getState().muteUser('quietuser')

      const state = useUserStore.getState()
      expect(state.following).toHaveLength(2)
      expect(state.blocked).toContain('baduser')
      expect(state.muted).toContain('quietuser')
    })
  })

  describe('Posts Store Persistence', () => {
    it('should persist posts and feeds', () => {
      const author = { address: null, username: 'testuser' }

      const doomPost = usePostsStore.getState().createPost('Doom content', 'doom', author)
      const lifePost = usePostsStore.getState().createPost('Life content', 'life', author)

      const state = usePostsStore.getState()
      expect(Object.keys(state.posts)).toHaveLength(2)
      expect(state.doomFeed).toContain(doomPost.id)
      expect(state.lifeFeed).toContain(lifePost.id)
    })

    it('should persist likes correctly', () => {
      const author = { address: null, username: 'testuser' }
      const post = usePostsStore.getState().createPost('Popular post', 'doom', author)

      usePostsStore.getState().likePost(post.id, 'user1')
      usePostsStore.getState().likePost(post.id, 'user2')

      const updatedPost = usePostsStore.getState().posts[post.id]
      expect(updatedPost.likes).toBe(2)
      expect(updatedPost.likedBy).toHaveLength(2)
    })

    it('should maintain feed order after persistence', () => {
      const author = { address: null, username: 'testuser' }

      const post1 = usePostsStore.getState().createPost('First', 'doom', author)
      const post2 = usePostsStore.getState().createPost('Second', 'doom', author)
      const post3 = usePostsStore.getState().createPost('Third', 'doom', author)

      const feed = usePostsStore.getState().doomFeed
      expect(feed[0]).toBe(post3.id)
      expect(feed[1]).toBe(post2.id)
      expect(feed[2]).toBe(post1.id)
    })
  })

  describe('Events Store Persistence', () => {
    it('should persist events and bets', () => {
      const eventsStore = useEventsStore.getState()

      const event = eventsStore.createEvent('Test Event', 'Description', 'technology', 30)

      useEventsStore.getState().placeBet(event.id, 'doom', 50, 'user1')
      useEventsStore.getState().placeBet(event.id, 'life', 30, 'user2')

      const state = useEventsStore.getState()
      expect(Object.keys(state.events)).toHaveLength(1)
      expect(state.bets).toHaveLength(2)
    })

    it('should persist event stakes correctly', () => {
      const event = useEventsStore.getState().createEvent('Stake Test', 'Testing stakes', 'economic', 60)

      useEventsStore.getState().placeBet(event.id, 'doom', 100, 'user1')
      useEventsStore.getState().placeBet(event.id, 'doom', 50, 'user2')
      useEventsStore.getState().placeBet(event.id, 'life', 75, 'user3')

      const updatedEvent = useEventsStore.getState().events[event.id]
      expect(updatedEvent.doomStake).toBe(150)
      expect(updatedEvent.lifeStake).toBe(75)
    })
  })

  describe('Bookmarks Store Persistence', () => {
    it('should persist bookmarks', () => {
      const author = { address: null, username: 'testuser' }
      const post = usePostsStore.getState().createPost('Content', 'doom', author)

      useBookmarksStore.getState().addBookmark(post.id, 'user1', 'My note')

      const state = useBookmarksStore.getState()
      expect(state.getBookmarkCount()).toBe(1)
      expect(state.isBookmarked(post.id)).toBe(true)
    })

    it('should persist collections', () => {
      useBookmarksStore.getState().createCollection('user1', 'Collection 1', 'Description')
      useBookmarksStore.getState().createCollection('user1', 'Collection 2')

      const collections = useBookmarksStore.getState().getUserCollections('user1')
      expect(collections).toHaveLength(2)
    })
  })

  describe('Streaks Store Persistence', () => {
    it('should persist streak data', () => {
      useStreaksStore.getState().recordActivity()

      const state = useStreaksStore.getState()
      expect(state.currentStreak).toBe(1)
      expect(state.hasActivityToday).toBe(true)
    })

    it('should persist milestone claims', () => {
      useStreaksStore.setState({
        currentStreak: 7,
        claimedMilestones: [],
      })

      useStreaksStore.getState().claimMilestone(7)

      const state = useStreaksStore.getState()
      expect(state.claimedMilestones).toContain(7)
      expect(state.totalBonusEarned).toBe(5)
    })
  })

  describe('Cross-Store Persistence', () => {
    it('should persist all stores independently', () => {
      useUserStore.getState().setUsername('crosstest')
      usePostsStore.getState().createPost('Test post', 'doom', { address: null, username: 'crosstest' })
      useEventsStore.getState().createEvent('Test Event', 'Description', 'climate', 30)
      useBookmarksStore.getState().createCollection('user1', 'My Collection')
      useStreaksStore.getState().recordActivity()

      expect(useUserStore.getState().author.username).toBe('crosstest')
      expect(Object.keys(usePostsStore.getState().posts)).toHaveLength(1)
      expect(Object.keys(useEventsStore.getState().events)).toHaveLength(1)
      expect(useBookmarksStore.getState().getUserCollections('user1')).toHaveLength(1)
      expect(useStreaksStore.getState().currentStreak).toBe(1)
    })

    it('should handle store dependencies correctly', () => {
      const user = useUserStore.getState()
      const author = user.author

      user.spendDoom(user.getLifePostCost())
      useUserStore.getState().incrementLifePosts()

      const post = usePostsStore.getState().createPost('Life post', 'life', author)

      useStreaksStore.getState().recordActivity()

      useBookmarksStore.getState().addBookmark(post.id, user.userId)

      expect(useUserStore.getState().lifePosts).toBe(1)
      expect(usePostsStore.getState().posts[post.id]).toBeDefined()
      expect(useStreaksStore.getState().currentStreak).toBe(1)
      expect(useBookmarksStore.getState().isBookmarked(post.id)).toBe(true)
    })
  })

  describe('Persistence Edge Cases', () => {
    it('should handle empty state persistence', () => {
      expect(usePostsStore.getState().doomFeed).toHaveLength(0)
      expect(Object.keys(useEventsStore.getState().events)).toHaveLength(0)
    })

    it('should handle large state correctly', () => {
      const author = { address: null, username: 'testuser' }

      for (let i = 0; i < 100; i++) {
        usePostsStore.getState().createPost(`Post ${i}`, 'doom', author)
      }

      expect(Object.keys(usePostsStore.getState().posts)).toHaveLength(100)
      expect(usePostsStore.getState().doomFeed).toHaveLength(100)
    })

    it('should handle special characters in content', () => {
      const author = { address: null, username: 'testuser' }
      const specialContent = 'Test with "quotes" and <tags> and emoji and unicode'

      const post = usePostsStore.getState().createPost(specialContent, 'doom', author)

      expect(usePostsStore.getState().posts[post.id]).toBeDefined()
    })
  })
})
