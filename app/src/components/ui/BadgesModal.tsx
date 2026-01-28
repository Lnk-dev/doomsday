/**
 * BadgesModal Component
 * Displays all badges organized by category
 */

import { X } from 'lucide-react'
import type { BadgeCategory } from '@/store/badges'
import { BADGE_DEFINITIONS, useBadgesStore } from '@/store/badges'
import { BadgeIcon, RarityBadge } from './BadgeIcon'
import { formatRelativeTime } from '@/lib/utils'

interface BadgesModalProps {
  onClose: () => void
}

const categoryLabels: Record<BadgeCategory, string> = {
  posting: 'Posting',
  engagement: 'Engagement',
  streaks: 'Streaks',
  betting: 'Betting',
  special: 'Special',
}

const categoryOrder: BadgeCategory[] = ['posting', 'engagement', 'streaks', 'betting', 'special']

export function BadgesModal({ onClose }: BadgesModalProps) {
  const earnedBadges = useBadgesStore((state) => state.earnedBadges)
  const hasBadge = useBadgesStore((state) => state.hasBadge)

  const getEarnedAt = (badgeId: string) => {
    const earned = earnedBadges.find(b => b.badgeId === badgeId)
    return earned?.earnedAt
  }

  const earnedCount = earnedBadges.length
  const totalCount = BADGE_DEFINITIONS.length

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg max-h-[85vh] bg-[#0a0a0a] border border-[#333] rounded-t-3xl sm:rounded-2xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#333]">
          <div>
            <h2 className="text-[17px] font-semibold text-white">Badges</h2>
            <p className="text-[13px] text-[#777]">{earnedCount} of {totalCount} earned</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#333] transition-colors"
            aria-label="Close badges modal"
          >
            <X size={20} className="text-[#777]" />
          </button>
        </div>

        {/* Badge categories */}
        <div className="overflow-y-auto max-h-[calc(85vh-60px)] p-4 space-y-6">
          {categoryOrder.map((category) => {
            const badges = BADGE_DEFINITIONS.filter(b => b.category === category)

            return (
              <div key={category}>
                <h3 className="text-[13px] font-semibold text-[#777] mb-3 uppercase">
                  {categoryLabels[category]}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {badges.map((badge) => {
                    const isEarned = hasBadge(badge.id)
                    const earnedAt = getEarnedAt(badge.id)

                    return (
                      <div
                        key={badge.id}
                        className={`p-3 rounded-xl border ${
                          isEarned
                            ? 'bg-[#1a1a1a] border-[#333]'
                            : 'bg-[#0d0d0d] border-[#222] opacity-60'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <BadgeIcon badge={badge} size="md" locked={!isEarned} showTooltip={false} />
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-white truncate">
                              {badge.name}
                            </p>
                            <p className="text-[11px] text-[#777] line-clamp-2">
                              {badge.description}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <RarityBadge rarity={badge.rarity} />
                            </div>
                            {isEarned && earnedAt && (
                              <p className="text-[10px] text-[#555] mt-1">
                                Earned {formatRelativeTime(earnedAt)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
