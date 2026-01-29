/**
 * Subscription Store
 *
 * Zustand store for managing user subscription state.
 * Handles:
 * - Current subscription tracking
 * - Subscription history
 * - Tier upgrades and downgrades
 * - Subscription cancellation
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  SubscriptionTier,
  canAccessFeature,
  getPredictionLimit,
  isHigherTier,
  SUBSCRIPTION_PLANS,
} from '@/lib/subscriptions'
import type { SubscriptionFeature } from '@/lib/subscriptions'

/** Billing period options */
export type BillingPeriod = 'monthly' | 'yearly'

/** Subscription status */
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'past_due'

/** Subscription record */
export interface Subscription {
  id: string
  tier: SubscriptionTier
  status: SubscriptionStatus
  billingPeriod: BillingPeriod
  startDate: Date
  endDate: Date | null
  cancelledAt: Date | null
  autoRenew: boolean
}

/** Subscription history entry */
export interface SubscriptionHistoryEntry {
  id: string
  tier: SubscriptionTier
  action: 'subscribed' | 'upgraded' | 'downgraded' | 'cancelled' | 'renewed' | 'expired'
  timestamp: Date
  previousTier?: SubscriptionTier
  price: number
  billingPeriod: BillingPeriod
}

/** Generate unique ID */
const generateId = (): string => `sub_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`

interface SubscriptionState {
  /** Current active subscription */
  currentSubscription: Subscription | null
  /** Subscription history */
  history: SubscriptionHistoryEntry[]
  /** Predictions made today (for limit tracking) */
  predictionsToday: number
  /** Date of last prediction (for daily reset) */
  lastPredictionDate: string | null

  // Computed getters
  /** Get current tier (defaults to FREE if no subscription) */
  getCurrentTier: () => SubscriptionTier
  /** Check if user has access to a feature */
  hasFeature: (feature: SubscriptionFeature) => boolean
  /** Check if user can make more predictions today */
  canMakePrediction: () => boolean
  /** Get remaining predictions for today */
  getRemainingPredictions: () => number | null
  /** Check if subscription is active */
  isSubscriptionActive: () => boolean

  // Actions
  /** Subscribe to a tier */
  subscribe: (tier: SubscriptionTier, billingPeriod: BillingPeriod) => void
  /** Upgrade to a higher tier */
  upgradeTier: (newTier: SubscriptionTier) => boolean
  /** Downgrade to a lower tier */
  downgradeTier: (newTier: SubscriptionTier) => boolean
  /** Cancel current subscription */
  cancelSubscription: () => boolean
  /** Reactivate cancelled subscription */
  reactivateSubscription: () => boolean
  /** Toggle auto-renewal */
  toggleAutoRenew: () => void
  /** Update billing period */
  updateBillingPeriod: (billingPeriod: BillingPeriod) => void
  /** Record a prediction (for limit tracking) */
  recordPrediction: () => boolean
  /** Reset daily prediction count */
  resetDailyPredictions: () => void
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      currentSubscription: null,
      history: [],
      predictionsToday: 0,
      lastPredictionDate: null,

      getCurrentTier: () => {
        const { currentSubscription } = get()
        if (!currentSubscription || currentSubscription.status !== 'active') {
          return SubscriptionTier.FREE
        }
        return currentSubscription.tier
      },

      hasFeature: (feature) => {
        const tier = get().getCurrentTier()
        return canAccessFeature(tier, feature)
      },

      canMakePrediction: () => {
        const state = get()
        const tier = state.getCurrentTier()
        const limit = getPredictionLimit(tier)

        // Check if we need to reset daily count
        const today = new Date().toISOString().split('T')[0]
        if (state.lastPredictionDate !== today) {
          state.resetDailyPredictions()
          return true
        }

        // Unlimited predictions
        if (limit === null) return true

        return state.predictionsToday < limit
      },

      getRemainingPredictions: () => {
        const state = get()
        const tier = state.getCurrentTier()
        const limit = getPredictionLimit(tier)

        if (limit === null) return null // Unlimited

        const today = new Date().toISOString().split('T')[0]
        if (state.lastPredictionDate !== today) {
          return limit
        }

        return Math.max(0, limit - state.predictionsToday)
      },

      isSubscriptionActive: () => {
        const { currentSubscription } = get()
        return currentSubscription?.status === 'active'
      },

      subscribe: (tier, billingPeriod) => {
        const plan = SUBSCRIPTION_PLANS[tier]
        const now = new Date()
        const endDate = new Date(now)
        if (billingPeriod === 'monthly') {
          endDate.setMonth(endDate.getMonth() + 1)
        } else {
          endDate.setFullYear(endDate.getFullYear() + 1)
        }

        const subscription: Subscription = {
          id: generateId(),
          tier,
          status: 'active',
          billingPeriod,
          startDate: now,
          endDate,
          cancelledAt: null,
          autoRenew: true,
        }

        const historyEntry: SubscriptionHistoryEntry = {
          id: generateId(),
          tier,
          action: 'subscribed',
          timestamp: now,
          price: billingPeriod === 'monthly' ? plan.price : plan.yearlyPrice,
          billingPeriod,
        }

        set((state) => ({
          currentSubscription: subscription,
          history: [historyEntry, ...state.history],
        }))
      },

