/**
 * Odds Chart Component
 * Issue #54: Price charts and analytics
 *
 * Displays historical odds/pool ratio for prediction events using Recharts.
 */

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from 'recharts'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface OddsDataPoint {
  timestamp: number
  doomOdds: number
  lifeOdds: number
  doomPool: number
  lifePool: number
}

interface OddsChartProps {
  data: OddsDataPoint[]
  eventTitle?: string
  timeRange?: '1h' | '24h' | '7d' | '30d' | 'all'
  onTimeRangeChange?: (range: '1h' | '24h' | '7d' | '30d' | 'all') => void
  variant?: 'line' | 'area'
  showPools?: boolean
}

export function OddsChart({
  data,
  eventTitle,
  timeRange = '24h',
  onTimeRangeChange,
  variant = 'area',
  showPools = false,
}: OddsChartProps) {
  // Calculate current odds and trend
  const { currentDoomOdds, trend, trendPercent } = useMemo(() => {
    if (data.length === 0) {
      return { currentDoomOdds: 50, trend: 'neutral' as const, trendPercent: 0 }
    }

    const current = data[data.length - 1]
    const previous = data.length > 1 ? data[data.length - 2] : current

    const currentDoomOdds = current.doomOdds
    const change = currentDoomOdds - previous.doomOdds

    let trend: 'up' | 'down' | 'neutral' = 'neutral'
    if (change > 0.5) trend = 'up'
    else if (change < -0.5) trend = 'down'

    return {
      currentDoomOdds,
      trend,
      trendPercent: Math.abs(change),
    }
  }, [data])

  // Format timestamp for X axis
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    if (timeRange === '1h' || timeRange === '24h') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ color: string; name: string; value: number }>; label?: number }) => {
    if (!active || !payload || !payload.length) return null

    const date = new Date(label || 0)
    return (
      <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 shadow-lg">
        <p className="text-zinc-400 text-xs mb-2">
          {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
        {payload.map((entry, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-zinc-300">{entry.name}:</span>
            <span className="font-medium text-white">
              {entry.name.includes('Pool')
                ? entry.value.toLocaleString()
                : `${entry.value.toFixed(1)}%`}
            </span>
          </div>
        ))}
      </div>
    )
  }

  // Time range buttons
  const timeRanges: Array<{ value: '1h' | '24h' | '7d' | '30d' | 'all'; label: string }> = [
    { value: '1h', label: '1H' },
    { value: '24h', label: '24H' },
    { value: '7d', label: '7D' },
    { value: '30d', label: '30D' },
    { value: 'all', label: 'All' },
  ]

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus

  return (
    <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          {eventTitle && (
            <h3 className="font-medium text-white text-sm mb-1">{eventTitle}</h3>
          )}
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white">
              {currentDoomOdds.toFixed(1)}%
            </span>
            <span className="text-zinc-400 text-sm">DOOM odds</span>
            <div
              className={`flex items-center gap-1 text-sm ${
                trend === 'up'
                  ? 'text-red-400'
                  : trend === 'down'
                  ? 'text-emerald-400'
                  : 'text-zinc-400'
              }`}
            >
              <TrendIcon className="w-4 h-4" />
              <span>{trendPercent.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Time Range Selector */}
        {onTimeRangeChange && (
          <div className="flex gap-1 bg-zinc-800 rounded-lg p-1">
            {timeRanges.map((range) => (
              <button
                key={range.value}
                onClick={() => onTimeRangeChange(range.value)}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  timeRange === range.value
                    ? 'bg-zinc-700 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="h-64">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-zinc-500">
            No historical data available
          </div>
        ) : variant === 'area' ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="doomGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="lifeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatTime}
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
                stroke="#6b7280"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: 10 }}
                formatter={(value) => <span className="text-zinc-300 text-xs">{value}</span>}
              />
              <Area
                type="monotone"
                dataKey="doomOdds"
                name="DOOM Odds"
                stroke="#ef4444"
                fill="url(#doomGradient)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="lifeOdds"
                name="LIFE Odds"
                stroke="#10b981"
                fill="url(#lifeGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatTime}
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis
                domain={showPools ? undefined : [0, 100]}
                tickFormatter={(value) => (showPools ? value.toLocaleString() : `${value}%`)}
                stroke="#6b7280"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: 10 }}
                formatter={(value) => <span className="text-zinc-300 text-xs">{value}</span>}
              />
              {showPools ? (
                <>
                  <Line
                    type="monotone"
                    dataKey="doomPool"
                    name="DOOM Pool"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="lifePool"
                    name="LIFE Pool"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                  />
                </>
              ) : (
                <>
                  <Line
                    type="monotone"
                    dataKey="doomOdds"
                    name="DOOM Odds"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="lifeOdds"
                    name="LIFE Odds"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Current Pool Stats */}
      {data.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-zinc-800">
          <div className="text-center">
            <div className="text-red-400 font-bold text-lg">
              {data[data.length - 1].doomPool.toLocaleString()}
            </div>
            <div className="text-zinc-500 text-xs">DOOM Pool</div>
          </div>
          <div className="text-center">
            <div className="text-emerald-400 font-bold text-lg">
              {data[data.length - 1].lifePool.toLocaleString()}
            </div>
            <div className="text-zinc-500 text-xs">LIFE Pool</div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Generate mock historical data for demo/testing
 */
export function generateMockOddsData(
  daysBack: number,
  currentDoomPool: number,
  currentLifePool: number
): OddsDataPoint[] {
  const data: OddsDataPoint[] = []
  const now = Date.now()
  const interval = (daysBack * 24 * 60 * 60 * 1000) / 100 // 100 data points

  let doomPool = currentDoomPool * 0.3 // Start at 30% of current
  let lifePool = currentLifePool * 0.3

  for (let i = 0; i <= 100; i++) {
    const timestamp = now - (100 - i) * interval

    // Gradually increase pools with some randomness
    const doomGrowth = (currentDoomPool - doomPool) * 0.02 + (Math.random() - 0.4) * currentDoomPool * 0.01
    const lifeGrowth = (currentLifePool - lifePool) * 0.02 + (Math.random() - 0.4) * currentLifePool * 0.01

    doomPool = Math.max(0, doomPool + doomGrowth)
    lifePool = Math.max(0, lifePool + lifeGrowth)

    const totalPool = doomPool + lifePool || 1
    const doomOdds = (doomPool / totalPool) * 100
    const lifeOdds = (lifePool / totalPool) * 100

    data.push({
      timestamp,
      doomOdds,
      lifeOdds,
      doomPool: Math.round(doomPool),
      lifePool: Math.round(lifePool),
    })
  }

  return data
}

/**
 * Mini sparkline chart for compact display
 */
interface OddsSparklineProps {
  data: OddsDataPoint[]
  width?: number
  height?: number
}

export function OddsSparkline({ data, width = 80, height = 24 }: OddsSparklineProps) {
  if (data.length < 2) return null

  const values = data.map((d) => d.doomOdds)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width
      const y = height - ((v - min) / range) * height
      return `${x},${y}`
    })
    .join(' ')

  const trend = values[values.length - 1] - values[0]

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={trend > 0 ? '#ef4444' : '#10b981'}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
