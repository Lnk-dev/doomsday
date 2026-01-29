/**
 * ResponsibleGamblingPage
 *
 * User settings for responsible gambling features:
 * - Betting limits (daily, weekly, monthly)
 * - Self-exclusion options
 * - Reality check reminders
 * - Gambling resources and support links
 */

import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Shield,
  Clock,
  Ban,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Info,
  DollarSign,
  Timer,
  Phone,
  HelpCircle,
} from 'lucide-react'
import {
  useResponsibleGamblingStore,
  formatDuration,
  formatTimeRemaining,
} from '@/store/responsibleGambling'

/** Toggle switch component */
function Toggle({
  enabled,
  onChange,
}: {
  enabled: boolean
  onChange: (enabled: boolean) => void
}) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`w-11 h-6 rounded-full transition-colors ${
        enabled ? 'bg-[var(--color-doom)]' : 'bg-[var(--color-toggle-bg)]'
      }`}
    >
      <div
        className="w-5 h-5 rounded-full bg-white transition-transform"
        style={{ transform: `translateX(${enabled ? '22px' : '2px'})` }}
      />
    </button>
  )
}

/** Limit input component */
function LimitInput({
  label,
  description,
  value,
  onChange,
  pendingIncrease,
  currentUsage,
}: {
  label: string
  description: string
  value: number | null
  onChange: (value: number | null) => void
  pendingIncrease?: { amount: number; effectiveAt: number }
  currentUsage: number
}) {
  const [inputValue, setInputValue] = useState(value?.toString() || '')

  const handleSave = () => {
    const num = parseFloat(inputValue)
    if (inputValue === '' || inputValue === '0') {
      onChange(null)
    } else if (!isNaN(num) && num > 0) {
      onChange(num)
    }
  }

  const remaining = value !== null ? Math.max(0, value - currentUsage) : null

  return (
    <div className="p-4 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)]">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-[15px] font-medium text-[var(--color-text-primary)]">
            {label}
          </p>
          <p className="text-[12px] text-[var(--color-text-muted)]">{description}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3">
        <div className="relative flex-1">
          <DollarSign
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
          />
          <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={handleSave}
            placeholder="No limit"
            className="w-full pl-8 pr-4 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] text-[14px] outline-none focus:border-[var(--color-doom)]"
          />
        </div>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-[var(--color-doom)] text-white text-[13px] font-medium rounded-lg"
        >
          Set
        </button>
      </div>

      {value !== null && (
        <div className="mt-3 flex items-center justify-between text-[12px]">
          <span className="text-[var(--color-text-muted)]">
            Used: ${currentUsage.toFixed(2)} / ${value.toFixed(2)}
          </span>
          <span className={remaining === 0 ? 'text-[var(--color-doom)]' : 'text-[#00ba7c]'}>
            ${remaining?.toFixed(2)} remaining
          </span>
        </div>
      )}

      {pendingIncrease && (
        <div className="mt-2 px-3 py-2 bg-[#f59e0b]/10 rounded-lg flex items-center gap-2">
          <Clock size={14} className="text-[#f59e0b]" />
          <span className="text-[12px] text-[#f59e0b]">
            Increase to ${pendingIncrease.amount} pending (
            {formatTimeRemaining(pendingIncrease.effectiveAt)})
          </span>
        </div>
      )}
    </div>
  )
}

