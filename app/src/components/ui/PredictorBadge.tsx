/**
 * PredictorBadge Component
 *
 * Displays a user's predictor tier badge with appropriate styling.
 * Shows detailed stats on hover including predictions made and accuracy.
 */

import {
  Circle,
  Target,
  Crosshair,
  Award,
  Gem,
  Eye,
} from 'lucide-react'
import {
  PredictorTier,
  getPredictorBadgeInfo,
  getNextTierProgress,
  type PredictorBadgeInfo,
} from '@/lib/predictorBadges'

/**
 * Icon mapping for predictor tiers
 */
const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  circle: Circle,
  target: Target,
  crosshair: Crosshair,
  award: Award,
  gem: Gem,
  eye: Eye,
}

interface PredictorBadgeProps {
  /** The predictor tier to display */
  tier: PredictorTier
  /** Number of predictions made */
  predictions?: number
  /** Accuracy percentage */
  accuracy?: number
  /** Badge size */
  size?: 'sm' | 'md' | 'lg'
  /** Whether to show the tooltip on hover */
  showTooltip?: boolean
  /** Show compact version (icon only) */
  compact?: boolean
}

const sizes = {
  sm: { container: 'w-6 h-6', icon: 12, text: 'text-[10px]' },
  md: { container: 'w-8 h-8', icon: 16, text: 'text-[12px]' },
  lg: { container: 'w-12 h-12', icon: 24, text: 'text-[14px]' },
}

export function PredictorBadge({
  tier,
  predictions = 0,
  accuracy = 0,
  size = 'md',
  showTooltip = true,
  compact = false,
}: PredictorBadgeProps) {
  const badgeInfo = getPredictorBadgeInfo(tier)
  const Icon = iconMap[badgeInfo.icon] || Circle
  const sizeConfig = sizes[size]
  const nextTierProgress = getNextTierProgress(tier, predictions, accuracy)

  // Special gradient background for Oracle tier
  const isOracle = tier === PredictorTier.ORACLE
  const bgStyle = isOracle
    ? {
        background:
          'linear-gradient(135deg, #ff000030, #ff7f0030, #ffff0030, #00ff0030, #0000ff30, #4b008230, #9400d330)',
      }
    : { backgroundColor: badgeInfo.bgColor }

  if (compact) {
    return (
      <div className="relative group inline-flex">
        <div
          className={`${sizeConfig.container} rounded-full flex items-center justify-center transition-all hover:scale-110`}
          style={bgStyle}
        >
          <span style={{ color: badgeInfo.color }}>
            <Icon size={sizeConfig.icon} />
          </span>
        </div>
        {showTooltip && (
          <PredictorTooltip
            badgeInfo={badgeInfo}
            predictions={predictions}
            accuracy={accuracy}
            nextTierProgress={nextTierProgress}
          />
        )}
      </div>
    )
  }

  return (
    <div className="relative group inline-flex items-center gap-2">
      <div
        className={`${sizeConfig.container} rounded-full flex items-center justify-center transition-all hover:scale-110`}
        style={bgStyle}
      >
        <span style={{ color: badgeInfo.color }}>
          <Icon size={sizeConfig.icon} />
        </span>
      </div>
      <span
        className={`${sizeConfig.text} font-semibold`}
        style={{ color: badgeInfo.color }}
      >
        {badgeInfo.title}
      </span>
      {showTooltip && (
        <PredictorTooltip
          badgeInfo={badgeInfo}
          predictions={predictions}
          accuracy={accuracy}
          nextTierProgress={nextTierProgress}
        />
      )}
    </div>
  )
}

interface PredictorTooltipProps {
  badgeInfo: PredictorBadgeInfo
  predictions: number
  accuracy: number
  nextTierProgress: ReturnType<typeof getNextTierProgress>
}

function PredictorTooltip({
  badgeInfo,
  predictions,
  accuracy,
  nextTierProgress,
}: PredictorTooltipProps) {
  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 min-w-[200px]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <span
          className="text-[14px] font-bold"
          style={{ color: badgeInfo.color }}
        >
          {badgeInfo.title}
        </span>
      </div>

      {/* Description */}
      <p className="text-[11px] text-[#777] mb-3">{badgeInfo.description}</p>

      {/* Stats */}
      <div className="space-y-1.5 mb-3">
        <div className="flex justify-between text-[11px]">
          <span className="text-[#888]">Predictions</span>
          <span className="text-white font-medium">{predictions}</span>
        </div>
        <div className="flex justify-between text-[11px]">
          <span className="text-[#888]">Accuracy</span>
          <span className="text-white font-medium">{accuracy.toFixed(1)}%</span>
        </div>
      </div>

      {/* Progress to next tier */}
      {nextTierProgress && (
        <div className="border-t border-[#333] pt-2">
          <p className="text-[10px] text-[#666] mb-1.5">
            Next: {getPredictorBadgeInfo(nextTierProgress.nextTier).title}
          </p>
          <div className="space-y-1">
            {nextTierProgress.predictionsNeeded > 0 && (
              <div>
                <div className="flex justify-between text-[10px] mb-0.5">
                  <span className="text-[#666]">Predictions</span>
                  <span className="text-[#888]">
                    {nextTierProgress.predictionsNeeded} more needed
                  </span>
                </div>
                <div className="h-1 bg-[#333] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, nextTierProgress.predictionsProgress)}%`,
                    }}
                  />
                </div>
              </div>
            )}
            {nextTierProgress.accuracyNeeded > 0 && (
              <div>
                <div className="flex justify-between text-[10px] mb-0.5">
                  <span className="text-[#666]">Accuracy</span>
                  <span className="text-[#888]">
                    Need {nextTierProgress.accuracyNeeded.toFixed(1)}% more
                  </span>
                </div>
                <div className="h-1 bg-[#333] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, nextTierProgress.accuracyProgress)}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Max tier indicator */}
      {!nextTierProgress && (
        <div className="border-t border-[#333] pt-2">
          <p
            className="text-[10px] font-medium text-center"
            style={{ color: badgeInfo.color }}
          >
            Maximum Tier Achieved
          </p>
        </div>
      )}
    </div>
  )
}

/**
 * Tier color names for reference
 */
export const TIER_COLORS = {
  [PredictorTier.NOVICE]: 'gray',
  [PredictorTier.AMATEUR]: 'bronze',
  [PredictorTier.SKILLED]: 'silver',
  [PredictorTier.EXPERT]: 'gold',
  [PredictorTier.MASTER]: 'platinum',
  [PredictorTier.ORACLE]: 'rainbow',
} as const
