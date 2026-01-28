/**
 * Store Reset Integration Tests
 *
 * Tests store reset functionality and state clearing.
 * Covers:
 * - Individual store resets
 * - Cross-store reset coordination
 * - Partial state clearing
 * - Reset edge cases
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useUserStore } from './user'
import { usePostsStore } from './posts'
import { useEventsStore } from './events'
import { useBookmarksStore } from './bookmarks'
import { useStreaksStore } from './streaks'
import { useToastStore } from './toast'
import { useLoadingStore } from './loading'
import { useLeaderboardStore } from './leaderboard'

describe('Store Reset Integration', () => {
  beforeEach(() => {
    useUserStore.setState({
      userId: 'test-user-id',
      author: { address: '0x123', username: 'existinguser', verified: true },
      displayName: 'Existing User',
      bio: 'Test bio',
      doomBalance: 500,
      lifeBalance: 100,
      daysLiving: 30,
      lifePosts: 50,
      isConnected: true,
      following: ['user1', 'user2', 'user3'],
      blocked: ['baduser'],
      muted: ['quietuser'],
    })

    usePostsStore.setState({
      posts: {
        'post-1': {
          id: 'post-1',
          author: { address: null, username: 'testuser' },
          content: 'Test content',
          variant: 'doom',
          createdAt: Date.now(),
          likes: 10,
          replies: 5,
          reposts: 2,
          likedBy: ['user1', 'user2'],
          repostedByUsers: [],
        },
      },
      doomFeed: ['post-1'],
      lifeFeed: [],
    })

    useEventsStore.setState({
      events: {
        'event-1': {
          id: 'event-1',
          title: 'Test Event',
          description: 'Description',
          category: 'technology',
          countdownEnd: Date.now() + 1000000,
          doomStake: 5000,
          lifeStake: 3000,
          status: 'active',
          linkedPosts: [],
          createdAt: Date.now(),
          createdBy: { address: null, username: 'creator' },
        },
      },
      bets: [
        { id: 'bet-1', eventId: 'event-1', userId: 'test-user-id', side: 'doom', amount: 50, createdAt: Date.now() },
      ],
    })

    useBookmarksStore.setState({
      bookmarks: {
        'bm-1': {
          id: 'bm-1',
          postId: 'post-1',
          userId: 'test-user-id',
          createdAt: Date.now(),
        },
      },
      bookmarksByPost: { 'post-1': 'bm-1' },
      collections: {},
      bookmarkOrder: ['bm-1'],
    })

    useStreaksStore.setState({
      currentStreak: 10,
      longestStreak: 15,
      lastActivityDay: Date.now(),
      claimedMilestones: [7],
      totalBonusEarned: 5,
      hasActivityToday: true,
    })

    useToastStore.setState({
      toasts: [
        { id: 'toast-1', message: 'Test toast', type: 'info', duration: 4000, createdAt: Date.now() },
      ],
    })

    useLoadingStore.setState({
      loadingStates: {
        posts: true,
        events: false,
        profile: false,
        leaderboard: false,
        timeline: false,
        postDetail: false,
      },
    })
  })

  describe('Streaks Store Reset', () => {
    it('should reset all streak data', () => {
      expect(useStreaksStore.getState().currentStreak).toBe(10)

      useStreaksStore.getState().resetStreak()

      const state = useStreaksStore.getState()
      expect(state.currentStreak).toBe(0)
      expect(state.longestStreak).toBe(0)
      expect(state.lastActivityDay).toBeNull()
      expect(state.claimedMilestones).toHaveLength(0)
      expect(state.totalBonusEarned).toBe(0)
      expect(state.hasActivityToday).toBe(false)
    })

    it('should allow recording activity after reset', () => {
      useStreaksStore.getState().resetStreak()

      const result = useStreaksStore.getState().recordActivity()

      expect(result.newStreak).toBe(1)
    })
  })

  describe('Toast Store Clear', () => {
    it('should clear all toasts', () => {
      expect(useToastStore.getState().toasts).toHaveLength(1)

      useToastStore.getState().clearToasts()

      expect(useToastStore.getState().toasts).toHaveLength(0)
    })

    it('should allow new toasts after clear', () => {
      useToastStore.getState().clearToasts()

      const toastId = useToastStore.getState().addToast('New toast', 'success')

      expect(useToastStore.getState().toasts).toHaveLength(1)
      expect(toastId).toBeDefined()
    })

    it('should remove individual toasts', () => {
      useToastStore.getState().addToast('Toast 2', 'error', { duration: 0 })
      useToastStore.getState().addToast('Toast 3', 'warning', { duration: 0 })

      expect(useToastStore.getState().toasts.length).toBeGreaterThanOrEqual(2)

      const toasts = useToastStore.getState().toasts
      const firstToastId = toasts[0].id
      useToastStore.getState().removeToast(firstToastId)

      expect(useToastStore.getState().toasts.find((t) => t.id === firstToastId)).toBeUndefined()
    })
  })

  describe('Loading Store Reset', () => {
    it('should stop all loading states', () => {
      useLoadingStore.getState().startLoading('posts')
      useLoadingStore.getState().startLoading('events')
      useLoadingStore.getState().startLoading('profile')

      useLoadingStore.getState().stopLoading('posts')
      useLoadingStore.getState().stopLoading('events')
      useLoadingStore.getState().stopLoading('profile')

      const state = useLoadingStore.getState()
      expect(state.isLoading('posts')).toBe(false)
      expect(state.isLoading('events')).toBe(false)
      expect(state.isLoading('profile')).toBe(false)
    })

    it('should toggle loading states correctly', () => {
      useLoadingStore.getState().setLoading('posts', true)
      expect(useLoadingStore.getState().isLoading('posts')).toBe(true)

      useLoadingStore.getState().setLoading('posts', false)
      expect(useLoadingStore.getState().isLoading('posts')).toBe(false)
    })
  })

  describe('Posts Store Reset', () => {
    it('should clear all posts', () => {
      expect(Object.keys(usePostsStore.getState().posts)).toHaveLength(1)

      usePostsStore.setState({
        posts: {},
        doomFeed: [],
        lifeFeed: [],
      })

      const state = usePostsStore.getState()
      expect(Object.keys(state.posts)).toHaveLength(0)
      expect(state.doomFeed).toHaveLength(0)
      expect(state.lifeFeed).toHaveLength(0)
    })

    it('should allow new posts after reset', () => {
      usePostsStore.setState({
        posts: {},
        doomFeed: [],
        lifeFeed: [],
      })

      const author = { address: null, username: 'newuser' }
      const post = usePostsStore.getState().createPost('New post after reset', 'doom', author)

      expect(usePostsStore.getState().posts[post.id]).toBeDefined()
      expect(usePostsStore.getState().doomFeed).toContain(post.id)
    })
  })

  describe('Events Store Reset', () => {
    it('should clear all events and bets', () => {
      expect(Object.keys(useEventsStore.getState().events)).toHaveLength(1)
      expect(useEventsStore.getState().bets).toHaveLength(1)

      useEventsStore.setState({
        events: {},
        bets: [],
      })

      const state = useEventsStore.getState()
      expect(Object.keys(state.events)).toHaveLength(0)
      expect(state.bets).toHaveLength(0)
    })

    it('should clear only bets while keeping events', () => {
      useEventsStore.setState((state) => ({
        ...state,
        bets: [],
      }))

      const state = useEventsStore.getState()
      expect(Object.keys(state.events)).toHaveLength(1)
      expect(state.bets).toHaveLength(0)
    })
  })

  describe('User Store Reset', () => {
    it('should reset user to anonymous state', () => {
      expect(useUserStore.getState().author.username).toBe('existinguser')
      expect(useUserStore.getState().doomBalance).toBe(500)

      useUserStore.setState({
        userId: 'new-anon-id',
        author: { address: null, username: 'anonymous' },
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

      const state = useUserStore.getState()
      expect(state.author.username).toBe('anonymous')
      expect(state.doomBalance).toBe(100)
      expect(state.isConnected).toBe(false)
      expect(state.following).toHaveLength(0)
    })

    it('should reset only following list', () => {
      expect(useUserStore.getState().following).toHaveLength(3)

      useUserStore.setState({ following: [] })

      expect(useUserStore.getState().following).toHaveLength(0)
      expect(useUserStore.getState().doomBalance).toBe(500)
    })
  })

  describe('Bookmarks Store Reset', () => {
    it('should clear all bookmarks', () => {
      expect(useBookmarksStore.getState().getBookmarkCount()).toBe(1)

      useBookmarksStore.setState({
        bookmarks: {},
        bookmarksByPost: {},
        collections: {},
        bookmarkOrder: [],
      })

      expect(useBookmarksStore.getState().getBookmarkCount()).toBe(0)
    })

    it('should allow new bookmarks after reset', () => {
      useBookmarksStore.setState({
        bookmarks: {},
        bookmarksByPost: {},
        collections: {},
        bookmarkOrder: [],
      })

      const post = usePostsStore.getState().posts['post-1']
      if (post) {
        useBookmarksStore.getState().addBookmark(post.id, 'user1')
        expect(useBookmarksStore.getState().isBookmarked(post.id)).toBe(true)
      }
    })
  })

  describe('Full Application Reset', () => {
    it('should reset all stores for logout scenario', () => {
      useUserStore.setState({
        userId: 'anon-' + Date.now(),
        author: { address: null, username: 'anonymous' },
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
      useToastStore.getState().clearToasts()

      expect(useUserStore.getState().isConnected).toBe(false)
      expect(Object.keys(usePostsStore.getState().posts)).toHaveLength(0)
      expect(Object.keys(useEventsStore.getState().events)).toHaveLength(0)
      expect(useBookmarksStore.getState().getBookmarkCount()).toBe(0)
      expect(useStreaksStore.getState().currentStreak).toBe(0)
      expect(useToastStore.getState().toasts).toHaveLength(0)
    })

    it('should preserve leaderboard data during reset', () => {
      const leaderboard = useLeaderboardStore.getState().getLeaderboard('doomer')

      useUserStore.setState({
        userId: 'anon-' + Date.now(),
        author: { address: null, username: 'anonymous' },
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

      const leaderboardAfter = useLeaderboardStore.getState().getLeaderboard('doomer')
      expect(leaderboardAfter.length).toBe(leaderboard.length)
    })
  })

  describe('Selective State Reset', () => {
    it('should reset balance while keeping profile', () => {
      useUserStore.setState((state) => ({
        ...state,
        doomBalance: 100,
        lifeBalance: 0,
      }))

      const state = useUserStore.getState()
      expect(state.doomBalance).toBe(100)
      expect(state.lifeBalance).toBe(0)
      expect(state.author.username).toBe('existinguser')
    })

    it('should reset likes on a post', () => {
      const postId = 'post-1'
      const post = usePostsStore.getState().posts[postId]

      usePostsStore.setState((state) => ({
        posts: {
          ...state.posts,
          [postId]: {
            ...post,
            likes: 0,
            likedBy: [],
          },
        },
      }))

      const updatedPost = usePostsStore.getState().posts[postId]
      expect(updatedPost.likes).toBe(0)
      expect(updatedPost.likedBy).toHaveLength(0)
      expect(updatedPost.content).toBe('Test content')
    })

    it('should reset event stakes', () => {
      const eventId = 'event-1'

      useEventsStore.setState((state) => ({
        events: {
          ...state.events,
          [eventId]: {
            ...state.events[eventId],
            doomStake: 0,
            lifeStake: 0,
          },
        },
      }))

      const event = useEventsStore.getState().events[eventId]
      expect(event.doomStake).toBe(0)
      expect(event.lifeStake).toBe(0)
      expect(event.title).toBe('Test Event')
    })
  })

  describe('Reset Edge Cases', () => {
    it('should handle resetting already empty stores', () => {
      usePostsStore.setState({ posts: {}, doomFeed: [], lifeFeed: [] })
      usePostsStore.setState({ posts: {}, doomFeed: [], lifeFeed: [] })

      expect(Object.keys(usePostsStore.getState().posts)).toHaveLength(0)
    })

    it('should handle reset during state transitions', () => {
      useUserStore.getState().addDoom(100)
      useUserStore.setState({ doomBalance: 100 })
      useUserStore.getState().addDoom(50)

      expect(useUserStore.getState().doomBalance).toBe(150)
    })
  })
})
