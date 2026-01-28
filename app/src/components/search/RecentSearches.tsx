/**
 * RecentSearches
 *
 * Shows recent search history with quick re-search functionality.
 */

import { Clock, X, Trash2 } from 'lucide-react'
import { useSearchStore } from '@/store/search'

interface RecentSearchesProps {
  onSelect: (query: string) => void
}

export function RecentSearches({ onSelect }: RecentSearchesProps) {
  const recentSearches = useSearchStore((state) => state.recentSearches)
  const removeRecentSearch = useSearchStore((state) => state.removeRecentSearch)
  const clearRecentSearches = useSearchStore((state) => state.clearRecentSearches)
  const query = useSearchStore((state) => state.query)

  // Don't show if there's an active query or no history
  if (query || recentSearches.length === 0) return null

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[14px] font-semibold text-[#777]">Recent Searches</h3>
        <button
          onClick={clearRecentSearches}
          className="flex items-center gap-1 text-[12px] text-[#777] hover:text-white transition-colors"
        >
          <Trash2 size={12} />
          Clear all
        </button>
      </div>

      <div className="space-y-1">
        {recentSearches.map((search) => (
          <div key={search} className="flex items-center gap-3 py-2 group">
            <Clock size={16} className="text-[#555]" />
            <button
              onClick={() => onSelect(search)}
              className="flex-1 text-left text-[15px] text-white hover:text-[#ff3040] transition-colors"
            >
              {search}
            </button>
            <button
              onClick={() => removeRecentSearch(search)}
              className="p-1 opacity-0 group-hover:opacity-100 hover:bg-[#333] rounded-full transition-all"
            >
              <X size={14} className="text-[#777]" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
