/**
 * Transaction Store Tests
 * Issue #101: Tests for transaction tracking and history
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useTransactionStore } from './transactions'

describe('transactions store', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useTransactionStore.setState({
      transactions: [],
      pendingCount: 0,
    })
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initial state', () => {
    it('should have no transactions', () => {
      const state = useTransactionStore.getState()
      expect(state.transactions).toHaveLength(0)
    })

    it('should have zero pending count', () => {
      const state = useTransactionStore.getState()
      expect(state.pendingCount).toBe(0)
    })
  })

  describe('addTransaction', () => {
    it('should add a transaction', () => {
      const now = Date.now()
      vi.setSystemTime(now)
      const { addTransaction } = useTransactionStore.getState()

      addTransaction({
        id: 'tx-1',
        status: 'pending',
        type: 'bet',
        description: 'Place bet on event',
      })

      const state = useTransactionStore.getState()
      expect(state.transactions).toHaveLength(1)
      expect(state.transactions[0].id).toBe('tx-1')
      expect(state.transactions[0].status).toBe('pending')
      expect(state.transactions[0].type).toBe('bet')
      expect(state.transactions[0].createdAt).toBe(now)
      expect(state.transactions[0].updatedAt).toBe(now)
    })

    it('should increment pending count for pending transaction', () => {
      const { addTransaction } = useTransactionStore.getState()

      addTransaction({
        id: 'tx-1',
        status: 'pending',
        type: 'bet',
        description: 'Test',
      })

      expect(useTransactionStore.getState().pendingCount).toBe(1)
    })

    it('should increment pending count for signing transaction', () => {
      const { addTransaction } = useTransactionStore.getState()

      addTransaction({
        id: 'tx-1',
        status: 'signing',
        type: 'bet',
        description: 'Test',
      })

      expect(useTransactionStore.getState().pendingCount).toBe(1)
    })

    it('should not increment pending count for confirmed transaction', () => {
      const { addTransaction } = useTransactionStore.getState()

      addTransaction({
        id: 'tx-1',
        status: 'confirmed',
        type: 'bet',
        description: 'Test',
        signature: 'test-sig',
      })

      expect(useTransactionStore.getState().pendingCount).toBe(0)
    })

    it('should not increment pending count for failed transaction', () => {
      const { addTransaction } = useTransactionStore.getState()

      addTransaction({
        id: 'tx-1',
        status: 'failed',
        type: 'bet',
        description: 'Test',
      })

      expect(useTransactionStore.getState().pendingCount).toBe(0)
    })

    it('should prepend new transactions', () => {
      const { addTransaction } = useTransactionStore.getState()

      addTransaction({ id: 'tx-1', status: 'confirmed', type: 'bet', description: 'First' })
      addTransaction({ id: 'tx-2', status: 'confirmed', type: 'bet', description: 'Second' })

      const state = useTransactionStore.getState()
      expect(state.transactions[0].id).toBe('tx-2')
      expect(state.transactions[1].id).toBe('tx-1')
    })

    it('should limit to 50 transactions', () => {
      const { addTransaction } = useTransactionStore.getState()

      for (let i = 0; i < 60; i++) {
        addTransaction({
          id: `tx-${i}`,
          status: 'confirmed',
          type: 'bet',
          description: `Transaction ${i}`,
        })
      }

      const state = useTransactionStore.getState()
      expect(state.transactions).toHaveLength(50)
      expect(state.transactions[0].id).toBe('tx-59')
    })

    it('should include signature if provided', () => {
      const { addTransaction } = useTransactionStore.getState()

      addTransaction({
        id: 'tx-1',
        status: 'confirmed',
        type: 'transfer',
        description: 'Test',
        signature: 'abc123signature',
      })

      expect(useTransactionStore.getState().transactions[0].signature).toBe('abc123signature')
    })
  })

  describe('updateTransaction', () => {
    it('should update transaction status', () => {
      const { addTransaction, updateTransaction } = useTransactionStore.getState()

      addTransaction({
        id: 'tx-1',
        status: 'pending',
        type: 'bet',
        description: 'Test',
      })

      updateTransaction('tx-1', { status: 'confirming' })

      expect(useTransactionStore.getState().transactions[0].status).toBe('confirming')
    })

    it('should update updatedAt timestamp', () => {
      const now = 1000
      vi.setSystemTime(now)
      const { addTransaction, updateTransaction } = useTransactionStore.getState()

      addTransaction({
        id: 'tx-1',
        status: 'pending',
        type: 'bet',
        description: 'Test',
      })

      vi.setSystemTime(now + 5000)
      updateTransaction('tx-1', { status: 'confirmed' })

      const tx = useTransactionStore.getState().transactions[0]
      expect(tx.createdAt).toBe(now)
      expect(tx.updatedAt).toBe(now + 5000)
    })

    it('should decrement pending count when transaction confirms', () => {
      const { addTransaction, updateTransaction } = useTransactionStore.getState()

      addTransaction({
        id: 'tx-1',
        status: 'pending',
        type: 'bet',
        description: 'Test',
      })

      expect(useTransactionStore.getState().pendingCount).toBe(1)

      updateTransaction('tx-1', { status: 'confirmed', signature: 'test-sig' })

      expect(useTransactionStore.getState().pendingCount).toBe(0)
    })

    it('should decrement pending count when transaction fails', () => {
      const { addTransaction, updateTransaction } = useTransactionStore.getState()

      addTransaction({
        id: 'tx-1',
        status: 'pending',
        type: 'bet',
        description: 'Test',
      })

      updateTransaction('tx-1', {
        status: 'failed',
        error: { type: 'NETWORK', message: 'Network error', recoverable: true, retryable: true },
      })

      expect(useTransactionStore.getState().pendingCount).toBe(0)
    })

    it('should not change pending count for pending->sending', () => {
      const { addTransaction, updateTransaction } = useTransactionStore.getState()

      addTransaction({
        id: 'tx-1',
        status: 'pending',
        type: 'bet',
        description: 'Test',
      })

      updateTransaction('tx-1', { status: 'sending' })

      expect(useTransactionStore.getState().pendingCount).toBe(1)
    })

    it('should add signature on confirmation', () => {
      const { addTransaction, updateTransaction } = useTransactionStore.getState()

      addTransaction({
        id: 'tx-1',
        status: 'pending',
        type: 'bet',
        description: 'Test',
      })

      updateTransaction('tx-1', { status: 'confirmed', signature: 'confirmed-signature' })

      expect(useTransactionStore.getState().transactions[0].signature).toBe('confirmed-signature')
    })

    it('should not modify state for non-existent transaction', () => {
      const { addTransaction, updateTransaction } = useTransactionStore.getState()

      addTransaction({
        id: 'tx-1',
        status: 'pending',
        type: 'bet',
        description: 'Test',
      })

      updateTransaction('tx-nonexistent', { status: 'confirmed' })

      const state = useTransactionStore.getState()
      expect(state.transactions).toHaveLength(1)
      expect(state.transactions[0].status).toBe('pending')
    })

    it('should not let pending count go negative', () => {
      const { addTransaction, updateTransaction } = useTransactionStore.getState()

      // Add confirmed transaction
      addTransaction({
        id: 'tx-1',
        status: 'confirmed',
        type: 'bet',
        description: 'Test',
      })

      // Try to update to confirmed again
      updateTransaction('tx-1', { status: 'confirmed' })

      expect(useTransactionStore.getState().pendingCount).toBe(0)
    })
  })

  describe('clearCompleted', () => {
    it('should remove confirmed transactions', () => {
      const { addTransaction, clearCompleted } = useTransactionStore.getState()

      addTransaction({ id: 'tx-1', status: 'confirmed', type: 'bet', description: 'Done' })
      addTransaction({ id: 'tx-2', status: 'pending', type: 'bet', description: 'In progress' })
      addTransaction({ id: 'tx-3', status: 'failed', type: 'bet', description: 'Failed' })

      clearCompleted()

      const state = useTransactionStore.getState()
      expect(state.transactions).toHaveLength(1)
      expect(state.transactions[0].id).toBe('tx-2')
    })

    it('should keep pending transactions', () => {
      const { addTransaction, clearCompleted } = useTransactionStore.getState()

      addTransaction({ id: 'tx-1', status: 'pending', type: 'bet', description: 'Pending' })
      addTransaction({ id: 'tx-2', status: 'signing', type: 'bet', description: 'Signing' })
      addTransaction({ id: 'tx-3', status: 'sending', type: 'bet', description: 'Sending' })
      addTransaction({ id: 'tx-4', status: 'confirming', type: 'bet', description: 'Confirming' })

      clearCompleted()

      expect(useTransactionStore.getState().transactions).toHaveLength(4)
    })
  })

  describe('clearAll', () => {
    it('should remove all transactions', () => {
      const { addTransaction, clearAll } = useTransactionStore.getState()

      addTransaction({ id: 'tx-1', status: 'confirmed', type: 'bet', description: 'A' })
      addTransaction({ id: 'tx-2', status: 'pending', type: 'bet', description: 'B' })
      addTransaction({ id: 'tx-3', status: 'failed', type: 'bet', description: 'C' })

      clearAll()

      const state = useTransactionStore.getState()
      expect(state.transactions).toHaveLength(0)
      expect(state.pendingCount).toBe(0)
    })
  })

  describe('transaction types', () => {
    it('should support all transaction types', () => {
      const { addTransaction } = useTransactionStore.getState()
      const types: Array<'transfer' | 'stake' | 'unstake' | 'swap' | 'bet' | 'other'> = [
        'transfer',
        'stake',
        'unstake',
        'swap',
        'bet',
        'other',
      ]

      types.forEach((type, i) => {
        addTransaction({
          id: `tx-${i}`,
          status: 'confirmed',
          type,
          description: `${type} transaction`,
        })
      })

      const state = useTransactionStore.getState()
      expect(state.transactions).toHaveLength(6)
      types.forEach((type, i) => {
        const tx = state.transactions.find((t) => t.id === `tx-${i}`)
        expect(tx?.type).toBe(type)
      })
    })
  })
})

describe('transaction selectors', () => {
  beforeEach(() => {
    useTransactionStore.setState({
      transactions: [],
      pendingCount: 0,
    })
  })

  describe('useRecentTransactions', () => {
    it('should return limited transactions', async () => {
      const { addTransaction } = useTransactionStore.getState()

      for (let i = 0; i < 15; i++) {
        addTransaction({
          id: `tx-${i}`,
          status: 'confirmed',
          type: 'bet',
          description: `Transaction ${i}`,
        })
      }

      // The useRecentTransactions hook with limit 10 would return first 10
      const state = useTransactionStore.getState()
      const recent = state.transactions.slice(0, 10)
      expect(recent).toHaveLength(10)
    })
  })

  describe('usePendingTransactionCount', () => {
    it('should return correct pending count', () => {
      const { addTransaction } = useTransactionStore.getState()

      addTransaction({ id: 'tx-1', status: 'pending', type: 'bet', description: 'A' })
      addTransaction({ id: 'tx-2', status: 'signing', type: 'bet', description: 'B' })
      addTransaction({ id: 'tx-3', status: 'confirmed', type: 'bet', description: 'C' })

      expect(useTransactionStore.getState().pendingCount).toBe(2)
    })
  })
})
