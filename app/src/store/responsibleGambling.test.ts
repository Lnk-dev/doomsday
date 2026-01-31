/**
 * Responsible Gambling Store Tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useResponsibleGamblingStore, formatDuration, formatTimeRemaining } from './responsibleGambling'

describe('responsible gambling store', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T12:00:00.000Z'))

    // Reset store state before each test
    useResponsibleGamblingStore.setState({
      limits: {
        daily: { type: 'daily', amount: null, currentUsage: 0, periodStart: Date.now() },
        weekly: { type: 'weekly', amount: null, currentUsage: 0, periodStart: Date.now() },
        monthly: { type: 'monthly', amount: null, currentUsage: 0, periodStart: Date.now() },
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
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initial state', () => {
    it('should have null limits by default', () => {
      const state = useResponsibleGamblingStore.getState()
      expect(state.limits.daily.amount).toBeNull()
      expect(state.limits.weekly.amount).toBeNull()
      expect(state.limits.monthly.amount).toBeNull()
    })

    it('should have self-exclusion disabled', () => {
      const state = useResponsibleGamblingStore.getState()
      expect(state.selfExclusion.active).toBe(false)
    })

    it('should have reality check disabled', () => {
      const state = useResponsibleGamblingStore.getState()
      expect(state.realityCheck.enabled).toBe(false)
    })
  })

  describe('setLimit', () => {
    it('should set a daily limit', () => {
      const { setLimit } = useResponsibleGamblingStore.getState()
      setLimit('daily', 100)

      const state = useResponsibleGamblingStore.getState()
      expect(state.limits.daily.amount).toBe(100)
    })

    it('should set a weekly limit', () => {
      const { setLimit } = useResponsibleGamblingStore.getState()
      setLimit('weekly', 500)

      const state = useResponsibleGamblingStore.getState()
      expect(state.limits.weekly.amount).toBe(500)
    })

    it('should set a monthly limit', () => {
      const { setLimit } = useResponsibleGamblingStore.getState()
      setLimit('monthly', 1000)

      const state = useResponsibleGamblingStore.getState()
      expect(state.limits.monthly.amount).toBe(1000)
    })

    it('should clear limit when set to null', () => {
      const { setLimit } = useResponsibleGamblingStore.getState()
      setLimit('daily', 100)
      setLimit('daily', null)

      const state = useResponsibleGamblingStore.getState()
      expect(state.limits.daily.amount).toBeNull()
    })

    it('should set pending increase when raising limit', () => {
      const { setLimit } = useResponsibleGamblingStore.getState()
      setLimit('daily', 100)
      setLimit('daily', 200)

      const state = useResponsibleGamblingStore.getState()
      expect(state.limits.daily.amount).toBe(100) // Still old limit
      expect(state.limits.daily.pendingIncrease?.amount).toBe(200)
    })

    it('should apply decrease immediately', () => {
      const { setLimit } = useResponsibleGamblingStore.getState()
      setLimit('daily', 100)
      setLimit('daily', 50)

      const state = useResponsibleGamblingStore.getState()
      expect(state.limits.daily.amount).toBe(50)
    })
  })

  describe('recordWager', () => {
    it('should record wager when no limit set', () => {
      const { recordWager } = useResponsibleGamblingStore.getState()
      const result = recordWager(100)

      expect(result).toBe(true)
      const state = useResponsibleGamblingStore.getState()
      expect(state.limits.daily.currentUsage).toBe(100)
    })

    it('should record wager when under limit', () => {
      const { setLimit, recordWager } = useResponsibleGamblingStore.getState()
      setLimit('daily', 200)

      const result = recordWager(100)

      expect(result).toBe(true)
    })

    it('should reject wager when over limit', () => {
      const { setLimit, recordWager } = useResponsibleGamblingStore.getState()
      setLimit('daily', 50)

      const result = recordWager(100)

      expect(result).toBe(false)
    })

    it('should track cumulative usage', () => {
      const { setLimit, recordWager } = useResponsibleGamblingStore.getState()
      setLimit('daily', 200)

      recordWager(50)
      recordWager(50)

      const state = useResponsibleGamblingStore.getState()
      expect(state.limits.daily.currentUsage).toBe(100)
    })

    it('should reject when excluded', () => {
      const { setSelfExclusion, recordWager } = useResponsibleGamblingStore.getState()
      setSelfExclusion('permanent')

      const result = recordWager(10)

      expect(result).toBe(false)
    })

    it('should track across all limit types', () => {
      const { recordWager } = useResponsibleGamblingStore.getState()

      recordWager(100)

      const state = useResponsibleGamblingStore.getState()
      expect(state.limits.daily.currentUsage).toBe(100)
      expect(state.limits.weekly.currentUsage).toBe(100)
      expect(state.limits.monthly.currentUsage).toBe(100)
    })
  })

  describe('getRemainingLimit', () => {
    it('should return null when no limit set', () => {
      const { getRemainingLimit } = useResponsibleGamblingStore.getState()
      expect(getRemainingLimit('daily')).toBeNull()
    })

    it('should return full amount when nothing spent', () => {
      const { setLimit, getRemainingLimit } = useResponsibleGamblingStore.getState()
      setLimit('daily', 100)

      expect(getRemainingLimit('daily')).toBe(100)
    })

    it('should return remaining amount after spending', () => {
      const { setLimit, recordWager, getRemainingLimit } = useResponsibleGamblingStore.getState()
      setLimit('daily', 100)
      recordWager(30)

      expect(getRemainingLimit('daily')).toBe(70)
    })

    it('should return 0 when limit exhausted', () => {
      const { setLimit, recordWager, getRemainingLimit } = useResponsibleGamblingStore.getState()
      setLimit('daily', 100)
      recordWager(100)

      expect(getRemainingLimit('daily')).toBe(0)
    })
  })

  describe('resetPeriod', () => {
    it('should reset current usage to 0', () => {
      const { recordWager, resetPeriod } = useResponsibleGamblingStore.getState()
      recordWager(100)
      resetPeriod('daily')

      const state = useResponsibleGamblingStore.getState()
      expect(state.limits.daily.currentUsage).toBe(0)
    })

    it('should apply pending increase after cooling period', () => {
      const { setLimit, resetPeriod } = useResponsibleGamblingStore.getState()
      setLimit('daily', 100)
      setLimit('daily', 200) // Sets pending increase

      // Advance time past cooling period (48 hours)
      vi.advanceTimersByTime(49 * 60 * 60 * 1000)
      resetPeriod('daily')

      const state = useResponsibleGamblingStore.getState()
      expect(state.limits.daily.amount).toBe(200)
    })
  })

  describe('self-exclusion', () => {
    it('should set temporary self-exclusion', () => {
      const { setSelfExclusion, isExcluded } = useResponsibleGamblingStore.getState()
      setSelfExclusion('temporary', 7)

      expect(isExcluded()).toBe(true)
      const state = useResponsibleGamblingStore.getState()
      expect(state.selfExclusion.type).toBe('temporary')
    })

    it('should set permanent self-exclusion', () => {
      const { setSelfExclusion, isExcluded } = useResponsibleGamblingStore.getState()
      setSelfExclusion('permanent')

      expect(isExcluded()).toBe(true)
      const state = useResponsibleGamblingStore.getState()
      expect(state.selfExclusion.type).toBe('permanent')
    })

    it('should not cancel permanent exclusion', () => {
      const { setSelfExclusion, cancelSelfExclusion, isExcluded } = useResponsibleGamblingStore.getState()
      setSelfExclusion('permanent')
      cancelSelfExclusion()

      expect(isExcluded()).toBe(true)
    })

    it('should not cancel temporary exclusion before end date', () => {
      const { setSelfExclusion, cancelSelfExclusion, isExcluded } = useResponsibleGamblingStore.getState()
      setSelfExclusion('temporary', 7)

      // Try to cancel after 3 days
      vi.advanceTimersByTime(3 * 24 * 60 * 60 * 1000)
      cancelSelfExclusion()

      expect(isExcluded()).toBe(true)
    })

    it('should allow cancel after temporary exclusion ends', () => {
      const { setSelfExclusion, cancelSelfExclusion, isExcluded } = useResponsibleGamblingStore.getState()
      setSelfExclusion('temporary', 7)

      // Advance time past exclusion period
      vi.advanceTimersByTime(8 * 24 * 60 * 60 * 1000)
      cancelSelfExclusion()

      expect(isExcluded()).toBe(false)
    })

    it('should expire temporary exclusion after end date', () => {
      const { setSelfExclusion, isExcluded } = useResponsibleGamblingStore.getState()
      setSelfExclusion('temporary', 7)

      // Advance time past exclusion period
      vi.advanceTimersByTime(8 * 24 * 60 * 60 * 1000)

      expect(isExcluded()).toBe(false)
    })
  })

  describe('reality check', () => {
    it('should enable reality check', () => {
      const { setRealityCheck } = useResponsibleGamblingStore.getState()
      setRealityCheck(true, 30)

      const state = useResponsibleGamblingStore.getState()
      expect(state.realityCheck.enabled).toBe(true)
      expect(state.realityCheck.intervalMinutes).toBe(30)
    })

    it('should disable reality check', () => {
      const { setRealityCheck } = useResponsibleGamblingStore.getState()
      setRealityCheck(true, 30)
      setRealityCheck(false)

      const state = useResponsibleGamblingStore.getState()
      expect(state.realityCheck.enabled).toBe(false)
    })

    it('should not show reality check when disabled', () => {
      const { startSession, shouldShowRealityCheck } = useResponsibleGamblingStore.getState()
      startSession()

      vi.advanceTimersByTime(2 * 60 * 60 * 1000)

      expect(shouldShowRealityCheck()).toBe(false)
    })

    it('should show reality check after interval', () => {
      const { setRealityCheck, startSession, shouldShowRealityCheck } = useResponsibleGamblingStore.getState()
      setRealityCheck(true, 60)
      startSession()

      vi.advanceTimersByTime(61 * 60 * 1000)

      expect(shouldShowRealityCheck()).toBe(true)
    })

    it('should reset timer after acknowledgement', () => {
      const { setRealityCheck, startSession, acknowledgeRealityCheck, shouldShowRealityCheck } = useResponsibleGamblingStore.getState()
      setRealityCheck(true, 60)
      startSession()

      vi.advanceTimersByTime(61 * 60 * 1000)
      acknowledgeRealityCheck()

      expect(shouldShowRealityCheck()).toBe(false)
    })
  })

  describe('session tracking', () => {
    it('should start a session', () => {
      const { startSession } = useResponsibleGamblingStore.getState()
      startSession()

      const state = useResponsibleGamblingStore.getState()
      expect(state.sessionStart).not.toBeNull()
    })

    it('should end a session and track time', () => {
      const { startSession, endSession } = useResponsibleGamblingStore.getState()
      startSession()

      vi.advanceTimersByTime(30 * 60 * 1000) // 30 minutes
      endSession()

      const state = useResponsibleGamblingStore.getState()
      expect(state.sessionStart).toBeNull()
      expect(state.totalSessionTime).toBe(30 * 60) // 30 minutes in seconds
    })

    it('should get session duration', () => {
      const { startSession, getSessionDuration } = useResponsibleGamblingStore.getState()
      startSession()

      vi.advanceTimersByTime(15 * 60 * 1000) // 15 minutes

      expect(getSessionDuration()).toBe(15 * 60)
    })

    it('should return 0 duration when no session', () => {
      const { getSessionDuration } = useResponsibleGamblingStore.getState()
      expect(getSessionDuration()).toBe(0)
    })

    it('should accumulate session time', () => {
      const { startSession, endSession } = useResponsibleGamblingStore.getState()

      startSession()
      vi.advanceTimersByTime(10 * 60 * 1000)
      endSession()

      startSession()
      vi.advanceTimersByTime(20 * 60 * 1000)
      endSession()

      const state = useResponsibleGamblingStore.getState()
      expect(state.totalSessionTime).toBe(30 * 60) // 30 minutes total
    })
  })
})

describe('utility functions', () => {
  describe('formatDuration', () => {
    it('should format minutes only', () => {
      expect(formatDuration(30 * 60)).toBe('30m')
    })

    it('should format hours and minutes', () => {
      expect(formatDuration(90 * 60)).toBe('1h 30m')
    })

    it('should format multiple hours', () => {
      expect(formatDuration(3 * 60 * 60)).toBe('3h 0m')
    })
  })

  describe('formatTimeRemaining', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-15T12:00:00.000Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should format days and hours', () => {
      const endDate = Date.now() + 3 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000
      expect(formatTimeRemaining(endDate)).toBe('3d 5h remaining')
    })

    it('should format hours only when less than a day', () => {
      const endDate = Date.now() + 5 * 60 * 60 * 1000
      expect(formatTimeRemaining(endDate)).toBe('5h remaining')
    })

    it('should return Expired for past dates', () => {
      const endDate = Date.now() - 1000
      expect(formatTimeRemaining(endDate)).toBe('Expired')
    })
  })
})
