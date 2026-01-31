/**
 * Analytics Store Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useAnalyticsStore } from './analytics'

describe('analytics store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAnalyticsStore.setState({
      timeRange: '30d',
      transactions: [],
      followerHistory: [],
    })
  })

  describe('initial state', () => {
    it('should have default time range of 30d', () => {
      const state = useAnalyticsStore.getState()
      expect(state.timeRange).toBe('30d')
    })

    it('should have empty transactions', () => {
      const state = useAnalyticsStore.getState()
      expect(state.transactions).toEqual([])
    })

    it('should have empty follower history', () => {
      const state = useAnalyticsStore.getState()
      expect(state.followerHistory).toEqual([])
    })
  })

  describe('setTimeRange', () => {
    it('should update time range', () => {
      const { setTimeRange } = useAnalyticsStore.getState()

      setTimeRange('7d')
      expect(useAnalyticsStore.getState().timeRange).toBe('7d')

      setTimeRange('all')
      expect(useAnalyticsStore.getState().timeRange).toBe('all')
    })
  })

  describe('addTransaction', () => {
    it('should add a transaction with generated id and timestamp', () => {
      const { addTransaction } = useAnalyticsStore.getState()

      addTransaction({
        type: 'earn',
        tokenType: 'doom',
        amount: 100,
        source: 'life_post',
        description: 'Earned from posting',
      })

      const state = useAnalyticsStore.getState()
      expect(state.transactions).toHaveLength(1)
      expect(state.transactions[0]).toMatchObject({
        type: 'earn',
        tokenType: 'doom',
        amount: 100,
        source: 'life_post',
        description: 'Earned from posting',
      })
      expect(state.transactions[0].id).toBeDefined()
      expect(state.transactions[0].createdAt).toBeDefined()
    })

    it('should add multiple transactions', () => {
      const { addTransaction } = useAnalyticsStore.getState()

      addTransaction({
        type: 'earn',
        tokenType: 'doom',
        amount: 100,
        source: 'life_post',
        description: 'First transaction',
      })

      addTransaction({
        type: 'spend',
        tokenType: 'life',
        amount: 50,
        source: 'bet_place',
        description: 'Second transaction',
      })

      const state = useAnalyticsStore.getState()
      expect(state.transactions).toHaveLength(2)
      expect(state.transactions[0].description).toBe('First transaction')
      expect(state.transactions[1].description).toBe('Second transaction')
    })

    it('should generate unique IDs for each transaction', () => {
      const { addTransaction } = useAnalyticsStore.getState()

      addTransaction({
        type: 'earn',
        tokenType: 'doom',
        amount: 100,
        source: 'life_post',
        description: 'Transaction 1',
      })

      addTransaction({
        type: 'earn',
        tokenType: 'doom',
        amount: 100,
        source: 'life_post',
        description: 'Transaction 2',
      })

      const state = useAnalyticsStore.getState()
      expect(state.transactions[0].id).not.toBe(state.transactions[1].id)
    })
  })

  describe('getTransactions', () => {
    it('should return all transactions', () => {
      const { addTransaction, getTransactions } = useAnalyticsStore.getState()

      addTransaction({
        type: 'earn',
        tokenType: 'doom',
        amount: 100,
        source: 'life_post',
        description: 'Test',
      })

      const transactions = getTransactions()
      expect(transactions).toHaveLength(1)
    })

    it('should return empty array when no transactions', () => {
      const { getTransactions } = useAnalyticsStore.getState()
      expect(getTransactions()).toEqual([])
    })
  })

  describe('clearTransactions', () => {
    it('should clear all transactions', () => {
      const { addTransaction, clearTransactions } = useAnalyticsStore.getState()

      addTransaction({
        type: 'earn',
        tokenType: 'doom',
        amount: 100,
        source: 'life_post',
        description: 'Test',
      })

      expect(useAnalyticsStore.getState().transactions).toHaveLength(1)

      clearTransactions()

      expect(useAnalyticsStore.getState().transactions).toHaveLength(0)
    })
  })

  describe('recordFollowerChange', () => {
    it('should add new follower count entry', () => {
      const { recordFollowerChange } = useAnalyticsStore.getState()

      recordFollowerChange(100)

      const state = useAnalyticsStore.getState()
      expect(state.followerHistory).toHaveLength(1)
      expect(state.followerHistory[0].count).toBe(100)
      expect(state.followerHistory[0].date).toBeDefined()
    })

    it('should update existing entry for same date', () => {
      const { recordFollowerChange } = useAnalyticsStore.getState()

      recordFollowerChange(100)
      recordFollowerChange(150)

      const state = useAnalyticsStore.getState()
      // Should still be 1 entry since it's the same day
      expect(state.followerHistory).toHaveLength(1)
      expect(state.followerHistory[0].count).toBe(150)
    })

    it('should record date in ISO format', () => {
      const { recordFollowerChange } = useAnalyticsStore.getState()

      recordFollowerChange(100)

      const state = useAnalyticsStore.getState()
      // Check date format is YYYY-MM-DD
      expect(state.followerHistory[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })
})
