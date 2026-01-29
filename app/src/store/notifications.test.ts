/**
 * Notifications Store Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useNotificationsStore, notifyMentionedUsers } from './notifications'

describe('notifications store', () => {
  beforeEach(() => {
    // Reset store state
    useNotificationsStore.setState({
      notifications: [],
      unreadCount: 0,
    })
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should have empty notifications list', () => {
      const state = useNotificationsStore.getState()
      expect(state.notifications).toEqual([])
    })

    it('should have zero unread count', () => {
      const state = useNotificationsStore.getState()
      expect(state.unreadCount).toBe(0)
    })
  })

  describe('addNotification', () => {
    it('should add a notification', () => {
      const { addNotification } = useNotificationsStore.getState()

      addNotification({
        type: 'mention',
        fromUsername: 'testuser',
        postId: 'post-1',
        preview: 'Test mention',
      })

      const state = useNotificationsStore.getState()
      expect(state.notifications).toHaveLength(1)
      expect(state.notifications[0].type).toBe('mention')
      expect(state.notifications[0].fromUsername).toBe('testuser')
      expect(state.notifications[0].isRead).toBe(false)
    })

    it('should increment unread count', () => {
      const { addNotification } = useNotificationsStore.getState()

      addNotification({
        type: 'like',
        fromUsername: 'user1',
      })

      expect(useNotificationsStore.getState().unreadCount).toBe(1)

      addNotification({
        type: 'follow',
        fromUsername: 'user2',
      })

      expect(useNotificationsStore.getState().unreadCount).toBe(2)
    })

    it('should generate unique IDs', () => {
      const { addNotification } = useNotificationsStore.getState()

      addNotification({ type: 'like', fromUsername: 'user1' })
      addNotification({ type: 'follow', fromUsername: 'user2' })

      const state = useNotificationsStore.getState()
      expect(state.notifications[0].id).not.toBe(state.notifications[1].id)
    })

    it('should set createdAt timestamp', () => {
      const before = Date.now()
      const { addNotification } = useNotificationsStore.getState()

      addNotification({ type: 'reply', fromUsername: 'user1' })

      const after = Date.now()
      const createdAt = useNotificationsStore.getState().notifications[0].createdAt

      expect(createdAt).toBeGreaterThanOrEqual(before)
      expect(createdAt).toBeLessThanOrEqual(after)
    })

    it('should keep only last 100 notifications', () => {
      const { addNotification } = useNotificationsStore.getState()

      // Add 105 notifications
      for (let i = 0; i < 105; i++) {
        addNotification({ type: 'like', fromUsername: `user${i}` })
      }

      expect(useNotificationsStore.getState().notifications).toHaveLength(100)
    })

    it('should add new notifications at the beginning', () => {
      const { addNotification } = useNotificationsStore.getState()

      addNotification({ type: 'like', fromUsername: 'first' })
      addNotification({ type: 'like', fromUsername: 'second' })

      const notifications = useNotificationsStore.getState().notifications
      expect(notifications[0].fromUsername).toBe('second')
      expect(notifications[1].fromUsername).toBe('first')
    })
  })

  describe('markAsRead', () => {
    it('should mark a notification as read', () => {
      const { addNotification, markAsRead } = useNotificationsStore.getState()

      addNotification({ type: 'mention', fromUsername: 'user1' })
      const notificationId = useNotificationsStore.getState().notifications[0].id

      markAsRead(notificationId)

      expect(useNotificationsStore.getState().notifications[0].isRead).toBe(true)
    })

    it('should decrement unread count', () => {
      const { addNotification, markAsRead } = useNotificationsStore.getState()

      addNotification({ type: 'like', fromUsername: 'user1' })
      addNotification({ type: 'follow', fromUsername: 'user2' })

      expect(useNotificationsStore.getState().unreadCount).toBe(2)

      const notificationId = useNotificationsStore.getState().notifications[0].id
      markAsRead(notificationId)

      expect(useNotificationsStore.getState().unreadCount).toBe(1)
    })

    it('should not decrement below zero', () => {
      useNotificationsStore.setState({ unreadCount: 0, notifications: [] })

      const { addNotification, markAsRead } = useNotificationsStore.getState()
      addNotification({ type: 'like', fromUsername: 'user1' })

      const notificationId = useNotificationsStore.getState().notifications[0].id

      // Mark as read twice
      markAsRead(notificationId)
      markAsRead(notificationId)

      expect(useNotificationsStore.getState().unreadCount).toBe(0)
    })

    it('should not change state for already read notification', () => {
      const { addNotification, markAsRead } = useNotificationsStore.getState()

      addNotification({ type: 'like', fromUsername: 'user1' })
      const notificationId = useNotificationsStore.getState().notifications[0].id

      markAsRead(notificationId)
      const stateAfterFirst = useNotificationsStore.getState()

      markAsRead(notificationId)
      const stateAfterSecond = useNotificationsStore.getState()

      expect(stateAfterFirst.unreadCount).toBe(stateAfterSecond.unreadCount)
    })

    it('should handle non-existent notification ID', () => {
      const { markAsRead } = useNotificationsStore.getState()

      // Should not throw
      markAsRead('non-existent-id')

      expect(useNotificationsStore.getState().unreadCount).toBe(0)
    })
  })

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', () => {
      const { addNotification, markAllAsRead } = useNotificationsStore.getState()

      addNotification({ type: 'like', fromUsername: 'user1' })
      addNotification({ type: 'follow', fromUsername: 'user2' })
      addNotification({ type: 'mention', fromUsername: 'user3' })

      markAllAsRead()

      const notifications = useNotificationsStore.getState().notifications
      expect(notifications.every((n) => n.isRead)).toBe(true)
    })

    it('should set unread count to zero', () => {
      const { addNotification, markAllAsRead } = useNotificationsStore.getState()

      addNotification({ type: 'like', fromUsername: 'user1' })
      addNotification({ type: 'follow', fromUsername: 'user2' })

      expect(useNotificationsStore.getState().unreadCount).toBe(2)

      markAllAsRead()

      expect(useNotificationsStore.getState().unreadCount).toBe(0)
    })
  })

  describe('clearNotifications', () => {
    it('should clear all notifications', () => {
      const { addNotification, clearNotifications } = useNotificationsStore.getState()

      addNotification({ type: 'like', fromUsername: 'user1' })
      addNotification({ type: 'follow', fromUsername: 'user2' })

      clearNotifications()

      expect(useNotificationsStore.getState().notifications).toEqual([])
    })

    it('should reset unread count to zero', () => {
      const { addNotification, clearNotifications } = useNotificationsStore.getState()

      addNotification({ type: 'like', fromUsername: 'user1' })

      clearNotifications()

      expect(useNotificationsStore.getState().unreadCount).toBe(0)
    })
  })

  describe('getNotificationsByType', () => {
    it('should filter notifications by type', () => {
      const { addNotification, getNotificationsByType } = useNotificationsStore.getState()

      addNotification({ type: 'like', fromUsername: 'user1' })
      addNotification({ type: 'mention', fromUsername: 'user2' })
      addNotification({ type: 'like', fromUsername: 'user3' })
      addNotification({ type: 'follow', fromUsername: 'user4' })

      const likes = getNotificationsByType('like')
      expect(likes).toHaveLength(2)
      expect(likes.every((n) => n.type === 'like')).toBe(true)
    })

    it('should return empty array when no matches', () => {
      const { addNotification, getNotificationsByType } = useNotificationsStore.getState()

      addNotification({ type: 'like', fromUsername: 'user1' })

      const replies = getNotificationsByType('reply')
      expect(replies).toEqual([])
    })
  })

  describe('getMentions', () => {
    it('should return only mention notifications', () => {
      const { addNotification, getMentions } = useNotificationsStore.getState()

      addNotification({ type: 'like', fromUsername: 'user1' })
      addNotification({ type: 'mention', fromUsername: 'user2', preview: 'mentioned you' })
      addNotification({ type: 'follow', fromUsername: 'user3' })
      addNotification({ type: 'mention', fromUsername: 'user4', preview: 'also mentioned you' })

      const mentions = getMentions()
      expect(mentions).toHaveLength(2)
      expect(mentions.every((n) => n.type === 'mention')).toBe(true)
    })
  })

  describe('notifyMentionedUsers helper', () => {
    it('should add notifications for mentioned users', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      notifyMentionedUsers('post-1', ['user1', 'user2'], 'author', 'Test post')

      // Should add 2 notifications
      expect(useNotificationsStore.getState().notifications).toHaveLength(2)

      consoleSpy.mockRestore()
    })

    it('should not notify the author', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      notifyMentionedUsers('post-1', ['author', 'user1'], 'author', 'Test post')

      // Should only add 1 notification (for user1, not author)
      expect(useNotificationsStore.getState().notifications).toHaveLength(1)
      expect(useNotificationsStore.getState().notifications[0].fromUsername).toBe('author')

      consoleSpy.mockRestore()
    })

    it('should handle case-insensitive author matching', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      notifyMentionedUsers('post-1', ['AUTHOR', 'user1'], 'author', 'Test post')

      // Should only add 1 notification (for user1)
      expect(useNotificationsStore.getState().notifications).toHaveLength(1)

      consoleSpy.mockRestore()
    })

    it('should use default preview if not provided', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      notifyMentionedUsers('post-1', ['user1'], 'author')

      const notification = useNotificationsStore.getState().notifications[0]
      expect(notification.preview).toBe('@author mentioned you in a post')

      consoleSpy.mockRestore()
    })
  })
})
