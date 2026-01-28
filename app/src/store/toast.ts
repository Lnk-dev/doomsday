/**
 * Toast Store
 *
 * Zustand store for managing toast notifications.
 * Supports multiple toast types with auto-dismiss and manual dismiss.
 */

import { create } from 'zustand'

/** Toast notification types */
export type ToastType = 'success' | 'error' | 'warning' | 'info'

/** Toast notification data */
export interface Toast {
  /** Unique identifier */
  id: string
  /** Toast message */
  message: string
  /** Toast type for styling */
  type: ToastType
  /** Duration in ms before auto-dismiss (0 = no auto-dismiss) */
  duration: number
  /** Timestamp when toast was created */
  createdAt: number
}

/** Options for creating a toast */
export interface ToastOptions {
  /** Duration in ms before auto-dismiss (default: 4000) */
  duration?: number
}

interface ToastState {
  /** Active toasts */
  toasts: Toast[]

  // Actions
  /** Add a new toast */
  addToast: (message: string, type: ToastType, options?: ToastOptions) => string
  /** Remove a toast by ID */
  removeToast: (id: string) => void
  /** Clear all toasts */
  clearToasts: () => void
}

/** Generate unique toast ID */
const generateId = (): string => `toast_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`

/** Default toast duration in ms */
const DEFAULT_DURATION = 4000

/** Maximum number of toasts to show */
const MAX_TOASTS = 5

export const useToastStore = create<ToastState>()((set, get) => ({
  toasts: [],

  addToast: (message, type, options = {}) => {
    const id = generateId()
    const duration = options.duration ?? DEFAULT_DURATION
    const toast: Toast = {
      id,
      message,
      type,
      duration,
      createdAt: Date.now(),
    }

    set((state) => {
      // Limit the number of toasts
      const newToasts = [...state.toasts, toast]
      if (newToasts.length > MAX_TOASTS) {
        newToasts.shift() // Remove oldest
      }
      return { toasts: newToasts }
    })

    // Auto-dismiss if duration > 0
    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id)
      }, duration)
    }

    return id
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }))
  },

  clearToasts: () => {
    set({ toasts: [] })
  },
}))

/**
 * Helper functions for creating toasts
 * Usage: toast.success('Message') or toast.error('Error message')
 */
export const toast = {
  /** Show success toast */
  success: (message: string, options?: ToastOptions) => {
    return useToastStore.getState().addToast(message, 'success', options)
  },

  /** Show error toast */
  error: (message: string, options?: ToastOptions) => {
    return useToastStore.getState().addToast(message, 'error', options)
  },

  /** Show warning toast */
  warning: (message: string, options?: ToastOptions) => {
    return useToastStore.getState().addToast(message, 'warning', options)
  },

  /** Show info toast */
  info: (message: string, options?: ToastOptions) => {
    return useToastStore.getState().addToast(message, 'info', options)
  },

  /** Dismiss a specific toast */
  dismiss: (id: string) => {
    useToastStore.getState().removeToast(id)
  },

  /** Dismiss all toasts */
  dismissAll: () => {
    useToastStore.getState().clearToasts()
  },
}
