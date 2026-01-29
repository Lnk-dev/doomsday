/**
 * Toast Notification System
 *
 * Provides in-app toast notifications for various events.
 */

import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastStore {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => string
  removeToast: (id: string) => void
  clearAll: () => void
}

let toastId = 0

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = `toast-${++toastId}`
    const newToast = { ...toast, id }

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }))

    // Auto-remove after duration (default 5 seconds)
    const duration = toast.duration ?? 5000
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }))
      }, duration)
    }

    return id
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }))
  },

  clearAll: () => {
    set({ toasts: [] })
  },
}))

// Convenience functions
export const toast = {
  success: (title: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title'>>) =>
    useToastStore.getState().addToast({ type: 'success', title, ...options }),

  error: (title: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title'>>) =>
    useToastStore.getState().addToast({ type: 'error', title, ...options }),

  warning: (title: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title'>>) =>
    useToastStore.getState().addToast({ type: 'warning', title, ...options }),

  info: (title: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title'>>) =>
    useToastStore.getState().addToast({ type: 'info', title, ...options }),

  dismiss: (id: string) => useToastStore.getState().removeToast(id),

  dismissAll: () => useToastStore.getState().clearAll(),
}

// Notification event types
export type NotificationEvent =
  | 'new_follower'
  | 'post_liked'
  | 'post_commented'
  | 'bet_won'
  | 'bet_lost'
  | 'event_resolved'
  | 'mention'

// Show notification for specific events
export function showNotification(event: NotificationEvent, data: Record<string, unknown>): string {
  switch (event) {
    case 'new_follower':
      return toast.info(`${data.username} started following you`, {
        action: {
          label: 'View Profile',
          onClick: () => window.location.href = `/profile/${data.username}`,
        },
      })

    case 'post_liked':
      return toast.info(`${data.username} liked your post`)

    case 'post_commented':
      return toast.info(`${data.username} commented on your post`, {
        action: {
          label: 'View',
          onClick: () => window.location.href = `/post/${data.postId}`,
        },
      })

    case 'bet_won':
      return toast.success(`You won ${data.amount} points!`, {
        message: `Your prediction on "${data.eventTitle}" was correct`,
        action: {
          label: 'View',
          onClick: () => window.location.href = `/events/${data.eventId}`,
        },
      })

    case 'bet_lost':
      return toast.info('Prediction resolved', {
        message: `"${data.eventTitle}" didn't go your way`,
      })

    case 'event_resolved':
      return toast.info('Event resolved', {
        message: `"${data.eventTitle}" has been resolved`,
        action: {
          label: 'View',
          onClick: () => window.location.href = `/events/${data.eventId}`,
        },
      })

    case 'mention':
      return toast.info(`${data.username} mentioned you`, {
        action: {
          label: 'View',
          onClick: () => window.location.href = `/post/${data.postId}`,
        },
      })

    default:
      return toast.info('New notification')
  }
}
