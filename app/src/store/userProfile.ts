/**
 * User Profile Store
 * Issue #62: Implement personalized feed algorithm
 *
 * Zustand store for tracking user behavior for personalized ranking.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserProfile } from '@/lib/ranking'
import { extractTopics } from '@/lib/ranking'

interface UserProfileState {
  /** User profile for ranking */
  profile: UserProfile

  /** Record a post like */
  recordLike: (postId: string, authorUsername: string, content: string) => void

  /** Record a post unlike */
  recordUnlike: (postId: string, authorUsername: string) => void

  /** Record a follow */
  recordFollow: (username: string) => void

  /** Record an unfollow */
  recordUnfollow: (username: string) => void

  /** Record viewing a post */
  recordView: (postId: string) => void

  /** Clear session views */
  clearSessionViews: () => void

  /** Get the current user profile */
  getProfile: () => UserProfile

  /** Reset profile */
  resetProfile: () => void
}

const createEmptyProfile = (): UserProfile => ({
  userId: '',
  likedPosts: [],
  likedAuthors: new Map(),
  followedAuthors: [],
  viewedPosts: new Set(),
  topicInterests: new Map(),
  totalInteractions: 0,
})

// Helper to serialize Map for localStorage
function serializeProfile(profile: UserProfile) {
  return {
    ...profile,
    likedAuthors: Object.fromEntries(profile.likedAuthors),
    viewedPosts: [], // Don't persist session views
    topicInterests: Object.fromEntries(profile.topicInterests),
  }
}

// Helper to deserialize Map from localStorage
function deserializeProfile(data: ReturnType<typeof serializeProfile>): UserProfile {
  return {
    ...data,
    likedAuthors: new Map(Object.entries(data.likedAuthors || {})),
    viewedPosts: new Set(),
    topicInterests: new Map(Object.entries(data.topicInterests || {})),
  }
}

export const useUserProfileStore = create<UserProfileState>()(
  persist(
    (set, get) => ({
      profile: createEmptyProfile(),

      recordLike: (postId: string, authorUsername: string, content: string) => {
        set((state) => {
          const profile = { ...state.profile }

          // Add to liked posts
          if (!profile.likedPosts.includes(postId)) {
            profile.likedPosts = [...profile.likedPosts, postId]
          }

          // Update author affinity
          const newLikedAuthors = new Map(profile.likedAuthors)
          const currentCount = newLikedAuthors.get(authorUsername) || 0
          newLikedAuthors.set(authorUsername, currentCount + 1)
          profile.likedAuthors = newLikedAuthors

          // Update topic interests based on content
          const topics = extractTopics(content)
          const newTopicInterests = new Map(profile.topicInterests)
          topics.forEach((topic) => {
            const currentInterest = newTopicInterests.get(topic) || 0
            // Increase interest, capped at 1
            newTopicInterests.set(topic, Math.min(1, currentInterest + 0.1))
          })
          profile.topicInterests = newTopicInterests

          // Increment total interactions
          profile.totalInteractions += 1

          return { profile }
        })
      },

      recordUnlike: (postId: string, authorUsername: string) => {
        set((state) => {
          const profile = { ...state.profile }

          // Remove from liked posts
          profile.likedPosts = profile.likedPosts.filter((id) => id !== postId)

          // Update author affinity
          const newLikedAuthors = new Map(profile.likedAuthors)
          const currentCount = newLikedAuthors.get(authorUsername) || 0
          if (currentCount > 1) {
            newLikedAuthors.set(authorUsername, currentCount - 1)
          } else {
            newLikedAuthors.delete(authorUsername)
          }
          profile.likedAuthors = newLikedAuthors

          return { profile }
        })
      },

      recordFollow: (username: string) => {
        set((state) => {
          const profile = { ...state.profile }

          if (!profile.followedAuthors.includes(username)) {
            profile.followedAuthors = [...profile.followedAuthors, username]
            profile.totalInteractions += 1
          }

          return { profile }
        })
      },

      recordUnfollow: (username: string) => {
        set((state) => {
          const profile = { ...state.profile }
          profile.followedAuthors = profile.followedAuthors.filter(
            (u) => u !== username
          )
          return { profile }
        })
      },

      recordView: (postId: string) => {
        set((state) => {
          const profile = { ...state.profile }
          const newViewedPosts = new Set(profile.viewedPosts)
          newViewedPosts.add(postId)
          profile.viewedPosts = newViewedPosts
          return { profile }
        })
      },

      clearSessionViews: () => {
        set((state) => ({
          profile: {
            ...state.profile,
            viewedPosts: new Set(),
          },
        }))
      },

      getProfile: () => get().profile,

      resetProfile: () => {
        set({ profile: createEmptyProfile() })
      },
    }),
    {
      name: 'doomsday-user-profile',
      partialize: (state) => ({
        profile: serializeProfile(state.profile),
      }),
      merge: (persisted, current) => ({
        ...current,
        profile: persisted
          ? deserializeProfile(
              (persisted as { profile: ReturnType<typeof serializeProfile> }).profile
            )
          : current.profile,
      }),
    }
  )
)

/**
 * Hook to sync user store follows with profile store
 */
export function useSyncUserProfile() {
  const recordFollow = useUserProfileStore((state) => state.recordFollow)
  const recordUnfollow = useUserProfileStore((state) => state.recordUnfollow)

  return {
    onFollow: recordFollow,
    onUnfollow: recordUnfollow,
  }
}
