/**
 * Creator Store
 * Issue #117: Build creator monetization dashboard UI
 *
 * Zustand store for managing creator earnings and withdrawal state.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { EarningsHistoryEntry, CreatorStats } from '@/lib/creatorStats'

/** Withdrawal request status */
export type WithdrawalStatus = 'pending' | 'processing' | 'completed' | 'failed'

/** Withdrawal history entry */
export interface WithdrawalEntry {
  id: string
  amount: number
  status: WithdrawalStatus
  requestedAt: number
  completedAt?: number
  walletAddress: string
  transactionId?: string
}

interface CreatorState {
  // Earnings data
  totalEarnings: number
  pendingPayouts: number
  earningsHistory: EarningsHistoryEntry[]

  // Withdrawal data
  withdrawalHistory: WithdrawalEntry[]
  minimumWithdrawal: number

  // Stats
  followers: number
  totalPosts: number
  totalViews: number
  totalLikes: number
  totalComments: number

  // Actions
  addEarnings: (entry: EarningsHistoryEntry) => void
  requestWithdrawal: (amount: number, walletAddress: string) => WithdrawalEntry | null
  updateWithdrawalStatus: (id: string, status: WithdrawalStatus, transactionId?: string) => void
  getEarningsHistory: (limit?: number) => EarningsHistoryEntry[]
  getWithdrawalHistory: (limit?: number) => WithdrawalEntry[]
  getStats: () => CreatorStats
  setStats: (stats: Partial<Pick<CreatorState, 'followers' | 'totalPosts' | 'totalViews' | 'totalLikes' | 'totalComments'>>) => void
  reset: () => void
}

const initialState = {
  totalEarnings: 0,
  pendingPayouts: 0,
  earningsHistory: [] as EarningsHistoryEntry[],
  withdrawalHistory: [] as WithdrawalEntry[],
  minimumWithdrawal: 10,
  followers: 0,
  totalPosts: 0,
  totalViews: 0,
  totalLikes: 0,
  totalComments: 0,
}

/**
 * Generate unique ID for withdrawals
 */
function generateWithdrawalId(): string {
  return `wd_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

export const useCreatorStore = create<CreatorState>()(
  persist(
    (set, get) => ({
      ...initialState,

      addEarnings: (entry) => {
        set((state) => ({
          earningsHistory: [entry, ...state.earningsHistory].slice(0, 1000), // Keep last 1000 entries
          totalEarnings: state.totalEarnings + entry.amount,
          pendingPayouts: state.pendingPayouts + entry.amount,
        }))
      },

      requestWithdrawal: (amount, walletAddress) => {
        const state = get()

        // Validate withdrawal
        if (amount < state.minimumWithdrawal) {
          return null
        }
        if (amount > state.pendingPayouts) {
          return null
        }

        const withdrawal: WithdrawalEntry = {
          id: generateWithdrawalId(),
          amount,
          status: 'pending',
          requestedAt: Date.now(),
          walletAddress,
        }

        set((state) => ({
          withdrawalHistory: [withdrawal, ...state.withdrawalHistory].slice(0, 100), // Keep last 100
          pendingPayouts: state.pendingPayouts - amount,
        }))

        return withdrawal
      },

      updateWithdrawalStatus: (id, status, transactionId) => {
        set((state) => {
          const index = state.withdrawalHistory.findIndex((w) => w.id === id)
          if (index === -1) return state

          const updated = [...state.withdrawalHistory]
          updated[index] = {
            ...updated[index],
            status,
            transactionId,
            completedAt: status === 'completed' ? Date.now() : updated[index].completedAt,
          }

          // If withdrawal failed, restore pending payouts
          let pendingPayouts = state.pendingPayouts
          if (status === 'failed' && state.withdrawalHistory[index].status !== 'failed') {
            pendingPayouts += state.withdrawalHistory[index].amount
          }

          return {
            withdrawalHistory: updated,
            pendingPayouts,
          }
        })
      },

      getEarningsHistory: (limit = 50) => {
        return get().earningsHistory.slice(0, limit)
      },

      getWithdrawalHistory: (limit = 20) => {
        return get().withdrawalHistory.slice(0, limit)
      },

      getStats: () => {
        const state = get()
        const { calculateEngagementRate } = require('@/lib/creatorStats')

        // Calculate monthly earnings
        const now = new Date()
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
        const monthlyEarnings = state.earningsHistory
          .filter((e) => new Date(e.date).getTime() >= monthStart)
          .reduce((sum, e) => sum + e.amount, 0)

        return {
          totalEarnings: state.totalEarnings,
          monthlyEarnings,
          followers: state.followers,
          posts: state.totalPosts,
          engagementRate: calculateEngagementRate(state.totalLikes, state.totalComments, state.totalViews),
        }
      },

      setStats: (stats) => {
        set((state) => ({
          ...state,
          ...stats,
        }))
      },

      reset: () => set(initialState),
    }),
    {
      name: 'doomsday-creator',
      partialize: (state) => ({
        totalEarnings: state.totalEarnings,
        pendingPayouts: state.pendingPayouts,
        earningsHistory: state.earningsHistory.slice(0, 100), // Persist last 100
        withdrawalHistory: state.withdrawalHistory.slice(0, 50), // Persist last 50
        followers: state.followers,
        totalPosts: state.totalPosts,
        totalViews: state.totalViews,
        totalLikes: state.totalLikes,
        totalComments: state.totalComments,
      }),
    }
  )
)

/**
 * Hook to get creator stats with calculated values
 */
export function useCreatorStats(): CreatorStats {
  return useCreatorStore((state) => state.getStats())
}

/**
 * Hook to get pending payout amount
 */
export function usePendingPayouts(): number {
  return useCreatorStore((state) => state.pendingPayouts)
}

/**
 * Hook to get recent earnings
 */
export function useRecentEarnings(limit = 10): EarningsHistoryEntry[] {
  return useCreatorStore((state) => state.earningsHistory.slice(0, limit))
}
