import { PageHeader } from '@/components/layout/PageHeader'
import { useState } from 'react'
import { TrendingUp, TrendingDown, ChevronRight } from 'lucide-react'

const tabs = [
  { id: 'doomer', label: 'Doomer', color: '#ff3040' },
  { id: 'life', label: 'Life', color: '#00ba7c' },
  { id: 'prepper', label: 'Prepper', color: '#f59e0b' },
  { id: 'salvation', label: 'Salvation', color: '#a855f7' },
  { id: 'preventer', label: 'Preventer', color: '#3b82f6' },
]

const mockLeaderboard = [
  { rank: 1, username: 'doomprophet', score: 1250000, change: 2 },
  { rank: 2, username: 'endtimeswatcher', score: 980000, change: -1 },
  { rank: 3, username: 'cassandrav2', score: 875000, change: 1 },
  { rank: 4, username: 'anonymous', score: 654000, change: 0 },
  { rank: 5, username: 'finaldays99', score: 543000, change: 3 },
  { rank: 6, username: 'collapseseer', score: 432000, change: -2 },
  { rank: 7, username: 'nightowl', score: 321000, change: 0 },
  { rank: 8, username: 'lasthope', score: 298000, change: 1 },
  { rank: 9, username: 'voidwatcher', score: 245000, change: -1 },
  { rank: 10, username: 'duskhorizon', score: 198000, change: 0 },
]

function formatScore(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`
  return num.toString()
}

export function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState('doomer')
  const activeColor = tabs.find(t => t.id === activeTab)?.color || '#ff3040'

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
              activeTab === tab.id
                ? 'text-white border-b-2'
                : 'text-[#777]'
            }`}
            style={activeTab === tab.id ? { borderColor: tab.color } : {}}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Your rank card */}
      <div className="m-4 p-4 rounded-2xl" style={{ backgroundColor: `${activeColor}15` }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] text-[#777]">Your Rank</p>
            <p className="text-[28px] font-bold text-white">#847</p>
          </div>
          <div className="text-right">
            <p className="text-[13px] text-[#777]">Score</p>
            <p className="text-[20px] font-bold text-white">24.5K</p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#333]">
          <span className="text-[13px]" style={{ color: activeColor }}>
            Top 6.8% — Earning rewards
          </span>
          <ChevronRight size={16} style={{ color: activeColor }} />
        </div>
      </div>

      {/* Leaderboard list */}
      <div className="px-4">
        <h3 className="text-[13px] font-semibold text-[#777] mb-2">TOP 10</h3>
      </div>

      <div className="divide-y divide-[#333]">
        {mockLeaderboard.map((entry) => (
          <button
            key={entry.rank}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#111] transition-colors"
          >
            {/* Rank */}
            <span className={`w-6 text-center text-[15px] font-bold ${
              entry.rank <= 3 ? 'text-yellow-500' : 'text-[#777]'
            }`}>
              {entry.rank}
            </span>

            {/* Avatar */}
            <div
              className="w-10 h-10 rounded-full bg-[#333]"
              style={entry.rank <= 3 ? { border: `2px solid ${activeColor}` } : {}}
            />

            {/* Username */}
            <div className="flex-1 text-left">
              <p className="text-[15px] font-medium text-white">@{entry.username}</p>
            </div>

            {/* Score & change */}
            <div className="text-right">
              <p className="text-[15px] font-semibold text-white">
                {formatScore(entry.score)}
              </p>
              {entry.change !== 0 && (
                <p className={`text-[12px] flex items-center justify-end gap-0.5 ${
                  entry.change > 0 ? 'text-[#00ba7c]' : 'text-[#ff3040]'
                }`}>
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
