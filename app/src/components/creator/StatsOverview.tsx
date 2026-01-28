/**
 * StatsOverview Component
 * Issue #117: Build creator monetization dashboard UI
 *
 * Displays creator statistics including followers, posts, and engagement.
 */

import { Users, FileText, Eye, TrendingUp, TrendingDown, Percent } from 'lucide-react'
import { useCreatorStore } from '@/store/creator'
import { calculateEngagementRate } from '@/lib/creatorStats'

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  trend?: number
  iconBgColor: string
  iconColor: string
}

function StatCard({ icon, label, value, trend, iconBgColor, iconColor }: StatCardProps) {
  const hasTrend = trend !== undefined
  const isPositive = trend && trend >= 0

  return (
    <div className="p-3 rounded-xl bg-[#1a1a1a] border border-[#333]">
      <div className="flex items-start justify-between mb-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: iconBgColor }}
        >
          <span style={{ color: iconColor }}>{icon}</span>
        </div>
        {hasTrend && (
          <div
            className={`flex items-center gap-0.5 text-[11px] font-medium ${
              isPositive ? 'text-[#00ba7c]' : 'text-[#ff3040]'
            }`}
          >
            {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {Math.abs(trend!).toFixed(1)}%
          </div>
        )}
      </div>
      <p className="text-[11px] text-[#777]">{label}</p>
      <p className="text-[20px] font-bold text-white">{value}</p>
    </div>
  )
}

function formatCompactNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`
  }
  return num.toString()
}

export function StatsOverview() {
  const followers = useCreatorStore((state) => state.followers)
  const totalPosts = useCreatorStore((state) => state.totalPosts)
  const totalViews = useCreatorStore((state) => state.totalViews)
  const totalLikes = useCreatorStore((state) => state.totalLikes)
  const totalComments = useCreatorStore((state) => state.totalComments)

  const engagementRate = calculateEngagementRate(totalLikes, totalComments, totalViews)

  // Mock growth indicators (in production these would come from historical data)
  const followerGrowth = 12.5
  const engagementGrowth = 8.3

  return (
    <div className="space-y-3">
      <h3 className="text-[14px] font-semibold text-white px-1">Statistics</h3>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<Users size={16} />}
          label="Followers"
          value={formatCompactNumber(followers)}
          trend={followerGrowth}
          iconBgColor="#6366f120"
          iconColor="#6366f1"
        />
        <StatCard
          icon={<FileText size={16} />}
          label="Total Posts"
          value={formatCompactNumber(totalPosts)}
          iconBgColor="#f59e0b20"
          iconColor="#f59e0b"
        />
        <StatCard
          icon={<Eye size={16} />}
          label="Total Views"
          value={formatCompactNumber(totalViews)}
          iconBgColor="#3b82f620"
          iconColor="#3b82f6"
        />
        <StatCard
          icon={<Percent size={16} />}
          label="Engagement"
          value={`${engagementRate.toFixed(1)}%`}
          trend={engagementGrowth}
          iconBgColor="#00ba7c20"
          iconColor="#00ba7c"
        />
      </div>

      {/* Engagement breakdown */}
      <div className="p-3 rounded-xl bg-[#1a1a1a] border border-[#333]">
        <p className="text-[12px] text-[#777] mb-2">Engagement Breakdown</p>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-[#777]">Likes</span>
              <span className="text-[12px] font-medium text-white">
                {formatCompactNumber(totalLikes)}
              </span>
            </div>
            <div className="h-1.5 bg-[#333] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#ff6b35] transition-all"
                style={{
                  width: `${totalViews > 0 ? Math.min((totalLikes / totalViews) * 100, 100) : 0}%`,
                }}
              />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-[#777]">Comments</span>
              <span className="text-[12px] font-medium text-white">
                {formatCompactNumber(totalComments)}
              </span>
            </div>
            <div className="h-1.5 bg-[#333] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#6366f1] transition-all"
                style={{
                  width: `${totalViews > 0 ? Math.min((totalComments / totalViews) * 100, 100) : 0}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
