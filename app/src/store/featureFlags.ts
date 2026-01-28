/**
 * Feature Flags Store
 * Issue #98: Implement feature flags and progressive rollout system
 *
 * Zustand store for managing feature flag state with
 * localStorage persistence and testing overrides.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  type FeatureFlag,
  type FeatureFlagId,
  DEFAULT_FLAGS,
  FEATURE_FLAG_IDS,
  isFeatureEnabled as checkFeatureEnabled,
  getEnabledFeatures as getEnabled,
  getAllFlags,
} from '@/lib/featureFlags'

interface FeatureFlagsState {
  /** Current feature flags configuration */
  flags: Record<string, FeatureFlag>

  /** Override flags for testing (takes precedence over regular flags) */
  overrides: Record<string, boolean>

  /** Current user ID for rollout calculations */
  userId: string | null

  /** Set a flag's enabled state */
  setFlag: (id: FeatureFlagId, enabled: boolean) => void

  /** Set a flag's rollout percentage */
  setRolloutPercentage: (id: FeatureFlagId, percentage: number) => void

  /** Set a flag's allowed users list */
  setAllowedUsers: (id: FeatureFlagId, users: string[]) => void

  /** Set an override for testing */
  setOverride: (id: FeatureFlagId, enabled: boolean) => void

  /** Clear an override */
  clearOverride: (id: FeatureFlagId) => void

  /** Clear all overrides */
  clearAllOverrides: () => void

  /** Set the current user ID */
  setUserId: (userId: string | null) => void

  /** Check if a feature is enabled */
  isEnabled: (id: FeatureFlagId) => boolean

  /** Get all enabled features */
  getEnabledFeatures: () => FeatureFlagId[]

  /** Get all flags */
  getAllFlags: () => FeatureFlag[]

  /** Reset flags to defaults */
  resetToDefaults: () => void
}

export const useFeatureFlagsStore = create<FeatureFlagsState>()(
  persist(
    (set, get) => ({
      flags: { ...DEFAULT_FLAGS },
      overrides: {},
      userId: null,

      setFlag: (id: FeatureFlagId, enabled: boolean) => {
        set((state) => ({
          flags: {
            ...state.flags,
            [id]: {
              ...state.flags[id],
              enabled,
            },
          },
        }))
      },

      setRolloutPercentage: (id: FeatureFlagId, percentage: number) => {
        const clampedPercentage = Math.max(0, Math.min(100, percentage))
        set((state) => ({
          flags: {
            ...state.flags,
            [id]: {
              ...state.flags[id],
              rolloutPercentage: clampedPercentage,
            },
          },
        }))
      },

      setAllowedUsers: (id: FeatureFlagId, users: string[]) => {
        set((state) => ({
          flags: {
            ...state.flags,
            [id]: {
              ...state.flags[id],
              allowedUsers: users,
            },
          },
        }))
      },

      setOverride: (id: FeatureFlagId, enabled: boolean) => {
        set((state) => ({
          overrides: {
            ...state.overrides,
            [id]: enabled,
          },
        }))
      },

      clearOverride: (id: FeatureFlagId) => {
        set((state) => {
          const { [id]: _, ...rest } = state.overrides
          return { overrides: rest }
        })
      },

      clearAllOverrides: () => {
        set({ overrides: {} })
      },

      setUserId: (userId: string | null) => {
        set({ userId })
      },

      isEnabled: (id: FeatureFlagId) => {
        const { flags, overrides, userId } = get()

        // Check for override first
        if (id in overrides) {
          return overrides[id]
        }

        return checkFeatureEnabled(id, userId ?? undefined, flags)
      },

      getEnabledFeatures: () => {
        const { flags, overrides, userId } = get()

        // Get enabled features considering overrides
        const enabledFromFlags = getEnabled(userId ?? undefined, flags)

        // Apply overrides
        const result = new Set(enabledFromFlags)

        for (const [flagId, enabled] of Object.entries(overrides)) {
          if (enabled) {
            result.add(flagId as FeatureFlagId)
          } else {
            result.delete(flagId as FeatureFlagId)
          }
        }

        return Array.from(result)
      },

      getAllFlags: () => {
        const { flags } = get()
        return getAllFlags(flags)
      },

      resetToDefaults: () => {
        set({
          flags: { ...DEFAULT_FLAGS },
          overrides: {},
        })
      },
    }),
    {
      name: 'doomsday-feature-flags',
      partialize: (state) => ({
        flags: state.flags,
        overrides: state.overrides,
        userId: state.userId,
      }),
    }
  )
)

// Re-export for convenience
export { FEATURE_FLAG_IDS }
export type { FeatureFlag, FeatureFlagId }
