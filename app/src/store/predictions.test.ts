/**
 * Predictions Store Tests
 * Issues #34, #35, #36: Tests for prediction tracking
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { usePredictionsStore } from './predictions'

describe('predictions store', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    usePredictionsStore.setState({
      predictions: [],
      onChainStats: null,
      isLoading: false,
      error: null,
      lastSyncAt: null,
    })
    vi.useRealTimers()
  })

  describe('initial state', () => {
    it('should have empty predictions array', () => {
      const state = usePredictionsStore.getState()
      expect(state.predictions).toEqual([])
    })

    it('should have null onChainStats', () => {
      const state = usePredictionsStore.getState()
      expect(state.onChainStats).toBeNull()
    })

    it('should not be loading', () => {
      const state = usePredictionsStore.getState()
      expect(state.isLoading).toBe(false)
    })
  })

  describe('recordPrediction', () => {
    it('should record a prediction with all fields', () => {
      const { recordPrediction } = usePredictionsStore.getState()
      const now = Date.now()
      vi.setSystemTime(now)

      const prediction = recordPrediction('event-1', 'user-1', 'doom', 100)

      expect(prediction.eventId).toBe('event-1')
      expect(prediction.userId).toBe('user-1')
      expect(prediction.side).toBe('doom')
      expect(prediction.amount).toBe(100)
      expect(prediction.resolved).toBe(false)
      expect(prediction.createdAt).toBe(now)
    })

    it('should generate unique IDs', () => {
      const { recordPrediction } = usePredictionsStore.getState()

      const p1 = recordPrediction('event-1', 'user-1', 'doom', 100)
      const p2 = recordPrediction('event-1', 'user-1', 'life', 50)

      expect(p1.id).not.toBe(p2.id)
    })

    it('should add prediction to store', () => {
      const { recordPrediction, getUserPredictions } = usePredictionsStore.getState()

      recordPrediction('event-1', 'user-1', 'doom', 100)

      const predictions = getUserPredictions('user-1')
      expect(predictions).toHaveLength(1)
    })
  })

  describe('resolvePrediction', () => {
    it('should mark prediction as resolved with win', () => {
      const { recordPrediction, resolvePrediction, getPrediction } = usePredictionsStore.getState()

      const prediction = recordPrediction('event-1', 'user-1', 'doom', 100)
      resolvePrediction(prediction.id, true)

      const updated = getPrediction(prediction.id)
      expect(updated?.resolved).toBe(true)
      expect(updated?.won).toBe(true)
      expect(updated?.resolvedAt).toBeDefined()
    })

    it('should mark prediction as resolved with loss', () => {
      const { recordPrediction, resolvePrediction, getPrediction } = usePredictionsStore.getState()

      const prediction = recordPrediction('event-1', 'user-1', 'doom', 100)
      resolvePrediction(prediction.id, false)

      const updated = getPrediction(prediction.id)
      expect(updated?.resolved).toBe(true)
      expect(updated?.won).toBe(false)
    })
  })

  describe('resolveEventPredictions', () => {
    it('should resolve all predictions for an event', () => {
      const { recordPrediction, resolveEventPredictions } = usePredictionsStore.getState()

      recordPrediction('event-1', 'user-1', 'doom', 100)
      recordPrediction('event-1', 'user-2', 'life', 50)
      recordPrediction('event-1', 'user-3', 'doom', 75)

      resolveEventPredictions('event-1', 'doom')

      const predictions = usePredictionsStore.getState().predictions
      expect(predictions.filter(p => p.resolved)).toHaveLength(3)
    })

    it('should mark winning side correctly', () => {
      const { recordPrediction, resolveEventPredictions, getPrediction } = usePredictionsStore.getState()

      const doomBet = recordPrediction('event-1', 'user-1', 'doom', 100)
      const lifeBet = recordPrediction('event-1', 'user-2', 'life', 50)

      resolveEventPredictions('event-1', 'doom')

      const doomPrediction = getPrediction(doomBet.id)
      const lifePrediction = getPrediction(lifeBet.id)

      expect(doomPrediction?.won).toBe(true)
      expect(lifePrediction?.won).toBe(false)
    })

    it('should not resolve already resolved predictions', () => {
      const { recordPrediction, resolvePrediction, resolveEventPredictions, getPrediction } = usePredictionsStore.getState()

      const prediction = recordPrediction('event-1', 'user-1', 'doom', 100)
      resolvePrediction(prediction.id, false) // Already resolved as loss

      const originalResolvedAt = getPrediction(prediction.id)?.resolvedAt

      resolveEventPredictions('event-1', 'doom')

      const updated = getPrediction(prediction.id)
      expect(updated?.won).toBe(false) // Still false, not changed
      expect(updated?.resolvedAt).toBe(originalResolvedAt)
    })
  })

  describe('markPredictionClaimed', () => {
    it('should mark prediction as claimed', () => {
      const { recordPrediction, markPredictionClaimed, getPrediction } = usePredictionsStore.getState()

      const prediction = recordPrediction('event-1', 'user-1', 'doom', 100)
      markPredictionClaimed(prediction.id)

      const updated = getPrediction(prediction.id)
      expect(updated?.claimed).toBe(true)
    })
  })

  describe('getUserPredictions', () => {
    it('should return only predictions for specified user', () => {
      const { recordPrediction, getUserPredictions } = usePredictionsStore.getState()

      recordPrediction('event-1', 'user-1', 'doom', 100)
      recordPrediction('event-2', 'user-1', 'life', 50)
      recordPrediction('event-1', 'user-2', 'doom', 75)

      const user1Predictions = getUserPredictions('user-1')
      const user2Predictions = getUserPredictions('user-2')

      expect(user1Predictions).toHaveLength(2)
      expect(user2Predictions).toHaveLength(1)
    })
  })

  describe('getPredictionStats', () => {
    it('should return empty stats for user with no predictions', () => {
      const { getPredictionStats } = usePredictionsStore.getState()

      const stats = getPredictionStats('user-1')

      expect(stats.total).toBe(0)
      expect(stats.won).toBe(0)
      expect(stats.lost).toBe(0)
      expect(stats.accuracy).toBe(0)
    })

    it('should calculate accuracy correctly', () => {
      const { recordPrediction, resolvePrediction, getPredictionStats } = usePredictionsStore.getState()

      const p1 = recordPrediction('event-1', 'user-1', 'doom', 100)
      const p2 = recordPrediction('event-2', 'user-1', 'life', 100)
      const p3 = recordPrediction('event-3', 'user-1', 'doom', 100)
      const p4 = recordPrediction('event-4', 'user-1', 'life', 100)

      resolvePrediction(p1.id, true)
      resolvePrediction(p2.id, true)
      resolvePrediction(p3.id, true)
      resolvePrediction(p4.id, false)

      const stats = getPredictionStats('user-1')

      expect(stats.total).toBe(4)
      expect(stats.won).toBe(3)
      expect(stats.lost).toBe(1)
      expect(stats.accuracy).toBe(75)
    })

    it('should not count unresolved predictions', () => {
      const { recordPrediction, resolvePrediction, getPredictionStats } = usePredictionsStore.getState()

      const p1 = recordPrediction('event-1', 'user-1', 'doom', 100)
      recordPrediction('event-2', 'user-1', 'life', 100) // unresolved

      resolvePrediction(p1.id, true)

      const stats = getPredictionStats('user-1')

      expect(stats.total).toBe(1)
    })

    it('should calculate total wagered', () => {
      const { recordPrediction, resolvePrediction, getPredictionStats } = usePredictionsStore.getState()

      const p1 = recordPrediction('event-1', 'user-1', 'doom', 100)
      const p2 = recordPrediction('event-2', 'user-1', 'life', 200)
      const p3 = recordPrediction('event-3', 'user-1', 'doom', 50)

      resolvePrediction(p1.id, true)
      resolvePrediction(p2.id, false)
      resolvePrediction(p3.id, true)

      const stats = getPredictionStats('user-1')

      expect(stats.totalWagered).toBe(350)
    })

    it('should calculate net profit (wins - losses)', () => {
      const { recordPrediction, resolvePrediction, getPredictionStats } = usePredictionsStore.getState()

      const p1 = recordPrediction('event-1', 'user-1', 'doom', 100)
      const p2 = recordPrediction('event-2', 'user-1', 'life', 200)
      const p3 = recordPrediction('event-3', 'user-1', 'doom', 50)

      resolvePrediction(p1.id, true) // +100
      resolvePrediction(p2.id, false) // -200
      resolvePrediction(p3.id, true) // +50

      const stats = getPredictionStats('user-1')

      // Net profit = 100 - 200 + 50 = -50
      expect(stats.netProfit).toBe(-50)
    })

    it('should track win streaks correctly', () => {
      const { recordPrediction, resolvePrediction, getPredictionStats } = usePredictionsStore.getState()
      let time = Date.now()

      // Create predictions in order
      vi.setSystemTime(time)
      const p1 = recordPrediction('event-1', 'user-1', 'doom', 100)

      time += 1000
      vi.setSystemTime(time)
      const p2 = recordPrediction('event-2', 'user-1', 'doom', 100)

      time += 1000
      vi.setSystemTime(time)
      const p3 = recordPrediction('event-3', 'user-1', 'doom', 100)

      time += 1000
      vi.setSystemTime(time)
      const p4 = recordPrediction('event-4', 'user-1', 'doom', 100)

      resolvePrediction(p1.id, true)
      resolvePrediction(p2.id, true)
      resolvePrediction(p3.id, true)
      resolvePrediction(p4.id, false)

      const stats = getPredictionStats('user-1')

      expect(stats.bestStreak).toBe(3)
      expect(stats.currentStreak).toBe(-1) // On a 1-loss streak
    })
  })

  describe('getEventPredictions', () => {
    it('should return only predictions for specified event', () => {
      const { recordPrediction, getEventPredictions } = usePredictionsStore.getState()

      recordPrediction('event-1', 'user-1', 'doom', 100)
      recordPrediction('event-1', 'user-2', 'life', 50)
      recordPrediction('event-2', 'user-1', 'doom', 75)

      const event1Predictions = getEventPredictions('event-1')
      const event2Predictions = getEventPredictions('event-2')

      expect(event1Predictions).toHaveLength(2)
      expect(event2Predictions).toHaveLength(1)
    })
  })

  describe('getUnclaimedWinnings', () => {
    it('should return only unclaimed winning predictions', () => {
      const { recordPrediction, resolvePrediction, markPredictionClaimed, getUnclaimedWinnings } = usePredictionsStore.getState()

      const p1 = recordPrediction('event-1', 'user-1', 'doom', 100)
      const p2 = recordPrediction('event-2', 'user-1', 'life', 50)
      const p3 = recordPrediction('event-3', 'user-1', 'doom', 75)
      const p4 = recordPrediction('event-4', 'user-1', 'life', 25)

      resolvePrediction(p1.id, true) // won, unclaimed
      resolvePrediction(p2.id, true) // won, will be claimed
      resolvePrediction(p3.id, false) // lost
      resolvePrediction(p4.id, true) // won, unclaimed

      markPredictionClaimed(p2.id)

      const unclaimed = getUnclaimedWinnings('user-1')

      expect(unclaimed).toHaveLength(2)
      expect(unclaimed.map(p => p.id)).toContain(p1.id)
      expect(unclaimed.map(p => p.id)).toContain(p4.id)
    })

    it('should not include unresolved predictions', () => {
      const { recordPrediction, getUnclaimedWinnings } = usePredictionsStore.getState()

      recordPrediction('event-1', 'user-1', 'doom', 100) // unresolved

      const unclaimed = getUnclaimedWinnings('user-1')

      expect(unclaimed).toHaveLength(0)
    })
  })

  describe('setError', () => {
    it('should set error message', () => {
      const { setError } = usePredictionsStore.getState()

      setError('Test error')

      const state = usePredictionsStore.getState()
      expect(state.error).toBe('Test error')
    })

    it('should clear error with null', () => {
      usePredictionsStore.setState({ error: 'Previous error' })
      const { setError } = usePredictionsStore.getState()

      setError(null)

      const state = usePredictionsStore.getState()
      expect(state.error).toBeNull()
    })
  })

  describe('clearOnChainData', () => {
    it('should clear onChainStats and lastSyncAt', () => {
      usePredictionsStore.setState({
        onChainStats: {
          totalBets: 10,
          wins: 5,
          losses: 5,
          totalWagered: 1000,
          totalWon: 500,
          totalLost: 500,
          netProfit: 0,
          eventsCreated: 2,
          currentStreak: 1,
          bestStreak: 3,
          worstStreak: 2,
          firstBetAt: Date.now(),
          lastBetAt: Date.now(),
        },
        lastSyncAt: Date.now(),
      })

      const { clearOnChainData } = usePredictionsStore.getState()
      clearOnChainData()

      const state = usePredictionsStore.getState()
      expect(state.onChainStats).toBeNull()
      expect(state.lastSyncAt).toBeNull()
    })
  })
})
