/**
 * Inbox Page
 * Issue #58: Implement direct messaging system
 *
 * Displays all conversations for the current user
 */

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, Search, Archive, Edit, MoreHorizontal, VolumeX } from 'lucide-react'
import { useMessagesStore } from '@/store/messages'
import { useUserStore } from '@/store'
import { formatRelativeTime } from '@/lib/utils'

export function InboxPage() {
  const token = useUserStore((state) => state.token)
  const getUser = useUserStore((state) => state.getUser)
  const user = getUser()
  const {
    conversations,
    isLoadingConversations,
    fetchConversations,
    toggleMute,
    toggleArchive,
  } = useMessagesStore()

  const [showArchived, setShowArchived] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

  useEffect(() => {
    if (token) {
      fetchConversations(token, showArchived)
    }
  }, [token, showArchived, fetchConversations])

  const filteredConversations = conversations.filter((conv) => {
    if (!showArchived && conv.isArchived) return false
    if (showArchived && !conv.isArchived) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        conv.otherUser.username.toLowerCase().includes(query) ||
        conv.otherUser.displayName?.toLowerCase().includes(query)
      )
    }
    return true
  })

  const handleMute = async (conversationId: string) => {
    if (token) {
      await toggleMute(token, conversationId)
      setMenuOpenId(null)
    }
  }

  const handleArchive = async (conversationId: string) => {
    if (token) {
      await toggleArchive(token, conversationId)
      setMenuOpenId(null)
    }
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <MessageCircle className="w-12 h-12 text-[#555] mb-4" />
        <h2 className="text-lg font-semibold mb-2">Sign in to message</h2>
        <p className="text-[#777] text-sm text-center">
          Connect your wallet to start private conversations
        </p>
      </div>
    )
  }

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-black/95 backdrop-blur-sm z-10 border-b border-[#222]">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold">Messages</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`p-2 rounded-full transition-colors ${
                showArchived ? 'bg-[#333] text-white' : 'text-[#777] hover:text-white'
              }`}
              title={showArchived ? 'Show active' : 'Show archived'}
            >
              <Archive className="w-5 h-5" />
            </button>
            <Link
              to="/messages/new"
              className="p-2 text-[#ff3040] hover:bg-[#ff3040]/10 rounded-full transition-colors"
              title="New message"
            >
              <Edit className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
            <input
              type="text"
              placeholder="Search messages"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[#555]"
            />
          </div>
        </div>
      </div>

      {/* Conversations List */}
      {isLoadingConversations ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-[#ff3040] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredConversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <MessageCircle className="w-12 h-12 text-[#555] mb-4" />
          <h3 className="text-lg font-medium mb-1">
            {showArchived ? 'No archived messages' : 'No messages yet'}
          </h3>
          <p className="text-[#777] text-sm text-center mb-4">
            {showArchived
              ? 'Messages you archive will appear here'
              : 'Start a conversation by tapping the compose button'}
          </p>
          {!showArchived && (
            <Link
              to="/messages/new"
              className="bg-[#ff3040] text-white px-6 py-2 rounded-full font-medium hover:bg-[#e02838] transition-colors"
            >
              New Message
            </Link>
          )}
        </div>
      ) : (
        <div className="divide-y divide-[#222]">
          {filteredConversations.map((conversation) => (
            <div key={conversation.id} className="relative">
              <Link
                to={`/messages/${conversation.id}`}
                className="flex items-center gap-3 p-4 hover:bg-[#111] transition-colors"
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {conversation.otherUser.avatarUrl ? (
                    <img
                      src={conversation.otherUser.avatarUrl}
                      alt={conversation.otherUser.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#333] flex items-center justify-center text-lg font-medium">
                      {conversation.otherUser.username[0].toUpperCase()}
                    </div>
                  )}
                  {conversation.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#ff3040] rounded-full flex items-center justify-center text-xs font-medium">
                      {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium truncate ${conversation.unreadCount > 0 ? 'text-white' : 'text-[#ccc]'}`}>
                      {conversation.otherUser.displayName || conversation.otherUser.username}
                    </span>
                    {conversation.otherUser.verified && (
                      <svg className="w-4 h-4 text-[#ff3040] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                      </svg>
                    )}
                    {conversation.isMuted && (
                      <VolumeX className="w-4 h-4 text-[#555] flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className={`text-sm truncate ${conversation.unreadCount > 0 ? 'text-[#aaa]' : 'text-[#555]'}`}>
                      {conversation.lastMessage?.content || 'No messages yet'}
                    </p>
                    {conversation.lastMessage && (
                      <span className="text-xs text-[#555] flex-shrink-0">
                        {formatRelativeTime(conversation.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>

              {/* Menu Button */}
              <button
                onClick={(e) => {
                  e.preventDefault()
                  setMenuOpenId(menuOpenId === conversation.id ? null : conversation.id)
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-[#555] hover:text-white rounded-full hover:bg-[#222]"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>

              {/* Dropdown Menu */}
              {menuOpenId === conversation.id && (
                <div className="absolute right-4 top-14 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-xl z-20 py-1 min-w-[150px]">
                  <button
                    onClick={() => handleMute(conversation.id)}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-[#222] text-left"
                  >
                    <VolumeX className="w-4 h-4" />
                    {conversation.isMuted ? 'Unmute' : 'Mute'}
                  </button>
                  <button
                    onClick={() => handleArchive(conversation.id)}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-[#222] text-left"
                  >
                    <Archive className="w-4 h-4" />
                    {conversation.isArchived ? 'Unarchive' : 'Archive'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
