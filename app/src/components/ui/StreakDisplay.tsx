/**
 * StreakDisplay Component
 * Issue #41: Implement daily streak rewards
 *
 * Displays user's current streak, progress to next milestone,
 * and allows claiming milestone rewards.
 */

import { Flame, Gift, AlertTriangle, Trophy, ChevronRight } from 'lucide-react'
import { useStreaksStore, STREAK_MILESTONES } from '@/store/streaks'
import { useUserStore } from '@/store'
import { useState } from 'react'

interface StreakDisplayProps {
  /** Compact mode for smaller displays */
  compact?: boolean
  /** Show claim buttons for milestones */
  showClaim?: boolean
}

export function StreakDisplay({ compact = false, showClaim = true }: StreakDisplayProps) {
  const currentStreak = useStreaksStore((state) => state.currentStreak)
  const longestStreak = useStreaksStore((state) => state.longestStreak)
  const isStreakAtRisk = useStreaksStore((state) => state.isStreakAtRisk)
  const getNextMilestone = useStreaksStore((state) => state.getNextMilestone)
  const getDaysUntilNextMilestone = useStreaksStore((state) => state.getDaysUntilNextMilestone)
  const getUnclaimedMilestones = useStreaksStore((state) => state.getUnclaimedMilestones)
  const claimMilestone = useStreaksStore((state) => state.claimMilestone)
  const addLife = useUserStore((state) => state.addLife)

  const [claimingMilestone, setClaimingMilestone] = useState<number | null>(null)

  const atRisk = isStreakAtRisk()
  const nextMilestone = getNextMilestone()
  const daysUntil = getDaysUntilNextMilestone()
  const unclaimedMilestones = getUnclaimedMilestones()

  const handleClaim = async (days: number) => {
    setClaimingMilestone(days)
    // Small delay for feedback
    await new Promise((r) => setTimeout(r, 300))
    const bonus = claimMilestone(days)
    if (bonus > 0) {
      addLife(bonus)
    }
    setClaimingMilestone(null)
  }

  // Compact display for profile header
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${
            atRisk
              ? 'bg-[#ff304020] text-[#ff3040]'
              : currentStreak > 0
              ? 'bg-[#ff6b0020] text-[#ff6b00]'
              : 'bg-[#333] text-[#777]'
          }`}
        >
          <Flame size={14} className={currentStreak > 0 ? 'fill-current' : ''} />
          <span className="text-[13px] font-semibold">{currentStreak}</span>
        </div>
        {atRisk && (
          <AlertTriangle size={14} className="text-[#ff3040]" />
        )}
      </div>
    )
  }

  // Full display with milestones
  return (
    <div className="bg-[#111] rounded-2xl border border-[#222] overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[#222]">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[15px] font-semibold text-white flex items-center gap-2">
            <Flame size={18} className="text-[#ff6b00]" />
            Daily Streak
          </h3>
          {atRisk && (
            <span className="flex items-center gap-1 text-[12px] text-[#ff3040] bg-[#ff304020] px-2 py-0.5 rounded-full">
              <AlertTriangle size={12} />
              At risk
            </span>
          )}
        </div>

        {/* Current streak */}
        <div className="flex items-baseline gap-2">
          <span className="text-[32px] font-bold text-[#ff6b00]">
            {currentStreak}
          </span>
          <span className="text-[15px] text-[#777]">
            {currentStreak === 1 ? 'day' : 'days'}
          </span>
        </div>

        {/* Longest streak */}
        <p className="text-[13px] text-[#555] mt-1 flex items-center gap-1">
          <Trophy size={12} />
          Longest: {longestStreak} days
        </p>
      </div>

      {/* Progress to next milestone */}
      {nextMilestone && (
        <div className="p-4 border-b border-[#222]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] text-[#777]">Next milestone</span>
            <span className="text-[13px] text-[#ff6b00] font-medium">
              {nextMilestone.name}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-[#222] rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-gradient-to-r from-[#ff6b00] to-[#ff3040] rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, (currentStreak / nextMilestone.days) * 100)}%`,
              }}
            />
          </div>

          <div className="flex items-center justify-between text-[12px]">
            <span className="text-[#555]">
              {currentStreak}/{nextMilestone.days} days
            </span>
            <span className="text-[#00ba7c] font-medium">
              +{nextMilestone.bonus} $LIFE reward
            </span>
          </div>

          {daysUntil > 0 && (
            <p className="text-[12px] text-[#555] mt-2">
              {daysUntil} {daysUntil === 1 ? 'day' : 'days'} to go!
            </p>
          )}
        </div>
      )}

      {/* Unclaimed milestones */}
      {showClaim && unclaimedMilestones.length > 0 && (
        <div className="p-4">
          <h4 className="text-[13px] font-semibold text-white mb-3 flex items-center gap-2">
            <Gift size={14} className="text-[#00ba7c]" />
            Claim Rewards
          </h4>
          <div className="space-y-2">
            {unclaimedMilestones.map((milestone) => (
              <button
                key={milestone.days}
                onClick={() => handleClaim(milestone.days)}
                disabled={claimingMilestone === milestone.days}
                className="w-full flex items-center justify-between p-3 bg-[#00ba7c10] border border-[#00ba7c30] rounded-xl hover:bg-[#00ba7c20] transition-colors disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#00ba7c20] flex items-center justify-center">
                    <Trophy size={16} className="text-[#00ba7c]" />
                  </div>
                  <div className="text-left">
                    <p className="text-[14px] font-semibold text-white">
                      {milestone.name}
                    </p>
                    <p className="text-[12px] text-[#777]">
                      {milestone.days} day streak
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-bold text-[#00ba7c]">
                    +{milestone.bonus} $LIFE
                  </span>
                  <ChevronRight size={16} className="text-[#00ba7c]" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* All milestones */}
      <div className="p-4 border-t border-[#222]">
        <h4 className="text-[13px] font-semibold text-[#777] mb-3">All Milestones</h4>
        <div className="space-y-2">
          {STREAK_MILESTONES.map((milestone) => {
            const achieved = currentStreak >= milestone.days
            const claimed = useStreaksStore.getState().claimedMilestones.includes(milestone.days)
            return (
              <div
                key={milestone.days}
                className={`flex items-center justify-between py-2 ${
                  achieved ? 'opacity-100' : 'opacity-40'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      achieved ? 'bg-[#00ba7c20]' : 'bg-[#222]'
                    }`}
                  >
                    {achieved ? (
                      <Flame size={12} className="text-[#00ba7c]" />
                    ) : (
                      <Flame size={12} className="text-[#555]" />
                    )}
                  </div>
                  <span className="text-[13px] text-white">
                    {milestone.days} days - {milestone.name}
                  </span>
                </div>
                <span
                  className={`text-[12px] font-medium ${
                    claimed
                      ? 'text-[#555]'
                      : achieved
                      ? 'text-[#00ba7c]'
                      : 'text-[#555]'
                  }`}
                >
                  {claimed ? 'Claimed' : `+${milestone.bonus} $LIFE`}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
