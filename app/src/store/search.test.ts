import { describe, it, expect, beforeEach } from 'vitest'
import { useSearchStore } from './search'

describe('Search Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useSearchStore.setState({
      query: '',
      results: [],
      isSearching: false,
      recentSearches: [],
      activeFilter: 'all',
    })
  })

  describe('setQuery', () => {
    it('should update query', () => {
      useSearchStore.getState().setQuery('test query')
      expect(useSearchStore.getState().query).toBe('test query')
    })
  })

  describe('setResults', () => {
    it('should update results and set isSearching to false', () => {
      useSearchStore.getState().setSearching(true)
      expect(useSearchStore.getState().isSearching).toBe(true)

      useSearchStore.getState().setResults([
        {
          id: '1',
          type: 'post',
          title: 'Test post',
          score: 0.9,
          matchedField: 'content',
          data: {} as never,
        },
      ])

      expect(useSearchStore.getState().results).toHaveLength(1)
      expect(useSearchStore.getState().isSearching).toBe(false)
    })
  })

  describe('addRecentSearch', () => {
    it('should add search to recent searches', () => {
      useSearchStore.getState().addRecentSearch('doom')
      expect(useSearchStore.getState().recentSearches).toContain('doom')
    })

    it('should not add empty searches', () => {
      useSearchStore.getState().addRecentSearch('')
      useSearchStore.getState().addRecentSearch('   ')
      expect(useSearchStore.getState().recentSearches).toHaveLength(0)
    })

    it('should move duplicate search to top', () => {
      useSearchStore.getState().addRecentSearch('first')
      useSearchStore.getState().addRecentSearch('second')
      useSearchStore.getState().addRecentSearch('first')

      const recent = useSearchStore.getState().recentSearches
      expect(recent[0]).toBe('first')
      expect(recent).toHaveLength(2)
    })

    it('should limit to 10 recent searches', () => {
      for (let i = 0; i < 15; i++) {
        useSearchStore.getState().addRecentSearch(`search${i}`)
      }
      expect(useSearchStore.getState().recentSearches).toHaveLength(10)
    })
  })

  describe('removeRecentSearch', () => {
    it('should remove a specific search from history', () => {
      useSearchStore.getState().addRecentSearch('keep')
      useSearchStore.getState().addRecentSearch('remove')

      useSearchStore.getState().removeRecentSearch('remove')

      expect(useSearchStore.getState().recentSearches).toContain('keep')
      expect(useSearchStore.getState().recentSearches).not.toContain('remove')
    })
  })

  describe('clearRecentSearches', () => {
    it('should clear all recent searches', () => {
      useSearchStore.getState().addRecentSearch('search1')
      useSearchStore.getState().addRecentSearch('search2')

      useSearchStore.getState().clearRecentSearches()

      expect(useSearchStore.getState().recentSearches).toHaveLength(0)
    })
  })

  describe('setActiveFilter', () => {
    it('should update active filter', () => {
      useSearchStore.getState().setActiveFilter('post')
      expect(useSearchStore.getState().activeFilter).toBe('post')

      useSearchStore.getState().setActiveFilter('event')
      expect(useSearchStore.getState().activeFilter).toBe('event')
    })
  })

  describe('clearSearch', () => {
    it('should reset query, results, and searching state', () => {
      useSearchStore.getState().setQuery('test')
      useSearchStore.getState().setResults([
        {
          id: '1',
          type: 'post',
          title: 'Test',
          score: 1,
          matchedField: 'content',
          data: {} as never,
        },
      ])
      useSearchStore.getState().setSearching(true)

      useSearchStore.getState().clearSearch()

      expect(useSearchStore.getState().query).toBe('')
      expect(useSearchStore.getState().results).toHaveLength(0)
      expect(useSearchStore.getState().isSearching).toBe(false)
    })
  })
})
