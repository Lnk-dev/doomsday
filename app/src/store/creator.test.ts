/**
 * Creator Store Tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useCreatorStore } from './creator'
import type { EarningsHistoryEntry } from '@/lib/creatorStats'

describe('creator store', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T12:00:00.000Z'))

    // Reset store state before each test
    useCreatorStore.getState().reset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initial state', () => {
    it('should have zero total earnings', () => {
      const state = useCreatorStore.getState()
      expect(state.totalEarnings).toBe(0)
    })

    it('should have zero pending payouts', () => {
      const state = useCreatorStore.getState()
      expect(state.pendingPayouts).toBe(0)
    })

    it('should have empty earnings history', () => {
      const state = useCreatorStore.getState()
      expect(state.earningsHistory).toEqual([])
    })

    it('should have empty withdrawal history', () => {
      const state = useCreatorStore.getState()
      expect(state.withdrawalHistory).toEqual([])
    })

    it('should have minimum withdrawal of 10', () => {
      const state = useCreatorStore.getState()
      expect(state.minimumWithdrawal).toBe(10)
    })
  })

  describe('addEarnings', () => {
    it('should add earnings entry', () => {
      const { addEarnings } = useCreatorStore.getState()
      const entry: EarningsHistoryEntry = {
        date: '2024-01-15',
        amount: 100,
        type: 'tip',
      }

      addEarnings(entry)

      const state = useCreatorStore.getState()
      expect(state.earningsHistory).toHaveLength(1)
      expect(state.earningsHistory[0]).toEqual(entry)
    })

    it('should update total earnings', () => {
      const { addEarnings } = useCreatorStore.getState()
      const entry: EarningsHistoryEntry = {
        date: '2024-01-15',
        amount: 100,
        type: 'tip',
      }

      addEarnings(entry)

      expect(useCreatorStore.getState().totalEarnings).toBe(100)
    })

    it('should update pending payouts', () => {
      const { addEarnings } = useCreatorStore.getState()
      const entry: EarningsHistoryEntry = {
        date: '2024-01-15',
        amount: 100,
        type: 'tip',
      }

      addEarnings(entry)

      expect(useCreatorStore.getState().pendingPayouts).toBe(100)
    })

    it('should accumulate multiple earnings', () => {
      const { addEarnings } = useCreatorStore.getState()

      addEarnings({ date: '2024-01-15', amount: 50, type: 'tip' })
      addEarnings({ date: '2024-01-15', amount: 75, type: 'content' })

      const state = useCreatorStore.getState()
      expect(state.totalEarnings).toBe(125)
      expect(state.pendingPayouts).toBe(125)
      expect(state.earningsHistory).toHaveLength(2)
    })

    it('should add new entries at the beginning', () => {
      const { addEarnings } = useCreatorStore.getState()

      addEarnings({ date: '2024-01-14', amount: 50, type: 'tip' })
      addEarnings({ date: '2024-01-15', amount: 75, type: 'tip' })

      const state = useCreatorStore.getState()
      expect(state.earningsHistory[0].amount).toBe(75)
    })
  })

  describe('requestWithdrawal', () => {
    beforeEach(() => {
      // Add some earnings first
      const { addEarnings } = useCreatorStore.getState()
      addEarnings({ date: '2024-01-15', amount: 100, type: 'tip' })
    })

    it('should create withdrawal request', () => {
      const { requestWithdrawal } = useCreatorStore.getState()
      const withdrawal = requestWithdrawal(50, 'wallet123')

      expect(withdrawal).not.toBeNull()
      expect(withdrawal?.amount).toBe(50)
      expect(withdrawal?.status).toBe('pending')
      expect(withdrawal?.walletAddress).toBe('wallet123')
    })

    it('should reduce pending payouts', () => {
      const { requestWithdrawal } = useCreatorStore.getState()
      requestWithdrawal(50, 'wallet123')

      expect(useCreatorStore.getState().pendingPayouts).toBe(50)
    })

    it('should add to withdrawal history', () => {
      const { requestWithdrawal } = useCreatorStore.getState()
      requestWithdrawal(50, 'wallet123')

      expect(useCreatorStore.getState().withdrawalHistory).toHaveLength(1)
    })

    it('should reject withdrawal below minimum', () => {
      const { requestWithdrawal } = useCreatorStore.getState()
      const withdrawal = requestWithdrawal(5, 'wallet123') // Below minimum of 10

      expect(withdrawal).toBeNull()
    })

    it('should reject withdrawal exceeding pending payouts', () => {
      const { requestWithdrawal } = useCreatorStore.getState()
      const withdrawal = requestWithdrawal(150, 'wallet123') // More than 100 pending

      expect(withdrawal).toBeNull()
    })

    it('should generate unique withdrawal IDs', () => {
      const { requestWithdrawal } = useCreatorStore.getState()
      const withdrawal1 = requestWithdrawal(30, 'wallet123')
      const withdrawal2 = requestWithdrawal(30, 'wallet123')

      expect(withdrawal1?.id).not.toBe(withdrawal2?.id)
    })
  })

  describe('updateWithdrawalStatus', () => {
    beforeEach(() => {
      const { addEarnings, requestWithdrawal } = useCreatorStore.getState()
      addEarnings({ date: '2024-01-15', amount: 100, type: 'tip' })
      requestWithdrawal(50, 'wallet123')
    })

    it('should update withdrawal status to processing', () => {
      const state = useCreatorStore.getState()
      const withdrawalId = state.withdrawalHistory[0].id

      state.updateWithdrawalStatus(withdrawalId, 'processing')

      expect(useCreatorStore.getState().withdrawalHistory[0].status).toBe('processing')
    })

    it('should update withdrawal status to completed', () => {
      const state = useCreatorStore.getState()
      const withdrawalId = state.withdrawalHistory[0].id

      state.updateWithdrawalStatus(withdrawalId, 'completed', 'tx123')

      const updated = useCreatorStore.getState().withdrawalHistory[0]
      expect(updated.status).toBe('completed')
      expect(updated.transactionId).toBe('tx123')
      expect(updated.completedAt).toBeDefined()
    })

    it('should restore pending payouts on failure', () => {
      const state = useCreatorStore.getState()
      const withdrawalId = state.withdrawalHistory[0].id
      const pendingBefore = state.pendingPayouts // 50 after withdrawal request

      state.updateWithdrawalStatus(withdrawalId, 'failed')

      expect(useCreatorStore.getState().pendingPayouts).toBe(pendingBefore + 50)
    })

    it('should not restore payouts if already failed', () => {
      const state = useCreatorStore.getState()
      const withdrawalId = state.withdrawalHistory[0].id

      state.updateWithdrawalStatus(withdrawalId, 'failed')
      const pendingAfterFirstFail = useCreatorStore.getState().pendingPayouts

      useCreatorStore.getState().updateWithdrawalStatus(withdrawalId, 'failed')

      expect(useCreatorStore.getState().pendingPayouts).toBe(pendingAfterFirstFail)
    })
  })

  describe('getEarningsHistory', () => {
    beforeEach(() => {
      const { addEarnings } = useCreatorStore.getState()
      for (let i = 0; i < 10; i++) {
        addEarnings({ date: `2024-01-${15 - i}`, amount: 10, type: 'tip' })
      }
    })

    it('should return limited entries', () => {
      const { getEarningsHistory } = useCreatorStore.getState()
      const history = getEarningsHistory(5)

      expect(history).toHaveLength(5)
    })

    it('should default to 50 entries', () => {
      const { getEarningsHistory } = useCreatorStore.getState()
      const history = getEarningsHistory()

      expect(history.length).toBeLessThanOrEqual(50)
    })
  })

  describe('getWithdrawalHistory', () => {
    beforeEach(() => {
      const { addEarnings } = useCreatorStore.getState()
      addEarnings({ date: '2024-01-15', amount: 1000, type: 'tip' })

      for (let i = 0; i < 5; i++) {
        useCreatorStore.getState().requestWithdrawal(50, `wallet${i}`)
      }
    })

    it('should return limited entries', () => {
      const { getWithdrawalHistory } = useCreatorStore.getState()
      const history = getWithdrawalHistory(3)

      expect(history).toHaveLength(3)
    })

    it('should default to 20 entries', () => {
      const { getWithdrawalHistory } = useCreatorStore.getState()
      const history = getWithdrawalHistory()

      expect(history.length).toBeLessThanOrEqual(20)
    })
  })

  describe('getStats', () => {
    it('should return correct stats', () => {
      const { setStats } = useCreatorStore.getState()

      setStats({
        followers: 1000,
        totalPosts: 50,
        totalViews: 10000,
        totalLikes: 500,
        totalComments: 100,
      })

      const stats = useCreatorStore.getState().getStats()

      expect(stats.followers).toBe(1000)
      expect(stats.posts).toBe(50)
      expect(stats.engagementRate).toBeGreaterThan(0)
    })

    it('should calculate monthly earnings', () => {
      const { addEarnings } = useCreatorStore.getState()

      // Add earnings for current month
      addEarnings({ date: '2024-01-15', amount: 100, type: 'tip' })
      addEarnings({ date: '2024-01-10', amount: 50, type: 'tip' })

      const stats = useCreatorStore.getState().getStats()

      expect(stats.monthlyEarnings).toBe(150)
    })
  })

  describe('setStats', () => {
    it('should update follower count', () => {
      const { setStats } = useCreatorStore.getState()
      setStats({ followers: 500 })

      expect(useCreatorStore.getState().followers).toBe(500)
    })

    it('should update multiple stats', () => {
      const { setStats } = useCreatorStore.getState()
      setStats({
        followers: 500,
        totalPosts: 25,
        totalViews: 5000,
      })

      const state = useCreatorStore.getState()
      expect(state.followers).toBe(500)
      expect(state.totalPosts).toBe(25)
      expect(state.totalViews).toBe(5000)
    })

    it('should preserve existing stats when updating partial', () => {
      const { setStats } = useCreatorStore.getState()
      setStats({ followers: 500, totalPosts: 25 })
      setStats({ followers: 600 })

      const state = useCreatorStore.getState()
      expect(state.followers).toBe(600)
      expect(state.totalPosts).toBe(25)
    })
  })

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      const { addEarnings, setStats } = useCreatorStore.getState()

      addEarnings({ date: '2024-01-15', amount: 100, type: 'tip' })
      setStats({ followers: 500 })

      useCreatorStore.getState().reset()

      const state = useCreatorStore.getState()
      expect(state.totalEarnings).toBe(0)
      expect(state.pendingPayouts).toBe(0)
      expect(state.earningsHistory).toEqual([])
      expect(state.followers).toBe(0)
    })
  })
})
