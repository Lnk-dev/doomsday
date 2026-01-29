/**
 * Web Push Notifications
 *
 * Handles browser push notification subscription and display.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface PushState {
  isSupported: boolean
  permission: NotificationPermission
  subscription: PushSubscription | null
  isSubscribed: boolean
  checkSupport: () => void
  requestPermission: () => Promise<NotificationPermission>
  subscribe: () => Promise<boolean>
  unsubscribe: () => Promise<boolean>
}

export const usePushStore = create<PushState>()(
  persist(
    (set, get) => ({
      isSupported: false,
      permission: 'default',
      subscription: null,
      isSubscribed: false,

      checkSupport: () => {
        const isSupported = 'serviceWorker' in navigator && 'PushManager' in window
        const permission = isSupported ? Notification.permission : 'denied'
        set({ isSupported, permission })
      },

      requestPermission: async () => {
        if (!get().isSupported) {
          return 'denied'
        }

        const permission = await Notification.requestPermission()
        set({ permission })
        return permission
      },

      subscribe: async () => {
        const state = get()

        if (!state.isSupported) {
          console.warn('Push notifications not supported')
          return false
        }

        if (state.permission !== 'granted') {
          const permission = await state.requestPermission()
          if (permission !== 'granted') {
            return false
          }
        }

        try {
          // Get service worker registration
          const registration = await navigator.serviceWorker.ready

          // Get VAPID public key from server
          const response = await fetch(`${API_BASE}/push/vapid-key`)
          if (!response.ok) {
            throw new Error('Failed to get VAPID key')
          }
          const { publicKey } = await response.json()

          // Subscribe to push
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey),
          })

          // Send subscription to server
          const token = localStorage.getItem('token')
          const saveResponse = await fetch(`${API_BASE}/push/subscribe`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(subscription),
          })

          if (!saveResponse.ok) {
            throw new Error('Failed to save subscription')
          }

          set({ subscription, isSubscribed: true })
          return true
        } catch (error) {
          console.error('Failed to subscribe to push notifications:', error)
          return false
        }
      },

      unsubscribe: async () => {
        const { subscription } = get()

        if (!subscription) {
          set({ isSubscribed: false })
          return true
        }

        try {
          await subscription.unsubscribe()

          // Notify server
          const token = localStorage.getItem('token')
          await fetch(`${API_BASE}/push/unsubscribe`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ endpoint: subscription.endpoint }),
          })

          set({ subscription: null, isSubscribed: false })
          return true
        } catch (error) {
          console.error('Failed to unsubscribe from push notifications:', error)
          return false
        }
      },
    }),
    {
      name: 'doomsday-push',
      partialize: (state) => ({
        isSubscribed: state.isSubscribed,
      }),
    }
  )
)

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray.buffer
}

// Initialize push support check
if (typeof window !== 'undefined') {
  usePushStore.getState().checkSupport()
}

// Request notification permission
export async function requestNotificationPermission(): Promise<boolean> {
  return (await usePushStore.getState().requestPermission()) === 'granted'
}

// Subscribe to push notifications
export async function subscribeToPush(): Promise<boolean> {
  return usePushStore.getState().subscribe()
}

// Unsubscribe from push notifications
export async function unsubscribeFromPush(): Promise<boolean> {
  return usePushStore.getState().unsubscribe()
}

// Check if push is available
export function isPushAvailable(): boolean {
  return usePushStore.getState().isSupported
}

// Check if push is enabled
export function isPushEnabled(): boolean {
  return usePushStore.getState().isSubscribed
}
