/**
 * LeaderboardPage
 *
 * Rankings across different categories (Doomer, Life, Prepper, etc).
 * Features:
 * - Category tabs with colored accents
 * - User's current rank card
 * - Top 10 leaderboard list
 * - Rank change indicators
 */

import { PageHeader } from '@/components/layout/PageHeader'
import { useState } from 'react'
import { TrendingUp, TrendingDown, ChevronRight } from 'lucide-react'
import { useLeaderboardStore, useUserStore } from '@/store'
import { formatNumber } from '@/lib/utils'
import type { LeaderboardCategory } from '@/types'

const tabs: { id: LeaderboardCategory; label: string; color: string }[] = [
  { id: 'doomer', label: 'Doomer', color: '#ff3040' },
  { id: 'life', label: 'Life', color: '#00ba7c' },
  { id: 'prepper', label: 'Prepper', color: '#f59e0b' },
  { id: 'salvation', label: 'Salvation', color: '#a855f7' },
  { id: 'preventer', label: 'Preventer', color: '#3b82f6' },
]

export function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<LeaderboardCategory>('doomer')

  // Store hooks
  const leaderboard = useLeaderboardStore((state) => state.getLeaderboard(activeTab))
  const doomBalance = useUserStore((state) => state.doomBalance)

  const activeColor = tabs.find((t) => t.id === activeTab)?.color || '#ff3040'

  // Mock user rank (in real app, would calculate from actual activity)
  const userRank = 847
  const userScore = doomBalance * 100 // Simplified score calculation
  const totalUsers = 12453
  const percentile = ((totalUsers - userRank) / totalUsers * 100).toFixed(1)
  const isEarning = parseFloat(percentile) > 50

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader title="Leaderboard" />

      {/* Tab selector */}
      <div className="flex border-b border-[#333] overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-fit px-4 py-3 text-[14px] font-semibold whitespace-nowrap transition-colors ${
              activeTab === tab.id ? 'text-white border-b-2' : 'text-[#777]'
            }`}
            style={activeTab === tab.id ? { borderColor: tab.color } : {}}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Your rank card */}
      <div
        className="m-4 p-4 rounded-2xl"
        style={{ backgroundColor: `${activeColor}15` }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] text-[#777]">Your Rank</p>
            <p className="text-[28px] font-bold text-white">#{userRank}</p>
          </div>
          <div className="text-right">
            <p className="text-[13px] text-[#777]">Score</p>
            <p className="text-[20px] font-bold text-white">
              {formatNumber(userScore)}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#333]">
          <span className="text-[13px]" style={{ color: activeColor }}>
            {isEarning ? (
              <>Top {percentile}% — Earning rewards</>
            ) : (
              <>Top {percentile}% — Post more to earn</>
            )}
          </span>
          <ChevronRight size={16} style={{ color: activeColor }} />
        </div>
      </div>

      {/* Leaderboard list */}
      <div className="px-4">
        <h3 className="text-[13px] font-semibold text-[#777] mb-2">TOP 10</h3>
      </div>

      <div className="divide-y divide-[#333]">
        {leaderboard.map((entry) => (
          <button
            key={entry.rank}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#111] transition-colors"
          >
            {/* Rank */}
            <span
              className={`w-6 text-center text-[15px] font-bold ${
                entry.rank <= 3 ? 'text-yellow-500' : 'text-[#777]'
              }`}
            >
              {entry.rank}
            </span>

            {/* Avatar */}
            <div
              className="w-10 h-10 rounded-full bg-[#333]"
              style={
                entry.rank <= 3 ? { border: `2px solid ${activeColor}` } : {}
              }
            />

            {/* Username & verified badge */}
            <div className="flex-1 text-left">
              <div className="flex items-center gap-1">
                <p className="text-[15px] font-medium text-white">
                  @{entry.user.username}
                </p>
                {entry.user.verified && (
                  <svg
                    className="w-4 h-4 text-blue-500"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
                  </svg>
                )}
              </div>
            </div>

            {/* Score & change */}
            <div className="text-right">
              <p className="text-[15px] font-semibold text-white">
                {formatNumber(entry.score)}
              </p>
              {entry.change !== 0 && (
                <p
                  className={`text-[12px] flex items-center justify-end gap-0.5 ${
                    entry.change > 0 ? 'text-[#00ba7c]' : 'text-[#ff3040]'
                  }`}
                >
                  {entry.change > 0 ? (
                    <TrendingUp size={10} />
                  ) : (
                    <TrendingDown size={10} />
                  )}
                  {Math.abs(entry.change)}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
