/**
 * SearchInput
 *
 * Debounced search input with clear button and loading state.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { useSearchStore } from '@/store/search'

interface SearchInputProps {
  placeholder?: string
  autoFocus?: boolean
  onSearch: (query: string) => void
  debounceMs?: number
}

export function SearchInput({
  placeholder = 'Search posts, users, events...',
  autoFocus = false,
  onSearch,
  debounceMs = 300,
}: SearchInputProps) {
  const query = useSearchStore((state) => state.query)
  const setQuery = useSearchStore((state) => state.setQuery)
  const isSearching = useSearchStore((state) => state.isSearching)

  const [localQuery, setLocalQuery] = useState(query)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Sync local state with store
  useEffect(() => {
    setLocalQuery(query)
  }, [query])

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      setQuery(localQuery)
      if (localQuery.trim()) {
        onSearch(localQuery.trim())
      }
    }, debounceMs)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [localQuery, debounceMs, onSearch, setQuery])

  const handleClear = useCallback(() => {
    setLocalQuery('')
    setQuery('')
    inputRef.current?.focus()
  }, [setQuery])

  return (
    <div className="relative flex items-center gap-3 px-4 py-2.5 bg-[#1a1a1a] rounded-xl">
      {isSearching ? (
        <Loader2 size={18} className="text-[#777] animate-spin" />
      ) : (
        <Search size={18} className="text-[#777]" />
      )}

      <input
        ref={inputRef}
        type="text"
        value={localQuery}
        onChange={(e) => setLocalQuery(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="flex-1 bg-transparent text-[15px] text-white placeholder-[#777] outline-none"
      />

      {localQuery && (
        <button
          onClick={handleClear}
          className="p-1 hover:bg-[#333] rounded-full transition-colors"
        >
          <X size={16} className="text-[#777]" />
        </button>
      )}
    </div>
  )
}
