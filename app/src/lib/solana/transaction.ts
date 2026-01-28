/**
 * Solana Transaction Utilities
 * Issue #101: Transaction retry and error handling system
 *
 * Provides transaction sending with automatic retry and error handling.
 */

import {
  Connection,
  Transaction,
  VersionedTransaction,
} from '@solana/web3.js'
import type { TransactionSignature, Commitment } from '@solana/web3.js'
import type { WalletContextState } from '@solana/wallet-adapter-react'
import { classifyError, type SolanaError } from './errors'

export type TransactionStatus =
  | 'pending'
  | 'signing'
  | 'sending'
  | 'confirming'
  | 'confirmed'
  | 'failed'

export interface TransactionResult {
  success: boolean
  signature?: TransactionSignature
  error?: SolanaError
  status: TransactionStatus
}

export interface RetryConfig {
  maxRetries: number
  baseDelayMs: number
  maxDelayMs: number
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
}

/**
 * Calculate exponential backoff delay
 */
function getBackoffDelay(attempt: number, config: RetryConfig): number {
  const delay = config.baseDelayMs * Math.pow(2, attempt)
  return Math.min(delay, config.maxDelayMs)
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Send and confirm a transaction with retry logic
 */
export async function sendTransactionWithRetry(
  connection: Connection,
  wallet: WalletContextState,
  transaction: Transaction | VersionedTransaction,
  options?: {
    commitment?: Commitment
    retryConfig?: Partial<RetryConfig>
    onStatusChange?: (status: TransactionStatus) => void
  }
): Promise<TransactionResult> {
  const config = { ...DEFAULT_RETRY_CONFIG, ...options?.retryConfig }
  const commitment = options?.commitment ?? 'confirmed'
  const onStatusChange = options?.onStatusChange ?? (() => {})

  if (!wallet.publicKey || !wallet.signTransaction) {
    return {
      success: false,
      status: 'failed',
      error: {
        type: 'USER_REJECTED',
        message: 'Wallet not connected',
        recoverable: true,
        retryable: false,
      },
    }
  }

  let lastError: SolanaError | undefined

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      // Get latest blockhash for fresh transaction
      onStatusChange('pending')
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash(commitment)

      if (transaction instanceof Transaction) {
        transaction.recentBlockhash = blockhash
        transaction.feePayer = wallet.publicKey
      }

      // Sign the transaction
      onStatusChange('signing')
      const signedTx = await wallet.signTransaction(transaction)

      // Send the transaction
      onStatusChange('sending')
      const signature = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false,
        preflightCommitment: commitment,
      })

      // Confirm the transaction
      onStatusChange('confirming')
      const confirmation = await connection.confirmTransaction(
        { signature, blockhash, lastValidBlockHeight },
        commitment
      )

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`)
      }

      onStatusChange('confirmed')
      return {
        success: true,
        signature,
        status: 'confirmed',
      }

    } catch (error) {
      lastError = classifyError(error)

      // Don't retry non-retryable errors
      if (!lastError.retryable) {
        onStatusChange('failed')
        return {
          success: false,
          error: lastError,
          status: 'failed',
        }
      }

      // Wait before retry (with exponential backoff)
      if (attempt < config.maxRetries) {
        const delay = getBackoffDelay(attempt, config)
        await sleep(delay)
      }
    }
  }

  // All retries exhausted
  onStatusChange('failed')
  return {
    success: false,
    error: lastError ?? {
      type: 'UNKNOWN',
      message: 'Transaction failed after all retries',
      recoverable: false,
      retryable: false,
    },
    status: 'failed',
  }
}

/**
 * Check if wallet has sufficient SOL for a transaction
 */
export async function checkSufficientBalance(
  connection: Connection,
  walletPublicKey: string,
  requiredLamports: number
): Promise<{ sufficient: boolean; balance: number; required: number }> {
  const { PublicKey } = await import('@solana/web3.js')
  const balance = await connection.getBalance(new PublicKey(walletPublicKey))
  return {
    sufficient: balance >= requiredLamports,
    balance,
    required: requiredLamports,
  }
}

/**
 * Estimate transaction fee
 */
export async function estimateTransactionFee(
  connection: Connection,
  transaction: Transaction
): Promise<number> {
  const { blockhash } = await connection.getLatestBlockhash()
  transaction.recentBlockhash = blockhash
  const fee = await transaction.getEstimatedFee(connection)
  return fee ?? 5000 // Default to 5000 lamports if estimation fails
}
