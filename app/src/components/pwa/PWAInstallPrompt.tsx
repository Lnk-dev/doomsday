/**
 * PWA Install Prompt Component
 * Issue #48: PWA with offline support
 *
 * Shows install prompt for adding app to home screen
 */

import { useState, useEffect } from 'react'
import { X, Download, Share } from 'lucide-react'
import { usePWA } from '@/hooks/usePWA'

export function PWAInstallPrompt() {
  const { canInstall, promptInstall, isInstalled } = usePWA()
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(isIOSDevice)

    // Check if dismissed recently (within 7 days)
    const dismissedAt = localStorage.getItem('pwa-prompt-dismissed')
    if (dismissedAt) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24)
      if (daysSinceDismissed < 7) {
        setDismissed(true)
        return
      }
    }

    // Show prompt after user has engaged with the app (30 seconds)
    const timer = setTimeout(() => {
      if ((canInstall || (isIOSDevice && !isInstalled)) && !dismissed) {
        setShowPrompt(true)
      }
    }, 30000)

    return () => clearTimeout(timer)
  }, [canInstall, isInstalled, dismissed])

  const handleInstall = async () => {
    const success = await promptInstall()
    if (success) {
      setShowPrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setDismissed(true)
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString())
  }

  // Don't show if already installed, dismissed, or can't install (and not iOS)
  if (!showPrompt || isInstalled || dismissed) return null
  if (!canInstall && !isIOS) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 max-w-md mx-auto bg-[#1a1a1a] border border-[#333] rounded-xl p-4 shadow-xl z-50 animate-slide-up">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1.5 text-[#555] hover:text-white transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-[#dc2626] rounded-xl flex items-center justify-center flex-shrink-0">
          <Download className="w-6 h-6 text-white" />
        </div>

        <div className="flex-1 min-w-0 pr-6">
          <h3 className="font-semibold text-white mb-1">Install Doomsday</h3>
          <p className="text-[13px] text-[#777] mb-3">
            Add to your home screen for the best experience
          </p>

          {isIOS ? (
            <div className="flex items-center gap-2 text-[12px] text-[#555]">
              <span>Tap</span>
              <Share className="w-4 h-4" />
              <span>then "Add to Home Screen"</span>
            </div>
          ) : (
            <button
              onClick={handleInstall}
              className="bg-[#dc2626] hover:bg-[#b91c1c] text-white px-4 py-2 rounded-lg text-[13px] font-medium transition-colors"
            >
              Install App
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
