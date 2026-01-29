/**
 * Admin Dashboard Page
 *
 * Overview page with key metrics and quick actions
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  Shield,
  AlertTriangle,
  Calendar,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import { adminApi } from '../lib/adminApi'
import { useAdminAuthStore } from '../store/adminAuth'
import type { OverviewMetrics } from '../types/admin'

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  icon: React.ElementType
  iconColor: string
  onClick?: () => void
}

function StatCard({ title, value, change, icon: Icon, iconColor, onClick }: StatCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`
        flex flex-col p-4 bg-[#111] border border-[#222] rounded-xl text-left
        ${onClick ? 'hover:border-[#333] hover:bg-[#1a1a1a] cursor-pointer' : 'cursor-default'}
        transition-colors
      `}
    >
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
      <p className="text-[13px] text-[#777] mb-1">{title}</p>
      <p className="text-[24px] font-bold text-white">{value}</p>
    </button>
  )
}

interface QuickActionProps {
  title: string
  description: string
  icon: React.ElementType
  onClick: () => void
}

function QuickAction({ title, description, icon: Icon, onClick }: QuickActionProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-4 p-4 bg-[#111] border border-[#222] rounded-xl hover:border-[#333] hover:bg-[#1a1a1a] transition-colors text-left w-full"
    >
      <div className="w-10 h-10 rounded-lg bg-[#1a1a1a] flex items-center justify-center">
        <Icon className="w-5 h-5 text-[#777]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium text-white">{title}</p>
        <p className="text-[12px] text-[#777]">{description}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-[#555]" />
    </button>
  )
}

export function AdminDashboardPage() {
  const navigate = useNavigate()
  const hasPermission = useAdminAuthStore((state) => state.hasPermission)

  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await adminApi.getOverview()
        setMetrics(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load metrics')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMetrics()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-[#ff3040] animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertTriangle className="w-8 h-8 text-[#ff3040]" />
        <p className="text-[14px] text-[#777]">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-[13px] font-medium text-white bg-[#222] rounded-lg hover:bg-[#333] transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div>
        <h2 className="text-[20px] font-semibold text-white mb-1">Welcome back</h2>
        <p className="text-[14px] text-[#777]">Here's what's happening today</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={metrics?.totalUsers?.toLocaleString() ?? '-'}
          change={metrics?.userGrowth}
          icon={Users}
          iconColor="#3b82f6"
          onClick={hasPermission('users.view') ? () => navigate('/admin/users') : undefined}
        />
        <StatCard
          title="Moderation Queue"
          value={metrics?.pendingModeration ?? '-'}
          icon={Shield}
          iconColor="#f59e0b"
          onClick={hasPermission('moderation.review') ? () => navigate('/admin/moderation') : undefined}
        />
        <StatCard
          title="Reported Content"
          value={metrics?.reportedContent ?? '-'}
          icon={AlertTriangle}
          iconColor="#ef4444"
          onClick={hasPermission('moderation.review') ? () => navigate('/admin/moderation') : undefined}
        />
        <StatCard
          title="Pending Events"
          value={metrics?.pendingEvents ?? '-'}
          icon={Calendar}
          iconColor="#8b5cf6"
          onClick={hasPermission('events.resolve') ? () => navigate('/admin/events') : undefined}
        />
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="text-[15px] font-medium text-white mb-3">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {hasPermission('moderation.review') && (
            <QuickAction
              title="Review Moderation Queue"
              description="Review flagged content and user reports"
              icon={Shield}
              onClick={() => navigate('/admin/moderation')}
            />
          )}
          {hasPermission('users.view') && (
            <QuickAction
              title="Manage Users"
              description="View and manage user accounts"
              icon={Users}
              onClick={() => navigate('/admin/users')}
            />
          )}
          {hasPermission('events.resolve') && (
            <QuickAction
              title="Resolve Events"
              description="Process pending event resolutions"
              icon={Calendar}
              onClick={() => navigate('/admin/events')}
            />
          )}
          {hasPermission('analytics.view') && (
            <QuickAction
              title="View Analytics"
              description="Platform metrics and insights"
              icon={TrendingUp}
              onClick={() => navigate('/admin/analytics')}
            />
          )}
        </div>
      </div>

      {/* Recent activity placeholder */}
      <div>
        <h3 className="text-[15px] font-medium text-white mb-3">Recent Activity</h3>
        <div className="bg-[#111] border border-[#222] rounded-xl p-6">
          <p className="text-[14px] text-[#555] text-center">
            Activity feed coming soon
          </p>
        </div>
      </div>
    </div>
  )
}
