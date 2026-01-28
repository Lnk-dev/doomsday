/**
 * Predictions Store
 *
 * Zustand store for tracking user predictions on events.
 * Handles recording, resolving, and calculating prediction statistics.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ID } from '@/types'

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
}

/** Generate unique ID */
const generateId = (): ID => Math.random().toString(36).substring(2, 15)

interface PredictionsState {
  /** All predictions */
  predictions: Prediction[]

  // Actions
  /** Record a new prediction */
  recordPrediction: (
    eventId: ID,
    userId: ID,
    side: 'doom' | 'life',
    amount: number
  ) => Prediction

  /** Resolve a prediction as won or lost */
  resolvePrediction: (predictionId: ID, won: boolean) => void

  /** Resolve all predictions for an event */
  resolveEventPredictions: (eventId: ID, winningSide: 'doom' | 'life') => void

  /** Get all predictions for a user */
  getUserPredictions: (userId: ID) => Prediction[]

  /** Get prediction statistics for a user */
  getPredictionStats: (userId: ID) => PredictionStats

  /** Get a specific prediction */
  getPrediction: (predictionId: ID) => Prediction | undefined

  /** Get all predictions for an event */
  getEventPredictions: (eventId: ID) => Prediction[]
}

export const usePredictionsStore = create<PredictionsState>()(
  persist(
    (set, get) => ({
      predictions: [],

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

        // Simple profit calculation: win = 2x return, lose = 0
        const netProfit = userPredictions.reduce((sum, p) => {
          if (p.won) {
            return sum + p.amount // Net gain is the amount (already had the amount, get it back + same amount)
          }
          return sum - p.amount // Net loss is the amount wagered
        }, 0)

        return {
          total,
          won,
          lost,
          accuracy: Math.round(accuracy * 10) / 10, // Round to 1 decimal
          totalWagered,
          netProfit,
        }
      },

      getPrediction: (predictionId) => {
        return get().predictions.find((p) => p.id === predictionId)
      },

      getEventPredictions: (eventId) => {
        return get().predictions.filter((p) => p.eventId === eventId)
      },
    }),
    {
      name: 'doomsday-predictions',
    }
  )
)
