/**
 * EarningsCard Component
 * Issue #117: Build creator monetization dashboard UI
 *
 * Displays creator earnings summary with total, monthly, and pending amounts.
 */

import { useState } from 'react'
import { DollarSign, TrendingUp, TrendingDown, Clock, ArrowUpRight } from 'lucide-react'
import { useCreatorStore, usePendingPayouts } from '@/store/creator'
import { formatEarnings, getEarningsTrend, formatPercentage } from '@/lib/creatorStats'

interface EarningsCardProps {
  onWithdraw?: () => void
}

export function EarningsCard({ onWithdraw }: EarningsCardProps) {
  const totalEarnings = useCreatorStore((state) => state.totalEarnings)
  const earningsHistory = useCreatorStore((state) => state.earningsHistory)
  const pendingPayouts = usePendingPayouts()
  const minimumWithdrawal = useCreatorStore((state) => state.minimumWithdrawal)

  // Calculate monthly earnings
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  const monthlyEarnings = earningsHistory
    .filter((e) => new Date(e.date).getTime() >= monthStart)
    .reduce((sum, e) => sum + e.amount, 0)

  // Calculate trend
  const trend = getEarningsTrend(earningsHistory, 30)
  const isPositiveTrend = trend >= 0

  const canWithdraw = pendingPayouts >= minimumWithdrawal

  return (
    <div className="rounded-2xl bg-[#1a1a1a] border border-[#333] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#333]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#00ba7c20] flex items-center justify-center">
            <DollarSign size={18} className="text-[#00ba7c]" />
          </div>
          <h3 className="text-[16px] font-semibold text-white">Earnings</h3>
        </div>
      </div>

      {/* Main earnings display */}
      <div className="p-4">
        <div className="mb-4">
          <p className="text-[12px] text-[#777] mb-1">Total Earnings</p>
          <div className="flex items-baseline gap-3">
            <p className="text-[32px] font-bold text-white">
              {formatEarnings(totalEarnings)}
            </p>
            <div
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] font-medium ${
                isPositiveTrend
                  ? 'bg-[#00ba7c20] text-[#00ba7c]'
                  : 'bg-[#ff304020] text-[#ff3040]'
              }`}
            >
              {isPositiveTrend ? (
                <TrendingUp size={12} />
              ) : (
                <TrendingDown size={12} />
              )}
              {formatPercentage(trend)}
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-[#111] border border-[#222]">
            <p className="text-[11px] text-[#777] mb-1">This Month</p>
            <p className="text-[20px] font-bold text-[#00ba7c]">
              {formatEarnings(monthlyEarnings)}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-[#111] border border-[#222]">
            <div className="flex items-center gap-1 mb-1">
              <Clock size={10} className="text-[#777]" />
              <p className="text-[11px] text-[#777]">Pending</p>
            </div>
            <p className="text-[20px] font-bold text-[#ff6b35]">
              {formatEarnings(pendingPayouts)}
            </p>
          </div>
        </div>

        {/* Withdraw button */}
        <button
          onClick={onWithdraw}
          disabled={!canWithdraw}
          className={`w-full py-3 rounded-xl text-[15px] font-semibold flex items-center justify-center gap-2 transition-colors ${
            canWithdraw
              ? 'bg-[#00ba7c] text-white hover:bg-[#00a56f]'
              : 'bg-[#333] text-[#777] cursor-not-allowed'
          }`}
        >
          <ArrowUpRight size={18} />
          Withdraw Funds
        </button>
        {!canWithdraw && (
          <p className="text-[11px] text-[#555] text-center mt-2">
            Minimum withdrawal: {formatEarnings(minimumWithdrawal)}
          </p>
        )}
      </div>
    </div>
  )
}
