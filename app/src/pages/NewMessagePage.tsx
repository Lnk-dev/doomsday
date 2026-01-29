/**
 * New Message Page
 * Issue #58: Implement direct messaging system
 *
 * Search for users and start new conversations
 */

import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Search, Send, X } from 'lucide-react'
import { useMessagesStore } from '@/store/messages'
import { useUserStore } from '@/store'
import type { ConversationParticipant } from '@/types'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export function NewMessagePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = useUserStore((state) => state.token)
  const getUser = useUserStore((state) => state.getUser)
  const user = getUser()
  const { startConversation, isSendingMessage, error, clearError } = useMessagesStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ConversationParticipant[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedUser, setSelectedUser] = useState<ConversationParticipant | null>(null)
  const [messageText, setMessageText] = useState('')

  // Pre-select user if provided in URL
  const preselectedUserId = searchParams.get('userId')
  const preselectedUsername = searchParams.get('username')

  useEffect(() => {
    if (preselectedUserId && preselectedUsername) {
      setSelectedUser({
        id: preselectedUserId,
        username: preselectedUsername,
        displayName: null,
        avatarUrl: null,
        verified: false,
      })
    }
  }, [preselectedUserId, preselectedUsername])

  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim() || !token) {
        setSearchResults([])
        return
      }

      setIsSearching(true)
      try {
        const response = await fetch(
          `${API_BASE}/users/search?q=${encodeURIComponent(searchQuery)}&limit=10`,
          { headers: { Authorization: `Bearer ${token}` } }
        )

        if (response.ok) {
          const data = await response.json()
          // Filter out current user
          setSearchResults(
            data.users
              .filter((u: ConversationParticipant) => u.id !== user?.id)
              .map((u: { id: string; username: string; displayName?: string; avatarUrl?: string; verified?: boolean }) => ({
                id: u.id,
                username: u.username,
                displayName: u.displayName || null,
                avatarUrl: u.avatarUrl || null,
                verified: u.verified || false,
              }))
          )
        }
      } catch {
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }

    const debounce = setTimeout(searchUsers, 300)
    return () => clearTimeout(debounce)
  }, [searchQuery, token, user?.id])

  const handleSend = async () => {
    if (!selectedUser || !messageText.trim() || !token) return

    const conversationId = await startConversation(token, selectedUser.id, messageText.trim())
    if (conversationId) {
      navigate(`/messages/${conversationId}`)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[#777]">Please sign in to send messages</p>
      </div>
    )
  }

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-black z-10 border-b border-[#222]">
        <div className="flex items-center gap-3 p-4">
          <button
            onClick={() => navigate('/messages')}
            className="p-2 -ml-2 text-[#777] hover:text-white rounded-full hover:bg-[#222]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">New Message</h1>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-[#ff3040]/10 border border-[#ff3040]/30 rounded-lg flex items-center justify-between">
          <span className="text-sm text-[#ff3040]">{error}</span>
          <button onClick={clearError} className="text-[#ff3040]">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Selected User */}
      {selectedUser ? (
        <div className="p-4 border-b border-[#222]">
          <div className="flex items-center gap-3">
            <span className="text-[#777]">To:</span>
            <div className="flex items-center gap-2 bg-[#222] px-3 py-1.5 rounded-full">
              {selectedUser.avatarUrl ? (
                <img
                  src={selectedUser.avatarUrl}
                  alt=""
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-[#333] flex items-center justify-center text-xs">
                  {selectedUser.username[0].toUpperCase()}
                </div>
              )}
              <span className="text-sm font-medium">
                {selectedUser.displayName || selectedUser.username}
              </span>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-[#555] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Search */}
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
              <input
                type="text"
                placeholder="Search for a user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-[#555]"
              />
            </div>
          </div>

          {/* Search Results */}
          {isSearching ? (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-2 border-[#ff3040] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : searchResults.length > 0 ? (
            <div className="divide-y divide-[#222]">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => {
                    setSelectedUser(result)
                    setSearchQuery('')
                    setSearchResults([])
                  }}
                  className="w-full flex items-center gap-3 p-4 hover:bg-[#111] text-left"
                >
                  {result.avatarUrl ? (
                    <img
                      src={result.avatarUrl}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#333] flex items-center justify-center text-lg">
                      {result.username[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">
                        {result.displayName || result.username}
                      </span>
                      {result.verified && (
                        <svg className="w-4 h-4 text-[#ff3040]" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm text-[#555]">@{result.username}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : searchQuery.trim() && !isSearching ? (
            <div className="text-center py-8 text-[#555]">
              No users found
            </div>
          ) : null}
        </>
      )}

      {/* Message Input (only show when user is selected) */}
      {selectedUser && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-black border-t border-[#222]">
          <div className="flex items-end gap-2">
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message..."
              rows={1}
              className="flex-1 bg-[#1a1a1a] border border-[#333] rounded-2xl px-4 py-3 resize-none focus:outline-none focus:border-[#555] max-h-32"
              style={{ minHeight: '48px' }}
            />
            <button
              onClick={handleSend}
              disabled={!messageText.trim() || isSendingMessage}
              className="p-3 bg-[#ff3040] text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#e02838] transition-colors"
            >
              {isSendingMessage ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
