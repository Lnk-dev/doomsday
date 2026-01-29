/**
 * Messages Store Tests
 * Issue #58: Implement direct messaging system
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useMessagesStore } from './messages'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('messages store', () => {
  beforeEach(() => {
    // Reset store state
    useMessagesStore.setState({
      conversations: [],
      currentConversation: null,
      totalUnreadCount: 0,
      isLoadingConversations: false,
      isLoadingMessages: false,
      isSendingMessage: false,
      error: null,
    })
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should have empty conversations list', () => {
      const state = useMessagesStore.getState()
      expect(state.conversations).toEqual([])
    })

    it('should have null current conversation', () => {
      const state = useMessagesStore.getState()
      expect(state.currentConversation).toBeNull()
    })

    it('should have zero unread count', () => {
      const state = useMessagesStore.getState()
      expect(state.totalUnreadCount).toBe(0)
    })

    it('should not be loading initially', () => {
      const state = useMessagesStore.getState()
      expect(state.isLoadingConversations).toBe(false)
      expect(state.isLoadingMessages).toBe(false)
      expect(state.isSendingMessage).toBe(false)
    })

    it('should have no error initially', () => {
      const state = useMessagesStore.getState()
      expect(state.error).toBeNull()
    })
  })

  describe('fetchConversations', () => {
    it('should set loading state when fetching', async () => {
      mockFetch.mockImplementation(() => new Promise(() => {})) // Never resolves

      const fetchPromise = useMessagesStore.getState().fetchConversations('test-token')

      expect(useMessagesStore.getState().isLoadingConversations).toBe(true)

      // Cleanup
      mockFetch.mockReset()
    })

    it('should update conversations on success', async () => {
      const mockConversations = [
        {
          id: '1',
          otherUser: { id: 'user-1', username: 'testuser', displayName: null, avatarUrl: null, verified: false },
          lastMessage: { content: 'Hello', senderId: 'user-1', createdAt: Date.now() },
          unreadCount: 1,
          isMuted: false,
          isArchived: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ conversations: mockConversations }),
      })

      await useMessagesStore.getState().fetchConversations('test-token')

      const state = useMessagesStore.getState()
      expect(state.conversations).toEqual(mockConversations)
      expect(state.isLoadingConversations).toBe(false)
      expect(state.error).toBeNull()
    })

    it('should set error on fetch failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      await useMessagesStore.getState().fetchConversations('test-token')

      const state = useMessagesStore.getState()
      expect(state.error).toBe('Failed to fetch conversations')
      expect(state.isLoadingConversations).toBe(false)
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await useMessagesStore.getState().fetchConversations('test-token')

      const state = useMessagesStore.getState()
      expect(state.error).toBe('Network error')
      expect(state.isLoadingConversations).toBe(false)
    })
  })

  describe('fetchConversation', () => {
    it('should set loading state when fetching', async () => {
      mockFetch.mockImplementation(() => new Promise(() => {}))

      useMessagesStore.getState().fetchConversation('test-token', 'conv-1')

      expect(useMessagesStore.getState().isLoadingMessages).toBe(true)

      mockFetch.mockReset()
    })

    it('should update current conversation on success', async () => {
      const mockData = {
        conversation: {
          id: 'conv-1',
          otherUser: { id: 'user-1', username: 'testuser', displayName: null, avatarUrl: null, verified: false },
          isMuted: false,
          isArchived: false,
          createdAt: Date.now(),
        },
        messages: [
          { id: 'msg-1', senderId: 'user-1', content: 'Hello', status: 'sent', isDeleted: false, createdAt: Date.now() },
        ],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      })

      await useMessagesStore.getState().fetchConversation('test-token', 'conv-1')

      const state = useMessagesStore.getState()
      expect(state.currentConversation).toEqual({
        conversation: mockData.conversation,
        messages: mockData.messages,
      })
      expect(state.isLoadingMessages).toBe(false)
    })

    it('should set error on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      })

      await useMessagesStore.getState().fetchConversation('test-token', 'conv-1')

      expect(useMessagesStore.getState().error).toBe('Failed to fetch conversation')
    })
  })

  describe('sendMessage', () => {
    it('should set sending state', async () => {
      mockFetch.mockImplementation(() => new Promise(() => {}))

      useMessagesStore.getState().sendMessage('test-token', 'conv-1', 'Hello')

      expect(useMessagesStore.getState().isSendingMessage).toBe(true)

      mockFetch.mockReset()
    })

    it('should add message to current conversation on success', async () => {
      // Set up current conversation
      useMessagesStore.setState({
        currentConversation: {
          conversation: {
            id: 'conv-1',
            otherUser: { id: 'user-1', username: 'testuser', displayName: null, avatarUrl: null, verified: false },
            isMuted: false,
            isArchived: false,
            createdAt: Date.now(),
          },
          messages: [],
        },
      })

      const mockResponse = {
        message: {
          id: 'msg-1',
          content: 'Hello',
          status: 'sent',
          createdAt: Date.now(),
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await useMessagesStore.getState().sendMessage('test-token', 'conv-1', 'Hello')

      expect(result).not.toBeNull()
      expect(result?.content).toBe('Hello')
      expect(useMessagesStore.getState().isSendingMessage).toBe(false)
      expect(useMessagesStore.getState().currentConversation?.messages.length).toBe(1)
    })

    it('should return null on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      const result = await useMessagesStore.getState().sendMessage('test-token', 'conv-1', 'Hello')

      expect(result).toBeNull()
      expect(useMessagesStore.getState().error).toBe('Failed to send message')
    })
  })

  describe('startConversation', () => {
    it('should return conversation ID on success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ conversationId: 'new-conv-1' }),
      })

      // Mock the subsequent fetchConversations call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ conversations: [] }),
      })

      const result = await useMessagesStore.getState().startConversation('test-token', 'user-1', 'Hello!')

      expect(result).toBe('new-conv-1')
      expect(useMessagesStore.getState().isSendingMessage).toBe(false)
    })

    it('should return null on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Cannot message yourself' }),
      })

      const result = await useMessagesStore.getState().startConversation('test-token', 'self-id', 'Hello!')

      expect(result).toBeNull()
      expect(useMessagesStore.getState().error).toBe('Cannot message yourself')
    })
  })

  describe('markAsRead', () => {
    it('should update unread count in conversations', async () => {
      useMessagesStore.setState({
        conversations: [
          {
            id: 'conv-1',
            otherUser: { id: 'user-1', username: 'test', displayName: null, avatarUrl: null, verified: false },
            lastMessage: null,
            unreadCount: 5,
            isMuted: false,
            isArchived: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
        totalUnreadCount: 5,
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      await useMessagesStore.getState().markAsRead('test-token', 'conv-1')

      const state = useMessagesStore.getState()
      expect(state.conversations[0].unreadCount).toBe(0)
      expect(state.totalUnreadCount).toBe(0)
    })
  })

  describe('toggleMute', () => {
    it('should toggle muted state', async () => {
      useMessagesStore.setState({
        conversations: [
          {
            id: 'conv-1',
            otherUser: { id: 'user-1', username: 'test', displayName: null, avatarUrl: null, verified: false },
            lastMessage: null,
            unreadCount: 0,
            isMuted: false,
            isArchived: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ muted: true }),
      })

      const result = await useMessagesStore.getState().toggleMute('test-token', 'conv-1')

      expect(result).toBe(true)
      expect(useMessagesStore.getState().conversations[0].isMuted).toBe(true)
    })
  })

  describe('toggleArchive', () => {
    it('should toggle archived state', async () => {
      useMessagesStore.setState({
        conversations: [
          {
            id: 'conv-1',
            otherUser: { id: 'user-1', username: 'test', displayName: null, avatarUrl: null, verified: false },
            lastMessage: null,
            unreadCount: 0,
            isMuted: false,
            isArchived: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ archived: true }),
      })

      const result = await useMessagesStore.getState().toggleArchive('test-token', 'conv-1')

      expect(result).toBe(true)
      expect(useMessagesStore.getState().conversations[0].isArchived).toBe(true)
    })
  })

  describe('clearError', () => {
    it('should clear error state', () => {
      useMessagesStore.setState({ error: 'Some error' })

      useMessagesStore.getState().clearError()

      expect(useMessagesStore.getState().error).toBeNull()
    })
  })

  describe('clearCurrentConversation', () => {
    it('should clear current conversation', () => {
      useMessagesStore.setState({
        currentConversation: {
          conversation: {
            id: 'conv-1',
            otherUser: { id: 'user-1', username: 'test', displayName: null, avatarUrl: null, verified: false },
            isMuted: false,
            isArchived: false,
            createdAt: Date.now(),
          },
          messages: [],
        },
      })

      useMessagesStore.getState().clearCurrentConversation()

      expect(useMessagesStore.getState().currentConversation).toBeNull()
    })
  })

  describe('fetchUnreadCount', () => {
    it('should update total unread count', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ unreadCount: 10 }),
      })

      await useMessagesStore.getState().fetchUnreadCount('test-token')

      expect(useMessagesStore.getState().totalUnreadCount).toBe(10)
    })

    it('should handle failure silently', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      await useMessagesStore.getState().fetchUnreadCount('test-token')

      // Should not change the count on failure
      expect(useMessagesStore.getState().totalUnreadCount).toBe(0)
    })
  })
})
