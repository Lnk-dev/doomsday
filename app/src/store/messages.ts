/**
 * Messages Store
 * Issue #58: Implement direct messaging system
 *
 * Zustand store for managing direct messages and conversations
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Conversation, Message, ID } from '@/types'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface MessagesState {
  // Data
  conversations: Conversation[]
  currentConversation: {
    conversation: Omit<Conversation, 'lastMessage' | 'unreadCount' | 'updatedAt'> | null
    messages: Message[]
  } | null
  totalUnreadCount: number

  // Loading states
  isLoadingConversations: boolean
  isLoadingMessages: boolean
  isSendingMessage: boolean

  // Error states
  error: string | null

  // Actions
  fetchConversations: (token: string, includeArchived?: boolean) => Promise<void>
  fetchConversation: (token: string, conversationId: ID) => Promise<void>
  sendMessage: (token: string, conversationId: ID, content: string, replyToId?: ID) => Promise<Message | null>
  startConversation: (token: string, participantId: ID, message: string) => Promise<string | null>
  markAsRead: (token: string, conversationId: ID) => Promise<void>
  toggleMute: (token: string, conversationId: ID) => Promise<boolean>
  toggleArchive: (token: string, conversationId: ID) => Promise<boolean>
  deleteMessage: (token: string, messageId: ID) => Promise<void>
  fetchUnreadCount: (token: string) => Promise<void>
  clearError: () => void
  clearCurrentConversation: () => void
}

export const useMessagesStore = create<MessagesState>()(
  persist(
    (set, get) => ({
      conversations: [],
      currentConversation: null,
      totalUnreadCount: 0,
      isLoadingConversations: false,
      isLoadingMessages: false,
      isSendingMessage: false,
      error: null,

      fetchConversations: async (token, includeArchived = false) => {
        set({ isLoadingConversations: true, error: null })

        try {
          const url = `${API_BASE}/messages/conversations${includeArchived ? '?includeArchived=true' : ''}`
          const response = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
          })

          if (!response.ok) {
            throw new Error('Failed to fetch conversations')
          }

          const data = await response.json()
          set({ conversations: data.conversations, isLoadingConversations: false })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch conversations',
            isLoadingConversations: false,
          })
        }
      },

      fetchConversation: async (token, conversationId) => {
        set({ isLoadingMessages: true, error: null })

        try {
          const response = await fetch(
            `${API_BASE}/messages/conversations/${conversationId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          )

          if (!response.ok) {
            throw new Error('Failed to fetch conversation')
          }

          const data = await response.json()
          set({
            currentConversation: {
              conversation: data.conversation,
              messages: data.messages,
            },
            isLoadingMessages: false,
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch conversation',
            isLoadingMessages: false,
          })
        }
      },

      sendMessage: async (token, conversationId, content, replyToId) => {
        set({ isSendingMessage: true, error: null })

        try {
          const response = await fetch(
            `${API_BASE}/messages/conversations/${conversationId}/messages`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ content, replyToId }),
            }
          )

          if (!response.ok) {
            throw new Error('Failed to send message')
          }

          const data = await response.json()
          const newMessage: Message = {
            id: data.message.id,
            senderId: '', // Will be filled by the API
            content: data.message.content,
            status: data.message.status,
            replyTo: null,
            isDeleted: false,
            createdAt: data.message.createdAt,
          }

          // Add message to current conversation
          const current = get().currentConversation
          if (current) {
            set({
              currentConversation: {
                ...current,
                messages: [...current.messages, newMessage],
              },
            })
          }

          set({ isSendingMessage: false })
          return newMessage
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to send message',
            isSendingMessage: false,
          })
          return null
        }
      },

      startConversation: async (token, participantId, message) => {
        set({ isSendingMessage: true, error: null })

        try {
          const response = await fetch(`${API_BASE}/messages/conversations`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ participantId, message }),
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to start conversation')
          }

          const data = await response.json()
          set({ isSendingMessage: false })

          // Refresh conversations list
          get().fetchConversations(token)

          return data.conversationId
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to start conversation',
            isSendingMessage: false,
          })
          return null
        }
      },

      markAsRead: async (token, conversationId) => {
        try {
          await fetch(
            `${API_BASE}/messages/conversations/${conversationId}/read`,
            {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
            }
          )

          // Update local state
          set((state) => ({
            conversations: state.conversations.map((c) =>
              c.id === conversationId ? { ...c, unreadCount: 0 } : c
            ),
            totalUnreadCount: Math.max(
              0,
              state.totalUnreadCount -
                (state.conversations.find((c) => c.id === conversationId)?.unreadCount || 0)
            ),
          }))
        } catch {
          // Silently fail for read receipts
        }
      },

      toggleMute: async (token, conversationId) => {
        try {
          const response = await fetch(
            `${API_BASE}/messages/conversations/${conversationId}/mute`,
            {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
            }
          )

          const data = await response.json()

          set((state) => ({
            conversations: state.conversations.map((c) =>
              c.id === conversationId ? { ...c, isMuted: data.muted } : c
            ),
          }))

          return data.muted
        } catch {
          return false
        }
      },

      toggleArchive: async (token, conversationId) => {
        try {
          const response = await fetch(
            `${API_BASE}/messages/conversations/${conversationId}/archive`,
            {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
            }
          )

          const data = await response.json()

          set((state) => ({
            conversations: state.conversations.map((c) =>
              c.id === conversationId ? { ...c, isArchived: data.archived } : c
            ),
          }))

          return data.archived
        } catch {
          return false
        }
      },

      deleteMessage: async (token, messageId) => {
        try {
          await fetch(`${API_BASE}/messages/messages/${messageId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          })

          // Update local state
          const current = get().currentConversation
          if (current) {
            set({
              currentConversation: {
                ...current,
                messages: current.messages.map((m) =>
                  m.id === messageId
                    ? { ...m, isDeleted: true, content: '[Message deleted]' }
                    : m
                ),
              },
            })
          }
        } catch {
          // Silently fail
        }
      },

      fetchUnreadCount: async (token) => {
        try {
          const response = await fetch(`${API_BASE}/messages/unread-count`, {
            headers: { Authorization: `Bearer ${token}` },
          })

          if (response.ok) {
            const data = await response.json()
            set({ totalUnreadCount: data.unreadCount })
          }
        } catch {
          // Silently fail
        }
      },

      clearError: () => set({ error: null }),

      clearCurrentConversation: () => set({ currentConversation: null }),
    }),
    {
      name: 'doomsday-messages',
      partialize: (state) => ({
        totalUnreadCount: state.totalUnreadCount,
      }),
    }
  )
)
