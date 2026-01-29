/**
 * Streak Store Tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useStreakStore } from './streak'

describe('streak store', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T12:00:00.000Z'))

    // Reset store state
    useStreakStore.setState({
      currentStreak: 0,
      longestStreak: 0,
      lastPostDate: null,
      claimedMilestones: [],
      isInGracePeriod: false,
      totalStreakRewards: 0,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initial state', () => {
    it('should have zero current streak', () => {
      const state = useStreakStore.getState()
      expect(state.currentStreak).toBe(0)
    })

    it('should have zero longest streak', () => {
      const state = useStreakStore.getState()
      expect(state.longestStreak).toBe(0)
    })

    it('should have no last post date', () => {
      const state = useStreakStore.getState()
      expect(state.lastPostDate).toBeNull()
    })

    it('should have no claimed milestones', () => {
      const state = useStreakStore.getState()
      expect(state.claimedMilestones).toEqual([])
    })
  })

  describe('recordLifePost', () => {
    it('should start streak on first post', () => {
      const { recordLifePost } = useStreakStore.getState()

      const result = recordLifePost()

      expect(result.streakUpdated).toBe(true)
      expect(result.newStreak).toBe(1)
      expect(useStreakStore.getState().currentStreak).toBe(1)
    })

    it('should set lastPostDate', () => {
      const { recordLifePost } = useStreakStore.getState()

      recordLifePost()

      expect(useStreakStore.getState().lastPostDate).toBe(Date.now())
    })

    it('should not update streak for same day post', () => {
      const { recordLifePost } = useStreakStore.getState()

      recordLifePost()
      const result = recordLifePost()

      expect(result.streakUpdated).toBe(false)
      expect(result.newStreak).toBe(1)
    })

    it('should increment streak for next day post', () => {
      const { recordLifePost } = useStreakStore.getState()

      recordLifePost()

      // Move to next day
      vi.setSystemTime(new Date('2024-01-16T12:00:00.000Z'))

      const result = recordLifePost()

      expect(result.streakUpdated).toBe(true)
      expect(result.newStreak).toBe(2)
    })

    it('should update longest streak', () => {
      const { recordLifePost } = useStreakStore.getState()

      recordLifePost()
      vi.setSystemTime(new Date('2024-01-16T12:00:00.000Z'))
      recordLifePost()
      vi.setSystemTime(new Date('2024-01-17T12:00:00.000Z'))
      recordLifePost()

      expect(useStreakStore.getState().longestStreak).toBe(3)
    })

    it('should reset streak after missing days', () => {
      const { recordLifePost } = useStreakStore.getState()

      recordLifePost()

      // Skip 3 days (past grace period)
      vi.setSystemTime(new Date('2024-01-19T12:00:00.000Z'))

      const result = recordLifePost()

      expect(result.newStreak).toBe(1)
    })

    it('should return milestone info when milestone reached', () => {
      useStreakStore.setState({ currentStreak: 6, lastPostDate: Date.now() - 86400000 })
      const { recordLifePost } = useStreakStore.getState()

      // Move to next day to get streak 7
      vi.setSystemTime(new Date('2024-01-16T12:00:00.000Z'))

      const result = recordLifePost()

      expect(result.newStreak).toBe(7)
      expect(result.milestonesClaimed).toHaveLength(1)
      expect(result.milestonesClaimed[0].days).toBe(7)
    })
  })

  describe('getNextMilestone', () => {
    it('should return first milestone when streak is 0', () => {
      const { getNextMilestone } = useStreakStore.getState()

      const next = getNextMilestone()

      expect(next?.days).toBe(7)
    })

    it('should return next milestone based on current streak', () => {
      useStreakStore.setState({ currentStreak: 10 })
      const { getNextMilestone } = useStreakStore.getState()

      const next = getNextMilestone()

      expect(next?.days).toBe(30)
    })

    it('should return null when all milestones achieved', () => {
      useStreakStore.setState({ currentStreak: 150 })
      const { getNextMilestone } = useStreakStore.getState()

      expect(getNextMilestone()).toBeNull()
    })
  })

  describe('getAchievedMilestones', () => {
    it('should return empty when streak is 0', () => {
      const { getAchievedMilestones } = useStreakStore.getState()

      expect(getAchievedMilestones()).toEqual([])
    })

    it('should return milestones achieved by current streak', () => {
      useStreakStore.setState({ currentStreak: 35 })
      const { getAchievedMilestones } = useStreakStore.getState()

      const achieved = getAchievedMilestones()

      expect(achieved).toHaveLength(2) // 7 and 30
      expect(achieved.map((m) => m.days)).toEqual([7, 30])
    })
  })

  describe('getClaimableMilestones', () => {
    it('should return unclaimed milestones', () => {
      useStreakStore.setState({ currentStreak: 35, claimedMilestones: [7] })
      const { getClaimableMilestones } = useStreakStore.getState()

      const claimable = getClaimableMilestones()

      expect(claimable).toHaveLength(1)
      expect(claimable[0].days).toBe(30)
    })

    it('should return empty when all are claimed', () => {
      useStreakStore.setState({ currentStreak: 35, claimedMilestones: [7, 30] })
      const { getClaimableMilestones } = useStreakStore.getState()

      expect(getClaimableMilestones()).toEqual([])
    })
  })

  describe('claimMilestone', () => {
    it('should claim a milestone', () => {
      useStreakStore.setState({ currentStreak: 10 })
      const { claimMilestone } = useStreakStore.getState()

      const result = claimMilestone(7)

      expect(result.success).toBe(true)
      expect(result.reward).toBe(5)
    })

    it('should add to claimedMilestones', () => {
      useStreakStore.setState({ currentStreak: 10 })
      const { claimMilestone } = useStreakStore.getState()

      claimMilestone(7)

      expect(useStreakStore.getState().claimedMilestones).toContain(7)
    })

    it('should add to totalStreakRewards', () => {
      useStreakStore.setState({ currentStreak: 10 })
      const { claimMilestone } = useStreakStore.getState()

      claimMilestone(7)

      expect(useStreakStore.getState().totalStreakRewards).toBe(5)
    })

    it('should fail for already claimed milestone', () => {
      useStreakStore.setState({ currentStreak: 10, claimedMilestones: [7] })
      const { claimMilestone } = useStreakStore.getState()

      const result = claimMilestone(7)

      expect(result.success).toBe(false)
      expect(result.reward).toBe(0)
    })

    it('should fail for unachieved milestone', () => {
      useStreakStore.setState({ currentStreak: 5 })
      const { claimMilestone } = useStreakStore.getState()

      const result = claimMilestone(7)

      expect(result.success).toBe(false)
    })

    it('should fail for invalid milestone', () => {
      useStreakStore.setState({ currentStreak: 100 })
      const { claimMilestone } = useStreakStore.getState()

      const result = claimMilestone(50)

      expect(result.success).toBe(false)
    })
  })

  describe('claimAllMilestones', () => {
    it('should claim all claimable milestones', () => {
      useStreakStore.setState({ currentStreak: 35 })
      const { claimAllMilestones } = useStreakStore.getState()

      const result = claimAllMilestones()

      expect(result.rewards).toEqual([5, 25])
      expect(result.total).toBe(30)
    })

    it('should update claimedMilestones', () => {
      useStreakStore.setState({ currentStreak: 35 })
      const { claimAllMilestones } = useStreakStore.getState()

      claimAllMilestones()

      expect(useStreakStore.getState().claimedMilestones).toEqual([7, 30])
    })

    it('should return empty when nothing to claim', () => {
      useStreakStore.setState({ currentStreak: 5 })
      const { claimAllMilestones } = useStreakStore.getState()

      const result = claimAllMilestones()

      expect(result.rewards).toEqual([])
      expect(result.total).toBe(0)
    })
  })

  describe('checkStreakStatus', () => {
    it('should return inactive when no posts', () => {
      const { checkStreakStatus } = useStreakStore.getState()

      const status = checkStreakStatus()

      expect(status.active).toBe(false)
      expect(status.inGrace).toBe(false)
    })

    it('should return active for recent post', () => {
      useStreakStore.setState({
        currentStreak: 5,
        lastPostDate: Date.now() - 12 * 60 * 60 * 1000, // 12 hours ago
      })
      const { checkStreakStatus } = useStreakStore.getState()

      const status = checkStreakStatus()

      expect(status.active).toBe(true)
      expect(status.inGrace).toBe(false)
    })

    it('should return inactive after streak lost', () => {
      useStreakStore.setState({
        currentStreak: 5,
        lastPostDate: Date.now() - 4 * 24 * 60 * 60 * 1000, // 4 days ago
      })
      const { checkStreakStatus } = useStreakStore.getState()

      const status = checkStreakStatus()

      expect(status.active).toBe(false)
      expect(status.inGrace).toBe(false)
    })
  })

  describe('resetStreak', () => {
    it('should reset all streak data', () => {
      useStreakStore.setState({
        currentStreak: 50,
        longestStreak: 100,
        lastPostDate: Date.now(),
        claimedMilestones: [7, 30],
        isInGracePeriod: true,
        totalStreakRewards: 30,
      })
      const { resetStreak } = useStreakStore.getState()

      resetStreak()

      const state = useStreakStore.getState()
      expect(state.currentStreak).toBe(0)
      expect(state.longestStreak).toBe(0)
      expect(state.lastPostDate).toBeNull()
      expect(state.claimedMilestones).toEqual([])
      expect(state.isInGracePeriod).toBe(false)
      expect(state.totalStreakRewards).toBe(0)
    })
  })

  describe('updateStreakStatus', () => {
    it('should reset streak when expired', () => {
      useStreakStore.setState({
        currentStreak: 5,
        lastPostDate: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
      })
      const { updateStreakStatus } = useStreakStore.getState()

      updateStreakStatus()

      expect(useStreakStore.getState().currentStreak).toBe(0)
    })

    it('should not reset active streak', () => {
      useStreakStore.setState({
        currentStreak: 5,
        lastPostDate: Date.now() - 12 * 60 * 60 * 1000, // 12 hours ago
      })
      const { updateStreakStatus } = useStreakStore.getState()

      updateStreakStatus()

      expect(useStreakStore.getState().currentStreak).toBe(5)
    })
  })
})
