/**
 * Feature Flag Dev Panel
 * Issue #98: Implement feature flags and progressive rollout system
 *
 * Development panel for toggling and managing feature flags.
 * Only rendered in development mode.
 */

import { useState } from 'react'
import { useFeatureFlags, useFeatureFlagActions } from '@/hooks/useFeatureFlag'
import type { FeatureFlagId } from '@/store/featureFlags'

/**
 * Development panel for managing feature flags
 * Only shown when NODE_ENV is not 'production'
 */
export function FeatureFlagPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(true)

  const { flags, overrides, isEnabled } = useFeatureFlags()
  const {
    setFlag,
    setRolloutPercentage,
    setOverride,
    clearOverride,
    clearAllOverrides,
    resetToDefaults,
  } = useFeatureFlagActions()

  // Only show in development
  if (import.meta.env.PROD) {
    return null
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium transition-colors"
        title="Open Feature Flags Panel"
      >
        Flags
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[80vh] bg-gray-900 border border-gray-700 rounded-lg shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-800 px-4 py-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-purple-400 font-semibold">Feature Flags</span>
          <span className="bg-purple-600/20 text-purple-400 text-xs px-2 py-0.5 rounded">
            DEV
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-gray-400 hover:text-white transition-colors"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-white transition-colors"
            title="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Actions Bar */}
          <div className="flex gap-2 px-4 py-2 bg-gray-800/50 border-b border-gray-700">
            <button
              onClick={clearAllOverrides}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Clear Overrides
            </button>
            <span className="text-gray-600">|</span>
            <button
              onClick={resetToDefaults}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Reset All
            </button>
          </div>

          {/* Flags List */}
          <div className="overflow-y-auto max-h-[60vh] p-4 space-y-4">
            {flags.map((flag) => {
              const flagId = flag.id as FeatureFlagId
              const enabled = isEnabled(flagId)
              const hasOverride = flagId in overrides

              return (
                <div
                  key={flag.id}
                  className={`p-3 rounded-lg border ${
                    hasOverride
                      ? 'border-yellow-600/50 bg-yellow-900/10'
                      : 'border-gray-700 bg-gray-800/50'
                  }`}
                >
                  {/* Flag Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{flag.name}</span>
                      {hasOverride && (
                        <span className="text-xs text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded">
                          Override
                        </span>
                      )}
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => {
                          if (hasOverride) {
                            if (e.target.checked === flag.enabled) {
                              clearOverride(flagId)
                            } else {
                              setOverride(flagId, e.target.checked)
                            }
                          } else {
                            setOverride(flagId, e.target.checked)
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  {/* Flag Description */}
                  <p className="text-sm text-gray-400 mb-3">{flag.description}</p>

                  {/* Rollout Percentage */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Rollout</span>
                      <span className="text-gray-400">{flag.rolloutPercentage}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={flag.rolloutPercentage}
                      onChange={(e) => setRolloutPercentage(flagId, parseInt(e.target.value))}
                      className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2 mt-3 pt-2 border-t border-gray-700/50">
                    <button
                      onClick={() => setFlag(flagId, true)}
                      className="text-xs text-green-400 hover:text-green-300 transition-colors"
                    >
                      Enable
                    </button>
                    <button
                      onClick={() => setFlag(flagId, false)}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      Disable
                    </button>
                    {hasOverride && (
                      <button
                        onClick={() => clearOverride(flagId)}
                        className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors ml-auto"
                      >
                        Clear Override
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-gray-800/50 border-t border-gray-700 text-xs text-gray-500">
            {Object.keys(overrides).length > 0 && (
              <span className="text-yellow-500">
                {Object.keys(overrides).length} override(s) active
              </span>
            )}
            {Object.keys(overrides).length === 0 && (
              <span>Toggle flags to test different configurations</span>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default FeatureFlagPanel
