import { PageHeader } from '@/components/layout/PageHeader'
import { Search, Clock, TrendingUp, TrendingDown } from 'lucide-react'

const mockEvents = [
  {
    id: 1,
    title: 'AI Singularity',
    category: 'Technology',
    countdown: '847d 14h',
    doomPercent: 58,
    totalStake: 214000,
    trending: 'up',
  },
  {
    id: 2,
    title: 'Global Economic Collapse',
    category: 'Economic',
    countdown: '182d 6h',
    doomPercent: 67,
    totalStake: 770000,
    trending: 'up',
  },
  {
    id: 3,
    title: 'Climate Tipping Point',
    category: 'Climate',
    countdown: '1,460d',
    doomPercent: 36,
    totalStake: 245000,
    trending: 'down',
  },
  {
    id: 4,
    title: 'Nuclear Incident',
    category: 'War',
    countdown: '365d',
    doomPercent: 23,
    totalStake: 156000,
    trending: 'down',
  },
]

const categories = ['All', 'Technology', 'Economic', 'Climate', 'War', 'Natural', 'Social']

export function EventsPage() {
  return (
    <div className="flex flex-col min-h-full">
      <PageHeader title="Search" />

      {/* Search bar */}
      <div className="px-4 py-2">
        <div className="flex items-center gap-3 px-4 py-2.5 bg-[#1a1a1a] rounded-xl">
          <Search size={18} className="text-[#777]" />
          <input
            type="text"
            placeholder="Search events"
            className="flex-1 bg-transparent text-[15px] text-white placeholder-[#777] outline-none"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 px-4 py-2 overflow-x-auto">
        {categories.map((cat, idx) => (
          <button
            key={cat}
            className={`px-4 py-1.5 rounded-full text-[14px] font-medium whitespace-nowrap transition-colors ${
              idx === 0
                ? 'bg-white text-black'
                : 'bg-[#1a1a1a] text-[#777] hover:bg-[#333]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Section header */}
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-[15px] font-bold text-white">Trending Events</h2>
      </div>

      {/* Events list */}
      <div className="divide-y divide-[#333]">
        {mockEvents.map((event) => (
          <button
            key={event.id}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#111] transition-colors text-left"
          >
            {/* Countdown badge */}
            <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-[#1a1a1a]">
              <Clock size={14} className="text-[#ff3040] mb-0.5" />
              <span className="text-[11px] font-mono font-bold text-white">
                {event.countdown.split(' ')[0]}
              </span>
            </div>

            {/* Event info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-[#777]">{event.category}</span>
                {event.trending === 'up' ? (
                  <TrendingUp size={12} className="text-[#ff3040]" />
                ) : (
                  <TrendingDown size={12} className="text-[#00ba7c]" />
                )}
              </div>
              <h3 className="text-[15px] font-semibold text-white truncate">
                {event.title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1.5 rounded-full bg-[#333] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#ff3040] to-[#ff6060]"
                    style={{ width: `${event.doomPercent}%` }}
                  />
                </div>
                <span className="text-[12px] text-[#777]">
                  {event.doomPercent}%
                </span>
              </div>
            </div>

            {/* Stake amount */}
            <div className="text-right">
              <p className="text-[12px] text-[#777]">Staked</p>
              <p className="text-[14px] font-semibold text-white">
                ${(event.totalStake / 1000).toFixed(0)}k
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Create event CTA */}
      <div className="px-4 py-4">
        <button className="w-full py-3 rounded-xl bg-[#1a1a1a] text-[15px] font-semibold text-white hover:bg-[#333] transition-colors">
          + Create Prediction
        </button>
      </div>
    </div>
  )
}
