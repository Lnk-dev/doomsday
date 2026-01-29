/**
 * Predictions Store
 * Issues #34, #35, #36: On-chain prediction tracking
 *
 * Zustand store for tracking user predictions on events.
 * Handles recording, resolving, and calculating prediction statistics.
 * Supports syncing with on-chain UserBet accounts.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Connection, PublicKey } from '@solana/web3.js'
import type { ID } from '@/types'
import {
  fetchUserStats,
  fetchUserBets,
  Outcome,
} from '@/lib/solana/programs/predictionMarket'

/**
 * A user's prediction on an event
 */
export interface Prediction {
  /** Unique prediction ID */
  id: ID
  /** Event ID this prediction is for */
  eventId: ID
  /** User ID who made the prediction */
  userId: ID
  /** Which side the user predicted */
  side: 'doom' | 'life'
  /** Amount wagered */
  amount: number
  /** When the prediction was made */
  createdAt: number
  /** Whether the prediction has been resolved */
  resolved: boolean
  /** Whether the user won (only set if resolved) */
  won?: boolean
  /** When the prediction was resolved */
  resolvedAt?: number
  /** On-chain event PDA (if from blockchain) */
  onChainEventPDA?: string
  /** Whether winnings have been claimed */
  claimed?: boolean
}

/**
 * Statistics for a user's prediction history
 */
export interface PredictionStats {
  /** Total number of resolved predictions */
  total: number
  /** Number of correct predictions */
  won: number
  /** Number of incorrect predictions */
  lost: number
  /** Accuracy percentage (0-100) */
  accuracy: number
  /** Total amount wagered */
  totalWagered: number
  /** Net profit/loss */
  netProfit: number
  /** Current win/loss streak (positive = wins, negative = losses) */
  currentStreak: number
  /** Best win streak */
  bestStreak: number
  /** Worst loss streak */
  worstStreak: number
}

/**
 * On-chain user stats (synced from blockchain)
 */
export interface OnChainStats {
  totalBets: number
  wins: number
  losses: number
  totalWagered: number
  totalWon: number
  totalLost: number
  netProfit: number
  eventsCreated: number
  currentStreak: number
  bestStreak: number
  worstStreak: number
  firstBetAt: number | null
  lastBetAt: number | null
}

/** Generate unique ID */
const generateId = (): ID => Math.random().toString(36).substring(2, 15)

interface PredictionsState {
  /** All predictions (local tracking) */
  predictions: Prediction[]
  /** On-chain stats for user */
  onChainStats: OnChainStats | null
  /** Loading state */
  isLoading: boolean
  /** Error state */
  error: string | null
  /** Last sync timestamp */
  lastSyncAt: number | null

  // Local actions
  recordPrediction: (
    eventId: ID,
    userId: ID,
    side: 'doom' | 'life',
    amount: number
  ) => Prediction
  resolvePrediction: (predictionId: ID, won: boolean) => void
  resolveEventPredictions: (eventId: ID, winningSide: 'doom' | 'life') => void
  markPredictionClaimed: (predictionId: ID) => void

  // Getters
  getUserPredictions: (userId: ID) => Prediction[]
  getPredictionStats: (userId: ID) => PredictionStats
  getPrediction: (predictionId: ID) => Prediction | undefined
  getEventPredictions: (eventId: ID) => Prediction[]
  getOnChainStats: () => OnChainStats | null
  getUnclaimedWinnings: (userId: ID) => Prediction[]

  // On-chain sync
  syncUserStatsFromChain: (connection: Connection, user: PublicKey) => Promise<void>
  syncUserBetsFromChain: (
    connection: Connection,
    user: PublicKey,
    eventPDAToIdMap: Record<string, ID>
  ) => Promise<void>

  // Helpers
  setError: (error: string | null) => void
  clearOnChainData: () => void
}

