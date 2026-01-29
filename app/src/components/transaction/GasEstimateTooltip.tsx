/**
 * Gas Estimate Tooltip Component
 * Issue #104: Gas fee estimation and optimization UI
 *
 * Hover tooltip explaining gas fees with network congestion indicator
 * and tips for saving on fees.
 */

import { useState, useRef, useEffect } from 'react'
import { HelpCircle, TrendingUp, TrendingDown, Minus, Lightbulb, Activity } from 'lucide-react'
import {
  type CongestionLevel,
  getCongestionDescription,
  getCongestionColor,
} from '@/lib/gasFees'

interface GasEstimateTooltipProps {
  /** Current network congestion level */
  congestionLevel: CongestionLevel
  /** Whether to show detailed tips */
  showTips?: boolean
  /** Custom trigger element (defaults to help icon) */
  children?: React.ReactNode
}

const GAS_FEE_TIPS = [
  'Transaction fees on Solana are very low compared to other blockchains.',
  'During low congestion, using "Low" priority can save on fees.',
  'Urgent transactions may need higher priority during peak times.',
  'Fees go to network validators who process your transaction.',
  'Failed transactions may still consume a small fee.',
]

function getCongestionIcon(level: CongestionLevel) {
  switch (level) {
    case 'low':
      return <TrendingDown className="w-4 h-4" />
    case 'normal':
      return <Minus className="w-4 h-4" />
    case 'high':
    case 'very-high':
      return <TrendingUp className="w-4 h-4" />
    default:
      return <Activity className="w-4 h-4" />
  }
}

function getCongestionLabel(level: CongestionLevel): string {
  switch (level) {
    case 'low':
      return 'Low'
    case 'normal':
      return 'Normal'
    case 'high':
      return 'High'
    case 'very-high':
      return 'Very High'
    default:
      return 'Unknown'
  }
}

export function GasEstimateTooltip({
  congestionLevel,
  showTips = true,
  children,
}: GasEstimateTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState<'top' | 'bottom'>('top')
  const triggerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  // Determine tooltip position based on available space
  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const spaceAbove = rect.top
      const spaceBelow = window.innerHeight - rect.bottom

      // Prefer top, but use bottom if not enough space
      setPosition(spaceAbove > 300 || spaceAbove > spaceBelow ? 'top' : 'bottom')
    }
  }, [isVisible])

  const congestionColor = getCongestionColor(congestionLevel)

  // Random tip to display
  const tipIndex = Math.floor(Math.random() * GAS_FEE_TIPS.length)
  const currentTip = GAS_FEE_TIPS[tipIndex]

  return (
    <div
      ref={triggerRef}
      className="relative inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {/* Trigger */}
      <button
        type="button"
        className="p-1 rounded hover:bg-[#333333] transition-colors text-[#777777] hover:text-[#f5f5f5]"
        aria-label="Learn about gas fees"
        aria-describedby={isVisible ? 'gas-tooltip' : undefined}
      >
        {children || <HelpCircle className="w-4 h-4" />}
      </button>

      {/* Tooltip */}
      {isVisible && (
        <div
          ref={tooltipRef}
          id="gas-tooltip"
          role="tooltip"
          className={`
            absolute z-50 w-72 p-4 rounded-lg
            bg-[#1a1a1a] border border-[#333333] shadow-xl
            ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}
            left-1/2 -translate-x-1/2
          `}
        >
          {/* Arrow */}
          <div
            className={`
              absolute left-1/2 -translate-x-1/2 w-3 h-3
              bg-[#1a1a1a] border-[#333333] rotate-45
              ${position === 'top'
                ? 'bottom-[-6px] border-r border-b'
                : 'top-[-6px] border-l border-t'
              }
            `}
          />

          {/* Header */}
          <h3 className="text-sm font-semibold text-[#f5f5f5] mb-3">
            About Gas Fees
          </h3>

          {/* Explanation */}
          <p className="text-xs text-[#999999] mb-4">
            Gas fees are paid to Solana network validators to process your transaction.
            Higher priority means faster confirmation but costs more.
          </p>

          {/* Network Congestion Indicator */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[#777777]">
                Network Congestion
              </span>
              <div
                className="flex items-center gap-1.5 text-xs font-medium"
                style={{ color: congestionColor }}
              >
                {getCongestionIcon(congestionLevel)}
                <span>{getCongestionLabel(congestionLevel)}</span>
              </div>
            </div>

            {/* Congestion bar */}
            <div className="h-1.5 bg-[#333333] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  backgroundColor: congestionColor,
                  width: congestionLevel === 'low' ? '25%'
                    : congestionLevel === 'normal' ? '50%'
                    : congestionLevel === 'high' ? '75%'
                    : '100%',
                }}
              />
            </div>

            <p className="mt-2 text-xs text-[#777777]">
              {getCongestionDescription(congestionLevel)}
            </p>
          </div>

          {/* Tips */}
          {showTips && (
            <div className="pt-3 border-t border-[#333333]">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-[#ffad1f] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-[#999999]">
                  <span className="font-medium text-[#ffad1f]">Tip: </span>
                  {currentTip}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Inline congestion indicator without tooltip
 */
export function CongestionIndicator({
  level,
  showLabel = true,
}: {
  level: CongestionLevel
  showLabel?: boolean
}) {
  const color = getCongestionColor(level)

  return (
    <div
      className="flex items-center gap-1.5 text-xs"
      style={{ color }}
    >
      {getCongestionIcon(level)}
      {showLabel && <span>{getCongestionLabel(level)}</span>}
    </div>
  )
}
