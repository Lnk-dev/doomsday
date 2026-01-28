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
  /** User's display author info */
  author: Author
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

  // Computed
  /** Calculate cost of next life post */
  getLifePostCost: () => number

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
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      userId: generateAnonId(),
      author: {
        address: null,
        username: 'anonymous',
      },
      doomBalance: 100, // Start with some tokens for testing
      lifeBalance: 0,
      daysLiving: 0,
      lifePosts: 0,
      isConnected: false,

      getLifePostCost: () => {
        const { lifePosts, daysLiving } = get()
        // Cost increases with post history
        // Base cost: 1 $DOOM, +1 for each day of life
        return Math.max(1, daysLiving + 1) + Math.floor(lifePosts / 10)
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
    }),
    {
      name: 'doomsday-user',
    }
  )
)
