/**
 * Conversation Page
 * Issue #58: Implement direct messaging system
 *
 * Displays messages in a conversation and allows sending new messages
 */

import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Send, MoreVertical, VolumeX, Archive, Trash2, Reply, X } from 'lucide-react'
import { useMessagesStore } from '@/store/messages'
import { useUserStore } from '@/store'
import { formatRelativeTime } from '@/lib/utils'
import type { Message } from '@/types'

export function ConversationPage() {
  const { conversationId } = useParams<{ conversationId: string }>()
  const navigate = useNavigate()
  const token = useUserStore((state) => state.token)
  const getUser = useUserStore((state) => state.getUser)
  const user = getUser()
  const {
    currentConversation,
    isLoadingMessages,
    isSendingMessage,
    fetchConversation,
    sendMessage,
    markAsRead,
    toggleMute,
    toggleArchive,
    deleteMessage,
    clearCurrentConversation,
  } = useMessagesStore()

  const [messageText, setMessageText] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (token && conversationId) {
      fetchConversation(token, conversationId)
      markAsRead(token, conversationId)
    }

    return () => {
      clearCurrentConversation()
    }
  }, [token, conversationId, fetchConversation, markAsRead, clearCurrentConversation])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentConversation?.messages])

  const handleSend = async () => {
    if (!messageText.trim() || !token || !conversationId) return

    const content = messageText.trim()
    setMessageText('')
    setReplyTo(null)

    await sendMessage(token, conversationId, content, replyTo?.id)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleMute = async () => {
    if (token && conversationId) {
      await toggleMute(token, conversationId)
      setShowMenu(false)
    }
  }

  const handleArchive = async () => {
    if (token && conversationId) {
      await toggleArchive(token, conversationId)
      setShowMenu(false)
      navigate('/messages')
    }
  }

  const handleDelete = async (messageId: string) => {
    if (token) {
      await deleteMessage(token, messageId)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[#777]">Please sign in to view messages</p>
      </div>
    )
  }

  if (isLoadingMessages || !currentConversation) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-2 border-[#ff3040] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const { conversation, messages } = currentConversation
  const otherUser = conversation?.otherUser

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-[#222] bg-black sticky top-0 z-10">
        <button
          onClick={() => navigate('/messages')}
          className="p-2 -ml-2 text-[#777] hover:text-white rounded-full hover:bg-[#222]"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <Link to={`/profile?user=${otherUser?.username}`} className="flex items-center gap-3 flex-1 min-w-0">
          {otherUser?.avatarUrl ? (
            <img
              src={otherUser.avatarUrl}
              alt={otherUser.username}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#333] flex items-center justify-center text-lg font-medium">
              {otherUser?.username[0].toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="font-medium truncate">
                {otherUser?.displayName || otherUser?.username}
              </span>
              {otherUser?.verified && (
                <svg className="w-4 h-4 text-[#ff3040] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
              )}
            </div>
            <span className="text-xs text-[#555]">@{otherUser?.username}</span>
          </div>
        </Link>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-[#777] hover:text-white rounded-full hover:bg-[#222]"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-xl z-20 py-1 min-w-[150px]">
              <button
                onClick={handleMute}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-[#222] text-left"
              >
                <VolumeX className="w-4 h-4" />
                {conversation?.isMuted ? 'Unmute' : 'Mute'}
              </button>
              <button
                onClick={handleArchive}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-[#222] text-left"
              >
                <Archive className="w-4 h-4" />
                Archive
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-[#555] mb-2">No messages yet</p>
            <p className="text-[#777] text-sm">Send a message to start the conversation</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwn = message.senderId === user.id
            const showAvatar = !isOwn && (index === 0 || messages[index - 1]?.senderId !== message.senderId)

            return (
              <div
                key={message.id}
                className={`flex gap-2 group ${isOwn ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                {!isOwn && (
                  <div className="w-8 flex-shrink-0">
                    {showAvatar && (
                      otherUser?.avatarUrl ? (
                        <img
                          src={otherUser.avatarUrl}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#333] flex items-center justify-center text-sm">
                          {otherUser?.username[0].toUpperCase()}
                        </div>
                      )
                    )}
                  </div>
                )}

                {/* Message Bubble */}
                <div className={`max-w-[70%] ${isOwn ? 'mr-2' : ''}`}>
                  {/* Reply Preview */}
                  {message.replyTo && (
                    <div className="text-xs text-[#555] mb-1 pl-3 border-l-2 border-[#333]">
                      {message.replyTo.content.slice(0, 50)}
                      {message.replyTo.content.length > 50 && '...'}
                    </div>
                  )}

                  <div
                    className={`relative rounded-2xl px-4 py-2 ${
                      isOwn
                        ? 'bg-[#ff3040] text-white'
                        : 'bg-[#222] text-[#eee]'
                    } ${message.isDeleted ? 'opacity-50 italic' : ''}`}
                  >
                    <p className="text-[15px] whitespace-pre-wrap break-words">{message.content}</p>
                    <span className={`text-[10px] ${isOwn ? 'text-white/60' : 'text-[#555]'} mt-1 block`}>
                      {formatRelativeTime(message.createdAt)}
                    </span>
                  </div>

                  {/* Message Actions */}
                  {!message.isDeleted && (
                    <div className={`flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${isOwn ? 'justify-end' : ''}`}>
                      <button
                        onClick={() => {
                          setReplyTo(message)
                          inputRef.current?.focus()
                        }}
                        className="p-1 text-[#555] hover:text-white rounded"
                        title="Reply"
                      >
                        <Reply className="w-4 h-4" />
                      </button>
                      {isOwn && (
                        <button
                          onClick={() => handleDelete(message.id)}
                          className="p-1 text-[#555] hover:text-[#ff3040] rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Preview */}
      {replyTo && (
        <div className="px-4 py-2 border-t border-[#222] bg-[#111] flex items-center gap-2">
          <Reply className="w-4 h-4 text-[#555]" />
          <span className="text-sm text-[#777] flex-1 truncate">
            Replying to: {replyTo.content.slice(0, 50)}
          </span>
          <button
            onClick={() => setReplyTo(null)}
            className="p-1 text-[#555] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-[#222] bg-black">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 bg-[#1a1a1a] border border-[#333] rounded-2xl px-4 py-3 text-[15px] resize-none focus:outline-none focus:border-[#555] max-h-32"
            style={{ minHeight: '48px' }}
          />
          <button
            onClick={handleSend}
            disabled={!messageText.trim() || isSendingMessage}
            className="p-3 bg-[#ff3040] text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#e02838] transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
