/**
 * User Store
 *
 * Zustand store for managing current user state.
 * Wallet-first identity: wallet address IS the identity.
 * Handles:
 * - Wallet-based authentication
 * - User profile management
 * - Life posting cost calculation
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Author, ID } from '@/types'
import {
  authenticateWallet as apiAuthenticateWallet,
  fetchUserProfile,
  type AuthUser,
} from '@/lib/api/auth'

interface UserState {
  // Identity - wallet is primary
  walletAddress: string | null
  userId: ID
  token: string | null

  // Profile from backend
  username: string
  displayName: string
  bio: string
  avatarUrl: string | null
  verified: boolean

  // Stats (backend persisted)
  daysLiving: number
  lifePosts: number

  // Legacy balances (kept for compatibility with existing components)
  // Note: Real on-chain balances should be fetched via useTokenBalance hook
  doomBalance: number
  lifeBalance: number

  // Legacy author object for compatibility
  author: Author

  // Auth state
  isAuthenticated: boolean
  isLoading: boolean
  authError: string | null

  // Social features
  isConnected: boolean
  following: string[]
  blocked: string[]
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

  // Auth actions
  /** Authenticate with wallet address */
  authenticateWithWallet: (address: string) => Promise<void>
  /** Logout and clear all auth state */
  logout: () => void
  /** Restore session from stored token */
  restoreSession: () => Promise<void>

  // Profile actions
  /** Update username */
  setUsername: (username: string) => void
  /** Increment life post count */
  incrementLifePosts: () => void
  /** Set connected wallet */
  setConnected: (connected: boolean) => void
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
  setUser: (user: AuthUser) => void
  /** Get current user object for DMs */
  getUser: () => { id: string; username: string; displayName: string | null; avatarUrl: string | null; verified: boolean } | null

  // Legacy balance actions (kept for compatibility)
  /** Add $DOOM tokens (legacy - use wallet store for real balances) */
  addDoom: (amount: number) => void
  /** Spend $DOOM tokens (legacy - use wallet store for real balances) */
  spendDoom: (amount: number) => boolean
  /** Donate $LIFE to another user (costs $DOOM) - legacy */
  donateLife: (amount: number) => boolean
  /** Add $LIFE tokens (legacy - use wallet store for real balances) */
  addLife: (amount: number) => void
}

/** Generate anonymous user ID for unauthenticated users */
const generateAnonId = (): ID => `anon_${Math.random().toString(36).substring(2, 8)}`

const initialState = {
  walletAddress: null,
  userId: generateAnonId(),
  token: null,
  username: 'anonymous',
  displayName: '',
  bio: '',
  avatarUrl: null,
  verified: false,
  daysLiving: 0,
  lifePosts: 0,
  doomBalance: 100, // Legacy mock balance for compatibility
  lifeBalance: 0,   // Legacy mock balance for compatibility
  author: {
    address: null,
    username: 'anonymous',
  },
  isAuthenticated: false,
  isLoading: false,
  authError: null,
  isConnected: false,
  following: [],
  blocked: [],
  muted: [],
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      ...initialState,

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

      authenticateWithWallet: async (address: string) => {
        // Don't re-authenticate if already authenticated with same wallet
        const currentState = get()
        if (currentState.isAuthenticated && currentState.walletAddress === address) {
          return
        }

        set({ isLoading: true, authError: null })

        try {
          const { user, token } = await apiAuthenticateWallet(address)

          set({
            walletAddress: user.walletAddress,
            userId: user.id,
            token,
            username: user.username,
            displayName: user.displayName || '',
            bio: user.bio || '',
            avatarUrl: user.avatarUrl,
            verified: user.verified,
            daysLiving: user.daysLiving,
            lifePosts: user.lifePosts,
            author: {
              address: user.walletAddress,
              username: user.username,
              verified: user.verified,
            },
            isAuthenticated: true,
            isLoading: false,
            authError: null,
            isConnected: true,
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Authentication failed'
          set({
            isLoading: false,
            authError: errorMessage,
          })
          throw error
        }
      },

      logout: () => {
        set({
          ...initialState,
          userId: generateAnonId(), // Generate new anon ID on logout
          // Preserve social preferences
          following: get().following,
          blocked: get().blocked,
          muted: get().muted,
        })
      },

      restoreSession: async () => {
        const { token } = get()
        if (!token) return

        set({ isLoading: true })

        try {
          const { user } = await fetchUserProfile(token)

          set({
            walletAddress: user.walletAddress,
            userId: user.id,
            username: user.username,
            displayName: user.displayName || '',
            bio: user.bio || '',
            avatarUrl: user.avatarUrl,
            verified: user.verified,
            daysLiving: user.daysLiving,
            lifePosts: user.lifePosts,
            author: {
              address: user.walletAddress,
              username: user.username,
              verified: user.verified,
            },
            isAuthenticated: true,
            isLoading: false,
          })
        } catch {
          // Token invalid, clear it
          set({
            token: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
      },

      setUsername: (username) => {
        set((state) => ({
          username,
          author: { ...state.author, username },
        }))
      },

      incrementLifePosts: () => {
        set((state) => ({
          lifePosts: state.lifePosts + 1,
        }))
      },

      setConnected: (connected) => {
        set({ isConnected: connected })
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
          walletAddress: user.walletAddress,
          userId: user.id,
          username: user.username,
          displayName: user.displayName || '',
          bio: user.bio || '',
          avatarUrl: user.avatarUrl,
          verified: user.verified,
          daysLiving: user.daysLiving,
          lifePosts: user.lifePosts,
          author: {
            address: user.walletAddress,
            username: user.username,
            verified: user.verified,
          },
        })
      },

      getUser: () => {
        const state = get()
        if (!state.isAuthenticated) {
          return null
        }
        return {
          id: state.userId,
          username: state.username,
          displayName: state.displayName || null,
          avatarUrl: state.avatarUrl,
          verified: state.verified,
        }
      },

      // Legacy balance actions for compatibility
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
    }),
    {
      name: 'doomsday-user',
      partialize: (state) => ({
        // Persist auth state
        walletAddress: state.walletAddress,
        userId: state.userId,
        token: state.token,
        username: state.username,
        displayName: state.displayName,
        bio: state.bio,
        avatarUrl: state.avatarUrl,
        verified: state.verified,
        daysLiving: state.daysLiving,
        lifePosts: state.lifePosts,
        isAuthenticated: state.isAuthenticated,
        // Persist legacy balances for compatibility
        doomBalance: state.doomBalance,
        lifeBalance: state.lifeBalance,
        // Persist social preferences
        following: state.following,
        blocked: state.blocked,
        muted: state.muted,
      }),
    }
  )
)
