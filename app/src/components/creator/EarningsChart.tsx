/**
 * EarningsChart Component
 * Issue #117: Build creator monetization dashboard UI
 *
 * Simple line chart showing earnings over time with period toggle.
 */

import { useState, useMemo } from 'react'
import { TrendingUp } from 'lucide-react'
import { useCreatorStore } from '@/store/creator'
import { groupEarningsByPeriod, formatEarnings } from '@/lib/creatorStats'

type ChartPeriod = 'day' | 'week' | 'month'

interface EarningsChartProps {
  className?: string
}

export function EarningsChart({ className = '' }: EarningsChartProps) {
  const [period, setPeriod] = useState<ChartPeriod>('week')
  const earningsHistory = useCreatorStore((state) => state.earningsHistory)

  const chartData = useMemo(() => {
    const grouped = groupEarningsByPeriod(earningsHistory, period)
    // Take last N data points based on period
    const limit = period === 'day' ? 14 : period === 'week' ? 12 : 6
    return grouped.slice(-limit)
  }, [earningsHistory, period])

  const maxAmount = useMemo(() => {
    if (chartData.length === 0) return 100
    return Math.max(...chartData.map((d) => d.amount), 1)
  }, [chartData])

  const periodLabels: Record<ChartPeriod, string> = {
    day: 'Daily',
    week: 'Weekly',
    month: 'Monthly',
  }

  // Format label for display
  const formatLabel = (label: string, chartPeriod: ChartPeriod): string => {
    if (chartPeriod === 'month') {
      const [year, month] = label.split('-')
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      return monthNames[parseInt(month, 10) - 1] || label
    }
    // For day and week, show MM/DD
    const date = new Date(label)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  return (
    <div className={`rounded-2xl bg-[#1a1a1a] border border-[#333] overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#333] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#6366f120] flex items-center justify-center">
            <TrendingUp size={18} className="text-[#6366f1]" />
          </div>
          <h3 className="text-[16px] font-semibold text-white">Earnings Trend</h3>
        </div>

        {/* Period toggle */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[#111]">
          {(['day', 'week', 'month'] as ChartPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors ${
                period === p
                  ? 'bg-[#333] text-white'
                  : 'text-[#777] hover:text-white'
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Chart area */}
      <div className="p-4">
        {chartData.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-[#555] text-[14px]">
            No earnings data yet
          </div>
        ) : (
          <div className="h-40 flex items-end gap-1">
            {chartData.map((point, index) => {
              const height = (point.amount / maxAmount) * 100
              const isLast = index === chartData.length - 1

              return (
                <div
                  key={point.label}
                  className="flex-1 flex flex-col items-center group"
                >
                  {/* Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                    <div className="bg-[#333] px-2 py-1 rounded text-[10px] text-white whitespace-nowrap">
                      {formatEarnings(point.amount)}
                    </div>
                  </div>

                  {/* Bar */}
                  <div
                    className={`w-full rounded-t-sm transition-all ${
                      isLast ? 'bg-[#00ba7c]' : 'bg-[#6366f1] group-hover:bg-[#818cf8]'
                    }`}
                    style={{
                      height: `${Math.max(height, 4)}%`,
                      minHeight: '4px',
                    }}
                  />

                  {/* Label */}
                  <p className="text-[9px] text-[#555] mt-1 truncate max-w-full">
                    {formatLabel(point.label, period)}
                  </p>
                </div>
              )
            })}
          </div>
        )}

        {/* Y-axis labels */}
        {chartData.length > 0 && (
          <div className="flex justify-between mt-2 text-[10px] text-[#555]">
            <span>{formatEarnings(0)}</span>
            <span>{formatEarnings(maxAmount)}</span>
          </div>
        )}
      </div>
    </div>
  )
}
