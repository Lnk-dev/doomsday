/**
 * Analytics Store
 * Issue #57: Add analytics dashboard for users
 *
 * Zustand store for tracking analytics state and transaction history.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TokenTransaction, ID } from '@/types'
import type { TimeRange } from '@/lib/analytics'

interface AnalyticsState {
  /** Time range filter for all analytics */
  timeRange: TimeRange
  /** Token transaction history */
  transactions: TokenTransaction[]
  /** Follower count history */
  followerHistory: { date: string; count: number }[]

  // Actions
  setTimeRange: (range: TimeRange) => void
  addTransaction: (
    transaction: Omit<TokenTransaction, 'id' | 'createdAt'>
  ) => void
  recordFollowerChange: (count: number) => void
  getTransactions: () => TokenTransaction[]
  clearTransactions: () => void
}

const generateId = (): ID => Math.random().toString(36).substring(2, 15)

export const useAnalyticsStore = create<AnalyticsState>()(
  persist(
    (set, get) => ({
      timeRange: '30d',
      transactions: [],
      followerHistory: [],

      setTimeRange: (range) => set({ timeRange: range }),

      addTransaction: (transaction) => {
        const fullTransaction: TokenTransaction = {
          ...transaction,
          id: generateId(),
          createdAt: Date.now(),
        }
        set((state) => ({
          transactions: [...state.transactions, fullTransaction],
        }))
      },

      recordFollowerChange: (count) => {
        const date = new Date().toISOString().split('T')[0]
        set((state) => {
          const existing = state.followerHistory.find((h) => h.date === date)
          if (existing) {
            return {
              followerHistory: state.followerHistory.map((h) =>
                h.date === date ? { ...h, count } : h
              ),
            }
          }
          return {
            followerHistory: [...state.followerHistory, { date, count }],
          }
        })
      },

      getTransactions: () => get().transactions,

      clearTransactions: () => set({ transactions: [] }),
    }),
    {
      name: 'doomsday-analytics',
    }
  )
)

/**
 * Hook to record a transaction when tokens are earned/spent
 */
export function useRecordTransaction() {
  const addTransaction = useAnalyticsStore((state) => state.addTransaction)

  return {
    recordEarn: (
      tokenType: 'doom' | 'life',
      amount: number,
      source: TokenTransaction['source'],
      description: string
    ) => {
      addTransaction({
        type: 'earn',
        tokenType,
        amount,
        source,
        description,
      })
    },
    recordSpend: (
      tokenType: 'doom' | 'life',
      amount: number,
      source: TokenTransaction['source'],
      description: string
    ) => {
      addTransaction({
        type: 'spend',
        tokenType,
        amount,
        source,
        description,
      })
    },
  }
}
