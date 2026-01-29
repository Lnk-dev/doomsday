/**
 * Subscription System
 *
 * Defines subscription tiers, plans, and utility functions
 * for checking feature access and managing subscription state.
 */

/** Subscription tier levels */
export const SubscriptionTier = {
  FREE: 'FREE',
  BASIC: 'BASIC',
  PRO: 'PRO',
  ELITE: 'ELITE',
} as const

export type SubscriptionTier = (typeof SubscriptionTier)[keyof typeof SubscriptionTier]

/** Features that can be gated by subscription */
export type SubscriptionFeature =
  | 'no_ads'
  | 'unlimited_predictions'
  | 'basic_analytics'
  | 'advanced_analytics'
  | 'priority_support'
  | 'vip_support'
  | 'profile_badges'
  | 'exclusive_events'
  | 'custom_themes'
  | 'early_access'
  | 'api_access'

/** Subscription plan definition */
export interface SubscriptionPlan {
  tier: SubscriptionTier
  name: string
  description: string
  price: number // Monthly price in USD
  yearlyPrice: number // Yearly price in USD (with discount)
  features: SubscriptionFeature[]
  featureDescriptions: string[]
  popular?: boolean
  color: string
}

/** Subscription plans configuration */
export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  [SubscriptionTier.FREE]: {
    tier: SubscriptionTier.FREE,
    name: 'Free',
    description: 'Get started with basic features',
    price: 0,
    yearlyPrice: 0,
    features: [],
    featureDescriptions: [
      'Basic doom scroll feed',
      'Limited predictions (5/day)',
      'Ad-supported experience',
      'Community access',
      'Basic profile',
    ],
    color: '#777777',
  },
  [SubscriptionTier.BASIC]: {
    tier: SubscriptionTier.BASIC,
    name: 'Basic',
    description: 'Remove ads and unlock more predictions',
    price: 5,
    yearlyPrice: 48, // $4/month when paid yearly
    features: ['no_ads', 'basic_analytics'],
    featureDescriptions: [
      'Ad-free experience',
      'Extended predictions (25/day)',
      'Basic analytics dashboard',
      'Prediction history',
      'Email support',
    ],
    color: '#00ba7c',
  },
  [SubscriptionTier.PRO]: {
    tier: SubscriptionTier.PRO,
    name: 'Pro',
    description: 'Advanced features for serious predictors',
    price: 15,
    yearlyPrice: 144, // $12/month when paid yearly
    features: [
      'no_ads',
      'unlimited_predictions',
      'basic_analytics',
      'advanced_analytics',
      'priority_support',
      'profile_badges',
      'custom_themes',
    ],
    featureDescriptions: [
      'Everything in Basic',
      'Unlimited predictions',
      'Advanced analytics & insights',
      'Priority support',
      'Exclusive Pro badge',
      'Custom profile themes',
      'Early access to new features',
    ],
    popular: true,
    color: '#ff6b35',
  },
  [SubscriptionTier.ELITE]: {
    tier: SubscriptionTier.ELITE,
    name: 'Elite',
    description: 'The ultimate Doomsday experience',
    price: 30,
    yearlyPrice: 288, // $24/month when paid yearly
    features: [
      'no_ads',
      'unlimited_predictions',
      'basic_analytics',
      'advanced_analytics',
      'priority_support',
      'vip_support',
      'profile_badges',
      'exclusive_events',
      'custom_themes',
      'early_access',
      'api_access',
    ],
    featureDescriptions: [
      'Everything in Pro',
      'VIP support with dedicated agent',
      'Exclusive Elite events',
      'Elite badge & profile flair',
      'API access for developers',
      'Private Elite community',
      'Influence on product roadmap',
    ],
    color: '#ff3040',
  },
}

/** Get features list for a specific tier */
export function getTierFeatures(tier: SubscriptionTier): SubscriptionFeature[] {
  return SUBSCRIPTION_PLANS[tier].features
}

/** Get feature descriptions for display */
export function getTierFeatureDescriptions(tier: SubscriptionTier): string[] {
  return SUBSCRIPTION_PLANS[tier].featureDescriptions
}

/** Check if a tier has access to a specific feature */
export function canAccessFeature(
  tier: SubscriptionTier,
  feature: SubscriptionFeature
): boolean {
  return SUBSCRIPTION_PLANS[tier].features.includes(feature)
}

/** Get the daily prediction limit for a tier */
export function getPredictionLimit(tier: SubscriptionTier): number | null {
  switch (tier) {
    case SubscriptionTier.FREE:
      return 5
    case SubscriptionTier.BASIC:
      return 25
    case SubscriptionTier.PRO:
    case SubscriptionTier.ELITE:
      return null // Unlimited
  }
}

/** Get tier by name (case insensitive) */
export function getTierByName(name: string): SubscriptionTier | null {
  const upperName = name.toUpperCase()
  const tiers = Object.values(SubscriptionTier)
  if (tiers.includes(upperName as SubscriptionTier)) {
    return upperName as SubscriptionTier
  }
  return null
}

/** Compare two tiers - returns positive if tier1 > tier2 */
export function compareTiers(
  tier1: SubscriptionTier,
  tier2: SubscriptionTier
): number {
  const tierOrder: SubscriptionTier[] = [
    SubscriptionTier.FREE,
    SubscriptionTier.BASIC,
    SubscriptionTier.PRO,
    SubscriptionTier.ELITE,
  ]
  return tierOrder.indexOf(tier1) - tierOrder.indexOf(tier2)
}

/** Check if tier1 is higher than tier2 */
export function isHigherTier(
  tier1: SubscriptionTier,
  tier2: SubscriptionTier
): boolean {
  return compareTiers(tier1, tier2) > 0
}

/** Get next tier upgrade option */
export function getNextTier(tier: SubscriptionTier): SubscriptionTier | null {
  switch (tier) {
    case SubscriptionTier.FREE:
      return SubscriptionTier.BASIC
    case SubscriptionTier.BASIC:
      return SubscriptionTier.PRO
    case SubscriptionTier.PRO:
      return SubscriptionTier.ELITE
    case SubscriptionTier.ELITE:
      return null
  }
}

/** Format price for display */
export function formatPrice(price: number): string {
  if (price === 0) return 'Free'
  return `$${price}/mo`
}

/** Format yearly price for display */
export function formatYearlyPrice(yearlyPrice: number): string {
  if (yearlyPrice === 0) return 'Free'
  const monthlyEquivalent = yearlyPrice / 12
  return `$${monthlyEquivalent.toFixed(0)}/mo`
}

/** Calculate savings for yearly billing */
export function calculateYearlySavings(tier: SubscriptionTier): number {
  const plan = SUBSCRIPTION_PLANS[tier]
  const monthlyTotal = plan.price * 12
  return monthlyTotal - plan.yearlyPrice
}
