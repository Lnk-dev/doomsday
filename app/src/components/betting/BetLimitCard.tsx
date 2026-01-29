/**
 * BetLimitCard Component
 *
 * Displays current betting limits with progress bars showing usage.
 * Shows daily, weekly, and monthly limits with an edit button.
 */

import { useNavigate } from 'react-router-dom'
import { DollarSign, Clock, Edit2, ChevronRight, AlertTriangle, Check } from 'lucide-react'
import { useResponsibleGamblingStore, formatTimeRemaining } from '@/store/responsibleGambling'

interface BetLimitCardProps {
  /** Show compact version (single card) */
  compact?: boolean
  /** Hide the edit button */
  hideEditButton?: boolean
  /** Additional CSS classes */
  className?: string
}

interface LimitProgressProps {
  label: string
  used: number
  limit: number | null
  period: 'day' | 'week' | 'month'
  pendingIncrease?: { amount: number; effectiveAt: number }
}

/**
 * Progress bar for individual limit
 */
function LimitProgress({ label, used, limit, period, pendingIncrease }: LimitProgressProps) {
  if (limit === null) {
    return (
      <div className="py-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[13px] text-[var(--color-text-secondary)]">{label}</span>
          <span className="text-[12px] text-[var(--color-text-muted)]">No limit set</span>
        </div>
        <div className="h-2 bg-[var(--color-bg-primary)] rounded-full overflow-hidden">
          <div className="h-full w-0 bg-[var(--color-text-muted)] rounded-full" />
        </div>
      </div>
    )
  }

  const percentage = Math.min((used / limit) * 100, 100)
  const remaining = Math.max(0, limit - used)
  const isNearLimit = percentage >= 80
  const isAtLimit = percentage >= 100

  // Determine color based on usage
  let color = '#00ba7c' // Green
  if (percentage >= 50) color = '#f59e0b' // Yellow
  if (percentage >= 80) color = '#f97316' // Orange
  if (percentage >= 100) color = '#ff3040' // Red

  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[13px] text-[var(--color-text-secondary)]">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-[var(--color-text-muted)]">
            ${used.toFixed(2)} / ${limit.toFixed(2)}
          </span>
          {isAtLimit && <Check size={12} className="text-[var(--color-doom)]" />}
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 bg-[var(--color-bg-primary)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </div>

      {/* Status text */}
      <div className="flex items-center justify-between mt-1">
        <span className="text-[10px] text-[var(--color-text-muted)]">
          {percentage.toFixed(0)}% used this {period}
        </span>
        <span
          className="text-[10px] font-medium"
          style={{ color: isNearLimit ? color : 'var(--color-text-muted)' }}
        >
          ${remaining.toFixed(2)} remaining
        </span>
      </div>

      {/* Pending increase notice */}
      {pendingIncrease && (
        <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-[#f59e0b]">
          <Clock size={10} />
          <span>
            Increase to ${pendingIncrease.amount.toFixed(2)} in{' '}
            {formatTimeRemaining(pendingIncrease.effectiveAt)}
          </span>
        </div>
      )}
    </div>
  )
}

export function BetLimitCard({ compact = false, hideEditButton = false, className = '' }: BetLimitCardProps) {
  const navigate = useNavigate()
  const limits = useResponsibleGamblingStore((s) => s.limits)

  // Check if any limits are set
  const hasAnyLimit =
    limits.daily.amount !== null ||
    limits.weekly.amount !== null ||
    limits.monthly.amount !== null

  // Check if any limit is near or at capacity
  const isNearAnyLimit = (() => {
    const types = ['daily', 'weekly', 'monthly'] as const
    for (const type of types) {
      const limit = limits[type]
      if (limit.amount !== null) {
        const percentage = (limit.currentUsage / limit.amount) * 100
        if (percentage >= 80) return true
      }
    }
    return false
  })()

  if (compact) {
    return (
      <button
        onClick={() => navigate('/settings/betting-limits')}
        className={`w-full p-4 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)] text-left ${className}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-bg-primary)] flex items-center justify-center">
              <DollarSign size={20} className="text-[var(--color-text-secondary)]" />
            </div>
            <div>
              <p className="text-[14px] font-medium text-[var(--color-text-primary)]">
                Betting Limits
              </p>
              <p className="text-[12px] text-[var(--color-text-muted)]">
                {hasAnyLimit ? 'Limits configured' : 'No limits set'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isNearAnyLimit && (
              <div className="w-2 h-2 rounded-full bg-[#f59e0b] animate-pulse" />
            )}
            <ChevronRight size={18} className="text-[var(--color-text-muted)]" />
          </div>
        </div>
      </button>
    )
  }

  return (
    <div
      className={`p-4 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)] ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <DollarSign size={18} className="text-[var(--color-text-secondary)]" />
          <h3 className="text-[15px] font-medium text-[var(--color-text-primary)]">
            Betting Limits
          </h3>
        </div>
        {!hideEditButton && (
          <button
            onClick={() => navigate('/settings/betting-limits')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-[var(--color-doom)] hover:bg-[var(--color-doom)]/10 rounded-lg transition-colors"
          >
            <Edit2 size={12} />
            Edit
          </button>
        )}
      </div>

      {/* Warning if near limits */}
      {isNearAnyLimit && (
        <div className="mb-4 p-2.5 bg-[#f59e0b]/10 rounded-lg flex items-start gap-2">
          <AlertTriangle size={14} className="text-[#f59e0b] mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-[#f59e0b]">
            You are approaching one or more of your betting limits. Consider taking a break.
          </p>
        </div>
      )}

      {/* Limits */}
      {!hasAnyLimit ? (
        <div className="py-6 text-center">
          <DollarSign size={32} className="mx-auto text-[var(--color-text-muted)] mb-2" />
          <p className="text-[13px] text-[var(--color-text-muted)]">No limits configured</p>
          <button
            onClick={() => navigate('/settings/betting-limits')}
            className="mt-3 px-4 py-2 text-[12px] font-medium text-white bg-[var(--color-doom)] rounded-lg"
          >
            Set Limits
          </button>
        </div>
      ) : (
        <div className="space-y-1 divide-y divide-[var(--color-border)]">
          <LimitProgress
            label="Daily Limit"
            used={limits.daily.currentUsage}
            limit={limits.daily.amount}
            period="day"
            pendingIncrease={limits.daily.pendingIncrease}
          />
          <LimitProgress
            label="Weekly Limit"
            used={limits.weekly.currentUsage}
            limit={limits.weekly.amount}
            period="week"
            pendingIncrease={limits.weekly.pendingIncrease}
          />
          <LimitProgress
            label="Monthly Limit"
            used={limits.monthly.currentUsage}
            limit={limits.monthly.amount}
            period="month"
            pendingIncrease={limits.monthly.pendingIncrease}
          />
        </div>
      )}
    </div>
  )
}

/**
 * Inline limit status for headers/navigation
 */
export function LimitStatusBadge({ className = '' }: { className?: string }) {
  const limits = useResponsibleGamblingStore((s) => s.limits)

  // Find the most restrictive limit status
  const types = ['daily', 'weekly', 'monthly'] as const
  let highestPercentage = 0

  for (const type of types) {
    const limit = limits[type]
    if (limit.amount !== null && limit.amount > 0) {
      const percentage = (limit.currentUsage / limit.amount) * 100
      highestPercentage = Math.max(highestPercentage, percentage)
    }
  }

  if (highestPercentage === 0) return null

  // Determine color
  let color = '#00ba7c'
  if (highestPercentage >= 50) color = '#f59e0b'
  if (highestPercentage >= 80) color = '#f97316'
  if (highestPercentage >= 100) color = '#ff3040'

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[10px] font-medium" style={{ color }}>
        {highestPercentage.toFixed(0)}%
      </span>
    </div>
  )
}
