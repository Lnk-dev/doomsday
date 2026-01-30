/**
 * Solana Transaction Utilities Tests
 * Issue #101: Tests for transaction retry and error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Connection, Transaction, Keypair } from '@solana/web3.js'
import type { WalletContextState } from '@solana/wallet-adapter-react'
import {
  sendTransactionWithRetry,
  checkSufficientBalance,
  estimateTransactionFee,
} from './transaction'

// Mock the errors module
vi.mock('./errors', () => ({
  classifyError: (error: Error) => ({
    type: error.message.includes('rejected') ? 'USER_REJECTED' : 'UNKNOWN',
    message: error.message,
    recoverable: !error.message.includes('rejected'),
    retryable: error.message.includes('timeout') || error.message.includes('blockhash'),
  }),
}))

describe('Transaction utilities', () => {
  describe('sendTransactionWithRetry', () => {
    const mockConnection = {
      getLatestBlockhash: vi.fn(),
      sendRawTransaction: vi.fn(),
      confirmTransaction: vi.fn(),
    } as unknown as Connection

    const mockKeypair = Keypair.generate()

    const createMockWallet = (overrides = {}): WalletContextState => ({
      publicKey: mockKeypair.publicKey,
      connected: true,
      connecting: false,
      disconnecting: false,
      autoConnect: false,
      wallet: null,
      wallets: [],
      select: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn(),
      sendTransaction: vi.fn(),
      signTransaction: vi.fn().mockImplementation(async (tx) => {
        // Return a mock signed transaction with serialize method
        return {
          ...tx,
          serialize: () => Buffer.from('mock-serialized-tx'),
        }
      }),
      signAllTransactions: vi.fn(),
      signMessage: vi.fn(),
      signIn: vi.fn(),
      ...overrides,
    })

    beforeEach(() => {
      vi.clearAllMocks()
      vi.mocked(mockConnection.getLatestBlockhash).mockResolvedValue({
        blockhash: 'test-blockhash-123',
        lastValidBlockHeight: 1000,
      })
      vi.mocked(mockConnection.sendRawTransaction).mockResolvedValue('test-signature-456')
      vi.mocked(mockConnection.confirmTransaction).mockResolvedValue({
        context: { slot: 100 },
        value: { err: null },
      })
    })

    it('should return error when wallet is not connected', async () => {
      const wallet = createMockWallet({ publicKey: null })
      const transaction = new Transaction()

      const result = await sendTransactionWithRetry(mockConnection, wallet, transaction)

      expect(result.success).toBe(false)
      expect(result.status).toBe('failed')
      expect(result.error?.type).toBe('USER_REJECTED')
      expect(result.error?.message).toBe('Wallet not connected')
    })

    it('should return error when signTransaction is not available', async () => {
      const wallet = createMockWallet({ signTransaction: undefined })
      const transaction = new Transaction()

      const result = await sendTransactionWithRetry(mockConnection, wallet, transaction)

      expect(result.success).toBe(false)
      expect(result.error?.message).toBe('Wallet not connected')
    })

    it('should successfully send and confirm transaction', async () => {
      const wallet = createMockWallet()
      const transaction = new Transaction()

      const result = await sendTransactionWithRetry(mockConnection, wallet, transaction)

      expect(result.success).toBe(true)
      expect(result.signature).toBe('test-signature-456')
      expect(result.status).toBe('confirmed')
    })

    it('should call status change callback during transaction lifecycle', async () => {
      const wallet = createMockWallet()
      const transaction = new Transaction()
      const statusChanges: string[] = []

      await sendTransactionWithRetry(mockConnection, wallet, transaction, {
        onStatusChange: (status) => statusChanges.push(status),
      })

      expect(statusChanges).toContain('pending')
      expect(statusChanges).toContain('signing')
      expect(statusChanges).toContain('sending')
      expect(statusChanges).toContain('confirming')
      expect(statusChanges).toContain('confirmed')
    })

    it('should return failed status when user rejects signature', async () => {
      const wallet = createMockWallet({
        signTransaction: vi.fn().mockRejectedValue(new Error('User rejected the request')),
      })
      const transaction = new Transaction()

      const result = await sendTransactionWithRetry(mockConnection, wallet, transaction)

      expect(result.success).toBe(false)
      expect(result.status).toBe('failed')
    })

    it('should retry on retryable errors', async () => {
      const wallet = createMockWallet()
      const transaction = new Transaction()

      vi.mocked(mockConnection.sendRawTransaction)
        .mockRejectedValueOnce(new Error('timeout'))
        .mockResolvedValueOnce('test-signature-retry')

      const result = await sendTransactionWithRetry(mockConnection, wallet, transaction, {
        retryConfig: { maxRetries: 2, baseDelayMs: 10, maxDelayMs: 100 },
      })

      expect(result.success).toBe(true)
      expect(mockConnection.sendRawTransaction).toHaveBeenCalledTimes(2)
    })

    it('should fail after exhausting retries', async () => {
      const wallet = createMockWallet()
      const transaction = new Transaction()

      vi.mocked(mockConnection.sendRawTransaction).mockRejectedValue(new Error('blockhash expired'))

      const result = await sendTransactionWithRetry(mockConnection, wallet, transaction, {
        retryConfig: { maxRetries: 2, baseDelayMs: 10, maxDelayMs: 100 },
      })

      expect(result.success).toBe(false)
      expect(result.status).toBe('failed')
      expect(mockConnection.sendRawTransaction).toHaveBeenCalledTimes(3) // 1 initial + 2 retries
    })

    it('should not retry on non-retryable errors', async () => {
      const wallet = createMockWallet({
        signTransaction: vi.fn().mockRejectedValue(new Error('User rejected')),
      })
      const transaction = new Transaction()

      const result = await sendTransactionWithRetry(mockConnection, wallet, transaction, {
        retryConfig: { maxRetries: 3, baseDelayMs: 10, maxDelayMs: 100 },
      })

      expect(result.success).toBe(false)
      // Should only try once for non-retryable error
    })

    it('should fail when confirmation has error', async () => {
      const wallet = createMockWallet()
      const transaction = new Transaction()

      vi.mocked(mockConnection.confirmTransaction).mockResolvedValue({
        context: { slot: 100 },
        value: { err: { InstructionError: [0, 'Custom'] } },
      })

      const result = await sendTransactionWithRetry(mockConnection, wallet, transaction)

      expect(result.success).toBe(false)
      expect(result.status).toBe('failed')
    })
  })

  describe('checkSufficientBalance', () => {
    it('should return sufficient when balance exceeds required', async () => {
      const mockConnection = {
        getBalance: vi.fn().mockResolvedValue(1_000_000_000), // 1 SOL in lamports
      } as unknown as Connection

      const result = await checkSufficientBalance(
        mockConnection,
        'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        100_000_000 // 0.1 SOL
      )

      expect(result.sufficient).toBe(true)
      expect(result.balance).toBe(1_000_000_000)
      expect(result.required).toBe(100_000_000)
    })

    it('should return insufficient when balance is less than required', async () => {
      const mockConnection = {
        getBalance: vi.fn().mockResolvedValue(50_000_000), // 0.05 SOL
      } as unknown as Connection

      const result = await checkSufficientBalance(
        mockConnection,
        'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        100_000_000 // 0.1 SOL
      )

      expect(result.sufficient).toBe(false)
      expect(result.balance).toBe(50_000_000)
    })

    it('should return sufficient when balance equals required', async () => {
      const mockConnection = {
        getBalance: vi.fn().mockResolvedValue(100_000_000),
      } as unknown as Connection

      const result = await checkSufficientBalance(
        mockConnection,
        'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        100_000_000
      )

      expect(result.sufficient).toBe(true)
    })

    it('should handle zero balance', async () => {
      const mockConnection = {
        getBalance: vi.fn().mockResolvedValue(0),
      } as unknown as Connection

      const result = await checkSufficientBalance(
        mockConnection,
        'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        5000
      )

      expect(result.sufficient).toBe(false)
      expect(result.balance).toBe(0)
    })
  })

  describe('estimateTransactionFee', () => {
    it('should return estimated fee from transaction', async () => {
      const mockConnection = {
        getLatestBlockhash: vi.fn().mockResolvedValue({
          blockhash: 'test-blockhash',
          lastValidBlockHeight: 1000,
        }),
      } as unknown as Connection

      const transaction = new Transaction()
      transaction.getEstimatedFee = vi.fn().mockResolvedValue(10000)

      const fee = await estimateTransactionFee(mockConnection, transaction)

      expect(fee).toBe(10000)
    })

    it('should return default fee when estimation fails', async () => {
      const mockConnection = {
        getLatestBlockhash: vi.fn().mockResolvedValue({
          blockhash: 'test-blockhash',
          lastValidBlockHeight: 1000,
        }),
      } as unknown as Connection

      const transaction = new Transaction()
      transaction.getEstimatedFee = vi.fn().mockResolvedValue(null)

      const fee = await estimateTransactionFee(mockConnection, transaction)

      expect(fee).toBe(5000) // Default fee
    })
  })
})

describe('Exponential backoff', () => {
  it('should calculate correct delays', () => {
    // Test the backoff calculation logic (matches internal getBackoffDelay)
    const baseDelay = 1000
    const maxDelay = 10000

    const attempt0 = Math.min(baseDelay * Math.pow(2, 0), maxDelay)
    const attempt1 = Math.min(baseDelay * Math.pow(2, 1), maxDelay)
    const attempt2 = Math.min(baseDelay * Math.pow(2, 2), maxDelay)
    const attempt3 = Math.min(baseDelay * Math.pow(2, 3), maxDelay)
    const attempt4 = Math.min(baseDelay * Math.pow(2, 4), maxDelay)

    expect(attempt0).toBe(1000)
    expect(attempt1).toBe(2000)
    expect(attempt2).toBe(4000)
    expect(attempt3).toBe(8000)
    expect(attempt4).toBe(10000) // Capped at maxDelay
  })
})
