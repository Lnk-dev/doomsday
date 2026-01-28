/**
 * SearchPage
 *
 * Unified search page with debounced input, recent searches,
 * and filtered results.
 */

import { useCallback, useEffect } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { SearchInput } from '@/components/search/SearchInput'
import { SearchResults } from '@/components/search/SearchResults'
import { RecentSearches } from '@/components/search/RecentSearches'
import { usePostsStore, useEventsStore } from '@/store'
import { useSearchStore } from '@/store/search'
import { searchAll } from '@/lib/search'

export function SearchPage() {
  const setResults = useSearchStore((state) => state.setResults)
  const setSearching = useSearchStore((state) => state.setSearching)
  const addRecentSearch = useSearchStore((state) => state.addRecentSearch)
  const setQuery = useSearchStore((state) => state.setQuery)
  const clearSearch = useSearchStore((state) => state.clearSearch)

  const posts = usePostsStore((state) => Object.values(state.posts))
  const events = useEventsStore((state) => Object.values(state.events))

  // Extract unique authors from posts
  const authors = posts.map((p) => p.author)

  // Clear search when component unmounts
  useEffect(() => {
    return () => {
      clearSearch()
    }
  }, [clearSearch])

  const handleSearch = useCallback(
    (query: string) => {
      if (!query.trim()) {
        setResults([])
        return
      }

      setSearching(true)

      // Simulate async search (replace with API call if backend exists)
      setTimeout(() => {
        const results = searchAll(posts, events, authors, query)
        setResults(results)
        addRecentSearch(query)
      }, 100)
    },
    [posts, events, authors, setResults, setSearching, addRecentSearch]
  )

  const handleRecentSelect = useCallback(
    (query: string) => {
      setQuery(query)
      handleSearch(query)
    },
    [setQuery, handleSearch]
  )

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader title="Search" />

      {/* Search input */}
      <div className="px-4 py-3 border-b border-[#333]">
        <SearchInput
          placeholder="Search posts, users, events..."
          autoFocus
          onSearch={handleSearch}
          debounceMs={300}
        />
      </div>

      {/* Recent searches (shown when no active query) */}
      <RecentSearches onSelect={handleRecentSelect} />

      {/* Search results */}
      <SearchResults />
    </div>
  )
}
