/**
 * Feature Flags Library
 * Issue #98: Implement feature flags and progressive rollout system
 *
 * Core feature flag definitions and utility functions for
 * checking feature availability based on rollout percentages
 * and user allowlists.
 */

/**
 * Feature flag configuration interface
 */
export interface FeatureFlag {
  /** Unique identifier for the flag */
  id: string
  /** Human-readable name */
  name: string
  /** Description of what the flag controls */
  description: string
  /** Whether the flag is globally enabled */
  enabled: boolean
  /** Percentage of users who should see this feature (0-100) */
  rolloutPercentage: number
  /** Optional list of user IDs who always have access */
  allowedUsers?: string[]
}

/**
 * Feature flag identifiers as constants for type safety
 */
export const FEATURE_FLAG_IDS = {
  DARK_MODE: 'DARK_MODE',
  BETTING_ENABLED: 'BETTING_ENABLED',
  NEW_TRANSACTION_UI: 'NEW_TRANSACTION_UI',
  PREMIUM_FEATURES: 'PREMIUM_FEATURES',
} as const

export type FeatureFlagId = (typeof FEATURE_FLAG_IDS)[keyof typeof FEATURE_FLAG_IDS]

/**
 * Default feature flag configurations
 */
export const DEFAULT_FLAGS: Record<FeatureFlagId, FeatureFlag> = {
  [FEATURE_FLAG_IDS.DARK_MODE]: {
    id: FEATURE_FLAG_IDS.DARK_MODE,
    name: 'Dark Mode',
    description: 'Enable dark mode theme option for users',
    enabled: true,
    rolloutPercentage: 100,
  },
  [FEATURE_FLAG_IDS.BETTING_ENABLED]: {
    id: FEATURE_FLAG_IDS.BETTING_ENABLED,
    name: 'Betting',
    description: 'Enable betting functionality on events',
    enabled: true,
    rolloutPercentage: 100,
  },
  [FEATURE_FLAG_IDS.NEW_TRANSACTION_UI]: {
    id: FEATURE_FLAG_IDS.NEW_TRANSACTION_UI,
    name: 'New Transaction UI',
    description: 'Enable the redesigned transaction interface',
    enabled: true,
    rolloutPercentage: 100,
  },
  [FEATURE_FLAG_IDS.PREMIUM_FEATURES]: {
    id: FEATURE_FLAG_IDS.PREMIUM_FEATURES,
    name: 'Premium Features',
    description: 'Enable premium subscription features',
    enabled: false,
    rolloutPercentage: 0,
  },
}

/**
 * Hash a user ID to a deterministic number for consistent rollout
 * Uses a simple hash function for predictable bucket assignment
 */
function hashUserId(userId: string): number {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

/**
 * Determine if a user falls within the rollout percentage
 * Uses consistent hashing so the same user always gets the same result
 */
function isUserInRollout(userId: string, flagId: string, rolloutPercentage: number): boolean {
  if (rolloutPercentage >= 100) return true
  if (rolloutPercentage <= 0) return false

  // Combine userId and flagId for unique bucket per feature
  const combinedKey = `${userId}-${flagId}`
  const hash = hashUserId(combinedKey)
  const bucket = hash % 100

  return bucket < rolloutPercentage
}

/**
 * Check if a feature is enabled for a specific user
 *
 * @param flagId - The feature flag identifier
 * @param userId - Optional user ID for rollout percentage checks
 * @param flags - Optional custom flags object (defaults to DEFAULT_FLAGS)
 * @returns Whether the feature is enabled for this user
 */
export function isFeatureEnabled(
  flagId: FeatureFlagId,
  userId?: string,
  flags: Record<string, FeatureFlag> = DEFAULT_FLAGS
): boolean {
  const flag = flags[flagId]

  if (!flag) {
    console.warn(`Feature flag "${flagId}" not found`)
    return false
  }

  // If flag is globally disabled, return false
  if (!flag.enabled) {
    return false
  }

  // Check if user is in the allowlist
  if (userId && flag.allowedUsers?.includes(userId)) {
    return true
  }

  // If no user ID provided, only check if globally enabled
  if (!userId) {
    return flag.enabled && flag.rolloutPercentage > 0
  }

  // Check rollout percentage
  return isUserInRollout(userId, flagId, flag.rolloutPercentage)
}

/**
 * Get all enabled features
 *
 * @param userId - Optional user ID for rollout percentage checks
 * @param flags - Optional custom flags object (defaults to DEFAULT_FLAGS)
 * @returns Array of enabled feature flag IDs
 */
export function getEnabledFeatures(
  userId?: string,
  flags: Record<string, FeatureFlag> = DEFAULT_FLAGS
): FeatureFlagId[] {
  return Object.keys(flags).filter((flagId) =>
    isFeatureEnabled(flagId as FeatureFlagId, userId, flags)
  ) as FeatureFlagId[]
}

/**
 * Get all feature flags
 *
 * @param flags - Optional custom flags object (defaults to DEFAULT_FLAGS)
 * @returns All feature flags
 */
export function getAllFlags(
  flags: Record<string, FeatureFlag> = DEFAULT_FLAGS
): FeatureFlag[] {
  return Object.values(flags)
}
