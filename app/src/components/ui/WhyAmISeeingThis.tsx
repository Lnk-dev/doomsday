/**
 * WhyAmISeeingThis Component
 * Issue #62: Implement personalized feed algorithm
 *
 * Transparency component explaining why a post appears in the feed.
 */

import { useState } from 'react'
import { HelpCircle, X, TrendingUp, Users, Heart, Clock, Star } from 'lucide-react'
import type { RankingExplanation, ExplanationReason } from '@/lib/ranking'
import { getExplanationText } from '@/lib/ranking'

interface WhyAmISeeingThisProps {
  explanation: RankingExplanation
  variant?: 'doom' | 'life'
}

export function WhyAmISeeingThis({ explanation, variant = 'doom' }: WhyAmISeeingThisProps) {
  const [isOpen, setIsOpen] = useState(false)

  const primaryText = getExplanationText(explanation.primaryReason)
  const variantColor = variant === 'doom' ? 'text-[#ff3040]' : 'text-[#00ba7c]'

  if (!isOpen) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(true)
        }}
        className="flex items-center gap-1 text-[11px] text-[#555] hover:text-[#777] transition-colors"
        aria-label="Why am I seeing this post"
      >
        <HelpCircle size={12} />
        <span className="hidden sm:inline">{primaryText}</span>
      </button>
    )
  }

  return (
    <div
      className="mt-2 p-3 bg-[#111] border border-[#333] rounded-lg"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[13px] font-medium text-white">Why you're seeing this</span>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 text-[#777] hover:text-white"
        >
          <X size={14} />
        </button>
      </div>

      <div className="space-y-2">
        {/* Primary reason */}
        <ReasonItem reason={explanation.primaryReason} isPrimary variantColor={variantColor} />

        {/* Secondary reasons */}
        {explanation.secondaryReasons.slice(0, 2).map((reason, index) => (
          <ReasonItem key={index} reason={reason} variantColor={variantColor} />
        ))}
      </div>

      {/* Signal breakdown (optional, for advanced users) */}
      <details className="mt-3">
        <summary className="text-[11px] text-[#555] cursor-pointer hover:text-[#777]">
          View ranking signals
        </summary>
        <div className="mt-2 grid grid-cols-2 gap-1 text-[10px] text-[#555]">
          <SignalBar label="Hot Score" value={explanation.signals.baseHotScore} />
          <SignalBar label="Author Affinity" value={explanation.signals.authorAffinity} />
          <SignalBar label="Topic Match" value={explanation.signals.topicRelevance} />
          <SignalBar label="Social Proof" value={explanation.signals.socialProof} />
          <SignalBar label="Quality" value={explanation.signals.qualityScore} />
          <SignalBar label="Freshness" value={explanation.signals.freshnessBonus} />
        </div>
      </details>
    </div>
  )
}

function ReasonItem({
  reason,
  isPrimary = false,
  variantColor,
}: {
  reason: ExplanationReason
  isPrimary?: boolean
  variantColor: string
}) {
  const Icon = REASON_ICONS[reason.type] || HelpCircle
  const text = getExplanationText(reason)

  return (
    <div className="flex items-center gap-2">
      <div className={`${isPrimary ? variantColor : 'text-[#555]'}`}>
        <Icon size={14} />
      </div>
      <span className={`text-[12px] ${isPrimary ? 'text-white' : 'text-[#777]'}`}>
        {text}
      </span>
    </div>
  )
}

const REASON_ICONS = {
  following: Users,
  author_affinity: Heart,
  topic_interest: Star,
  social_proof: Users,
  trending: TrendingUp,
  fresh_content: Clock,
  popular: TrendingUp,
} as const

function SignalBar({ label, value }: { label: string; value: number }) {
  const percentage = Math.round(value * 100)

  return (
    <div className="flex items-center gap-1">
      <span className="w-20 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-[#222] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#555] rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="w-8 text-right">{percentage}%</span>
    </div>
  )
}

/**
 * Compact version for inline use
 */
export function WhyAmISeeingThisCompact({
  explanation,
}: {
  explanation: RankingExplanation
}) {
  const primaryText = getExplanationText(explanation.primaryReason)

  return (
    <span className="text-[11px] text-[#555]" title="Why you're seeing this">
      {primaryText}
    </span>
  )
}
