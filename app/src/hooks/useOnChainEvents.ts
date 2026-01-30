/**
 * On-Chain Events Hook
 * Syncs prediction events from the Solana blockchain
 */

import { useEffect, useCallback } from 'react'
import { useConnection } from '@solana/wallet-adapter-react'
import { useEventsStore } from '@/store/events'

interface UseOnChainEventsOptions {
  /** Auto-sync on mount (default: true) */
  autoSync?: boolean
  /** Refresh interval in ms (default: 30000 = 30s) */
  refreshInterval?: number
}

export function useOnChainEvents(options: UseOnChainEventsOptions = {}) {
  const { autoSync = true, refreshInterval = 30000 } = options

  const { connection } = useConnection()
  const syncEventsFromChain = useEventsStore((s) => s.syncEventsFromChain)
  const isLoading = useEventsStore((s) => s.isLoading)
  const error = useEventsStore((s) => s.error)
  const lastSyncAt = useEventsStore((s) => s.lastSyncAt)
  const setError = useEventsStore((s) => s.setError)

  const sync = useCallback(async () => {
    try {
      await syncEventsFromChain(connection)
    } catch (err) {
      console.error('Failed to sync events:', err)
    }
  }, [connection, syncEventsFromChain])

  // Auto-sync on mount
  useEffect(() => {
    if (autoSync) {
      sync()
    }
  }, [autoSync, sync])

  // Periodic refresh
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(sync, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [refreshInterval, sync])

  return {
    sync,
    isLoading,
    error,
    lastSyncAt,
    clearError: () => setError(null),
  }
}
