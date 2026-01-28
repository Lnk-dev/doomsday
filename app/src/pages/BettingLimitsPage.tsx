/**
 * BettingLimitsPage
 *
 * Comprehensive page for managing all betting limits including:
 * - Max bet per event
 * - Daily/weekly/monthly loss limits
 * - Cool-off period settings
 * - Betting history summary
 * - Exposure meter
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  DollarSign,
  Clock,
  Shield,
  TrendingUp,
  History,
  ChevronDown,
  ChevronUp,
  Info,
  RefreshCw,
} from 'lucide-react'
import {
  useResponsibleGamblingStore,
  formatTimeRemaining,
} from '@/store/responsibleGambling'
import { ExposureMeter } from '@/components/betting/ExposureMeter'
import {
  ExposureLevel,
  getMaxBetForExposure,
  formatCurrency,
} from '@/lib/bettingLimits'

/**
 * Limit input component with validation
 */
function LimitInputField({
  label,
  description,
  value,
  onChange,
  pendingIncrease,
  currentUsage,
  icon: Icon,
}: {
  label: string
  description: string
  value: number | null
  onChange: (value: number | null) => void
  pendingIncrease?: { amount: number; effectiveAt: number }
  currentUsage: number
  icon: React.ElementType
}) {
  const [inputValue, setInputValue] = useState(value?.toString() || '')
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (!isEditing) {
      setInputValue(value?.toString() || '')
    }
  }, [value, isEditing])

  const handleSave = () => {
    setIsEditing(false)
    const num = parseFloat(inputValue)
    if (inputValue === '' || inputValue === '0') {
      onChange(null)
    } else if (!isNaN(num) && num > 0) {
      onChange(num)
    }
  }

  const remaining = value !== null ? Math.max(0, value - currentUsage) : null
  const percentage = value !== null && value > 0 ? (currentUsage / value) * 100 : 0

  // Determine status color
  let statusColor = '#00ba7c' // Green
  if (percentage >= 50) statusColor = '#f59e0b'
  if (percentage >= 80) statusColor = '#f97316'
  if (percentage >= 100) statusColor = '#ff3040'

  return (
    <div className="p-4 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)]">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--color-bg-primary)] flex items-center justify-center flex-shrink-0">
          <Icon size={20} className="text-[var(--color-text-secondary)]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-medium text-[var(--color-text-primary)]">{label}</p>
          <p className="text-[12px] text-[var(--color-text-muted)] mt-0.5">{description}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <div className="relative flex-1">
          <DollarSign
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
          />
          <input
            type="number"
            value={inputValue}
            onChange={(e) => {
              setIsEditing(true)
              setInputValue(e.target.value)
            }}
            onBlur={handleSave}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="No limit"
            min="0"
            step="0.01"
            className="w-full pl-8 pr-4 py-2.5 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] text-[14px] outline-none focus:border-[var(--color-doom)] transition-colors"
          />
        </div>
        <button
          onClick={handleSave}
          className="px-4 py-2.5 bg-[var(--color-doom)] text-white text-[13px] font-medium rounded-lg hover:bg-[var(--color-doom)]/90 transition-colors"
        >
          Set
        </button>
      </div>

      {value !== null && (
        <>
          {/* Progress bar */}
          <div className="mt-3">
            <div className="h-2 bg-[var(--color-bg-primary)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(percentage, 100)}%`,
                  backgroundColor: statusColor,
                }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="mt-2 flex items-center justify-between text-[12px]">
            <span className="text-[var(--color-text-muted)]">
              Used: <span style={{ color: statusColor }}>${currentUsage.toFixed(2)}</span> / $
              {value.toFixed(2)}
            </span>
            <span style={{ color: remaining === 0 ? '#ff3040' : '#00ba7c' }}>
              ${remaining?.toFixed(2)} left
            </span>
          </div>
        </>
      )}

      {/* Pending increase notice */}
      {pendingIncrease && (
        <div className="mt-3 px-3 py-2 bg-[#f59e0b]/10 rounded-lg flex items-center gap-2">
          <Clock size={14} className="text-[#f59e0b]" />
          <span className="text-[12px] text-[#f59e0b]">
            Increase to ${pendingIncrease.amount.toFixed(2)} pending (
            {formatTimeRemaining(pendingIncrease.effectiveAt)})
          </span>
        </div>
      )}
    </div>
  )
}

