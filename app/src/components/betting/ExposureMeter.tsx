/**
 * ExposureMeter Component
 *
 * Visual meter showing current betting exposure level.
 * Displays a color-coded progress bar with percentage and dollar amount.
 * Shows warnings when approaching or exceeding limits.
 */

import { AlertTriangle, TrendingUp, Shield, AlertCircle } from 'lucide-react'
import {
  ExposureLevel,
  calculateExposure,
  calculateExposurePercentage,
  getExposureColor,
  getExposureLabel,
  formatCurrency,
  EXPOSURE_THRESHOLDS,
} from '@/lib/bettingLimits'

interface ExposureMeterProps {
  /** Total amount currently at risk */
  totalAtRisk: number
  /** User's total bankroll */
  bankroll: number
  /** Show compact version */
  compact?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Get the icon for exposure level
 */
function ExposureIcon({
  level,
  className,
  size,
  style,
}: {
  level: ExposureLevel
  className?: string
  size?: number
  style?: React.CSSProperties
}) {
  const iconProps = { className, size, style }
  switch (level) {
    case ExposureLevel.LOW:
      return <Shield {...iconProps} />
    case ExposureLevel.MEDIUM:
      return <TrendingUp {...iconProps} />
    case ExposureLevel.HIGH:
      return <AlertTriangle {...iconProps} />
    case ExposureLevel.CRITICAL:
      return <AlertCircle {...iconProps} />
    default:
      return <Shield {...iconProps} />
  }
}

export function ExposureMeter({
  totalAtRisk,
  bankroll,
  compact = false,
  className = '',
}: ExposureMeterProps) {
  const exposureLevel = calculateExposure(totalAtRisk, bankroll)
  const exposurePercentage = calculateExposurePercentage(totalAtRisk, bankroll)
  const color = getExposureColor(exposureLevel)
  const label = getExposureLabel(exposureLevel)

  // Calculate progress for the meter (cap at 100% for display)
  const displayPercentage = Math.min(exposurePercentage, 100)

  // Determine if we should show a warning
  const showWarning =
    exposureLevel === ExposureLevel.HIGH || exposureLevel === ExposureLevel.CRITICAL

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
          title={`${label}: ${exposurePercentage.toFixed(1)}%`}
        />
        <span className="text-[12px] font-medium" style={{ color }}>
          {exposurePercentage.toFixed(1)}%
        </span>
      </div>
    )
  }

  return (
    <div
      className={`p-4 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)] ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ExposureIcon level={exposureLevel} size={18} style={{ color }} className="flex-shrink-0" />
          <span className="text-[14px] font-medium text-[var(--color-text-primary)]">
            Exposure Level
          </span>
        </div>
        <span
          className="text-[13px] font-semibold px-2 py-0.5 rounded-full"
          style={{ color, backgroundColor: `${color}20` }}
        >
          {label}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative h-3 bg-[var(--color-bg-primary)] rounded-full overflow-hidden mb-3">
        {/* Threshold markers */}
        <div
          className="absolute top-0 bottom-0 w-px bg-[var(--color-text-muted)]/30 z-10"
          style={{ left: `${EXPOSURE_THRESHOLDS.LOW * 100}%` }}
        />
        <div
          className="absolute top-0 bottom-0 w-px bg-[var(--color-text-muted)]/30 z-10"
          style={{ left: `${EXPOSURE_THRESHOLDS.MEDIUM * 100}%` }}
        />
        <div
          className="absolute top-0 bottom-0 w-px bg-[var(--color-text-muted)]/30 z-10"
          style={{ left: `${EXPOSURE_THRESHOLDS.HIGH * 100}%` }}
        />

        {/* Progress fill with gradient */}
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${displayPercentage}%`,
            background:
              exposureLevel === ExposureLevel.CRITICAL
                ? `linear-gradient(to right, #00ba7c, #f59e0b, #f97316, ${color})`
                : color,
          }}
        />
      </div>

      {/* Stats Row */}
      <div className="flex items-center justify-between text-[12px]">
        <div className="text-[var(--color-text-muted)]">
          <span className="font-medium" style={{ color }}>
            {formatCurrency(totalAtRisk)}
          </span>
          {' at risk'}
        </div>
        <div className="text-[var(--color-text-secondary)]">
          {exposurePercentage.toFixed(1)}% of {formatCurrency(bankroll)}
        </div>
      </div>

      {/* Threshold Labels */}
      <div className="flex justify-between mt-2 text-[10px] text-[var(--color-text-muted)]">
        <span>Safe (2%)</span>
        <span>Moderate (5%)</span>
        <span>High (10%)</span>
      </div>

      {/* Warning Message */}
      {showWarning && (
        <div
          className="mt-3 p-2 rounded-lg flex items-start gap-2"
          style={{ backgroundColor: `${color}15` }}
        >
          <AlertTriangle size={14} style={{ color }} className="mt-0.5 flex-shrink-0" />
          <p className="text-[11px]" style={{ color }}>
            {exposureLevel === ExposureLevel.CRITICAL
              ? 'Your exposure is at a critical level. Consider reducing your positions or taking a break.'
              : 'You are approaching high exposure. Consider being more conservative with your next bets.'}
          </p>
        </div>
      )}
    </div>
  )
}

/**
 * Mini exposure indicator for inline use
 */
export function ExposureIndicator({
  totalAtRisk,
  bankroll,
  className = '',
}: Omit<ExposureMeterProps, 'compact'>) {
  const exposureLevel = calculateExposure(totalAtRisk, bankroll)
  const exposurePercentage = calculateExposurePercentage(totalAtRisk, bankroll)
  const color = getExposureColor(exposureLevel)

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div className="w-12 h-1.5 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${Math.min(exposurePercentage, 100)}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <span className="text-[10px] font-medium" style={{ color }}>
        {exposurePercentage.toFixed(0)}%
      </span>
    </div>
  )
}

/**
 * Exposure level badge for display
 */
export function ExposureBadge({
  level,
  showLabel = true,
  className = '',
}: {
  level: ExposureLevel
  showLabel?: boolean
  className?: string
}) {
  const color = getExposureColor(level)
  const label = getExposureLabel(level)

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full ${className}`}
      style={{ backgroundColor: `${color}20` }}
    >
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      {showLabel && (
        <span className="text-[11px] font-medium" style={{ color }}>
          {label}
        </span>
      )}
    </div>
  )
}
