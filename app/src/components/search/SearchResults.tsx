/**
 * SearchResults
 *
 * Displays search results grouped by type with filtering.
 */

import { useNavigate } from 'react-router-dom'
import { FileText, Calendar, User, Loader2 } from 'lucide-react'
import { useSearchStore, type SearchResult, type SearchResultType } from '@/store/search'

const filterOptions: { value: SearchResultType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'post', label: 'Posts' },
  { value: 'event', label: 'Events' },
  { value: 'user', label: 'Users' },
]

const typeIcons: Record<SearchResultType, React.ReactNode> = {
  post: <FileText size={16} />,
  event: <Calendar size={16} />,
  user: <User size={16} />,
}

const typeColors: Record<SearchResultType, string> = {
  post: '#ff3040',
  event: '#3b82f6',
  user: '#00ba7c',
}

export function SearchResults() {
  const navigate = useNavigate()
  const results = useSearchStore((state) => state.results)
  const activeFilter = useSearchStore((state) => state.activeFilter)
  const setActiveFilter = useSearchStore((state) => state.setActiveFilter)
  const query = useSearchStore((state) => state.query)
  const isSearching = useSearchStore((state) => state.isSearching)

  const filteredResults =
    activeFilter === 'all'
      ? results
      : results.filter((r) => r.type === activeFilter)

  const handleResultClick = (result: SearchResult) => {
    switch (result.type) {
      case 'post':
        navigate(`/post/${result.id}`)
        break
      case 'event':
        navigate(`/events/${result.id}`)
        break
      case 'user':
        navigate(`/profile/${result.id}`)
        break
    }
  }

  if (!query) return null

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Filter tabs */}
      <div className="flex gap-2 px-4 py-2 overflow-x-auto border-b border-[#333]">
        {filterOptions.map((option) => {
          const count =
            option.value === 'all'
              ? results.length
              : results.filter((r) => r.type === option.value).length

          return (
            <button
              key={option.value}
              onClick={() => setActiveFilter(option.value)}
              className={`px-4 py-1.5 rounded-full text-[14px] font-medium whitespace-nowrap transition-colors ${
                activeFilter === option.value
                  ? 'bg-white text-black'
                  : 'bg-[#1a1a1a] text-[#777] hover:bg-[#333]'
              }`}
            >
              {option.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Results list */}
      {isSearching ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-[#777]" size={24} />
        </div>
      ) : filteredResults.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-8">
          <p className="text-[15px] text-[#777] text-center">
            No results found for "{query}"
          </p>
          <p className="text-[13px] text-[#555] text-center mt-1">
            Try searching for something else
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#333]">
          {filteredResults.map((result) => (
            <button
              key={`${result.type}-${result.id}`}
              onClick={() => handleResultClick(result)}
              className="w-full flex items-start gap-3 px-4 py-3 hover:bg-[#111] transition-colors text-left"
            >
              <div
                className="flex items-center justify-center w-10 h-10 rounded-full"
                style={{ backgroundColor: `${typeColors[result.type]}20` }}
              >
                <span style={{ color: typeColors[result.type] }}>
                  {typeIcons[result.type]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-medium text-white truncate">
                  {result.title}
                </p>
                {result.subtitle && (
                  <p className="text-[13px] text-[#777]">{result.subtitle}</p>
                )}
              </div>
              <span
                className="text-[12px] px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${typeColors[result.type]}20`,
                  color: typeColors[result.type],
                }}
              >
                {result.type}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
