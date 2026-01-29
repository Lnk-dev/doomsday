/**
 * MentionAutocomplete Component
 * Issue #56: Add @mentions and user tagging
 *
 * Dropdown component for autocompleting @mentions.
 */

import { useState, useEffect, useCallback } from 'react'
import { Loader2, CheckCircle2 } from 'lucide-react'

interface User {
  username: string
  avatar?: string
  verified?: boolean
  displayName?: string
}

interface MentionAutocompleteProps {
  /** Search query (text after @) */
  query: string
  /** Position for dropdown placement */
  position: { top: number; left: number }
  /** Callback when user is selected */
  onSelect: (username: string) => void
  /** Callback to close dropdown */
  onClose: () => void
  /** Whether dropdown is visible */
  isOpen: boolean
}

export function MentionAutocomplete({
  query,
  position,
  onSelect,
  onClose,
  isOpen,
}: MentionAutocompleteProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Fetch matching users
  useEffect(() => {
    if (!query || query.length < 1) {
      setUsers([])
      return
    }

    setLoading(true)
    searchUsers(query)
      .then(setUsers)
      .finally(() => setLoading(false))
  }, [query])

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [users])

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((i) => Math.min(i + 1, users.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((i) => Math.max(i - 1, 0))
          break
        case 'Enter':
        case 'Tab':
          if (users[selectedIndex]) {
            e.preventDefault()
            onSelect(users[selectedIndex].username)
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    },
    [isOpen, users, selectedIndex, onSelect, onClose]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!isOpen || (users.length === 0 && !loading)) return null

  return (
    <div
      className="absolute z-50 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-xl overflow-hidden max-h-[200px] overflow-y-auto w-[250px]"
      style={{ top: position.top, left: position.left }}
    >
      {loading ? (
        <div className="flex items-center gap-2 p-3 text-[#777] text-sm">
          <Loader2 size={14} className="animate-spin" />
          <span>Searching...</span>
        </div>
      ) : (
        users.map((user, index) => (
          <button
            key={user.username}
            onClick={() => onSelect(user.username)}
            className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
              index === selectedIndex ? 'bg-[#333]' : 'hover:bg-[#252525]'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff3040] to-[#ff6b6b] flex-shrink-0 overflow-hidden flex items-center justify-center">
              {user.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-xs font-bold">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="text-white font-medium truncate">
                  {user.displayName || user.username}
                </span>
                {user.verified && (
                  <CheckCircle2 size={14} className="text-[#1d9bf0] flex-shrink-0" fill="#1d9bf0" />
                )}
              </div>
              <span className="text-[13px] text-[#777] truncate block">@{user.username}</span>
            </div>
          </button>
        ))
      )}
    </div>
  )
}

// Mock user search - replace with actual implementation
async function searchUsers(query: string): Promise<User[]> {
  // Simulate API delay
  await new Promise((r) => setTimeout(r, 150))

  // Mock users for development
  const mockUsers: User[] = [
    { username: 'doomprophet', displayName: 'Doom Prophet', verified: true },
    { username: 'cassandrav2', displayName: 'Cassandra V2' },
    { username: 'climatewatch', displayName: 'Climate Watch', verified: true },
    { username: 'anon_4821', displayName: 'Anonymous User' },
    { username: 'endtimes', displayName: 'End Times' },
    { username: 'lifeliver', displayName: 'Life Liver', verified: true },
    { username: 'sunrisewatcher', displayName: 'Sunrise Watcher' },
    { username: 'presentmoment', displayName: 'Present Moment', verified: true },
    { username: 'builder_anon', displayName: 'Builder Anon' },
    { username: 'doomscroller', displayName: 'Doom Scroller' },
    { username: 'optimist_prime', displayName: 'Optimist Prime' },
    { username: 'reality_check', displayName: 'Reality Check', verified: true },
  ]

  return mockUsers
    .filter(
      (u) =>
        u.username.toLowerCase().includes(query.toLowerCase()) ||
        u.displayName?.toLowerCase().includes(query.toLowerCase())
    )
    .slice(0, 5)
}
