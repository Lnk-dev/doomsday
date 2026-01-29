/**
 * PWA Update Prompt Component
 * Issue #48: PWA with offline support
 *
 * Shows prompt when new version is available or app is offline-ready
 */

import { useEffect, useState } from 'react'
import { RefreshCw, Check, X } from 'lucide-react'
import { usePWA } from '@/hooks/usePWA'

export function PWAUpdatePrompt() {
  const { needRefresh, offlineReady, updateServiceWorker, close } = usePWA()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (needRefresh || offlineReady) {
      setVisible(true)
    }
  }, [needRefresh, offlineReady])

  // Auto-hide offline ready notification after 5 seconds
  useEffect(() => {
    if (offlineReady && visible) {
      const timer = setTimeout(() => {
        setVisible(false)
        close()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [offlineReady, visible, close])

  if (!visible) return null

  const handleClose = () => {
    setVisible(false)
    close()
  }

  const handleUpdate = async () => {
    await updateServiceWorker()
  }

  return (
    <div className="fixed top-4 left-4 right-4 max-w-md mx-auto bg-[#1a1a1a] border border-[#333] rounded-xl p-4 shadow-xl z-50 animate-slide-down">
      <button
        onClick={handleClose}
        className="absolute top-3 right-3 p-1.5 text-[#555] hover:text-white transition-colors"
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>

      {offlineReady && !needRefresh && (
        <div className="flex items-center gap-3 pr-8">
          <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Check className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <p className="font-medium text-white">Ready for offline</p>
            <p className="text-[12px] text-[#777]">App is cached and works offline</p>
          </div>
        </div>
      )}

      {needRefresh && (
        <div className="flex items-center justify-between pr-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <RefreshCw className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="font-medium text-white">Update available</p>
              <p className="text-[12px] text-[#777]">New version ready to install</p>
            </div>
          </div>
          <button
            onClick={handleUpdate}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-[13px] font-medium transition-colors flex-shrink-0"
          >
            Update
          </button>
        </div>
      )}
    </div>
  )
}