export function ResponsibleGamblingPage() {
  const navigate = useNavigate()

  const limits = useResponsibleGamblingStore((s) => s.limits)
  const setLimit = useResponsibleGamblingStore((s) => s.setLimit)
  const selfExclusion = useResponsibleGamblingStore((s) => s.selfExclusion)
  const setSelfExclusion = useResponsibleGamblingStore((s) => s.setSelfExclusion)
  const cancelSelfExclusion = useResponsibleGamblingStore((s) => s.cancelSelfExclusion)
  const isExcluded = useResponsibleGamblingStore((s) => s.isExcluded)
  const realityCheck = useResponsibleGamblingStore((s) => s.realityCheck)
  const setRealityCheck = useResponsibleGamblingStore((s) => s.setRealityCheck)
  const getSessionDuration = useResponsibleGamblingStore((s) => s.getSessionDuration)

  const [showExclusionModal, setShowExclusionModal] = useState(false)
  const [exclusionDays, setExclusionDays] = useState(7)

  const sessionDuration = getSessionDuration()

  // Track current time for exclusion check - useState initializer captures time once
  const [checkTime] = useState(() => Date.now())
  const canEndExclusion = useMemo(() => {
    if (!selfExclusion) return false
    if (selfExclusion.type !== 'temporary') return false
    if (!selfExclusion.endDate) return false
    return checkTime >= selfExclusion.endDate
  }, [selfExclusion, checkTime])

  return (
    <div className="flex flex-col min-h-full bg-[var(--color-bg-primary)] pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-[var(--color-border)]">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft size={24} className="text-[var(--color-text-primary)]" />
        </button>
        <h1 className="text-[17px] font-semibold text-[var(--color-text-primary)]">
          Responsible Gambling
        </h1>
      </div>

      {/* Self-Exclusion Banner */}
      {isExcluded() && (
        <div className="mx-4 mt-4 p-4 bg-[var(--color-doom)]/10 border border-[var(--color-doom)]/30 rounded-xl">
          <div className="flex items-start gap-3">
            <Ban size={20} className="text-[var(--color-doom)] mt-0.5" />
            <div className="flex-1">
              <p className="text-[15px] font-medium text-[var(--color-doom)]">
                Self-Exclusion Active
              </p>
              <p className="text-[13px] text-[var(--color-text-secondary)] mt-1">
                {selfExclusion.type === 'permanent'
                  ? 'You have permanently excluded yourself from betting.'
                  : `Betting is disabled. ${formatTimeRemaining(selfExclusion.endDate!)}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Session Info */}
      {sessionDuration > 0 && (
        <div className="mx-4 mt-4 p-3 bg-[var(--color-bg-secondary)] rounded-xl flex items-center gap-3">
          <Timer size={18} className="text-[var(--color-text-muted)]" />
          <span className="text-[13px] text-[var(--color-text-secondary)]">
            Current session: {formatDuration(sessionDuration)}
          </span>
        </div>
      )}

      {/* Betting Limits */}
      <div className="mt-6">
        <div className="px-4 flex items-center gap-2 mb-3">
          <DollarSign size={16} className="text-[var(--color-text-secondary)]" />
          <h2 className="text-[13px] font-semibold text-[var(--color-text-secondary)]">
            BETTING LIMITS
          </h2>
        </div>
        <div className="px-4 space-y-3">
          <LimitInput
            label="Daily Limit"
            description="Maximum wager amount per day"
            value={limits.daily.amount}
            onChange={(v) => setLimit('daily', v)}
            pendingIncrease={limits.daily.pendingIncrease}
            currentUsage={limits.daily.currentUsage}
          />
          <LimitInput
            label="Weekly Limit"
            description="Maximum wager amount per week"
            value={limits.weekly.amount}
            onChange={(v) => setLimit('weekly', v)}
            pendingIncrease={limits.weekly.pendingIncrease}
            currentUsage={limits.weekly.currentUsage}
          />
          <LimitInput
            label="Monthly Limit"
            description="Maximum wager amount per month"
            value={limits.monthly.amount}
            onChange={(v) => setLimit('monthly', v)}
            pendingIncrease={limits.monthly.pendingIncrease}
            currentUsage={limits.monthly.currentUsage}
          />
        </div>
        <p className="px-4 mt-2 text-[11px] text-[var(--color-text-muted)]">
          Note: Decreasing limits takes effect immediately. Increasing limits requires a 48-hour
          cooling period.
        </p>
      </div>

      {/* Reality Check */}
      <div className="mt-6">
        <div className="px-4 flex items-center gap-2 mb-3">
          <Clock size={16} className="text-[var(--color-text-secondary)]" />
          <h2 className="text-[13px] font-semibold text-[var(--color-text-secondary)]">
            REALITY CHECK
          </h2>
        </div>
        <div className="mx-4 p-4 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[15px] font-medium text-[var(--color-text-primary)]">
                Session Reminders
              </p>
              <p className="text-[12px] text-[var(--color-text-muted)]">
                Get reminded of time spent betting
              </p>
            </div>
            <Toggle
              enabled={realityCheck.enabled}
              onChange={(enabled) => setRealityCheck(enabled, realityCheck.intervalMinutes)}
            />
          </div>

          {realityCheck.enabled && (
            <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
              <p className="text-[12px] text-[var(--color-text-muted)] mb-2">
                Remind me every:
              </p>
              <div className="flex gap-2">
                {[15, 30, 60, 120].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => setRealityCheck(true, mins)}
                    className={`flex-1 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                      realityCheck.intervalMinutes === mins
                        ? 'bg-[var(--color-doom)] text-white'
                        : 'bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)]'
                    }`}
                  >
                    {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Self-Exclusion */}
      <div className="mt-6">
        <div className="px-4 flex items-center gap-2 mb-3">
          <Ban size={16} className="text-[var(--color-text-secondary)]" />
          <h2 className="text-[13px] font-semibold text-[var(--color-text-secondary)]">
            SELF-EXCLUSION
          </h2>
        </div>
        <div className="mx-4 p-4 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)]">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-[#f59e0b] mt-0.5" />
            <div className="flex-1">
              <p className="text-[15px] font-medium text-[var(--color-text-primary)]">
                Take a Break
              </p>
              <p className="text-[12px] text-[var(--color-text-muted)] mt-1">
                Temporarily or permanently exclude yourself from betting. This cannot be reversed
                during the exclusion period.
              </p>
            </div>
          </div>

          {!isExcluded() ? (
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setShowExclusionModal(true)}
                className="flex-1 py-3 bg-[#f59e0b]/10 text-[#f59e0b] rounded-xl text-[14px] font-medium"
              >
                Temporary Break
              </button>
              <button
                onClick={() => {
                  if (confirm('Are you sure? Permanent exclusion cannot be reversed.')) {
                    setSelfExclusion('permanent')
                  }
                }}
                className="flex-1 py-3 bg-[var(--color-doom)]/10 text-[var(--color-doom)] rounded-xl text-[14px] font-medium"
              >
                Permanent Exclusion
              </button>
            </div>
          ) : (
            canEndExclusion && (
              <button
                onClick={cancelSelfExclusion}
                className="mt-4 w-full py-3 bg-[#00ba7c]/10 text-[#00ba7c] rounded-xl text-[14px] font-medium"
              >
                End Self-Exclusion
              </button>
            )
          )}
        </div>
      </div>

      {/* Resources */}
      <div className="mt-6">
        <div className="px-4 flex items-center gap-2 mb-3">
          <HelpCircle size={16} className="text-[var(--color-text-secondary)]" />
          <h2 className="text-[13px] font-semibold text-[var(--color-text-secondary)]">
            SUPPORT RESOURCES
          </h2>
        </div>
        <div className="mx-4 space-y-2">
          <a
            href="https://www.ncpgambling.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)]"
          >
            <div className="flex items-center gap-3">
              <Shield size={20} className="text-[#00ba7c]" />
              <div>
                <p className="text-[14px] font-medium text-[var(--color-text-primary)]">
                  National Council on Problem Gambling
                </p>
                <p className="text-[12px] text-[var(--color-text-muted)]">ncpgambling.org</p>
              </div>
            </div>
            <ExternalLink size={16} className="text-[var(--color-text-muted)]" />
          </a>

          <a
            href="tel:1-800-522-4700"
            className="flex items-center justify-between p-4 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)]"
          >
            <div className="flex items-center gap-3">
              <Phone size={20} className="text-[var(--color-doom)]" />
              <div>
                <p className="text-[14px] font-medium text-[var(--color-text-primary)]">
                  Gambling Helpline
                </p>
                <p className="text-[12px] text-[var(--color-text-muted)]">1-800-522-4700 (24/7)</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-[var(--color-text-muted)]" />
          </a>

          <a
            href="https://www.gamblersanonymous.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)]"
          >
            <div className="flex items-center gap-3">
              <Shield size={20} className="text-[#3b82f6]" />
              <div>
                <p className="text-[14px] font-medium text-[var(--color-text-primary)]">
                  Gamblers Anonymous
                </p>
                <p className="text-[12px] text-[var(--color-text-muted)]">
                  gamblersanonymous.org
                </p>
              </div>
            </div>
            <ExternalLink size={16} className="text-[var(--color-text-muted)]" />
          </a>
        </div>
      </div>

      {/* Info Footer */}
      <div className="mx-4 mt-6 p-4 bg-[var(--color-bg-secondary)] rounded-xl flex items-start gap-3">
        <Info size={18} className="text-[var(--color-text-muted)] mt-0.5" />
        <p className="text-[12px] text-[var(--color-text-muted)]">
          Gambling should be entertainment, not a way to make money. Never bet more than you can
          afford to lose. If gambling is causing problems in your life, please reach out for help.
        </p>
      </div>

      {/* Temporary Exclusion Modal */}
      {showExclusionModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowExclusionModal(false)}
          />
          <div className="relative w-full max-w-lg bg-[var(--color-bg-tertiary)] rounded-t-3xl p-6">
            <h3 className="text-[17px] font-semibold text-[var(--color-text-primary)] mb-4">
              Temporary Self-Exclusion
            </h3>
            <p className="text-[14px] text-[var(--color-text-secondary)] mb-4">
              Choose how long you want to take a break from betting:
            </p>

            <div className="grid grid-cols-4 gap-2 mb-6">
              {[7, 14, 30, 90].map((days) => (
                <button
                  key={days}
                  onClick={() => setExclusionDays(days)}
                  className={`py-3 rounded-xl text-[14px] font-medium transition-colors ${
                    exclusionDays === days
                      ? 'bg-[var(--color-doom)] text-white'
                      : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  {days}d
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowExclusionModal(false)}
                className="flex-1 py-3 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] rounded-xl font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setSelfExclusion('temporary', exclusionDays)
                  setShowExclusionModal(false)
                }}
                className="flex-1 py-3 bg-[var(--color-doom)] text-white rounded-xl font-medium"
              >
                Confirm
              </button>
            </div>

            <div className="h-6" />
          </div>
        </div>
      )}
    </div>
  )
}