/**
 * Cool-off period selector
 */
function CoolOffPeriodSelector({
  value,
  onChange,
}: {
  value: number | null
  onChange: (value: number | null) => void
}) {
  const options = [
    { label: 'None', value: null },
    { label: '15 min', value: 0.25 },
    { label: '30 min', value: 0.5 },
    { label: '1 hour', value: 1 },
    { label: '2 hours', value: 2 },
    { label: '4 hours', value: 4 },
    { label: '8 hours', value: 8 },
    { label: '24 hours', value: 24 },
  ]

  return (
    <div className="p-4 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)]">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-[var(--color-bg-primary)] flex items-center justify-center flex-shrink-0">
          <Clock size={20} className="text-[var(--color-text-secondary)]" />
        </div>
        <div>
          <p className="text-[15px] font-medium text-[var(--color-text-primary)]">Cool-Off Period</p>
          <p className="text-[12px] text-[var(--color-text-muted)] mt-0.5">
            Minimum time required between bets
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {options.map((option) => (
          <button
            key={option.label}
            onClick={() => onChange(option.value)}
            className={`py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
              value === option.value
                ? 'bg-[var(--color-doom)] text-white'
                : 'bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * Betting history summary section
 */
function BettingHistorySummary({ isExpanded, onToggle }: { isExpanded: boolean; onToggle: () => void }) {
  const limits = useResponsibleGamblingStore((s) => s.limits)

  // Mock history data - in a real app this would come from a store/API
  const historyStats = {
    totalBets: 42,
    totalWagered: limits.daily.currentUsage + limits.weekly.currentUsage * 0.3,
    winRate: 48.5,
    averageBet: 25.50,
    biggestWin: 150.00,
    biggestLoss: 75.00,
    currentStreak: -2, // Negative = losing streak
    longestWinStreak: 5,
    longestLoseStreak: 4,
  }

  return (
    <div className="bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)] overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-bg-primary)] flex items-center justify-center">
            <History size={20} className="text-[var(--color-text-secondary)]" />
          </div>
          <div className="text-left">
            <p className="text-[15px] font-medium text-[var(--color-text-primary)]">
              Betting History
            </p>
            <p className="text-[12px] text-[var(--color-text-muted)]">
              {historyStats.totalBets} bets total
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp size={20} className="text-[var(--color-text-muted)]" />
        ) : (
          <ChevronDown size={20} className="text-[var(--color-text-muted)]" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-[var(--color-border)]">
          <div className="grid grid-cols-2 gap-3 mt-4">
            {/* Total Wagered */}
            <div className="p-3 bg-[var(--color-bg-primary)] rounded-lg">
              <p className="text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide">
                Total Wagered
              </p>
              <p className="text-[18px] font-semibold text-[var(--color-text-primary)] mt-1">
                {formatCurrency(historyStats.totalWagered)}
              </p>
            </div>

            {/* Win Rate */}
            <div className="p-3 bg-[var(--color-bg-primary)] rounded-lg">
              <p className="text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide">
                Win Rate
              </p>
              <p
                className="text-[18px] font-semibold mt-1"
                style={{ color: historyStats.winRate >= 50 ? '#00ba7c' : '#ff3040' }}
              >
                {historyStats.winRate.toFixed(1)}%
              </p>
            </div>

            {/* Average Bet */}
            <div className="p-3 bg-[var(--color-bg-primary)] rounded-lg">
              <p className="text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide">
                Average Bet
              </p>
              <p className="text-[18px] font-semibold text-[var(--color-text-primary)] mt-1">
                {formatCurrency(historyStats.averageBet)}
              </p>
            </div>

            {/* Current Streak */}
            <div className="p-3 bg-[var(--color-bg-primary)] rounded-lg">
              <p className="text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide">
                Current Streak
              </p>
              <p
                className="text-[18px] font-semibold mt-1"
                style={{ color: historyStats.currentStreak >= 0 ? '#00ba7c' : '#ff3040' }}
              >
                {historyStats.currentStreak >= 0 ? '+' : ''}
                {historyStats.currentStreak}
              </p>
            </div>
          </div>

          {/* Extremes */}
          <div className="mt-3 flex gap-3">
            <div className="flex-1 p-3 bg-[#00ba7c]/10 rounded-lg">
              <p className="text-[11px] text-[#00ba7c] uppercase tracking-wide">Biggest Win</p>
              <p className="text-[16px] font-semibold text-[#00ba7c] mt-1">
                +{formatCurrency(historyStats.biggestWin)}
              </p>
            </div>
            <div className="flex-1 p-3 bg-[#ff3040]/10 rounded-lg">
              <p className="text-[11px] text-[#ff3040] uppercase tracking-wide">Biggest Loss</p>
              <p className="text-[16px] font-semibold text-[#ff3040] mt-1">
                -{formatCurrency(historyStats.biggestLoss)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Recommended limits based on bankroll
 */
function RecommendedLimits({ bankroll }: { bankroll: number }) {
  const setLimit = useResponsibleGamblingStore((s) => s.setLimit)

  const recommendations = {
    daily: getMaxBetForExposure(bankroll, ExposureLevel.LOW) * 5, // 5 bets per day
    weekly: getMaxBetForExposure(bankroll, ExposureLevel.MEDIUM) * 20, // ~3 bets per day
    monthly: getMaxBetForExposure(bankroll, ExposureLevel.MEDIUM) * 60, // ~2 bets per day
  }

  const applyRecommended = () => {
    setLimit('daily', recommendations.daily)
    setLimit('weekly', recommendations.weekly)
    setLimit('monthly', recommendations.monthly)
  }

  if (bankroll <= 0) return null

  return (
    <div className="p-4 bg-[#00ba7c]/10 rounded-xl border border-[#00ba7c]/20">
      <div className="flex items-start gap-3">
        <Shield size={20} className="text-[#00ba7c] mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-[14px] font-medium text-[#00ba7c]">Recommended Limits</p>
          <p className="text-[12px] text-[var(--color-text-muted)] mt-1">
            Based on your bankroll of {formatCurrency(bankroll)}, we recommend:
          </p>
          <ul className="mt-2 space-y-1 text-[12px] text-[var(--color-text-secondary)]">
            <li>Daily: {formatCurrency(recommendations.daily)}</li>
            <li>Weekly: {formatCurrency(recommendations.weekly)}</li>
            <li>Monthly: {formatCurrency(recommendations.monthly)}</li>
          </ul>
          <button
            onClick={applyRecommended}
            className="mt-3 px-4 py-2 bg-[#00ba7c] text-white text-[12px] font-medium rounded-lg flex items-center gap-2"
          >
            <RefreshCw size={12} />
            Apply Recommended
          </button>
        </div>
      </div>
    </div>
  )
}

export function BettingLimitsPage() {
  const navigate = useNavigate()
  const [showHistory, setShowHistory] = useState(false)

  const limits = useResponsibleGamblingStore((s) => s.limits)
  const setLimit = useResponsibleGamblingStore((s) => s.setLimit)

  // Mock data - in real app would come from user store
  const [maxBetPerEvent, setMaxBetPerEvent] = useState<number | null>(100)
  const [coolOffPeriod, setCoolOffPeriod] = useState<number | null>(null)
  const bankroll = 1000 // Would come from user profile
  const totalAtRisk = 150 // Would come from active bets

  return (
    <div className="flex flex-col min-h-full bg-[var(--color-bg-primary)] pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-[var(--color-border)] sticky top-0 bg-[var(--color-bg-primary)] z-10">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft size={24} className="text-[var(--color-text-primary)]" />
        </button>
        <h1 className="text-[17px] font-semibold text-[var(--color-text-primary)]">
          Betting Limits
        </h1>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Exposure Meter */}
        <ExposureMeter totalAtRisk={totalAtRisk} bankroll={bankroll} />

        {/* Recommended Limits */}
        <RecommendedLimits bankroll={bankroll} />

        {/* Max Bet Per Event */}
        <div className="mt-2">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-[var(--color-text-secondary)]" />
            <h2 className="text-[13px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
              Per-Event Limit
            </h2>
          </div>
          <LimitInputField
            label="Max Bet Per Event"
            description="Maximum amount you can bet on a single event"
            value={maxBetPerEvent}
            onChange={setMaxBetPerEvent}
            currentUsage={0}
            icon={DollarSign}
          />
        </div>

        {/* Loss Limits */}
        <div className="mt-2">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={16} className="text-[var(--color-text-secondary)]" />
            <h2 className="text-[13px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
              Loss Limits
            </h2>
          </div>
          <div className="space-y-3">
            <LimitInputField
              label="Daily Loss Limit"
              description="Maximum amount you can lose per day"
              value={limits.daily.amount}
              onChange={(v) => setLimit('daily', v)}
              pendingIncrease={limits.daily.pendingIncrease}
              currentUsage={limits.daily.currentUsage}
              icon={DollarSign}
            />
            <LimitInputField
              label="Weekly Loss Limit"
              description="Maximum amount you can lose per week"
              value={limits.weekly.amount}
              onChange={(v) => setLimit('weekly', v)}
              pendingIncrease={limits.weekly.pendingIncrease}
              currentUsage={limits.weekly.currentUsage}
              icon={DollarSign}
            />
            <LimitInputField
              label="Monthly Loss Limit"
              description="Maximum amount you can lose per month"
              value={limits.monthly.amount}
              onChange={(v) => setLimit('monthly', v)}
              pendingIncrease={limits.monthly.pendingIncrease}
              currentUsage={limits.monthly.currentUsage}
              icon={DollarSign}
            />
          </div>
        </div>

        {/* Cool-Off Period */}
        <div className="mt-2">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={16} className="text-[var(--color-text-secondary)]" />
            <h2 className="text-[13px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
              Pacing Controls
            </h2>
          </div>
          <CoolOffPeriodSelector value={coolOffPeriod} onChange={setCoolOffPeriod} />
        </div>

        {/* Betting History */}
        <div className="mt-2">
          <div className="flex items-center gap-2 mb-3">
            <History size={16} className="text-[var(--color-text-secondary)]" />
            <h2 className="text-[13px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
              Activity Summary
            </h2>
          </div>
          <BettingHistorySummary isExpanded={showHistory} onToggle={() => setShowHistory(!showHistory)} />
        </div>

        {/* Info Footer */}
        <div className="mt-4 p-4 bg-[var(--color-bg-secondary)] rounded-xl flex items-start gap-3">
          <Info size={18} className="text-[var(--color-text-muted)] mt-0.5 flex-shrink-0" />
          <div className="text-[12px] text-[var(--color-text-muted)] space-y-2">
            <p>
              <strong>Note:</strong> Decreasing limits takes effect immediately. Increasing limits
              requires a 48-hour cooling period for your protection.
            </p>
            <p>
              Need more help? Visit our{' '}
              <button
                onClick={() => navigate('/settings/gambling')}
                className="text-[var(--color-doom)] underline"
              >
                Responsible Gambling
              </button>{' '}
              page for self-exclusion options and support resources.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
