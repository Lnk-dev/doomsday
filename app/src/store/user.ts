/**
 * User Store
 *
 * Zustand store for managing current user state.
 * Handles:
 * - Anonymous user creation
 * - User profile management
 * - Token balances (mock for now)
 * - Life posting cost calculation
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Author, ID } from '@/types'

/** Generate anonymous user ID */
const generateAnonId = (): ID => `anon_${Math.random().toString(36).substring(2, 8)}`

interface UserState {
  /** Current user ID (local identifier) */
  userId: ID
  /** JWT auth token for API requests */
  token: string | null
  /** User's display author info */
  author: Author
  /** User's display name */
  displayName: string
  /** User's bio */
  bio: string
  /** User's avatar URL */
  avatarUrl: string | null
  /** $DOOM token balance */
  doomBalance: number
  /** $LIFE token balance */
  lifeBalance: number
  /** Days with consecutive life posts */
  daysLiving: number
  /** Total life posts made */
  lifePosts: number
  /** Is wallet connected */
  isConnected: boolean
  /** List of followed usernames */
  following: string[]
  /** List of blocked usernames */
  blocked: string[]
  /** List of muted usernames */
  muted: string[]

  // Computed
  /** Calculate cost of next life post */
  getLifePostCost: () => number
  /** Check if following a user */
  isFollowing: (username: string) => boolean
  /** Check if user is blocked */
  isBlocked: (username: string) => boolean
  /** Check if user is muted */
  isMuted: (username: string) => boolean
  /** Check if content should be hidden (blocked or muted) */
  isHidden: (username: string) => boolean

  // Actions
  /** Update username */
  setUsername: (username: string) => void
  /** Add $DOOM tokens */
  addDoom: (amount: number) => void
  /** Spend $DOOM tokens */
  spendDoom: (amount: number) => boolean
  /** Increment life post count */
  incrementLifePosts: () => void
  /** Set connected wallet */
  setConnected: (connected: boolean) => void
  /** Donate $LIFE to another user (costs $DOOM) */
  donateLife: (amount: number) => boolean
  /** Add $LIFE tokens */
  addLife: (amount: number) => void
  /** Follow a user */
  followUser: (username: string) => void
  /** Unfollow a user */
  unfollowUser: (username: string) => void
  /** Update user profile */
  updateProfile: (updates: { displayName?: string; bio?: string; avatar?: string }) => void
  /** Block a user */
  blockUser: (username: string) => void
  /** Unblock a user */
  unblockUser: (username: string) => void
  /** Mute a user */
  muteUser: (username: string) => void
  /** Unmute a user */
  unmuteUser: (username: string) => void
  /** Set auth token */
  setToken: (token: string | null) => void
  /** Set user from API response */
  setUser: (user: { id: string; username: string; displayName?: string; avatarUrl?: string; doomBalance?: number }) => void
  /** Get current user object for DMs */
  getUser: () => { id: string; username: string; displayName: string | null; avatarUrl: string | null; verified: boolean } | null
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      userId: generateAnonId(),
      token: null,
      author: {
        address: null,
        username: 'anonymous',
      },
      displayName: '',
      bio: '',
      avatarUrl: null,
      doomBalance: 100, // Start with some tokens for testing
      lifeBalance: 0,
      daysLiving: 0,
      lifePosts: 0,
      isConnected: false,
      following: [],
      blocked: [],
      muted: [],

      getLifePostCost: () => {
        const { lifePosts, daysLiving } = get()
        // Cost increases with post history
        // Base cost: 1 $DOOM, +1 for each day of life
        return Math.max(1, daysLiving + 1) + Math.floor(lifePosts / 10)
      },

      isFollowing: (username) => {
        return get().following.includes(username)
      },

      isBlocked: (username) => {
        return get().blocked.includes(username)
      },

      isMuted: (username) => {
        return get().muted.includes(username)
      },

      isHidden: (username) => {
        const state = get()
        return state.blocked.includes(username) || state.muted.includes(username)
      },

      setUsername: (username) => {
        set((state) => ({
          author: { ...state.author, username },
        }))
      },

      addDoom: (amount) => {
        set((state) => ({
          doomBalance: state.doomBalance + amount,
        }))
      },

      spendDoom: (amount) => {
        const { doomBalance } = get()
        if (doomBalance < amount) return false

        set((state) => ({
          doomBalance: state.doomBalance - amount,
        }))
        return true
      },

      incrementLifePosts: () => {
        set((state) => ({
          lifePosts: state.lifePosts + 1,
        }))
      },

      setConnected: (connected) => {
        set({ isConnected: connected })
      },

      donateLife: (amount) => {
        const { doomBalance } = get()
        // Cost: 1 $DOOM per $LIFE donated
        if (doomBalance < amount) return false

        set((state) => ({
          doomBalance: state.doomBalance - amount,
        }))
        return true
      },

      addLife: (amount) => {
        set((state) => ({
          lifeBalance: state.lifeBalance + amount,
        }))
      },

      followUser: (username) => {
        set((state) => ({
          following: state.following.includes(username)
            ? state.following
            : [...state.following, username],
        }))
      },

      unfollowUser: (username) => {
        set((state) => ({
          following: state.following.filter((u) => u !== username),
        }))
      },

      updateProfile: (updates) => {
        set((state) => ({
          displayName: updates.displayName !== undefined ? updates.displayName : state.displayName,
          bio: updates.bio !== undefined ? updates.bio : state.bio,
          author: updates.avatar !== undefined
            ? { ...state.author, avatar: updates.avatar }
            : state.author,
        }))
      },

      blockUser: (username) => {
        set((state) => ({
          blocked: state.blocked.includes(username)
            ? state.blocked
            : [...state.blocked, username],
          // Also unfollow if following
          following: state.following.filter((u) => u !== username),
        }))
      },

      unblockUser: (username) => {
        set((state) => ({
          blocked: state.blocked.filter((u) => u !== username),
        }))
      },

      muteUser: (username) => {
        set((state) => ({
          muted: state.muted.includes(username)
            ? state.muted
            : [...state.muted, username],
        }))
      },

      unmuteUser: (username) => {
        set((state) => ({
          muted: state.muted.filter((u) => u !== username),
        }))
      },

      setToken: (token) => set({ token }),

      setUser: (user) => {
        set({
          userId: user.id,
          author: { address: null, username: user.username },
          displayName: user.displayName || '',
          avatarUrl: user.avatarUrl || null,
          doomBalance: user.doomBalance ?? 100,
        })
      },

      getUser: () => {
        const state = get()
        if (!state.isConnected && state.author.username === 'anonymous') {
          return null
        }
        return {
          id: state.userId,
          username: state.author.username,
          displayName: state.displayName || null,
          avatarUrl: state.avatarUrl,
          verified: state.author.verified ?? false,
        }
      },
    }),
    {
      name: 'doomsday-user',
    }
  )
)
