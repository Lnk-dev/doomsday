/**
 * User Store + Posts Store Integration Tests
 *
 * Tests interactions between user state management and post creation.
 * Covers:
 * - Life post creation costs $DOOM tokens
 * - Life post creation increments user stats
 * - Insufficient balance prevents post creation
 * - Post cost increases with user history
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useUserStore } from './user'
import { usePostsStore } from './posts'

describe('User Store + Posts Store Integration', () => {
  beforeEach(() => {
    // Reset both stores to initial state
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
  })

  describe('Life Post Creation Flow', () => {
    it('should cost $DOOM to create a life post', () => {
      const userStore = useUserStore.getState()
      const postsStore = usePostsStore.getState()
      const author = userStore.author

      const cost = userStore.getLifePostCost()
      const initialBalance = userStore.doomBalance

      const canAfford = userStore.spendDoom(cost)
      expect(canAfford).toBe(true)

      if (canAfford) {
        postsStore.createPost('Living my best life!', 'life', author)
        useUserStore.getState().incrementLifePosts()
      }

      const finalState = useUserStore.getState()
      expect(finalState.doomBalance).toBe(initialBalance - cost)
      expect(finalState.lifePosts).toBe(1)
    })

    it('should prevent life post creation when insufficient $DOOM', () => {
      useUserStore.setState({ doomBalance: 0 })

      const userStore = useUserStore.getState()
      const cost = userStore.getLifePostCost()
      const canAfford = userStore.spendDoom(cost)

      expect(canAfford).toBe(false)
      expect(useUserStore.getState().doomBalance).toBe(0)
      expect(usePostsStore.getState().lifeFeed).toHaveLength(0)
    })

    it('should increase life post cost with history', () => {
      const author = useUserStore.getState().author
      const initialCost = useUserStore.getState().getLifePostCost()
      expect(initialCost).toBe(1)

      for (let i = 0; i < 10; i++) {
        const currentStore = useUserStore.getState()
        const cost = currentStore.getLifePostCost()
        if (currentStore.spendDoom(cost)) {
          usePostsStore.getState().createPost(`Life post ${i + 1}`, 'life', author)
          useUserStore.getState().incrementLifePosts()
        }
      }

      const finalCost = useUserStore.getState().getLifePostCost()
      expect(finalCost).toBeGreaterThan(initialCost)
    })

    it('should not charge for doom posts', () => {
      const userStore = useUserStore.getState()
      const author = userStore.author
      const initialBalance = userStore.doomBalance

      usePostsStore.getState().createPost('The end is near!', 'doom', author)

      expect(useUserStore.getState().doomBalance).toBe(initialBalance)
    })

    it('should track life posts separately from doom posts', () => {
      const author = useUserStore.getState().author

      usePostsStore.getState().createPost('Doom post 1', 'doom', author)
      usePostsStore.getState().createPost('Doom post 2', 'doom', author)
      expect(useUserStore.getState().lifePosts).toBe(0)

      const cost = useUserStore.getState().getLifePostCost()
      if (useUserStore.getState().spendDoom(cost)) {
        usePostsStore.getState().createPost('Life post 1', 'life', author)
        useUserStore.getState().incrementLifePosts()
      }

      expect(useUserStore.getState().lifePosts).toBe(1)

      const postsState = usePostsStore.getState()
      expect(postsState.doomFeed).toHaveLength(2)
      expect(postsState.lifeFeed).toHaveLength(1)
    })
  })

  describe('Post Interactions with User State', () => {
    it('should allow liking posts from any user', () => {
      const author = { address: null, username: 'otheruser' }
      const post = usePostsStore.getState().createPost('Test post', 'doom', author)

      const userId = useUserStore.getState().userId
      usePostsStore.getState().likePost(post.id, userId)

      const updatedPost = usePostsStore.getState().posts[post.id]
      expect(updatedPost.likes).toBe(1)
      expect(updatedPost.likedBy).toContain(userId)
    })

    it('should track posts from followed users', () => {
      const userStore = useUserStore.getState()

      userStore.followUser('doomprophet')
      expect(useUserStore.getState().isFollowing('doomprophet')).toBe(true)

      const followedAuthor = { address: null, username: 'doomprophet' }
      const post = usePostsStore.getState().createPost('Doom is coming!', 'doom', followedAuthor)

      expect(usePostsStore.getState().getPost(post.id)).toBeDefined()
      expect(useUserStore.getState().isFollowing(post.author.username)).toBe(true)
    })

    it('should handle multiple users liking the same post', () => {
      const author = { address: null, username: 'poster' }
      const post = usePostsStore.getState().createPost('Popular post', 'doom', author)

      const users = ['user-1', 'user-2', 'user-3', 'user-4', 'user-5']
      users.forEach((userId) => {
        usePostsStore.getState().likePost(post.id, userId)
      })

      const updatedPost = usePostsStore.getState().posts[post.id]
      expect(updatedPost.likes).toBe(5)
      expect(updatedPost.likedBy).toHaveLength(5)
    })

    it('should hide posts from blocked users', () => {
      const userStore = useUserStore.getState()

      userStore.blockUser('toxicuser')
      expect(useUserStore.getState().isBlocked('toxicuser')).toBe(true)
      expect(useUserStore.getState().isHidden('toxicuser')).toBe(true)

      const blockedAuthor = { address: null, username: 'toxicuser' }
      const post = usePostsStore.getState().createPost('You wont see this', 'doom', blockedAuthor)

      expect(usePostsStore.getState().getPost(post.id)).toBeDefined()
      expect(useUserStore.getState().isHidden(post.author.username)).toBe(true)
    })

    it('should hide posts from muted users', () => {
      useUserStore.getState().muteUser('quietuser')

      expect(useUserStore.getState().isMuted('quietuser')).toBe(true)
      expect(useUserStore.getState().isHidden('quietuser')).toBe(true)
    })
  })

  describe('User Stats Across Sessions', () => {
    it('should maintain cost calculation with accumulated stats', () => {
      useUserStore.setState({
        userId: 'returning-user',
        author: { address: null, username: 'veteran' },
        displayName: '',
        bio: '',
        doomBalance: 500,
        lifeBalance: 50,
        daysLiving: 30,
        lifePosts: 100,
        isConnected: false,
        following: [],
        blocked: [],
        muted: [],
      })

      const cost = useUserStore.getState().getLifePostCost()
      expect(cost).toBe(41)
    })

    it('should correctly calculate cost at tier boundaries', () => {
      useUserStore.setState({ daysLiving: 0, lifePosts: 10 })
      expect(useUserStore.getState().getLifePostCost()).toBe(2)

      useUserStore.setState({ lifePosts: 20 })
      expect(useUserStore.getState().getLifePostCost()).toBe(3)

      useUserStore.setState({ daysLiving: 5, lifePosts: 15 })
      expect(useUserStore.getState().getLifePostCost()).toBe(7)
    })
  })

  describe('Concurrent Operations', () => {
    it('should handle rapid post creation correctly', () => {
      const author = useUserStore.getState().author

      const posts = []
      for (let i = 0; i < 10; i++) {
        posts.push(usePostsStore.getState().createPost(`Post ${i}`, 'doom', author))
      }

      const state = usePostsStore.getState()
      expect(state.doomFeed).toHaveLength(10)
      expect(Object.keys(state.posts)).toHaveLength(10)

      expect(state.doomFeed[0]).toBe(posts[9].id)
      expect(state.doomFeed[9]).toBe(posts[0].id)
    })

    it('should handle rapid balance changes correctly', () => {
      useUserStore.setState({ doomBalance: 1000 })

      for (let i = 0; i < 20; i++) {
        useUserStore.getState().spendDoom(10)
        useUserStore.getState().addDoom(5)
      }

      expect(useUserStore.getState().doomBalance).toBe(900)
    })
  })
})
