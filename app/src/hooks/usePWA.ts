/**
 * PWA Service Worker Hook
 * Issue #48: PWA with offline support
 *
 * Handles service worker registration and update prompts
 */

import { useState, useEffect, useCallback } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

export interface UsePWAReturn {
  /** App is ready to work offline */
  offlineReady: boolean
  /** New version available, needs refresh */
  needRefresh: boolean
  /** Trigger update and reload */
  updateServiceWorker: () => Promise<void>
  /** Dismiss prompts */
  close: () => void
  /** Whether app is installed as PWA */
  isInstalled: boolean
  /** Whether app can be installed */
  canInstall: boolean
  /** Trigger install prompt */
  promptInstall: () => Promise<boolean>
}

export function usePWA(): UsePWAReturn {
  const [offlineReady, setOfflineReady] = useState(false)
  const [needRefresh, setNeedRefresh] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [canInstall, setCanInstall] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  const {
    offlineReady: [swOfflineReady, setSwOfflineReady],
    needRefresh: [swNeedRefresh, setSwNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // Check for updates periodically (every hour)
      if (r) {
        setInterval(() => {
          r.update()
        }, 60 * 60 * 1000)
      }
    },
    onRegisterError(error) {
      console.error('SW registration error:', error)
    },
  })

  // Sync local state with SW state
  useEffect(() => {
    setOfflineReady(swOfflineReady)
  }, [swOfflineReady])

  useEffect(() => {
    setNeedRefresh(swNeedRefresh)
  }, [swNeedRefresh])

  // Check if running as installed PWA
  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true

    setIsInstalled(isStandalone)
  }, [])

  // Listen for install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setCanInstall(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setCanInstall(false)
      setDeferredPrompt(null)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const close = useCallback(() => {
    setSwOfflineReady(false)
    setSwNeedRefresh(false)
    setOfflineReady(false)
    setNeedRefresh(false)
  }, [setSwOfflineReady, setSwNeedRefresh])

  const update = useCallback(async () => {
    await updateServiceWorker(true)
  }, [updateServiceWorker])

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false

    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setDeferredPrompt(null)
      setCanInstall(false)
      return true
    }

    return false
  }, [deferredPrompt])

  return {
    offlineReady,
    needRefresh,
    updateServiceWorker: update,
    close,
    isInstalled,
    canInstall,
    promptInstall,
  }
}

// Type declaration for beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}
