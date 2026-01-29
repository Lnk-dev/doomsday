/**
 * Admin Analytics Page
 *
 * Platform analytics with metrics, charts, and leaderboards
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Users,
  TrendingUp,
  TrendingDown,
  FileText,
  Wallet,
  Calendar,
  Loader2,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { adminApi } from '../lib/adminApi'
import type { OverviewMetrics, TimeRange, TimeseriesData, LeaderboardData, LeaderboardType } from '../types/admin'

const TIME_RANGES: { id: TimeRange; label: string }[] = [
  { id: '24h', label: '24h' },
  { id: '7d', label: '7d' },
  { id: '30d', label: '30d' },
  { id: '90d', label: '90d' },
]

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  icon: React.ElementType
  iconColor: string
}

function MetricCard({ title, value, change, icon: Icon, iconColor }: MetricCardProps) {
  return (
    <div className="p-4 bg-[#111] border border-[#222] rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${iconColor}20` }}
        >
          <Icon className="w-5 h-5" style={{ color: iconColor }} />
        </div>
        {change !== undefined && (
          <div
            className={`flex items-center gap-1 text-[12px] font-medium ${
              change >= 0 ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <p className="text-[12px] text-[#777] mb-1">{title}</p>
      <p className="text-[24px] font-bold text-white">{value}</p>
    </div>
  )
}

export function AdminAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d')
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null)
  const [timeseries, setTimeseries] = useState<TimeseriesData | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null)
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>('bettors')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [metricsData, timeseriesData, leaderboardData] = await Promise.all([
        adminApi.getOverview(),
        adminApi.getTimeseries('dau', timeRange),
        adminApi.getLeaderboard(leaderboardType, timeRange),
      ])

      setMetrics(metricsData)
      setTimeseries(timeseriesData)
      setLeaderboard(leaderboardData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setIsLoading(false)
    }
  }, [timeRange, leaderboardType])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const formatChartData = (data: TimeseriesData | null) => {
    if (!data) return []
    return data.data.map((point) => ({
      date: new Date(point.timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      value: point.value,
    }))
  }

  if (isLoading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-[#ff3040] animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-semibold text-white">Analytics</h2>
          <p className="text-[14px] text-[#777]">Platform metrics and insights</p>
        </div>

        {/* Time range selector */}
        <div className="flex items-center gap-1 p-1 bg-[#111] border border-[#222] rounded-lg">
          {TIME_RANGES.map((range) => (
            <button
              key={range.id}
              onClick={() => setTimeRange(range.id)}
              className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
                timeRange === range.id
                  ? 'bg-[#ff3040]/10 text-[#ff3040]'
                  : 'text-[#777] hover:text-white'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-[14px] text-red-400">{error}</p>
        </div>
      )}

      {/* Metrics grid */}
      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <MetricCard
            title="Daily Active Users"
            value={metrics.dau.toLocaleString()}
            change={metrics.dauChange}
            icon={Users}
            iconColor="#3b82f6"
          />
          <MetricCard
            title="Weekly Active Users"
            value={metrics.wau.toLocaleString()}
            change={metrics.wauChange}
            icon={Users}
            iconColor="#8b5cf6"
          />
          <MetricCard
            title="Monthly Active Users"
            value={metrics.mau.toLocaleString()}
            change={metrics.mauChange}
            icon={Users}
            iconColor="#ec4899"
          />
          <MetricCard
            title="Total Posts"
            value={metrics.totalPosts.toLocaleString()}
            change={metrics.postsChange}
            icon={FileText}
            iconColor="#f59e0b"
          />
          <MetricCard
            title="Total Bets"
            value={metrics.totalBets.toLocaleString()}
            change={metrics.betsChange}
            icon={Wallet}
            iconColor="#22c55e"
          />
          <MetricCard
            title="Total Volume"
            value={`$${(metrics.totalVolume / 1000).toFixed(1)}k`}
            change={metrics.volumeChange}
            icon={TrendingUp}
            iconColor="#ef4444"
          />
        </div>
      )}

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DAU Chart */}
        <div className="bg-[#111] border border-[#222] rounded-xl p-4">
          <h3 className="text-[15px] font-medium text-white mb-4">Daily Active Users</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formatChartData(timeseries)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis
                  dataKey="date"
                  stroke="#555"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#555"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => value.toLocaleString()}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: '#999' }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#ff3040"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#ff3040' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-[#111] border border-[#222] rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-medium text-white">Leaderboard</h3>
            <div className="flex items-center gap-1">
              {(['bettors', 'posters', 'earners'] as LeaderboardType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setLeaderboardType(type)}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition-colors capitalize ${
                    leaderboardType === type
                      ? 'bg-[#ff3040]/10 text-[#ff3040]'
                      : 'text-[#555] hover:text-white'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {leaderboard?.entries.length === 0 ? (
            <p className="text-[13px] text-[#555] text-center py-8">No data available</p>
          ) : (
            <div className="space-y-2">
              {leaderboard?.entries.slice(0, 10).map((entry) => (
                <div
                  key={entry.userId}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-[#1a1a1a] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center text-[12px] font-bold text-[#555]">
                      #{entry.rank}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-[#333] flex items-center justify-center text-white text-[12px] font-medium overflow-hidden">
                      {entry.avatar ? (
                        <img src={entry.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        entry.username.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="text-[13px] text-white">{entry.username}</span>
                  </div>
                  <span className="text-[13px] font-medium text-[#ff3040]">
                    {entry.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Events summary */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-[#111] border border-[#222] rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-[12px] text-[#777]">Active Events</p>
                <p className="text-[20px] font-bold text-white">{metrics.activeEvents}</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-[#111] border border-[#222] rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-[12px] text-[#777]">Resolved Events</p>
                <p className="text-[20px] font-bold text-white">{metrics.resolvedEvents}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