export const usePredictionsStore = create<PredictionsState>()(
  persist(
    (set, get) => ({
      predictions: [],
      onChainStats: null,
      isLoading: false,
      error: null,
      lastSyncAt: null,

      recordPrediction: (eventId, userId, side, amount) => {
        const prediction: Prediction = {
          id: generateId(),
          eventId,
          userId,
          side,
          amount,
          createdAt: Date.now(),
          resolved: false,
        }

        set((state) => ({
          predictions: [...state.predictions, prediction],
        }))

        return prediction
      },

      resolvePrediction: (predictionId, won) => {
        set((state) => ({
          predictions: state.predictions.map((p) =>
            p.id === predictionId
              ? { ...p, resolved: true, won, resolvedAt: Date.now() }
              : p
          ),
        }))
      },

      resolveEventPredictions: (eventId, winningSide) => {
        set((state) => ({
          predictions: state.predictions.map((p) =>
            p.eventId === eventId && !p.resolved
              ? {
                  ...p,
                  resolved: true,
                  won: p.side === winningSide,
                  resolvedAt: Date.now(),
                }
              : p
          ),
        }))
      },

      markPredictionClaimed: (predictionId) => {
        set((state) => ({
          predictions: state.predictions.map((p) =>
            p.id === predictionId ? { ...p, claimed: true } : p
          ),
        }))
      },

      getUserPredictions: (userId) => {
        return get().predictions.filter((p) => p.userId === userId)
      },

      getPredictionStats: (userId) => {
        const userPredictions = get().predictions.filter(
          (p) => p.userId === userId && p.resolved
        )

        const total = userPredictions.length
        const won = userPredictions.filter((p) => p.won).length
        const lost = total - won
        const accuracy = total > 0 ? (won / total) * 100 : 0

        const totalWagered = userPredictions.reduce((sum, p) => sum + p.amount, 0)

        // Calculate net profit based on actual payout ratios would be more accurate
        // For now, simple calculation: win = 2x return, lose = 0
        const netProfit = userPredictions.reduce((sum, p) => {
          if (p.won) {
            return sum + p.amount
          }
          return sum - p.amount
        }, 0)

        // Calculate streaks
        let currentStreak = 0
        let bestStreak = 0
        let worstStreak = 0
        let tempStreak = 0

        const sortedPredictions = [...userPredictions].sort((a, b) => a.createdAt - b.createdAt)
        for (const pred of sortedPredictions) {
          if (pred.won) {
            if (tempStreak >= 0) {
              tempStreak++
            } else {
              tempStreak = 1
            }
            if (tempStreak > bestStreak) bestStreak = tempStreak
          } else {
            if (tempStreak <= 0) {
              tempStreak--
            } else {
              tempStreak = -1
            }
            if (Math.abs(tempStreak) > worstStreak) worstStreak = Math.abs(tempStreak)
          }
        }
        currentStreak = tempStreak

        return {
          total,
          won,
          lost,
          accuracy: Math.round(accuracy * 10) / 10,
          totalWagered,
          netProfit,
          currentStreak,
          bestStreak,
          worstStreak,
        }
      },

      getPrediction: (predictionId) => {
        return get().predictions.find((p) => p.id === predictionId)
      },

      getEventPredictions: (eventId) => {
        return get().predictions.filter((p) => p.eventId === eventId)
      },

      getOnChainStats: () => get().onChainStats,

      getUnclaimedWinnings: (userId) => {
        return get().predictions.filter(
          (p) => p.userId === userId && p.resolved && p.won && !p.claimed
        )
      },

      // On-chain sync
      syncUserStatsFromChain: async (connection, user) => {
        set({ isLoading: true, error: null })

        try {
          const stats = await fetchUserStats(connection, user)

          if (stats) {
            const onChainStats: OnChainStats = {
              totalBets: stats.totalBets.toNumber(),
              wins: stats.wins.toNumber(),
              losses: stats.losses.toNumber(),
              totalWagered: stats.totalWagered.toNumber() / 1e9,
              totalWon: stats.totalWon.toNumber() / 1e9,
              totalLost: stats.totalLost.toNumber() / 1e9,
              netProfit: stats.netProfit.toNumber() / 1e9,
              eventsCreated: stats.eventsCreated.toNumber(),
              currentStreak: stats.currentStreak.toNumber(),
              bestStreak: stats.bestStreak.toNumber(),
              worstStreak: stats.worstStreak.toNumber(),
              firstBetAt: stats.firstBetAt ? stats.firstBetAt.toNumber() * 1000 : null,
              lastBetAt: stats.lastBetAt ? stats.lastBetAt.toNumber() * 1000 : null,
            }

            set({
              onChainStats,
              lastSyncAt: Date.now(),
              isLoading: false,
            })
          } else {
            set({ isLoading: false })
          }
        } catch (error) {
          console.error('Failed to sync user stats from chain:', error)
          set({
            error: error instanceof Error ? error.message : 'Failed to sync stats',
            isLoading: false,
          })
        }
      },

      syncUserBetsFromChain: async (connection, user, eventPDAToIdMap) => {
        set({ isLoading: true, error: null })

        try {
          const bets = await fetchUserBets(connection, user)
          const userId = user.toBase58()

          const newPredictions: Prediction[] = []

          for (const bet of bets) {
            const eventPDA = bet.event.toBase58()
            const eventId = eventPDAToIdMap[eventPDA] || `onchain-${eventPDA.slice(0, 8)}`

            // Check if we already have this prediction
            const existing = get().predictions.find(
              (p) => p.onChainEventPDA === eventPDA && p.userId === userId
            )

            if (!existing) {
              newPredictions.push({
                id: `onchain-${bet.event.toBase58().slice(0, 8)}-${user.toBase58().slice(0, 8)}`,
                eventId,
                userId,
                side: bet.outcome === Outcome.Doom ? 'doom' : 'life',
                amount: bet.amount.toNumber() / 1e9,
                createdAt: bet.placedAt.toNumber() * 1000,
                resolved: bet.claimed || bet.refunded,
                won: bet.claimed ? true : bet.refunded ? undefined : undefined,
                claimed: bet.claimed,
                onChainEventPDA: eventPDA,
              })
            }
          }

          if (newPredictions.length > 0) {
            set((state) => ({
              predictions: [...state.predictions, ...newPredictions],
              lastSyncAt: Date.now(),
              isLoading: false,
            }))
          } else {
            set({ isLoading: false })
          }
        } catch (error) {
          console.error('Failed to sync user bets from chain:', error)
          set({
            error: error instanceof Error ? error.message : 'Failed to sync bets',
            isLoading: false,
          })
        }
      },

      setError: (error) => set({ error }),

      clearOnChainData: () =>
        set({
          onChainStats: null,
          lastSyncAt: null,
        }),
    }),
    {
      name: 'doomsday-predictions',
      partialize: (state) => ({
        predictions: state.predictions,
        // Don't persist on-chain stats - they should be re-synced
      }),
    }
  )
)
