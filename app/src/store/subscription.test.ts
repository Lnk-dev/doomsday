/**
 * Subscription Store Tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useSubscriptionStore } from './subscription'
import { SubscriptionTier } from '@/lib/subscriptions'

describe('subscription store', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T12:00:00.000Z'))

    // Reset store state before each test
    useSubscriptionStore.setState({
      currentSubscription: null,
      history: [],
      predictionsToday: 0,
      lastPredictionDate: null,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initial state', () => {
    it('should have no current subscription', () => {
      const state = useSubscriptionStore.getState()
      expect(state.currentSubscription).toBeNull()
    })

    it('should have empty history', () => {
      const state = useSubscriptionStore.getState()
      expect(state.history).toEqual([])
    })

    it('should have zero predictions today', () => {
      const state = useSubscriptionStore.getState()
      expect(state.predictionsToday).toBe(0)
    })
  })

  describe('getCurrentTier', () => {
    it('should return FREE when no subscription', () => {
      const { getCurrentTier } = useSubscriptionStore.getState()
      expect(getCurrentTier()).toBe(SubscriptionTier.FREE)
    })

    it('should return subscription tier when active', () => {
      const { subscribe } = useSubscriptionStore.getState()
      subscribe(SubscriptionTier.PRO, 'monthly')

      expect(useSubscriptionStore.getState().getCurrentTier()).toBe(SubscriptionTier.PRO)
    })

    it('should return FREE when subscription is cancelled', () => {
      const { subscribe } = useSubscriptionStore.getState()
      subscribe(SubscriptionTier.PRO, 'monthly')
      useSubscriptionStore.getState().cancelSubscription()

      expect(useSubscriptionStore.getState().getCurrentTier()).toBe(SubscriptionTier.FREE)
    })
  })

  describe('subscribe', () => {
    it('should create a monthly subscription', () => {
      const { subscribe } = useSubscriptionStore.getState()
      subscribe(SubscriptionTier.PRO, 'monthly')

      const state = useSubscriptionStore.getState()
      expect(state.currentSubscription).not.toBeNull()
      expect(state.currentSubscription?.tier).toBe(SubscriptionTier.PRO)
      expect(state.currentSubscription?.billingPeriod).toBe('monthly')
      expect(state.currentSubscription?.status).toBe('active')
    })

    it('should create a yearly subscription', () => {
      const { subscribe } = useSubscriptionStore.getState()
      subscribe(SubscriptionTier.ELITE, 'yearly')

      const state = useSubscriptionStore.getState()
      expect(state.currentSubscription?.billingPeriod).toBe('yearly')
    })

    it('should set auto-renew to true by default', () => {
      const { subscribe } = useSubscriptionStore.getState()
      subscribe(SubscriptionTier.PRO, 'monthly')

      const state = useSubscriptionStore.getState()
      expect(state.currentSubscription?.autoRenew).toBe(true)
    })

    it('should add to history', () => {
      const { subscribe } = useSubscriptionStore.getState()
      subscribe(SubscriptionTier.PRO, 'monthly')

      const state = useSubscriptionStore.getState()
      expect(state.history).toHaveLength(1)
      expect(state.history[0].action).toBe('subscribed')
      expect(state.history[0].tier).toBe(SubscriptionTier.PRO)
    })

    it('should set correct end date for monthly', () => {
      const { subscribe } = useSubscriptionStore.getState()
      subscribe(SubscriptionTier.PRO, 'monthly')

      const state = useSubscriptionStore.getState()
      const endDate = new Date(state.currentSubscription!.endDate!)
      expect(endDate.getMonth()).toBe(1) // February (0-indexed)
    })
  })

  describe('upgradeTier', () => {
    it('should upgrade from FREE to PRO', () => {
      const { upgradeTier } = useSubscriptionStore.getState()
      const result = upgradeTier(SubscriptionTier.PRO)

      expect(result).toBe(true)
      expect(useSubscriptionStore.getState().getCurrentTier()).toBe(SubscriptionTier.PRO)
    })

    it('should upgrade from PRO to ELITE', () => {
      const { subscribe } = useSubscriptionStore.getState()
      subscribe(SubscriptionTier.PRO, 'monthly')

      const result = useSubscriptionStore.getState().upgradeTier(SubscriptionTier.ELITE)

      expect(result).toBe(true)
      expect(useSubscriptionStore.getState().getCurrentTier()).toBe(SubscriptionTier.ELITE)
    })

    it('should not downgrade via upgrade', () => {
      const { subscribe } = useSubscriptionStore.getState()
      subscribe(SubscriptionTier.ELITE, 'monthly')

      const result = useSubscriptionStore.getState().upgradeTier(SubscriptionTier.PRO)

      expect(result).toBe(false)
      expect(useSubscriptionStore.getState().getCurrentTier()).toBe(SubscriptionTier.ELITE)
    })

    it('should add upgrade to history', () => {
      const { subscribe } = useSubscriptionStore.getState()
      subscribe(SubscriptionTier.PRO, 'monthly')
      useSubscriptionStore.getState().upgradeTier(SubscriptionTier.ELITE)

      const state = useSubscriptionStore.getState()
      expect(state.history[0].action).toBe('upgraded')
      expect(state.history[0].previousTier).toBe(SubscriptionTier.PRO)
    })
  })

  describe('downgradeTier', () => {
    it('should downgrade from ELITE to PRO', () => {
      const { subscribe } = useSubscriptionStore.getState()
      subscribe(SubscriptionTier.ELITE, 'monthly')

      const result = useSubscriptionStore.getState().downgradeTier(SubscriptionTier.PRO)

      expect(result).toBe(true)
      expect(useSubscriptionStore.getState().getCurrentTier()).toBe(SubscriptionTier.PRO)
    })

    it('should downgrade to FREE', () => {
      const { subscribe } = useSubscriptionStore.getState()
      subscribe(SubscriptionTier.PRO, 'monthly')

      const result = useSubscriptionStore.getState().downgradeTier(SubscriptionTier.FREE)

      expect(result).toBe(true)
      expect(useSubscriptionStore.getState().currentSubscription).toBeNull()
    })

    it('should not upgrade via downgrade', () => {
      const { subscribe } = useSubscriptionStore.getState()
      subscribe(SubscriptionTier.PRO, 'monthly')

      const result = useSubscriptionStore.getState().downgradeTier(SubscriptionTier.ELITE)

      expect(result).toBe(false)
    })

    it('should add downgrade to history', () => {
      const { subscribe } = useSubscriptionStore.getState()
      subscribe(SubscriptionTier.ELITE, 'monthly')
      useSubscriptionStore.getState().downgradeTier(SubscriptionTier.PRO)

      const state = useSubscriptionStore.getState()
      expect(state.history[0].action).toBe('downgraded')
    })
  })

  describe('cancelSubscription', () => {
    it('should cancel active subscription', () => {
      const { subscribe } = useSubscriptionStore.getState()
      subscribe(SubscriptionTier.PRO, 'monthly')

      const result = useSubscriptionStore.getState().cancelSubscription()

      expect(result).toBe(true)
      expect(useSubscriptionStore.getState().currentSubscription?.status).toBe('cancelled')
    })

    it('should return false when no subscription', () => {
      const { cancelSubscription } = useSubscriptionStore.getState()
      const result = cancelSubscription()

      expect(result).toBe(false)
    })

    it('should set cancelledAt date', () => {
      const { subscribe } = useSubscriptionStore.getState()
      subscribe(SubscriptionTier.PRO, 'monthly')
      useSubscriptionStore.getState().cancelSubscription()

      const state = useSubscriptionStore.getState()
      expect(state.currentSubscription?.cancelledAt).not.toBeNull()
    })

    it('should disable auto-renew', () => {
      const { subscribe } = useSubscriptionStore.getState()
      subscribe(SubscriptionTier.PRO, 'monthly')
      useSubscriptionStore.getState().cancelSubscription()

      const state = useSubscriptionStore.getState()
      expect(state.currentSubscription?.autoRenew).toBe(false)
    })
  })

  describe('reactivateSubscription', () => {
    it('should reactivate cancelled subscription', () => {
      const { subscribe } = useSubscriptionStore.getState()
      subscribe(SubscriptionTier.PRO, 'monthly')
      useSubscriptionStore.getState().cancelSubscription()

      const result = useSubscriptionStore.getState().reactivateSubscription()

      expect(result).toBe(true)
      expect(useSubscriptionStore.getState().currentSubscription?.status).toBe('active')
    })

    it('should return false for active subscription', () => {
      const { subscribe } = useSubscriptionStore.getState()
      subscribe(SubscriptionTier.PRO, 'monthly')

      const result = useSubscriptionStore.getState().reactivateSubscription()

      expect(result).toBe(false)
    })

    it('should re-enable auto-renew', () => {
      const { subscribe } = useSubscriptionStore.getState()
      subscribe(SubscriptionTier.PRO, 'monthly')
      useSubscriptionStore.getState().cancelSubscription()
      useSubscriptionStore.getState().reactivateSubscription()

      const state = useSubscriptionStore.getState()
      expect(state.currentSubscription?.autoRenew).toBe(true)
    })
  })

  describe('toggleAutoRenew', () => {
    it('should toggle auto-renew off', () => {
      const { subscribe } = useSubscriptionStore.getState()
      subscribe(SubscriptionTier.PRO, 'monthly')

      useSubscriptionStore.getState().toggleAutoRenew()

      expect(useSubscriptionStore.getState().currentSubscription?.autoRenew).toBe(false)
    })

    it('should toggle auto-renew on', () => {
      const { subscribe } = useSubscriptionStore.getState()
      subscribe(SubscriptionTier.PRO, 'monthly')
      useSubscriptionStore.getState().toggleAutoRenew() // off
      useSubscriptionStore.getState().toggleAutoRenew() // on

      expect(useSubscriptionStore.getState().currentSubscription?.autoRenew).toBe(true)
    })
  })

  describe('prediction limits', () => {
    it('should allow predictions when under limit', () => {
      const { canMakePrediction, recordPrediction } = useSubscriptionStore.getState()

      expect(canMakePrediction()).toBe(true)
      expect(recordPrediction()).toBe(true)
    })

    it('should track predictions made', () => {
      const { recordPrediction } = useSubscriptionStore.getState()

      recordPrediction()
      recordPrediction()

      const state = useSubscriptionStore.getState()
      expect(state.predictionsToday).toBe(2)
    })

    it('should reset predictions on new day', () => {
      const { recordPrediction } = useSubscriptionStore.getState()

      // Make predictions today
      recordPrediction()
      recordPrediction()

      // Advance to next day
      vi.setSystemTime(new Date('2024-01-16T12:00:00.000Z'))

      expect(useSubscriptionStore.getState().canMakePrediction()).toBe(true)
    })

    it('should return remaining predictions', () => {
      const { getRemainingPredictions } = useSubscriptionStore.getState()

      // FREE tier has limited predictions
      const remaining = getRemainingPredictions()
      expect(remaining).not.toBeNull()
      expect(remaining).toBeGreaterThan(0)
    })

    it('should return null for unlimited predictions', () => {
      const { subscribe } = useSubscriptionStore.getState()
      subscribe(SubscriptionTier.ELITE, 'monthly')

      expect(useSubscriptionStore.getState().getRemainingPredictions()).toBeNull()
    })
  })

  describe('isSubscriptionActive', () => {
    it('should return false when no subscription', () => {
      const { isSubscriptionActive } = useSubscriptionStore.getState()
      expect(isSubscriptionActive()).toBe(false)
    })

    it('should return true when subscription active', () => {
      const { subscribe } = useSubscriptionStore.getState()
      subscribe(SubscriptionTier.PRO, 'monthly')

      expect(useSubscriptionStore.getState().isSubscriptionActive()).toBe(true)
    })

    it('should return false when cancelled', () => {
      const { subscribe } = useSubscriptionStore.getState()
      subscribe(SubscriptionTier.PRO, 'monthly')
      useSubscriptionStore.getState().cancelSubscription()

      expect(useSubscriptionStore.getState().isSubscriptionActive()).toBe(false)
    })
  })

  describe('updateBillingPeriod', () => {
    it('should update billing period', () => {
      const { subscribe } = useSubscriptionStore.getState()
      subscribe(SubscriptionTier.PRO, 'monthly')

      useSubscriptionStore.getState().updateBillingPeriod('yearly')

      expect(useSubscriptionStore.getState().currentSubscription?.billingPeriod).toBe('yearly')
    })
  })
})
