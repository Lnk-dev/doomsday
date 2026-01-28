/**
 * Feature Flag Hooks
 * Issue #98: Implement feature flags and progressive rollout system
 *
 * React hooks for consuming feature flags in components.
 */

import { useMemo } from 'react'
import {
  useFeatureFlagsStore,
  type FeatureFlagId,
  type FeatureFlag,
} from '@/store/featureFlags'

/**
 * Hook to check if a single feature flag is enabled
 *
 * @param flagId - The feature flag identifier to check
 * @returns Boolean indicating if the feature is enabled
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isBettingEnabled = useFeatureFlag('BETTING_ENABLED')
 *
 *   if (!isBettingEnabled) {
 *     return <div>Betting is currently unavailable</div>
 *   }
 *
 *   return <BettingInterface />
 * }
 * ```
 */
export function useFeatureFlag(flagId: FeatureFlagId): boolean {
  const isEnabled = useFeatureFlagsStore((state) => state.isEnabled)
  const flags = useFeatureFlagsStore((state) => state.flags)
  const overrides = useFeatureFlagsStore((state) => state.overrides)
  const userId = useFeatureFlagsStore((state) => state.userId)

  // Memoize the result to prevent unnecessary re-renders
  return useMemo(() => {
    return isEnabled(flagId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flagId, flags, overrides, userId, isEnabled])
}

/**
 * Hook to get all feature flags and their states
 *
 * @returns Object containing all flags, enabled features, and utility functions
 *
 * @example
 * ```tsx
 * function FeatureDebugPanel() {
 *   const { flags, enabledFeatures, isEnabled } = useFeatureFlags()
 *
 *   return (
 *     <div>
 *       <h3>Enabled Features: {enabledFeatures.length}</h3>
 *       {flags.map(flag => (
 *         <div key={flag.id}>
 *           {flag.name}: {isEnabled(flag.id) ? 'ON' : 'OFF'}
 *         </div>
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 */
export function useFeatureFlags(): {
  /** All feature flag configurations */
  flags: FeatureFlag[]
  /** Array of currently enabled feature flag IDs */
  enabledFeatures: FeatureFlagId[]
  /** Check if a specific feature is enabled */
  isEnabled: (flagId: FeatureFlagId) => boolean
  /** Current overrides map */
  overrides: Record<string, boolean>
  /** Current user ID */
  userId: string | null
} {
  const getAllFlags = useFeatureFlagsStore((state) => state.getAllFlags)
  const getEnabledFeatures = useFeatureFlagsStore((state) => state.getEnabledFeatures)
  const isEnabled = useFeatureFlagsStore((state) => state.isEnabled)
  const overrides = useFeatureFlagsStore((state) => state.overrides)
  const userId = useFeatureFlagsStore((state) => state.userId)
  const flagsState = useFeatureFlagsStore((state) => state.flags)

  const flags = useMemo(() => getAllFlags(), [getAllFlags, flagsState])
  const enabledFeatures = useMemo(
    () => getEnabledFeatures(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getEnabledFeatures, flagsState, overrides, userId]
  )

  return {
    flags,
    enabledFeatures,
    isEnabled,
    overrides,
    userId,
  }
}

/**
 * Hook for feature flag management (setters)
 * Separated from reading hooks for better separation of concerns
 *
 * @returns Object with all feature flag management functions
 *
 * @example
 * ```tsx
 * function AdminPanel() {
 *   const { setFlag, setRolloutPercentage, setOverride } = useFeatureFlagActions()
 *
 *   return (
 *     <button onClick={() => setFlag('PREMIUM_FEATURES', true)}>
 *       Enable Premium
 *     </button>
 *   )
 * }
 * ```
 */
export function useFeatureFlagActions(): {
  /** Enable or disable a flag */
  setFlag: (id: FeatureFlagId, enabled: boolean) => void
  /** Set rollout percentage for gradual rollout */
  setRolloutPercentage: (id: FeatureFlagId, percentage: number) => void
  /** Set allowed users for a flag */
  setAllowedUsers: (id: FeatureFlagId, users: string[]) => void
  /** Set a testing override */
  setOverride: (id: FeatureFlagId, enabled: boolean) => void
  /** Clear a specific override */
  clearOverride: (id: FeatureFlagId) => void
  /** Clear all testing overrides */
  clearAllOverrides: () => void
  /** Set the current user ID for rollout calculations */
  setUserId: (userId: string | null) => void
  /** Reset all flags to default values */
  resetToDefaults: () => void
} {
  const setFlag = useFeatureFlagsStore((state) => state.setFlag)
  const setRolloutPercentage = useFeatureFlagsStore((state) => state.setRolloutPercentage)
  const setAllowedUsers = useFeatureFlagsStore((state) => state.setAllowedUsers)
  const setOverride = useFeatureFlagsStore((state) => state.setOverride)
  const clearOverride = useFeatureFlagsStore((state) => state.clearOverride)
  const clearAllOverrides = useFeatureFlagsStore((state) => state.clearAllOverrides)
  const setUserId = useFeatureFlagsStore((state) => state.setUserId)
  const resetToDefaults = useFeatureFlagsStore((state) => state.resetToDefaults)

  return {
    setFlag,
    setRolloutPercentage,
    setAllowedUsers,
    setOverride,
    clearOverride,
    clearAllOverrides,
    setUserId,
    resetToDefaults,
  }
}
