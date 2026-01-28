/**
 * Search Store
 *
 * Zustand store for unified search functionality.
 * Handles:
 * - Search query state
 * - Search results aggregation
 * - Recent searches persistence
 * - Search filter management
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Post, PredictionEvent, Author, ID } from '@/types'

/** Search result types */
export type SearchResultType = 'post' | 'event' | 'user'

export interface SearchResult {
  id: ID
  type: SearchResultType
  title: string
  subtitle?: string
  score: number
  matchedField: string
  data: Post | PredictionEvent | Author
}

interface SearchState {
  /** Current search query */
  query: string
  /** Active search results */
  results: SearchResult[]
  /** Is search in progress */
  isSearching: boolean
  /** Recent search queries (max 10) */
  recentSearches: string[]
  /** Active filter for result type */
  activeFilter: SearchResultType | 'all'

  // Actions
  setQuery: (query: string) => void
  setResults: (results: SearchResult[]) => void
  setSearching: (searching: boolean) => void
  addRecentSearch: (query: string) => void
  clearRecentSearches: () => void
  removeRecentSearch: (query: string) => void
  setActiveFilter: (filter: SearchResultType | 'all') => void
  clearSearch: () => void
}

const MAX_RECENT_SEARCHES = 10

export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      query: '',
      results: [],
      isSearching: false,
      recentSearches: [],
      activeFilter: 'all',

      setQuery: (query) => set({ query }),

      setResults: (results) => set({ results, isSearching: false }),

      setSearching: (isSearching) => set({ isSearching }),

      addRecentSearch: (query) => {
        if (!query.trim()) return
        set((state) => {
          const filtered = state.recentSearches.filter(
            (q) => q.toLowerCase() !== query.toLowerCase()
          )
          return {
            recentSearches: [query, ...filtered].slice(0, MAX_RECENT_SEARCHES),
          }
        })
      },

      clearRecentSearches: () => set({ recentSearches: [] }),

      removeRecentSearch: (query) => {
        set((state) => ({
          recentSearches: state.recentSearches.filter((q) => q !== query),
        }))
      },

      setActiveFilter: (activeFilter) => set({ activeFilter }),

      clearSearch: () => set({ query: '', results: [], isSearching: false }),
    }),
    {
      name: 'doomsday-search',
      partialize: (state) => ({ recentSearches: state.recentSearches }),
    }
  )
)
