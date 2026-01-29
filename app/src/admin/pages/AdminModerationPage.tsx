/**
 * Admin Moderation Page
 *
 * Content moderation queue with review actions
 */

import { useState, useEffect, useCallback } from 'react'
import { Shield, Clock, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'
import { adminApi } from '../lib/adminApi'
import { ContentReviewCard } from '../components/moderation/ContentReviewCard'
import type { ModerationQueue, ModerationStatus, ReviewAction } from '../types/admin'

type TabType = 'pending' | 'in_progress' | 'all'

const TABS: { id: TabType; label: string }[] = [
  { id: 'pending', label: 'Pending' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'all', label: 'All' },
]

interface StatCardProps {
  title: string
  value: number
  icon: React.ElementType
  iconColor: string
}

function StatCard({ title, value, icon: Icon, iconColor }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 p-4 bg-[#111] border border-[#222] rounded-xl">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `${iconColor}20` }}
      >
        <Icon className="w-5 h-5" style={{ color: iconColor }} />
      </div>
      <div>
        <p className="text-[12px] text-[#777]">{title}</p>
        <p className="text-[20px] font-bold text-white">{value}</p>
      </div>
    </div>
  )
}

export function AdminModerationPage() {
  const [activeTab, setActiveTab] = useState<TabType>('pending')
  const [data, setData] = useState<ModerationQueue | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [claimingId, setClaimingId] = useState<string | null>(null)

  const fetchQueue = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const status: ModerationStatus | undefined =
        activeTab === 'all' ? undefined : activeTab

      const result = await adminApi.getModerationQueue(status)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load moderation queue')
    } finally {
      setIsLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    fetchQueue()
  }, [fetchQueue])

  const handleClaim = async (itemId: string) => {
    try {
      setClaimingId(itemId)
      await adminApi.claimModerationItem(itemId)
      fetchQueue()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to claim item')
    } finally {
      setClaimingId(null)
    }
  }

  const handleUnclaim = async (itemId: string) => {
    try {
      setClaimingId(itemId)
      await adminApi.unclaimModerationItem(itemId)
      fetchQueue()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unclaim item')
    } finally {
      setClaimingId(null)
    }
  }

  const handleReview = async (itemId: string, action: ReviewAction, notes?: string) => {
    try {
      await adminApi.reviewModerationItem(itemId, { action, notes })
      fetchQueue()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to review item')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-[20px] font-semibold text-white">Moderation Queue</h2>
        <p className="text-[14px] text-[#777]">Review reported content and take action</p>
      </div>

      {/* Stats */}
      {data?.stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Pending"
            value={data.stats.pending}
            icon={Clock}
            iconColor="#f59e0b"
          />
          <StatCard
            title="In Progress"
            value={data.stats.inProgress}
            icon={Shield}
            iconColor="#3b82f6"
          />
          <StatCard
            title="Resolved Today"
            value={data.stats.resolvedToday}
            icon={CheckCircle}
            iconColor="#22c55e"
          />
          <StatCard
            title="High Priority"
            value={data.stats.highPriority}
            icon={AlertTriangle}
            iconColor="#ef4444"
          />
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-[#111] border border-[#222] rounded-lg w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-[#222] text-white'
                : 'text-[#777] hover:text-white'
            }`}
          >
            {tab.label}
            {tab.id === 'pending' && data?.stats?.pending ? (
              <span className="ml-1.5 px-1.5 py-0.5 bg-[#ff3040]/20 text-[#ff3040] text-[10px] rounded">
                {data.stats.pending}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-[14px] text-red-400">{error}</p>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 text-[#ff3040] animate-spin" />
        </div>
      ) : data?.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Shield className="w-12 h-12 text-[#333]" />
          <p className="text-[14px] text-[#555]">No items in the queue</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data?.items.map((item) => (
            <ContentReviewCard
              key={item.id}
              item={item}
              onClaim={() => handleClaim(item.id)}
              onUnclaim={() => handleUnclaim(item.id)}
              onReview={(action, notes) => handleReview(item.id, action, notes)}
              isClaiming={claimingId === item.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
