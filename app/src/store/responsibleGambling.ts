/**
 * Responsible Gambling Store
 *
 * Manages user betting limits, self-exclusion, and reality check settings.
 * All settings are stored locally with persistence.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface BettingLimit {
  type: 'daily' | 'weekly' | 'monthly'
  amount: number | null
  currentUsage: number
  periodStart: number // timestamp
  pendingIncrease?: {
    amount: number
    effectiveAt: number // timestamp
  }
}

export interface SelfExclusion {
  active: boolean
  startDate: number | null
  endDate: number | null
  type: 'temporary' | 'permanent' | null
}

export interface RealityCheck {
  enabled: boolean
  intervalMinutes: number // 15, 30, 60, 120
  lastShown: number | null
}

export interface ResponsibleGamblingState {
  // Betting limits
  limits: {
    daily: BettingLimit
    weekly: BettingLimit
    monthly: BettingLimit
  }

  // Self-exclusion
  selfExclusion: SelfExclusion

  // Reality check reminders
  realityCheck: RealityCheck

  // Session tracking
  sessionStart: number | null
  totalSessionTime: number // in seconds

  // Actions
  setLimit: (type: 'daily' | 'weekly' | 'monthly', amount: number | null) => void
  recordWager: (amount: number) => boolean // returns false if limit exceeded
  getRemainingLimit: (type: 'daily' | 'weekly' | 'monthly') => number | null
  resetPeriod: (type: 'daily' | 'weekly' | 'monthly') => void

  setSelfExclusion: (type: 'temporary' | 'permanent', durationDays?: number) => void
  cancelSelfExclusion: () => void
  isExcluded: () => boolean

  setRealityCheck: (enabled: boolean, intervalMinutes?: number) => void
  shouldShowRealityCheck: () => boolean
  acknowledgeRealityCheck: () => void

  startSession: () => void
  endSession: () => void
  getSessionDuration: () => number
}

const COOLING_PERIOD_HOURS = 48
const MS_PER_DAY = 24 * 60 * 60 * 1000

const createEmptyLimit = (type: 'daily' | 'weekly' | 'monthly'): BettingLimit => ({
  type,
  amount: null,
  currentUsage: 0,
  periodStart: Date.now(),
})

export const useResponsibleGamblingStore = create<ResponsibleGamblingState>()(
  persist(
    (set, get) => ({
      limits: {
        daily: createEmptyLimit('daily'),
        weekly: createEmptyLimit('weekly'),
        monthly: createEmptyLimit('monthly'),
      },

      selfExclusion: {
        active: false,
        startDate: null,
        endDate: null,
        type: null,
      },

      realityCheck: {
        enabled: false,
        intervalMinutes: 60,
        lastShown: null,
      },

      sessionStart: null,
      totalSessionTime: 0,

      setLimit: (type, amount) => {
        const { limits } = get()
        const currentLimit = limits[type]

        // If increasing limit, set pending increase with cooling period
        if (currentLimit.amount !== null && amount !== null && amount > currentLimit.amount) {
          set({
            limits: {
              ...limits,
              [type]: {
                ...currentLimit,
                pendingIncrease: {
                  amount,
                  effectiveAt: Date.now() + COOLING_PERIOD_HOURS * 60 * 60 * 1000,
                },
              },
            },
          })
        } else {
          // Decrease or initial set takes effect immediately
          set({
            limits: {
              ...limits,
              [type]: {
                ...currentLimit,
                amount,
                pendingIncrease: undefined,
              },
            },
          })
        }
      },

      recordWager: (amount) => {
        const { limits, isExcluded } = get()

        // Check if excluded
        if (isExcluded()) {
          return false
        }

        // Check all limits
        const types: Array<'daily' | 'weekly' | 'monthly'> = ['daily', 'weekly', 'monthly']
        for (const type of types) {
          const limit = limits[type]
          if (limit.amount !== null) {
            if (limit.currentUsage + amount > limit.amount) {
              return false
            }
          }
        }

        // Record the wager
        set({
          limits: {
            daily: { ...limits.daily, currentUsage: limits.daily.currentUsage + amount },
            weekly: { ...limits.weekly, currentUsage: limits.weekly.currentUsage + amount },
            monthly: { ...limits.monthly, currentUsage: limits.monthly.currentUsage + amount },
          },
        })

        return true
      },

      getRemainingLimit: (type) => {
        const { limits } = get()
        const limit = limits[type]
        if (limit.amount === null) return null
        return Math.max(0, limit.amount - limit.currentUsage)
      },

      resetPeriod: (type) => {
        const { limits } = get()
        const limit = limits[type]

        // Apply pending increase if cooling period has passed
        let newAmount = limit.amount
        if (limit.pendingIncrease && Date.now() >= limit.pendingIncrease.effectiveAt) {
          newAmount = limit.pendingIncrease.amount
        }

        set({
          limits: {
            ...limits,
            [type]: {
              ...limit,
              amount: newAmount,
              currentUsage: 0,
              periodStart: Date.now(),
              pendingIncrease: undefined,
            },
          },
        })
      },

      setSelfExclusion: (type, durationDays) => {
        const startDate = Date.now()
        const endDate = type === 'permanent'
          ? null
          : startDate + (durationDays || 7) * MS_PER_DAY

        set({
          selfExclusion: {
            active: true,
            startDate,
            endDate,
            type,
          },
        })
      },

      cancelSelfExclusion: () => {
        const { selfExclusion } = get()

        // Cannot cancel permanent exclusion
        if (selfExclusion.type === 'permanent') {
          return
        }

        // Cannot cancel before exclusion period ends
        if (selfExclusion.endDate && Date.now() < selfExclusion.endDate) {
          return
        }

        set({
          selfExclusion: {
            active: false,
            startDate: null,
            endDate: null,
            type: null,
          },
        })
      },

      isExcluded: () => {
        const { selfExclusion } = get()

        if (!selfExclusion.active) return false

        // Permanent exclusion
        if (selfExclusion.type === 'permanent') return true

        // Temporary exclusion - check if still active
        if (selfExclusion.endDate && Date.now() < selfExclusion.endDate) {
          return true
        }

        return false
      },

      setRealityCheck: (enabled, intervalMinutes) => {
        set({
          realityCheck: {
            enabled,
            intervalMinutes: intervalMinutes || 60,
            lastShown: enabled ? Date.now() : null,
          },
        })
      },

      shouldShowRealityCheck: () => {
        const { realityCheck, sessionStart } = get()

        if (!realityCheck.enabled || !sessionStart) return false

        const lastShown = realityCheck.lastShown || sessionStart
        const elapsed = Date.now() - lastShown
        const intervalMs = realityCheck.intervalMinutes * 60 * 1000

        return elapsed >= intervalMs
      },

      acknowledgeRealityCheck: () => {
        set({
          realityCheck: {
            ...get().realityCheck,
            lastShown: Date.now(),
          },
        })
      },

      startSession: () => {
        set({ sessionStart: Date.now() })
      },

      endSession: () => {
        const { sessionStart, totalSessionTime } = get()
        if (sessionStart) {
          const duration = Math.floor((Date.now() - sessionStart) / 1000)
          set({
            sessionStart: null,
            totalSessionTime: totalSessionTime + duration,
          })
        }
      },

      getSessionDuration: () => {
        const { sessionStart } = get()
        if (!sessionStart) return 0
        return Math.floor((Date.now() - sessionStart) / 1000)
      },
    }),
    {
      name: 'doomsday-responsible-gambling',
    }
  )
)

// Helper to format duration
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

// Helper to format remaining time
export function formatTimeRemaining(endDate: number): string {
  const remaining = endDate - Date.now()
  if (remaining <= 0) return 'Expired'

  const days = Math.floor(remaining / MS_PER_DAY)
  const hours = Math.floor((remaining % MS_PER_DAY) / (60 * 60 * 1000))

  if (days > 0) {
    return `${days}d ${hours}h remaining`
  }
  return `${hours}h remaining`
}
