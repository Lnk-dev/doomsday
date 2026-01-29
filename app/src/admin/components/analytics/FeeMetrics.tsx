/**
 * Fee Metrics Admin Component
 * Issue #77: Platform fee tracking
 *
 * Displays platform fee collection statistics from the blockchain.
 */

import { useState, useEffect } from 'react'
import { useConnection } from '@solana/wallet-adapter-react'
import { Coins, TrendingUp, RefreshCw, Wallet, Percent } from 'lucide-react'
import { fetchPlatformConfig, type PlatformConfig } from '@/lib/solana/programs/predictionMarket'
import { getNetworkDisplayName } from '@/lib/solana/config'

interface FeeMetricsProps {
  refreshInterval?: number // in milliseconds, default 30000 (30s)
}

export function FeeMetrics({ refreshInterval = 30000 }: FeeMetricsProps) {
  const { connection } = useConnection()

  const [config, setConfig] = useState<PlatformConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchConfig = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const platformConfig = await fetchPlatformConfig(connection)
      setConfig(platformConfig)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Failed to fetch platform config:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchConfig()

    if (refreshInterval > 0) {
      const interval = setInterval(fetchConfig, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [connection, refreshInterval])

  // Format large numbers
  const formatNumber = (num: number): string => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`
    if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`
    return num.toFixed(2)
  }

  // Calculate total fees
  const totalDoomFees = config ? config.totalDoomFees.toNumber() / 1e9 : 0
  const totalLifeFees = config ? config.totalLifeFees.toNumber() / 1e9 : 0
  const totalFees = totalDoomFees + totalLifeFees

  // Fee percentage
  const feePercent = config ? config.feeBasisPoints / 100 : 0

  // Platform stats
  const totalEvents = config ? config.totalEvents.toNumber() : 0
  const totalBets = config ? config.totalBets.toNumber() : 0

  if (error) {
    return (
      <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
        <div className="text-center py-8">
          <div className="text-red-400 mb-2">Failed to load metrics</div>
          <p className="text-zinc-500 text-sm mb-4">{error}</p>
          <button
            onClick={fetchConfig}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white text-sm transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white">Platform Fee Metrics</h3>
          <p className="text-zinc-500 text-sm">
            Network: {getNetworkDisplayName()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-zinc-500 text-xs">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchConfig}
            disabled={isLoading}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Loading skeleton */}
      {isLoading && !config ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-zinc-800 rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-zinc-700 rounded w-20 mb-2" />
              <div className="h-8 bg-zinc-700 rounded w-24" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total Fees */}
            <div className="bg-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
                <Coins className="w-4 h-4" />
                Total Fees Collected
              </div>
              <div className="text-2xl font-bold text-white">
                {formatNumber(totalFees)}
              </div>
              <div className="text-emerald-400 text-sm">tokens</div>
            </div>

            {/* Fee Rate */}
            <div className="bg-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
                <Percent className="w-4 h-4" />
                Platform Fee Rate
              </div>
              <div className="text-2xl font-bold text-white">
                {feePercent}%
              </div>
              <div className="text-zinc-500 text-sm">per winning claim</div>
            </div>

            {/* Total Events */}
            <div className="bg-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
                <TrendingUp className="w-4 h-4" />
                Total Events
              </div>
              <div className="text-2xl font-bold text-white">
                {totalEvents.toLocaleString()}
              </div>
              <div className="text-zinc-500 text-sm">resolved</div>
            </div>

            {/* Total Bets */}
            <div className="bg-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
                <Wallet className="w-4 h-4" />
                Total Bets
              </div>
              <div className="text-2xl font-bold text-white">
                {totalBets.toLocaleString()}
              </div>
              <div className="text-zinc-500 text-sm">placed</div>
            </div>
          </div>

          {/* Fee Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* DOOM Fees */}
            <div className="bg-zinc-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-zinc-400 text-sm">DOOM Fees</span>
                <span className="text-red-400 font-bold">
                  {formatNumber(totalDoomFees)} $DOOM
                </span>
              </div>
              <div className="w-full bg-zinc-700 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${totalFees > 0 ? (totalDoomFees / totalFees) * 100 : 50}%`,
                  }}
                />
              </div>
            </div>

            {/* LIFE Fees */}
            <div className="bg-zinc-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-zinc-400 text-sm">LIFE Fees</span>
                <span className="text-emerald-400 font-bold">
                  {formatNumber(totalLifeFees)} $LIFE
                </span>
              </div>
              <div className="w-full bg-zinc-700 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${totalFees > 0 ? (totalLifeFees / totalFees) * 100 : 50}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Platform Config Info */}
          {config && (
            <div className="bg-zinc-800/50 rounded-lg p-4 text-sm">
              <h4 className="font-medium text-white mb-3">Platform Configuration</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-zinc-400">
                <div>
                  <span className="text-zinc-500">Authority: </span>
                  <span className="font-mono text-xs">
                    {config.authority.toBase58().slice(0, 8)}...{config.authority.toBase58().slice(-8)}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500">Oracle: </span>
                  <span className="font-mono text-xs">
                    {config.oracle.toBase58().slice(0, 8)}...{config.oracle.toBase58().slice(-8)}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500">Status: </span>
                  <span className={config.paused ? 'text-red-400' : 'text-emerald-400'}>
                    {config.paused ? 'Paused' : 'Active'}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500">Fee Basis Points: </span>
                  <span>{config.feeBasisPoints}</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

/**
 * Compact fee card for dashboard overview
 */
export function FeeMetricsCard() {
  const { connection } = useConnection()
  const [totalFees, setTotalFees] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchFees = async () => {
      try {
        const config = await fetchPlatformConfig(connection)
        if (config) {
          const doom = config.totalDoomFees.toNumber() / 1e9
          const life = config.totalLifeFees.toNumber() / 1e9
          setTotalFees(doom + life)
        }
      } catch {
        // Silently fail for card
      } finally {
        setIsLoading(false)
      }
    }

    fetchFees()
  }, [connection])

  if (isLoading) {
    return (
      <div className="bg-zinc-800 rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-zinc-700 rounded w-16 mb-2" />
        <div className="h-6 bg-zinc-700 rounded w-20" />
      </div>
    )
  }

  return (
    <div className="bg-zinc-800 rounded-lg p-4">
      <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
        <Coins className="w-4 h-4" />
        Fees Collected
      </div>
      <div className="text-xl font-bold text-emerald-400">
        {totalFees >= 1000 ? `${(totalFees / 1000).toFixed(1)}K` : totalFees.toFixed(2)}
      </div>
    </div>
  )
}
