/**
 * EventsPage
 *
 * Prediction market showing doom events with countdowns.
 * Features:
 * - Search and filter events by category
 * - Event cards with countdown timers
 * - Doom vs Life odds visualization
 * - Total stake amounts
 */

import { PageHeader } from '@/components/layout/PageHeader'
import { Search, Clock, TrendingUp, TrendingDown } from 'lucide-react'
import { useEventsStore } from '@/store'
import { formatCountdown, formatNumber } from '@/lib/utils'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { EventCategory } from '@/types'

const categories: (EventCategory | 'all')[] = [
  'all',
  'technology',
  'economic',
  'climate',
  'war',
  'natural',
  'social',
]

const categoryLabels: Record<EventCategory | 'all', string> = {
  all: 'All',
  technology: 'Technology',
  economic: 'Economic',
  climate: 'Climate',
  war: 'War',
  natural: 'Natural',
  social: 'Social',
  other: 'Other',
}

export function EventsPage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<EventCategory | 'all'>('all')

  // Get events from store
  const events = useEventsStore((state) => state.getEvents())

  // Filter events
  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategory === 'all' || event.category === activeCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader title="Search" />

      {/* Search bar */}
      <div className="px-4 py-2">
        <div className="flex items-center gap-3 px-4 py-2.5 bg-[#1a1a1a] rounded-xl">
          <Search size={18} className="text-[#777]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events"
            className="flex-1 bg-transparent text-[15px] text-white placeholder-[#777] outline-none"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 px-4 py-2 overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-[14px] font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat
                ? 'bg-white text-black'
                : 'bg-[#1a1a1a] text-[#777] hover:bg-[#333]'
            }`}
          >
            {categoryLabels[cat]}
          </button>
        ))}
      </div>

      {/* Section header */}
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-[15px] font-bold text-white">
          {activeCategory === 'all' ? 'All Events' : categoryLabels[activeCategory]}
        </h2>
        <p className="text-[13px] text-[#777]">{filteredEvents.length} predictions</p>
      </div>

      {/* Events list */}
      <div className="divide-y divide-[#333]">
        {filteredEvents.map((event) => {
          const totalStake = event.doomStake + event.lifeStake
          const doomPercent = totalStake > 0
            ? Math.round((event.doomStake / totalStake) * 100)
            : 50
          const isTrendingDoom = doomPercent > 50

          return (
            <button
              key={event.id}
              onClick={() => navigate(`/events/${event.id}`)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#111] transition-colors text-left"
            >
              {/* Countdown badge */}
              <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-[#1a1a1a]">
                <Clock size={14} className="text-[#ff3040] mb-0.5" />
                <span className="text-[11px] font-mono font-bold text-white">
                  {formatCountdown(event.countdownEnd).split(' ')[0]}
                </span>
              </div>

              {/* Event info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-[#777] capitalize">
                    {event.category}
                  </span>
                  {isTrendingDoom ? (
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
                      style={{ width: `${doomPercent}%` }}
                    />
                  </div>
                  <span className="text-[12px] text-[#777]">
                    {doomPercent}%
                  </span>
                </div>
              </div>

              {/* Stake amount */}
              <div className="text-right">
                <p className="text-[12px] text-[#777]">Staked</p>
                <p className="text-[14px] font-semibold text-white">
                  {formatNumber(totalStake)}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Empty state */}
      {filteredEvents.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center py-16 px-8">
          <Clock size={48} className="text-[#333] mb-4" />
          <p className="text-[15px] text-[#777] text-center">
            No events found.
          </p>
        </div>
      )}

      {/* Create event CTA */}
      <div className="px-4 py-4">
        <button className="w-full py-3 rounded-xl bg-[#1a1a1a] text-[15px] font-semibold text-white hover:bg-[#333] transition-colors">
          + Create Prediction
        </button>
      </div>
    </div>
  )
}
