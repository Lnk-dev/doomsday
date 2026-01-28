/**
 * Transaction Hook
 * Issue #101: Transaction retry and error handling system
 *
 * Custom hook for sending transactions with tracking and error handling.
 */

import { useCallback, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Transaction, VersionedTransaction } from '@solana/web3.js'
import {
  sendTransactionWithRetry,
  type TransactionResult,
  type TransactionStatus,
} from '@/lib/solana/transaction'
import { useTransactionStore, type TrackedTransaction } from '@/store/transactions'
import { toast } from '@/store'

type TransactionType = TrackedTransaction['type']

interface UseTransactionOptions {
  onSuccess?: (signature: string) => void
  onError?: (error: TransactionResult['error']) => void
  showToasts?: boolean
}

export function useTransaction(options: UseTransactionOptions = {}) {
  const { connection } = useConnection()
  const wallet = useWallet()
  const addTransaction = useTransactionStore((s) => s.addTransaction)
  const updateTransaction = useTransactionStore((s) => s.updateTransaction)

  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<TransactionStatus | null>(null)
  const [error, setError] = useState<TransactionResult['error'] | null>(null)

  const { onSuccess, onError, showToasts = true } = options

  const sendTransaction = useCallback(
    async (
      transaction: Transaction | VersionedTransaction,
      txType: TransactionType,
      description: string
    ): Promise<TransactionResult> => {
      const txId = `tx-${Date.now()}-${Math.random().toString(36).slice(2)}`

      setIsLoading(true)
      setError(null)
      setStatus('pending')

      // Add to store
      addTransaction({
        id: txId,
        status: 'pending',
        type: txType,
        description,
      })

      const result = await sendTransactionWithRetry(connection, wallet, transaction, {
        onStatusChange: (newStatus) => {
          setStatus(newStatus)
          updateTransaction(txId, { status: newStatus })
        },
      })

      setIsLoading(false)

      if (result.success && result.signature) {
        updateTransaction(txId, {
          status: 'confirmed',
          signature: result.signature,
        })

        if (showToasts) {
          toast.success('Transaction confirmed')
        }
        onSuccess?.(result.signature)
      } else if (result.error) {
        setError(result.error)
        updateTransaction(txId, {
          status: 'failed',
          error: result.error,
        })

        if (showToasts) {
          toast.error(result.error.message)
        }
        onError?.(result.error)
      }

      return result
    },
    [connection, wallet, addTransaction, updateTransaction, showToasts, onSuccess, onError]
  )

  const reset = useCallback(() => {
    setIsLoading(false)
    setStatus(null)
    setError(null)
  }, [])

  return {
    sendTransaction,
    isLoading,
    status,
    error,
    reset,
    connected: wallet.connected,
  }
}
