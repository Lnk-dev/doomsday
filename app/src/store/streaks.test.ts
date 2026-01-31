/**
 * Streaks Store Tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useStreaksStore, STREAK_MILESTONES } from './streaks'

describe('streaks store', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T12:00:00.000Z'))

    // Reset store state before each test
    useStreaksStore.getState().resetStreak()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initial state', () => {
    it('should have zero current streak', () => {
      const state = useStreaksStore.getState()
      expect(state.currentStreak).toBe(0)
    })

    it('should have zero longest streak', () => {
      const state = useStreaksStore.getState()
      expect(state.longestStreak).toBe(0)
    })

    it('should have null last activity day', () => {
      const state = useStreaksStore.getState()
      expect(state.lastActivityDay).toBeNull()
    })

    it('should have empty claimed milestones', () => {
      const state = useStreaksStore.getState()
      expect(state.claimedMilestones).toEqual([])
    })

    it('should have zero total bonus earned', () => {
      const state = useStreaksStore.getState()
      expect(state.totalBonusEarned).toBe(0)
    })
  })

  describe('recordActivity', () => {
    it('should start streak at 1 for first activity', () => {
      const { recordActivity } = useStreaksStore.getState()
      const result = recordActivity()

      expect(result.newStreak).toBe(1)
      expect(useStreaksStore.getState().currentStreak).toBe(1)
    })

    it('should not increase streak for same day activity', () => {
      const { recordActivity } = useStreaksStore.getState()
      recordActivity()
      const result = useStreaksStore.getState().recordActivity()

      expect(result.newStreak).toBe(1)
    })

    it('should increment streak for consecutive day', () => {
      const { recordActivity } = useStreaksStore.getState()
      recordActivity()

      // Advance to next day
      vi.setSystemTime(new Date('2024-01-16T12:00:00.000Z'))
      const result = useStreaksStore.getState().recordActivity()

      expect(result.newStreak).toBe(2)
    })

    it('should maintain streak with grace period (1 day missed)', () => {
      const { recordActivity } = useStreaksStore.getState()
      recordActivity()

      // Skip a day (grace period)
      vi.setSystemTime(new Date('2024-01-17T12:00:00.000Z'))
      const result = useStreaksStore.getState().recordActivity()

      expect(result.newStreak).toBe(2)
      expect(result.streakBroken).toBe(false)
    })

    it('should break streak after more than 2 days', () => {
      const { recordActivity } = useStreaksStore.getState()
      recordActivity()

      // Advance time by 3 days
      vi.setSystemTime(new Date('2024-01-18T12:00:00.000Z'))
      const result = useStreaksStore.getState().recordActivity()

      expect(result.newStreak).toBe(1)
      expect(result.streakBroken).toBe(true)
    })

    it('should update longest streak', () => {
      for (let i = 0; i < 5; i++) {
        vi.setSystemTime(new Date(`2024-01-${15 + i}T12:00:00.000Z`))
        useStreaksStore.getState().recordActivity()
      }

      expect(useStreaksStore.getState().longestStreak).toBe(5)
    })

    it('should set hasActivityToday flag', () => {
      const { recordActivity } = useStreaksStore.getState()
      recordActivity()

      expect(useStreaksStore.getState().hasActivityToday).toBe(true)
    })
  })

  describe('checkStreak', () => {
    it('should reset hasActivityToday on new day', () => {
      const { recordActivity } = useStreaksStore.getState()
      recordActivity()

      vi.setSystemTime(new Date('2024-01-16T12:00:00.000Z'))
      useStreaksStore.getState().checkStreak()

      expect(useStreaksStore.getState().hasActivityToday).toBe(false)
    })

    it('should break streak if more than 2 days without activity', () => {
      const { recordActivity } = useStreaksStore.getState()
      recordActivity()

      vi.setSystemTime(new Date('2024-01-18T12:00:00.000Z'))
      useStreaksStore.getState().checkStreak()

      expect(useStreaksStore.getState().currentStreak).toBe(0)
    })

    it('should not break streak within grace period', () => {
      const { recordActivity } = useStreaksStore.getState()
      recordActivity()

      vi.setSystemTime(new Date('2024-01-17T12:00:00.000Z'))
      useStreaksStore.getState().checkStreak()

      expect(useStreaksStore.getState().currentStreak).toBe(1)
    })
  })

  describe('claimMilestone', () => {
    it('should claim milestone when eligible', () => {
      // Build up a 7-day streak
      for (let i = 0; i < 7; i++) {
        vi.setSystemTime(new Date(`2024-01-${15 + i}T12:00:00.000Z`))
        useStreaksStore.getState().recordActivity()
      }

      const bonus = useStreaksStore.getState().claimMilestone(7)

      expect(bonus).toBe(5) // Week Warrior bonus
      expect(useStreaksStore.getState().claimedMilestones).toContain(7)
    })

    it('should not claim milestone twice', () => {
      for (let i = 0; i < 7; i++) {
        vi.setSystemTime(new Date(`2024-01-${15 + i}T12:00:00.000Z`))
        useStreaksStore.getState().recordActivity()
      }

      useStreaksStore.getState().claimMilestone(7)
      const secondBonus = useStreaksStore.getState().claimMilestone(7)

      expect(secondBonus).toBe(0)
    })

    it('should not claim milestone when not reached', () => {
      const { recordActivity, claimMilestone } = useStreaksStore.getState()
      recordActivity()

      const bonus = claimMilestone(7)

      expect(bonus).toBe(0)
    })

    it('should update total bonus earned', () => {
      for (let i = 0; i < 7; i++) {
        vi.setSystemTime(new Date(`2024-01-${15 + i}T12:00:00.000Z`))
        useStreaksStore.getState().recordActivity()
      }

      useStreaksStore.getState().claimMilestone(7)

      expect(useStreaksStore.getState().totalBonusEarned).toBe(5)
    })
  })

  describe('getUnclaimedMilestones', () => {
    it('should return empty array when no milestones reached', () => {
      const { recordActivity, getUnclaimedMilestones } = useStreaksStore.getState()
      recordActivity()

      const unclaimed = getUnclaimedMilestones()

      expect(unclaimed).toEqual([])
    })

    it('should return unclaimed milestones', () => {
      for (let i = 0; i < 7; i++) {
        vi.setSystemTime(new Date(`2024-01-${15 + i}T12:00:00.000Z`))
        useStreaksStore.getState().recordActivity()
      }

      const unclaimed = useStreaksStore.getState().getUnclaimedMilestones()

      expect(unclaimed).toHaveLength(1)
      expect(unclaimed[0].days).toBe(7)
    })

    it('should not include claimed milestones', () => {
      for (let i = 0; i < 7; i++) {
        vi.setSystemTime(new Date(`2024-01-${15 + i}T12:00:00.000Z`))
        useStreaksStore.getState().recordActivity()
      }

      useStreaksStore.getState().claimMilestone(7)
      const unclaimed = useStreaksStore.getState().getUnclaimedMilestones()

      expect(unclaimed).toEqual([])
    })
  })

  describe('getNextMilestone', () => {
    it('should return first milestone when starting', () => {
      const { getNextMilestone } = useStreaksStore.getState()
      const next = getNextMilestone()

      expect(next?.days).toBe(7)
      expect(next?.name).toBe('Week Warrior')
    })

    it('should return next milestone after reaching one', () => {
      for (let i = 0; i < 7; i++) {
        vi.setSystemTime(new Date(`2024-01-${15 + i}T12:00:00.000Z`))
        useStreaksStore.getState().recordActivity()
      }

      const next = useStreaksStore.getState().getNextMilestone()

      expect(next?.days).toBe(30)
    })

    it('should return null after all milestones', () => {
      useStreaksStore.setState({ currentStreak: 365 })

      const { getNextMilestone } = useStreaksStore.getState()
      const next = getNextMilestone()

      expect(next).toBeNull()
    })
  })

  describe('getDaysUntilNextMilestone', () => {
    it('should return days until first milestone', () => {
      const { getDaysUntilNextMilestone } = useStreaksStore.getState()

      expect(getDaysUntilNextMilestone()).toBe(7)
    })

    it('should decrease as streak grows', () => {
      for (let i = 0; i < 3; i++) {
        vi.setSystemTime(new Date(`2024-01-${15 + i}T12:00:00.000Z`))
        useStreaksStore.getState().recordActivity()
      }

      expect(useStreaksStore.getState().getDaysUntilNextMilestone()).toBe(4)
    })
  })

  describe('isStreakAtRisk', () => {
    it('should return false when no streak', () => {
      const { isStreakAtRisk } = useStreaksStore.getState()
      expect(isStreakAtRisk()).toBe(false)
    })

    it('should return false when activity recorded today', () => {
      const { recordActivity } = useStreaksStore.getState()
      recordActivity()

      expect(useStreaksStore.getState().isStreakAtRisk()).toBe(false)
    })

    it('should return true when no activity today and streak exists', () => {
      const { recordActivity } = useStreaksStore.getState()
      recordActivity()

      // Advance to next day without recording activity
      vi.setSystemTime(new Date('2024-01-16T12:00:00.000Z'))
      useStreaksStore.getState().checkStreak()

      expect(useStreaksStore.getState().isStreakAtRisk()).toBe(true)
    })
  })

  describe('resetStreak', () => {
    it('should reset all streak data', () => {
      for (let i = 0; i < 7; i++) {
        vi.setSystemTime(new Date(`2024-01-${15 + i}T12:00:00.000Z`))
        useStreaksStore.getState().recordActivity()
      }
      useStreaksStore.getState().claimMilestone(7)
      useStreaksStore.getState().resetStreak()

      const state = useStreaksStore.getState()
      expect(state.currentStreak).toBe(0)
      expect(state.longestStreak).toBe(0)
      expect(state.lastActivityDay).toBeNull()
      expect(state.claimedMilestones).toEqual([])
      expect(state.totalBonusEarned).toBe(0)
    })
  })
})

describe('STREAK_MILESTONES', () => {
  it('should have correct milestone definitions', () => {
    expect(STREAK_MILESTONES).toHaveLength(4)
    expect(STREAK_MILESTONES[0]).toEqual({ days: 7, bonus: 5, name: 'Week Warrior' })
    expect(STREAK_MILESTONES[1]).toEqual({ days: 30, bonus: 25, name: 'Monthly Master' })
    expect(STREAK_MILESTONES[2]).toEqual({ days: 100, bonus: 100, name: 'Century Champion' })
    expect(STREAK_MILESTONES[3]).toEqual({ days: 365, bonus: 500, name: 'Year Legend' })
  })

  it('should be in ascending order by days', () => {
    for (let i = 1; i < STREAK_MILESTONES.length; i++) {
      expect(STREAK_MILESTONES[i].days).toBeGreaterThan(STREAK_MILESTONES[i - 1].days)
    }
  })
})
