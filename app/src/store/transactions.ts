/**
 * Transaction Store
 * Issue #101: Transaction retry and error handling system
 *
 * Zustand store for tracking transaction history and status.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TransactionStatus } from '@/lib/solana/transaction'
import type { SolanaError } from '@/lib/solana/errors'

export interface TrackedTransaction {
  id: string
  signature?: string
  status: TransactionStatus
  type: 'transfer' | 'stake' | 'unstake' | 'swap' | 'bet' | 'other'
  description: string
  error?: SolanaError
  createdAt: number
  updatedAt: number
}

interface TransactionState {
  transactions: TrackedTransaction[]
  pendingCount: number

  // Actions
  addTransaction: (tx: Omit<TrackedTransaction, 'createdAt' | 'updatedAt'>) => void
  updateTransaction: (id: string, updates: Partial<TrackedTransaction>) => void
  clearCompleted: () => void
  clearAll: () => void
}

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set, get) => ({
      transactions: [],
      pendingCount: 0,

      addTransaction: (tx) => {
        const now = Date.now()
        const newTx: TrackedTransaction = {
          ...tx,
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({
          transactions: [newTx, ...state.transactions].slice(0, 50), // Keep last 50
          pendingCount: state.pendingCount + (tx.status !== 'confirmed' && tx.status !== 'failed' ? 1 : 0),
        }))
      },

      updateTransaction: (id, updates) => {
        set((state) => {
          const txIndex = state.transactions.findIndex(t => t.id === id)
          if (txIndex === -1) return state

          const oldTx = state.transactions[txIndex]
          const newTx = { ...oldTx, ...updates, updatedAt: Date.now() }

          const newTransactions = [...state.transactions]
          newTransactions[txIndex] = newTx

          // Update pending count
          const wasPending = oldTx.status !== 'confirmed' && oldTx.status !== 'failed'
          const isPending = newTx.status !== 'confirmed' && newTx.status !== 'failed'
          const pendingDelta = (wasPending ? -1 : 0) + (isPending ? 1 : 0)

          return {
            transactions: newTransactions,
            pendingCount: Math.max(0, state.pendingCount + pendingDelta),
          }
        })
      },

      clearCompleted: () => {
        set((state) => ({
          transactions: state.transactions.filter(
            t => t.status !== 'confirmed' && t.status !== 'failed'
          ),
        }))
      },

      clearAll: () => set({ transactions: [], pendingCount: 0 }),
    }),
    {
      name: 'doomsday-transactions',
      partialize: (state) => ({
        transactions: state.transactions.slice(0, 20), // Persist last 20 only
      }),
    }
  )
)

/**
 * Hook to get recent transactions
 */
export function useRecentTransactions(limit = 10) {
  return useTransactionStore((state) => state.transactions.slice(0, limit))
}

/**
 * Hook to get pending transaction count
 */
export function usePendingTransactionCount() {
  return useTransactionStore((state) => state.pendingCount)
}
