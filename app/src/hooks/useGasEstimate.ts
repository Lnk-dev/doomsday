/**
 * Gas Estimate Hook
 * Issue #104: Gas fee estimation and optimization UI
 *
 * Custom hook for fetching and managing gas estimates with auto-refresh.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  type GasEstimate,
  type CongestionLevel,
  GasPriority,
  getAllGasEstimates,
  setSolPrice,
} from '@/lib/gasFees'

/** Refresh interval in milliseconds */
const REFRESH_INTERVAL = 30_000 // 30 seconds

interface UseGasEstimateResult {
  /** Gas estimates for all priority levels */
  estimates: GasEstimate[]
  /** Currently selected priority */
  selectedPriority: GasPriority
  /** Set the selected priority */
  setSelectedPriority: (priority: GasPriority) => void
  /** Current network congestion level */
  congestionLevel: CongestionLevel
  /** Network multiplier based on congestion */
  networkMultiplier: number
  /** Whether estimates are currently loading */
  isLoading: boolean
  /** Error message if fetch failed */
  error: string | null
  /** Manually refresh estimates */
  refresh: () => Promise<void>
  /** Timestamp of last refresh */
  lastRefresh: number | null
}

/**
 * Mock function to fetch network gas prices
 * In production, this would call a Solana RPC or priority fee API
 */
async function fetchNetworkGasPrices(): Promise<{
  multiplier: number
  congestion: CongestionLevel
  solPrice: number
}> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Mock: Generate slightly random multiplier to simulate network conditions
  const baseMultiplier = 1.0
  const variance = Math.random() * 0.4 - 0.2 // -0.2 to +0.2
  const multiplier = Math.max(0.5, baseMultiplier + variance)

  // Determine congestion based on multiplier
  let congestion: CongestionLevel = 'normal'
  if (multiplier < 0.8) {
    congestion = 'low'
  } else if (multiplier > 1.3) {
    congestion = 'high'
  } else if (multiplier > 1.6) {
    congestion = 'very-high'
  }

  // Mock SOL price (would come from price feed in production)
  const solPrice = 150 + Math.random() * 10 - 5 // $145-$155

  return {
    multiplier,
    congestion,
    solPrice,
  }
}

/**
 * Hook for managing gas estimates with auto-refresh
 * @param initialPriority - Initial priority level to select
 * @param autoRefresh - Whether to auto-refresh estimates
 * @returns Gas estimates and control functions
 */
export function useGasEstimate(
  initialPriority: GasPriority = GasPriority.STANDARD,
  autoRefresh: boolean = true
): UseGasEstimateResult {
  const [estimates, setEstimates] = useState<GasEstimate[]>([])
  const [selectedPriority, setSelectedPriority] = useState<GasPriority>(initialPriority)
  const [congestionLevel, setCongestionLevel] = useState<CongestionLevel>('normal')
  const [networkMultiplier, setNetworkMultiplier] = useState<number>(1.0)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<number | null>(null)

  const refreshIntervalRef = useRef<number | null>(null)
  const isMountedRef = useRef<boolean>(true)

  const refresh = useCallback(async () => {
    if (!isMountedRef.current) return

    setIsLoading(true)
    setError(null)

    try {
      const { multiplier, congestion, solPrice } = await fetchNetworkGasPrices()

      if (!isMountedRef.current) return

      // Update SOL price for USD calculations
      setSolPrice(solPrice)

      // Calculate estimates with network multiplier
      const newEstimates = getAllGasEstimates(multiplier)

      setNetworkMultiplier(multiplier)
      setCongestionLevel(congestion)
      setEstimates(newEstimates)
      setLastRefresh(Date.now())
    } catch (err) {
      if (!isMountedRef.current) return

      setError(err instanceof Error ? err.message : 'Failed to fetch gas estimates')
      // Use default estimates on error
      setEstimates(getAllGasEstimates(1.0))
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [])

  // Initial fetch and auto-refresh setup
  useEffect(() => {
    isMountedRef.current = true

    // Initial fetch
    refresh()

    // Set up auto-refresh
    if (autoRefresh) {
      refreshIntervalRef.current = window.setInterval(refresh, REFRESH_INTERVAL)
    }

    return () => {
      isMountedRef.current = false
      if (refreshIntervalRef.current !== null) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [refresh, autoRefresh])

  return {
    estimates,
    selectedPriority,
    setSelectedPriority,
    congestionLevel,
    networkMultiplier,
    isLoading,
    error,
    refresh,
    lastRefresh,
  }
}

/**
 * Get the estimate for a specific priority from the estimates array
 */
export function getEstimateByPriority(
  estimates: GasEstimate[],
  priority: GasPriority
): GasEstimate | undefined {
  return estimates.find((e) => e.priority === priority)
}
