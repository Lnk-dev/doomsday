/**
 * QualityScoreDisplay
 *
 * Displays quality score with tier badge and improvement suggestions.
 * Updates in real-time as event criteria are modified.
 */

import { useMemo } from 'react'
import { Check, AlertCircle, Star, Award, Crown, Trophy } from 'lucide-react'
import type { QualityTier, ResolutionCriterion, VerificationSource, CreatorStake } from '@/types'

interface QualityScoreDisplayProps {
  resolutionCriteria: ResolutionCriterion[]
  verificationSources: VerificationSource[]
  creatorStake?: CreatorStake | null
  description: string
}

interface ScoreBreakdown {
  quantitativeCriteria: number
  primarySource: number
  secondarySource: number
  creatorStake: number
  descriptionQuality: number
}

function calculateScore(
  criteria: ResolutionCriterion[],
  sources: VerificationSource[],
  stake: CreatorStake | null | undefined,
  description: string
): { score: number; tier: QualityTier; breakdown: ScoreBreakdown } {
  const breakdown: ScoreBreakdown = {
    quantitativeCriteria: 0,
    primarySource: 0,
    secondarySource: 0,
    creatorStake: 0,
    descriptionQuality: 0,
  }

  // Quantitative criteria (+20 each, max 40)
  const quantitativeCriteria = criteria.filter((c) => c.metric)
  breakdown.quantitativeCriteria = Math.min(quantitativeCriteria.length * 20, 40)

  // Primary source with URL (+20)
  const primaryWithUrl = sources.find((s) => s.isPrimary && s.url)
  if (primaryWithUrl) {
    breakdown.primarySource = 20
  }

  // Secondary source (+10)
  const hasSecondary = sources.filter((s) => !s.isPrimary).length > 0
  if (hasSecondary) {
    breakdown.secondarySource = 10
  }

  // Creator stake (+15 for any, +10 more for 500+)
  if (stake && stake.amount > 0) {
    breakdown.creatorStake = 15
    if (stake.amount >= 500) {
      breakdown.creatorStake += 10
    }
  }

  // Description length (+5 for 100+ chars)
  if (description.length >= 100) {
    breakdown.descriptionQuality = 5
  }

  const score = Math.min(
    breakdown.quantitativeCriteria +
      breakdown.primarySource +
      breakdown.secondarySource +
      breakdown.creatorStake +
      breakdown.descriptionQuality,
    100
  )

  const tier: QualityTier = score >= 80 ? 'platinum' : score >= 60 ? 'gold' : score >= 40 ? 'silver' : 'bronze'

  return { score, tier, breakdown }
}

const tierConfig: Record<QualityTier, { label: string; color: string; bgColor: string; icon: typeof Star }> = {
  bronze: { label: 'Bronze', color: '#cd7f32', bgColor: 'rgba(205, 127, 50, 0.15)', icon: Star },
  silver: { label: 'Silver', color: '#c0c0c0', bgColor: 'rgba(192, 192, 192, 0.15)', icon: Award },
  gold: { label: 'Gold', color: '#ffd700', bgColor: 'rgba(255, 215, 0, 0.15)', icon: Trophy },
  platinum: { label: 'Platinum', color: '#e5e4e2', bgColor: 'rgba(229, 228, 226, 0.15)', icon: Crown },
}

export function QualityScoreDisplay({
  resolutionCriteria,
  verificationSources,
  creatorStake,
  description,
}: QualityScoreDisplayProps) {
  const { score, tier, breakdown } = useMemo(
    () => calculateScore(resolutionCriteria, verificationSources, creatorStake, description),
    [resolutionCriteria, verificationSources, creatorStake, description]
  )

  const config = tierConfig[tier]
  const TierIcon = config.icon

  // Generate improvement suggestions
  const improvements = useMemo(() => {
    const suggestions: string[] = []

    if (breakdown.quantitativeCriteria < 40) {
      const needed = (40 - breakdown.quantitativeCriteria) / 20
      suggestions.push(`Add ${needed} quantitative criterion with a metric`)
    }

    if (breakdown.primarySource === 0) {
      suggestions.push('Add a URL to your primary source')
    }

    if (breakdown.secondarySource === 0) {
      suggestions.push('Add a secondary verification source')
    }

    if (breakdown.creatorStake === 0) {
      suggestions.push('Add a creator stake')
    } else if (breakdown.creatorStake === 15) {
      suggestions.push('Increase stake to 500+ DOOM')
    }

    if (breakdown.descriptionQuality === 0) {
      suggestions.push('Expand description to 100+ characters')
    }

    return suggestions
  }, [breakdown])

  return (
    <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#333]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: config.bgColor }}
          >
            <TierIcon size={20} style={{ color: config.color }} />
          </div>
          <div>
            <span className="text-[12px] text-[#777]">Quality Score</span>
            <p className="text-[18px] font-bold text-white">{score}</p>
          </div>
        </div>
        <div
          className="px-3 py-1 rounded-full text-[12px] font-semibold"
          style={{ backgroundColor: config.bgColor, color: config.color }}
        >
          {config.label}
        </div>
      </div>

      {/* Score breakdown */}
      <div className="space-y-2 mb-4">
        <ScoreItem
          label="Quantitative criteria"
          points={breakdown.quantitativeCriteria}
          maxPoints={40}
        />
        <ScoreItem
          label="Primary source with URL"
          points={breakdown.primarySource}
          maxPoints={20}
        />
        <ScoreItem
          label="Secondary source"
          points={breakdown.secondarySource}
          maxPoints={10}
        />
        <ScoreItem
          label="Creator stake"
          points={breakdown.creatorStake}
          maxPoints={25}
        />
        <ScoreItem
          label="Description quality"
          points={breakdown.descriptionQuality}
          maxPoints={5}
        />
      </div>

      {/* Improvements */}
      {improvements.length > 0 && (
        <div className="pt-3 border-t border-[#333]">
          <div className="flex items-center gap-1 mb-2">
            <AlertCircle size={12} className="text-[#f59e0b]" />
            <span className="text-[11px] text-[#f59e0b] font-medium">Improve your score</span>
          </div>
          <ul className="space-y-1">
            {improvements.map((suggestion, i) => (
              <li key={i} className="text-[11px] text-[#777] flex items-start gap-1">
                <span className="text-[#f59e0b]">+</span>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {score >= 80 && (
        <div className="pt-3 border-t border-[#333] flex items-center gap-2">
          <Check size={14} className="text-[#00ba7c]" />
          <span className="text-[11px] text-[#00ba7c]">
            Excellent! Your event has a high quality score.
          </span>
        </div>
      )}
    </div>
  )
}

function ScoreItem({
  label,
  points,
  maxPoints,
}: {
  label: string
  points: number
  maxPoints: number
}) {
  const percentage = (points / maxPoints) * 100

  return (
    <div>
      <div className="flex items-center justify-between text-[11px] mb-1">
        <span className="text-[#777]">{label}</span>
        <span className={points > 0 ? 'text-[#00ba7c]' : 'text-[#555]'}>
          +{points}/{maxPoints}
        </span>
      </div>
      <div className="h-1 bg-[#333] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            points > 0 ? 'bg-[#00ba7c]' : 'bg-[#333]'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
