import { PageHeader } from '@/components/layout/PageHeader'
import { Plus, Clock, TrendingUp, TrendingDown } from 'lucide-react'

const mockEvents = [
  {
    id: 1,
    title: 'AI Singularity',
    category: 'Technology',
    countdown: '847 days',
    doomStake: 125000,
    lifeStake: 89000,
    odds: 58,
  },
  {
    id: 2,
    title: 'Global Economic Collapse',
    category: 'Economic',
    countdown: '182 days',
    doomStake: 450000,
    lifeStake: 320000,
    odds: 41,
  },
  {
    id: 3,
    title: 'Climate Tipping Point',
    category: 'Climate',
    countdown: '1,460 days',
    doomStake: 89000,
    lifeStake: 156000,
    odds: 36,
  },
]

export function EventsPage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Events"
        subtitle="The countdowns"
        action={
          <button className="p-2 rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors">
            <Plus size={20} />
          </button>
        }
      />

      <div className="flex-1 px-4 py-4 space-y-4">
        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['All', 'Technology', 'Economic', 'Climate', 'War', 'Natural'].map((cat) => (
            <button
              key={cat}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                cat === 'All'
                  ? 'bg-red-600 text-white'
                  : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Event cards */}
        {mockEvents.map((event) => (
          <article
            key={event.id}
            className="p-4 rounded-xl bg-neutral-900 border border-neutral-800"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400">
                  {event.category}
                </span>
                <h3 className="font-semibold text-lg text-neutral-100 mt-1">
                  {event.title}
                </h3>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-red-500">
                  <Clock size={14} />
                  <span className="font-mono font-bold">{event.countdown}</span>
                </div>
              </div>
            </div>

            {/* Odds bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-red-400 flex items-center gap-1">
                  <TrendingDown size={12} />
                  Doom {event.odds}%
                </span>
                <span className="text-green-400 flex items-center gap-1">
                  Life {100 - event.odds}%
                  <TrendingUp size={12} />
                </span>
              </div>
              <div className="h-2 rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-red-500"
                  style={{ width: `${event.odds}%` }}
                />
              </div>
            </div>

            {/* Stakes */}
            <div className="flex gap-2">
              <button className="flex-1 py-2 rounded-lg bg-red-950/50 border border-red-900 text-red-400 text-sm font-medium hover:bg-red-950 transition-colors">
                Bet Doom
              </button>
              <button className="flex-1 py-2 rounded-lg bg-green-950/50 border border-green-900 text-green-400 text-sm font-medium hover:bg-green-950 transition-colors">
                Bet Life
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
