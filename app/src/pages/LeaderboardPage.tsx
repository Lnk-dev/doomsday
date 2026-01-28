import { PageHeader } from '@/components/layout/PageHeader'
import { useState } from 'react'
import { Flame, Heart, Shield, Cross, Target, TrendingUp, TrendingDown } from 'lucide-react'

const tabs = [
  { id: 'doomer', label: 'Doomer', icon: Flame, color: 'red' },
  { id: 'life', label: 'Life', icon: Heart, color: 'green' },
  { id: 'prepper', label: 'Prepper', icon: Shield, color: 'amber' },
  { id: 'salvation', label: 'Salvation', icon: Cross, color: 'purple' },
  { id: 'preventer', label: 'Preventer', icon: Target, color: 'blue' },
]

const mockLeaderboard = [
  { rank: 1, name: 'DoomProphet_X', score: 1250000, change: 2 },
  { rank: 2, name: 'EndTimesWatcher', score: 980000, change: -1 },
  { rank: 3, name: 'CassandraV2', score: 875000, change: 1 },
  { rank: 4, name: 'Anonymous', score: 654000, change: 0 },
  { rank: 5, name: 'FinalDays99', score: 543000, change: 3 },
  { rank: 6, name: 'CollapseSeer', score: 432000, change: -2 },
  { rank: 7, name: 'NightOwl', score: 321000, change: 0 },
  { rank: 8, name: 'LastHope', score: 298000, change: 1 },
  { rank: 9, name: 'VoidWatcher', score: 245000, change: -1 },
  { rank: 10, name: 'DuskHorizon', score: 198000, change: 0 },
]

export function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState('doomer')

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Leaderboard"
        subtitle="Top 50% earn rewards"
      />

      <div className="flex-1 px-4 py-4 space-y-4">
        {/* Tab selector */}
        <div className="flex gap-1 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                  isActive
                    ? `bg-${tab.color}-950 text-${tab.color}-400 border border-${tab.color}-800`
                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                }`}
                style={isActive ? {
                  backgroundColor: tab.color === 'red' ? '#450a0a' :
                                   tab.color === 'green' ? '#052e16' :
                                   tab.color === 'amber' ? '#451a03' :
                                   tab.color === 'purple' ? '#3b0764' : '#172554',
                  color: tab.color === 'red' ? '#f87171' :
                         tab.color === 'green' ? '#4ade80' :
                         tab.color === 'amber' ? '#fbbf24' :
                         tab.color === 'purple' ? '#c084fc' : '#60a5fa'
                } : {}}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Your rank card */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/50 to-neutral-900 border border-red-900/50">
          <p className="text-sm text-neutral-400 mb-1">Your Rank</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-red-400">#847</span>
              <span className="text-neutral-400">of 12,453</span>
            </div>
            <div className="text-right">
              <p className="text-xs text-neutral-500">Score</p>
              <p className="font-bold text-neutral-200">24,500</p>
            </div>
          </div>
          <p className="text-xs text-green-500 mt-2">Top 6.8% - Earning rewards</p>
        </div>

        {/* Leaderboard list */}
        <div className="rounded-xl bg-neutral-900 border border-neutral-800 overflow-hidden">
          {mockLeaderboard.map((entry, idx) => (
            <div
              key={entry.rank}
              className={`flex items-center gap-3 px-4 py-3 ${
                idx !== mockLeaderboard.length - 1 ? 'border-b border-neutral-800' : ''
              }`}
            >
              <span className={`w-8 text-center font-bold ${
                entry.rank <= 3 ? 'text-yellow-500' : 'text-neutral-500'
              }`}>
                {entry.rank}
              </span>
              <div className="w-8 h-8 rounded-full bg-neutral-700" />
              <div className="flex-1">
                <p className="font-medium text-neutral-200">{entry.name}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm text-neutral-300">
                  {entry.score.toLocaleString()}
                </p>
                <p className={`text-xs flex items-center justify-end gap-0.5 ${
                  entry.change > 0 ? 'text-green-500' :
                  entry.change < 0 ? 'text-red-500' : 'text-neutral-500'
                }`}>
                  {entry.change > 0 && <TrendingUp size={10} />}
                  {entry.change < 0 && <TrendingDown size={10} />}
                  {entry.change !== 0 && Math.abs(entry.change)}
                  {entry.change === 0 && '-'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