      upgradeTier: (newTier) => {
        const state = get()
        const currentTier = state.getCurrentTier()

        if (!isHigherTier(newTier, currentTier)) {
          return false
        }

        const billingPeriod = state.currentSubscription?.billingPeriod || 'monthly'
        const plan = SUBSCRIPTION_PLANS[newTier]
        const now = new Date()
        const endDate = new Date(now)
        if (billingPeriod === 'monthly') {
          endDate.setMonth(endDate.getMonth() + 1)
        } else {
          endDate.setFullYear(endDate.getFullYear() + 1)
        }

        const subscription: Subscription = {
          id: generateId(),
          tier: newTier,
          status: 'active',
          billingPeriod,
          startDate: now,
          endDate,
          cancelledAt: null,
          autoRenew: state.currentSubscription?.autoRenew ?? true,
        }

        const historyEntry: SubscriptionHistoryEntry = {
          id: generateId(),
          tier: newTier,
          action: 'upgraded',
          timestamp: now,
          previousTier: currentTier,
          price: billingPeriod === 'monthly' ? plan.price : plan.yearlyPrice,
          billingPeriod,
        }

        set((state) => ({
          currentSubscription: subscription,
          history: [historyEntry, ...state.history],
        }))

        return true
      },

      downgradeTier: (newTier) => {
        const state = get()
        const currentTier = state.getCurrentTier()

        if (isHigherTier(newTier, currentTier) || newTier === currentTier) {
          return false
        }

        const billingPeriod = state.currentSubscription?.billingPeriod || 'monthly'
        const plan = SUBSCRIPTION_PLANS[newTier]
        const now = new Date()

        // Downgrade takes effect at end of current billing period
        const historyEntry: SubscriptionHistoryEntry = {
          id: generateId(),
          tier: newTier,
          action: 'downgraded',
          timestamp: now,
          previousTier: currentTier,
          price: billingPeriod === 'monthly' ? plan.price : plan.yearlyPrice,
          billingPeriod,
        }

        // For simplicity, immediate downgrade in this implementation
        if (newTier === SubscriptionTier.FREE) {
          set((state) => ({
            currentSubscription: null,
            history: [historyEntry, ...state.history],
          }))
        } else {
          const endDate = new Date(now)
          if (billingPeriod === 'monthly') {
            endDate.setMonth(endDate.getMonth() + 1)
          } else {
            endDate.setFullYear(endDate.getFullYear() + 1)
          }

          const subscription: Subscription = {
            id: generateId(),
            tier: newTier,
            status: 'active',
            billingPeriod,
            startDate: now,
            endDate,
            cancelledAt: null,
            autoRenew: state.currentSubscription?.autoRenew ?? true,
          }

          set((state) => ({
            currentSubscription: subscription,
            history: [historyEntry, ...state.history],
          }))
        }

        return true
      },

      cancelSubscription: () => {
        const { currentSubscription } = get()
        if (!currentSubscription || currentSubscription.status !== 'active') {
          return false
        }

        const now = new Date()
        const historyEntry: SubscriptionHistoryEntry = {
          id: generateId(),
          tier: currentSubscription.tier,
          action: 'cancelled',
          timestamp: now,
          price: 0,
          billingPeriod: currentSubscription.billingPeriod,
        }

        set((state) => ({
          currentSubscription: state.currentSubscription
            ? {
                ...state.currentSubscription,
                status: 'cancelled',
                cancelledAt: now,
                autoRenew: false,
              }
            : null,
          history: [historyEntry, ...state.history],
        }))

        return true
      },

      reactivateSubscription: () => {
        const { currentSubscription } = get()
        if (!currentSubscription || currentSubscription.status !== 'cancelled') {
          return false
        }

        const now = new Date()
        const plan = SUBSCRIPTION_PLANS[currentSubscription.tier]
        const historyEntry: SubscriptionHistoryEntry = {
          id: generateId(),
          tier: currentSubscription.tier,
          action: 'renewed',
          timestamp: now,
          price:
            currentSubscription.billingPeriod === 'monthly'
              ? plan.price
              : plan.yearlyPrice,
          billingPeriod: currentSubscription.billingPeriod,
        }

        set((state) => ({
          currentSubscription: state.currentSubscription
            ? {
                ...state.currentSubscription,
                status: 'active',
                cancelledAt: null,
                autoRenew: true,
              }
            : null,
          history: [historyEntry, ...state.history],
        }))

        return true
      },

      toggleAutoRenew: () => {
        set((state) => ({
          currentSubscription: state.currentSubscription
            ? {
                ...state.currentSubscription,
                autoRenew: !state.currentSubscription.autoRenew,
              }
            : null,
        }))
      },

      updateBillingPeriod: (billingPeriod) => {
        set((state) => ({
          currentSubscription: state.currentSubscription
            ? {
                ...state.currentSubscription,
                billingPeriod,
              }
            : null,
        }))
      },

      recordPrediction: () => {
        const state = get()
        if (!state.canMakePrediction()) {
          return false
        }

        const today = new Date().toISOString().split('T')[0]
        set({
          predictionsToday:
            state.lastPredictionDate === today ? state.predictionsToday + 1 : 1,
          lastPredictionDate: today,
        })

        return true
      },

      resetDailyPredictions: () => {
        set({
          predictionsToday: 0,
          lastPredictionDate: new Date().toISOString().split('T')[0],
        })
      },
    }),
    {
      name: 'doomsday-subscription',
      partialize: (state) => ({
        currentSubscription: state.currentSubscription,
        history: state.history,
        predictionsToday: state.predictionsToday,
        lastPredictionDate: state.lastPredictionDate,
      }),
    }
  )
)
