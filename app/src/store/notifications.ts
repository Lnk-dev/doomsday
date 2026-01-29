/**
 * Notifications Store
 * Issue #56: Add @mentions and user tagging
 *
 * Zustand store for managing notifications including mentions.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type NotificationType = 'mention' | 'like' | 'reply' | 'follow' | 'repost'

export interface Notification {
  id: string
  type: NotificationType
  /** Username who triggered the notification */
  fromUsername: string
  fromAvatar?: string
  /** Post ID if applicable */
  postId?: string
  /** Preview of content */
  preview?: string
  /** When the notification was created */
  createdAt: number
  /** Whether notification has been read */
  isRead: boolean
}

interface NotificationsState {
  notifications: Notification[]
  unreadCount: number

  // Actions
  addNotification: (
    notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>
  ) => void
  markAsRead: (notificationId: string) => void
  markAllAsRead: () => void
  clearNotifications: () => void

  // Queries
  getNotificationsByType: (type: NotificationType) => Notification[]
  getMentions: () => Notification[]
}

const generateId = (): string => Math.random().toString(36).substring(2, 15)

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,

      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: generateId(),
          createdAt: Date.now(),
          isRead: false,
        }

        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 100), // Keep last 100
          unreadCount: state.unreadCount + 1,
        }))
      },

      markAsRead: (notificationId) => {
        set((state) => {
          const notification = state.notifications.find((n) => n.id === notificationId)
          if (!notification || notification.isRead) {
            return state
          }

          return {
            notifications: state.notifications.map((n) =>
              n.id === notificationId ? { ...n, isRead: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
          }
        })
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
          unreadCount: 0,
        }))
      },

      clearNotifications: () => {
        set({ notifications: [], unreadCount: 0 })
      },

      getNotificationsByType: (type) => {
        return get().notifications.filter((n) => n.type === type)
      },

      getMentions: () => {
        return get().notifications.filter((n) => n.type === 'mention')
      },
    }),
    {
      name: 'doomsday-notifications',
      partialize: (state) => ({
        notifications: state.notifications,
        unreadCount: state.unreadCount,
      }),
    }
  )
)

/**
 * Helper function to notify mentioned users
 * In a real app, this would send to a backend
 */
export function notifyMentionedUsers(
  postId: string,
  mentionedUsernames: string[],
  fromUsername: string,
  preview?: string
) {
  const { addNotification } = useNotificationsStore.getState()

  // Don't notify yourself
  const usersToNotify = mentionedUsernames.filter(
    (u) => u.toLowerCase() !== fromUsername.toLowerCase()
  )

  usersToNotify.forEach((username) => {
    // In a real app, this would send to a backend
    // For now, we simulate local notifications for demo
    console.log(`Notifying @${username} of mention by @${fromUsername} in post ${postId}`)

    // Add notification for demo purposes
    // In production, this would be handled by the backend
    addNotification({
      type: 'mention',
      fromUsername,
      postId,
      preview: preview || `@${fromUsername} mentioned you in a post`,
    })
  })
}
