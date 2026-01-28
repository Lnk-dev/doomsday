/**
 * Gas Fee Selector Component
 * Issue #104: Gas fee estimation and optimization UI
 *
 * Radio button selector for choosing transaction priority level.
 * Shows estimated fee in SOL/USD and confirmation time.
 */

import { Zap, Clock, Coins, Rocket } from 'lucide-react'
import {
  GasPriority,
  GAS_PRIORITY_VALUES,
  PRIORITY_NAMES,
  PRIORITY_DESCRIPTIONS,
  formatGasFee,
  type GasEstimate,
} from '@/lib/gasFees'

interface GasFeeSelectorProps {
  /** Gas estimates for all priority levels */
  estimates: GasEstimate[]
  /** Currently selected priority */
  selectedPriority: GasPriority
  /** Callback when priority changes */
  onPriorityChange: (priority: GasPriority) => void
  /** Recommended priority level (will be highlighted) */
  recommendedPriority?: GasPriority
  /** Whether the selector is disabled */
  disabled?: boolean
  /** Whether estimates are loading */
  isLoading?: boolean
}

const PRIORITY_ICONS: Record<GasPriority, React.ReactNode> = {
  [GasPriority.LOW]: <Coins className="w-4 h-4" />,
  [GasPriority.STANDARD]: <Clock className="w-4 h-4" />,
  [GasPriority.HIGH]: <Zap className="w-4 h-4" />,
  [GasPriority.URGENT]: <Rocket className="w-4 h-4" />,
}

const PRIORITY_COLORS: Record<GasPriority, string> = {
  [GasPriority.LOW]: '#00ba7c',
  [GasPriority.STANDARD]: '#1d9bf0',
  [GasPriority.HIGH]: '#ffad1f',
  [GasPriority.URGENT]: '#ff3040',
}

export function GasFeeSelector({
  estimates,
  selectedPriority,
  onPriorityChange,
  recommendedPriority = GasPriority.STANDARD,
  disabled = false,
  isLoading = false,
}: GasFeeSelectorProps) {
  const priorities = GAS_PRIORITY_VALUES

  return (
    <div className="space-y-2" role="radiogroup" aria-label="Transaction priority">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-[#f5f5f5]">
          Transaction Priority
        </label>
        {isLoading && (
          <span className="text-xs text-[#777777]">Updating...</span>
        )}
      </div>

      <div className="space-y-2">
        {priorities.map((priority) => {
          const estimate = estimates.find((e) => e.priority === priority)
          const isSelected = selectedPriority === priority
          const isRecommended = recommendedPriority === priority
          const color = PRIORITY_COLORS[priority]

          return (
            <button
              key={priority}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => onPriorityChange(priority)}
              className={`
                w-full p-3 rounded-lg border transition-all text-left
                ${isSelected
                  ? `border-[${color}] bg-[${color}]/10`
                  : 'border-[#333333] bg-[#1a1a1a] hover:bg-[#222222] hover:border-[#444444]'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              style={{
                borderColor: isSelected ? color : undefined,
                backgroundColor: isSelected ? `${color}10` : undefined,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Radio indicator */}
                  <div
                    className={`
                      w-4 h-4 rounded-full border-2 flex items-center justify-center
                      ${isSelected ? '' : 'border-[#555555]'}
                    `}
                    style={{ borderColor: isSelected ? color : undefined }}
                  >
                    {isSelected && (
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    )}
                  </div>

                  {/* Icon and name */}
                  <div
                    className="flex items-center gap-2"
                    style={{ color: isSelected ? color : '#f5f5f5' }}
                  >
                    {PRIORITY_ICONS[priority]}
                    <span className="font-medium">{PRIORITY_NAMES[priority]}</span>
                  </div>

                  {/* Recommended badge */}
                  {isRecommended && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#1d9bf0]/20 text-[#1d9bf0]">
                      Recommended
                    </span>
                  )}
                </div>

                {/* Fee and time */}
                <div className="text-right">
                  {estimate ? (
                    <>
                      <div className="text-sm font-medium text-[#f5f5f5]">
                        {formatGasFee(estimate.lamports).sol}
                      </div>
                      <div className="text-xs text-[#777777]">
                        {formatGasFee(estimate.lamports).usd} &middot; {estimate.estimatedTime}
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-[#555555]">--</div>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="mt-1.5 ml-7 text-xs text-[#777777]">
                {PRIORITY_DESCRIPTIONS[priority]}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Compact version of the gas fee selector for inline use
 */
export function GasFeeSelectorCompact({
  estimates,
  selectedPriority,
  onPriorityChange,
  disabled = false,
}: Omit<GasFeeSelectorProps, 'recommendedPriority' | 'isLoading'>) {
  const priorities = GAS_PRIORITY_VALUES

  return (
    <div className="flex gap-2" role="radiogroup" aria-label="Transaction priority">
      {priorities.map((priority) => {
        const estimate = estimates.find((e) => e.priority === priority)
        const isSelected = selectedPriority === priority
        const color = PRIORITY_COLORS[priority]

        return (
          <button
            key={priority}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled}
            onClick={() => onPriorityChange(priority)}
            className={`
              flex-1 px-3 py-2 rounded-lg border transition-all
              ${isSelected
                ? ''
                : 'border-[#333333] bg-[#1a1a1a] hover:bg-[#222222]'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            style={{
              borderColor: isSelected ? color : undefined,
              backgroundColor: isSelected ? `${color}10` : undefined,
            }}
          >
            <div
              className="flex items-center justify-center gap-1 mb-1"
              style={{ color: isSelected ? color : '#f5f5f5' }}
            >
              {PRIORITY_ICONS[priority]}
              <span className="text-xs font-medium">{PRIORITY_NAMES[priority]}</span>
            </div>
            {estimate && (
              <div className="text-xs text-[#777777] text-center">
                {formatGasFee(estimate.lamports).usd}
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
