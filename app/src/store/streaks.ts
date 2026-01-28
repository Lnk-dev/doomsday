/**
 * Streaks Store
 * Issue #41: Implement daily streak rewards
 *
 * Tracks consecutive days of activity (life posts) and awards bonus $LIFE.
 * Features:
 * - Track consecutive days with life posts
 * - Award bonus $LIFE for streak milestones
 * - Grace period for streak recovery (1 day)
 * - Persist streak data locally
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** Streak milestone definitions */
export const STREAK_MILESTONES = [
  { days: 7, bonus: 5, name: 'Week Warrior' },
  { days: 30, bonus: 25, name: 'Monthly Master' },
  { days: 100, bonus: 100, name: 'Century Champion' },
  { days: 365, bonus: 500, name: 'Year Legend' },
] as const

/** Get start of day timestamp */
const getStartOfDay = (date: Date = new Date()): number => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** Get days difference between two dates */
const getDaysDiff = (date1: number, date2: number): number => {
  const oneDay = 24 * 60 * 60 * 1000
  return Math.round((date2 - date1) / oneDay)
}

interface StreakState {
  /** Current streak count */
  currentStreak: number
  /** Longest streak achieved */
  longestStreak: number
  /** Last activity day (start of day timestamp) */
  lastActivityDay: number | null
  /** Milestones that have been claimed */
  claimedMilestones: number[]
  /** Total bonus earned from streaks */
  totalBonusEarned: number
  /** Whether today's activity has been recorded */
  hasActivityToday: boolean

  // Actions
  /** Record activity for today */
  recordActivity: () => { streakBroken: boolean; newStreak: number; milestoneReached?: typeof STREAK_MILESTONES[number] }
  /** Check and update streak status (call on app load) */
  checkStreak: () => void
  /** Claim a milestone reward */
  claimMilestone: (days: number) => number
  /** Get unclaimed milestones */
  getUnclaimedMilestones: () => typeof STREAK_MILESTONES[number][]
  /** Get next milestone */
  getNextMilestone: () => typeof STREAK_MILESTONES[number] | null
  /** Get days until next milestone */
  getDaysUntilNextMilestone: () => number
  /** Check if streak is at risk (no activity today and would break tomorrow) */
  isStreakAtRisk: () => boolean
  /** Reset streak (for testing) */
  resetStreak: () => void
}

export const useStreaksStore = create<StreakState>()(
  persist(
    (set, get) => ({
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDay: null,
      claimedMilestones: [],
      totalBonusEarned: 0,
      hasActivityToday: false,

      recordActivity: () => {
        const state = get()
        const today = getStartOfDay()
        const lastDay = state.lastActivityDay

        // Already recorded activity today
        if (state.hasActivityToday && lastDay === today) {
          return { streakBroken: false, newStreak: state.currentStreak }
        }

        let newStreak = 1
        let streakBroken = false

        if (lastDay !== null) {
          const daysDiff = getDaysDiff(lastDay, today)

          if (daysDiff === 0) {
            // Same day, no change
            newStreak = state.currentStreak
          } else if (daysDiff === 1) {
            // Consecutive day, increment streak
            newStreak = state.currentStreak + 1
          } else if (daysDiff === 2) {
            // Grace period - missed one day but can recover
            newStreak = state.currentStreak + 1
          } else {
            // Streak broken
            streakBroken = state.currentStreak > 0
            newStreak = 1
          }
        }

        const newLongest = Math.max(state.longestStreak, newStreak)

        // Check for milestone reached
        const milestoneReached = STREAK_MILESTONES.find(
          (m) => m.days === newStreak && !state.claimedMilestones.includes(m.days)
        )

        set({
          currentStreak: newStreak,
          longestStreak: newLongest,
          lastActivityDay: today,
          hasActivityToday: true,
        })

        return { streakBroken, newStreak, milestoneReached }
      },

      checkStreak: () => {
        const state = get()
        const today = getStartOfDay()
        const lastDay = state.lastActivityDay

        if (lastDay === null) {
          return
        }

        const daysDiff = getDaysDiff(lastDay, today)

        // Reset hasActivityToday if it's a new day
        if (daysDiff > 0) {
          set({ hasActivityToday: false })
        }

        // Check if streak should be broken (more than 2 days without activity)
        if (daysDiff > 2 && state.currentStreak > 0) {
          set({ currentStreak: 0 })
        }
      },

      claimMilestone: (days) => {
        const state = get()
        const milestone = STREAK_MILESTONES.find((m) => m.days === days)

        if (!milestone || state.claimedMilestones.includes(days)) {
          return 0
        }

        if (state.currentStreak < days) {
          return 0
        }

        set({
          claimedMilestones: [...state.claimedMilestones, days],
          totalBonusEarned: state.totalBonusEarned + milestone.bonus,
        })

        return milestone.bonus
      },

      getUnclaimedMilestones: () => {
        const state = get()
        return STREAK_MILESTONES.filter(
          (m) => m.days <= state.currentStreak && !state.claimedMilestones.includes(m.days)
        )
      },

      getNextMilestone: () => {
        const state = get()
        return (
          STREAK_MILESTONES.find((m) => m.days > state.currentStreak) || null
        )
      },

      getDaysUntilNextMilestone: () => {
        const state = get()
        const next = get().getNextMilestone()
        if (!next) return 0
        return next.days - state.currentStreak
      },

      isStreakAtRisk: () => {
        const state = get()
        if (state.currentStreak === 0) return false
        if (state.hasActivityToday) return false

        const today = getStartOfDay()
        const lastDay = state.lastActivityDay
        if (!lastDay) return false

        const daysDiff = getDaysDiff(lastDay, today)
        // At risk if it's been 1 day since last activity (tomorrow would break)
        return daysDiff >= 1
      },

      resetStreak: () => {
        set({
          currentStreak: 0,
          longestStreak: 0,
          lastActivityDay: null,
          claimedMilestones: [],
          totalBonusEarned: 0,
          hasActivityToday: false,
        })
      },
    }),
    {
      name: 'doomsday-streaks',
    }
  )
)
