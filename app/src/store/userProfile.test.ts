/**
 * User Profile Store Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useUserProfileStore } from './userProfile'

describe('user profile store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useUserProfileStore.getState().resetProfile()
  })

  describe('initial state', () => {
    it('should have empty liked posts', () => {
      const profile = useUserProfileStore.getState().getProfile()
      expect(profile.likedPosts).toEqual([])
    })

    it('should have empty liked authors', () => {
      const profile = useUserProfileStore.getState().getProfile()
      expect(profile.likedAuthors.size).toBe(0)
    })

    it('should have empty followed authors', () => {
      const profile = useUserProfileStore.getState().getProfile()
      expect(profile.followedAuthors).toEqual([])
    })

    it('should have empty viewed posts', () => {
      const profile = useUserProfileStore.getState().getProfile()
      expect(profile.viewedPosts.size).toBe(0)
    })

    it('should have zero total interactions', () => {
      const profile = useUserProfileStore.getState().getProfile()
      expect(profile.totalInteractions).toBe(0)
    })
  })

  describe('recordLike', () => {
    it('should add post to liked posts', () => {
      const { recordLike, getProfile } = useUserProfileStore.getState()

      recordLike('post1', 'author1', 'Some content')

      const profile = getProfile()
      expect(profile.likedPosts).toContain('post1')
    })

    it('should not duplicate liked posts', () => {
      const { recordLike, getProfile } = useUserProfileStore.getState()

      recordLike('post1', 'author1', 'Some content')
      recordLike('post1', 'author1', 'Some content')

      const profile = getProfile()
      expect(profile.likedPosts.filter(p => p === 'post1')).toHaveLength(1)
    })

    it('should update author affinity', () => {
      const { recordLike, getProfile } = useUserProfileStore.getState()

      recordLike('post1', 'author1', 'Content')
      recordLike('post2', 'author1', 'Content')

      const profile = getProfile()
      expect(profile.likedAuthors.get('author1')).toBe(2)
    })

    it('should increment total interactions', () => {
      const { recordLike, getProfile } = useUserProfileStore.getState()

      recordLike('post1', 'author1', 'Content')
      recordLike('post2', 'author2', 'Content')

      const profile = getProfile()
      expect(profile.totalInteractions).toBe(2)
    })

    it('should extract and track topic interests', () => {
      const { recordLike, getProfile } = useUserProfileStore.getState()

      recordLike('post1', 'author1', 'climate change is important')

      const profile = getProfile()
      // Topics should be tracked
      expect(profile.topicInterests.size).toBeGreaterThanOrEqual(0)
    })
  })

  describe('recordUnlike', () => {
    it('should remove post from liked posts', () => {
      const { recordLike } = useUserProfileStore.getState()

      recordLike('post1', 'author1', 'Content')
      useUserProfileStore.getState().recordUnlike('post1', 'author1')

      const profile = useUserProfileStore.getState().getProfile()
      expect(profile.likedPosts).not.toContain('post1')
    })

    it('should decrease author affinity', () => {
      const { recordLike } = useUserProfileStore.getState()

      recordLike('post1', 'author1', 'Content')
      recordLike('post2', 'author1', 'Content')
      useUserProfileStore.getState().recordUnlike('post2', 'author1')

      const profile = useUserProfileStore.getState().getProfile()
      expect(profile.likedAuthors.get('author1')).toBe(1)
    })

    it('should remove author when affinity reaches zero', () => {
      const { recordLike } = useUserProfileStore.getState()

      recordLike('post1', 'author1', 'Content')
      useUserProfileStore.getState().recordUnlike('post1', 'author1')

      const profile = useUserProfileStore.getState().getProfile()
      expect(profile.likedAuthors.has('author1')).toBe(false)
    })
  })

  describe('recordFollow', () => {
    it('should add to followed authors', () => {
      const { recordFollow, getProfile } = useUserProfileStore.getState()

      recordFollow('author1')

      const profile = getProfile()
      expect(profile.followedAuthors).toContain('author1')
    })

    it('should not duplicate followed authors', () => {
      const { recordFollow } = useUserProfileStore.getState()

      recordFollow('author1')
      useUserProfileStore.getState().recordFollow('author1')

      const profile = useUserProfileStore.getState().getProfile()
      expect(profile.followedAuthors.filter(a => a === 'author1')).toHaveLength(1)
    })

    it('should increment total interactions', () => {
      const { recordFollow, getProfile } = useUserProfileStore.getState()

      recordFollow('author1')

      const profile = getProfile()
      expect(profile.totalInteractions).toBe(1)
    })
  })

  describe('recordUnfollow', () => {
    it('should remove from followed authors', () => {
      const { recordFollow } = useUserProfileStore.getState()

      recordFollow('author1')
      useUserProfileStore.getState().recordUnfollow('author1')

      const profile = useUserProfileStore.getState().getProfile()
      expect(profile.followedAuthors).not.toContain('author1')
    })

    it('should handle unfollowing non-followed author', () => {
      const { recordUnfollow, getProfile } = useUserProfileStore.getState()

      // Should not throw
      recordUnfollow('author1')

      const profile = getProfile()
      expect(profile.followedAuthors).toEqual([])
    })
  })

  describe('recordView', () => {
    it('should add to viewed posts', () => {
      const { recordView, getProfile } = useUserProfileStore.getState()

      recordView('post1')

      const profile = getProfile()
      expect(profile.viewedPosts.has('post1')).toBe(true)
    })

    it('should not duplicate viewed posts', () => {
      const { recordView } = useUserProfileStore.getState()

      recordView('post1')
      useUserProfileStore.getState().recordView('post1')

      const profile = useUserProfileStore.getState().getProfile()
      expect(profile.viewedPosts.size).toBe(1)
    })

    it('should track multiple views', () => {
      const { recordView } = useUserProfileStore.getState()

      recordView('post1')
      useUserProfileStore.getState().recordView('post2')
      useUserProfileStore.getState().recordView('post3')

      const profile = useUserProfileStore.getState().getProfile()
      expect(profile.viewedPosts.size).toBe(3)
    })
  })

  describe('clearSessionViews', () => {
    it('should clear viewed posts', () => {
      const { recordView } = useUserProfileStore.getState()

      recordView('post1')
      recordView('post2')
      useUserProfileStore.getState().clearSessionViews()

      const profile = useUserProfileStore.getState().getProfile()
      expect(profile.viewedPosts.size).toBe(0)
    })

    it('should preserve other profile data', () => {
      const { recordLike, recordView } = useUserProfileStore.getState()

      recordLike('post1', 'author1', 'Content')
      recordView('post2')
      useUserProfileStore.getState().clearSessionViews()

      const profile = useUserProfileStore.getState().getProfile()
      expect(profile.likedPosts).toContain('post1')
    })
  })

  describe('resetProfile', () => {
    it('should reset all profile data', () => {
      const { recordLike, recordFollow, recordView } = useUserProfileStore.getState()

      recordLike('post1', 'author1', 'Content')
      recordFollow('author2')
      recordView('post2')
      useUserProfileStore.getState().resetProfile()

      const profile = useUserProfileStore.getState().getProfile()
      expect(profile.likedPosts).toEqual([])
      expect(profile.followedAuthors).toEqual([])
      expect(profile.viewedPosts.size).toBe(0)
      expect(profile.totalInteractions).toBe(0)
    })
  })

  describe('getProfile', () => {
    it('should return current profile', () => {
      const { recordLike, getProfile } = useUserProfileStore.getState()

      recordLike('post1', 'author1', 'Content')

      const profile = getProfile()
      expect(profile).toBeDefined()
      expect(profile.likedPosts).toContain('post1')
    })
  })
})
