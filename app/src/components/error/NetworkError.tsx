/**
 * NetworkError Component - Specialized error display for network failures
 */

import { useState, useEffect, useCallback } from 'react'
import { WifiOff, ServerCrash, Clock, RefreshCw, Home, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'

type Variant = 'offline' | 'timeout' | 'serverError' | 'generic'

interface Props {
  variant?: Variant
  title?: string
  description?: string
  showRetry?: boolean
  onRetry?: () => void
  autoRetry?: boolean
  autoRetryDelay?: number
  maxAutoRetries?: number
  showHome?: boolean
  icon?: ReactNode
  className?: string
  compact?: boolean
}

const config: Record<Variant, { icon: ReactNode; iconBg: string; title: string; description: string }> = {
  offline: { icon: <WifiOff size={32} />, iconBg: 'bg-[var(--color-error-bg,#ff304020)]', title: 'No internet connection', description: 'Please check your connection and try again.' },
  timeout: { icon: <Clock size={32} />, iconBg: 'bg-[var(--color-warning-bg,#ffad1f20)]', title: 'Request timed out', description: 'The server is taking too long to respond.' },
  serverError: { icon: <ServerCrash size={32} />, iconBg: 'bg-[var(--color-error-bg,#ff304020)]', title: 'Server error', description: 'Our servers are having trouble right now.' },
  generic: { icon: <AlertCircle size={32} />, iconBg: 'bg-[var(--color-error-bg,#ff304020)]', title: 'Connection error', description: 'Unable to connect to the server. Please try again.' },
}

export function NetworkError({ variant = 'generic', title, description, showRetry = true, onRetry, autoRetry = false, autoRetryDelay = 5000, maxAutoRetries = 3, showHome = false, icon, className = '', compact = false }: Props) {
  const navigate = useNavigate()
  const c = config[variant]
  const [retryCount, setRetryCount] = useState(0)
  const [countdown, setCountdown] = useState(Math.floor(autoRetryDelay / 1000))
  const [isRetrying, setIsRetrying] = useState(false)
  const displayIcon = icon ?? c.icon
  const displayTitle = title ?? c.title
  const displayDescription = description ?? c.description
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true

  const handleRetry = useCallback(() => {
    setIsRetrying(true)
    if (onRetry) { onRetry() } else { window.location.reload() }
    setTimeout(() => setIsRetrying(false), 1000)
  }, [onRetry])

  useEffect(() => {
    if (!autoRetry || retryCount >= maxAutoRetries || !isOnline) return
    const timer = setInterval(() => {
      setCountdown((p) => { if (p <= 1) { setRetryCount((c) => c + 1); handleRetry(); return Math.floor(autoRetryDelay / 1000) } return p - 1 })
    }, 1000)
    return () => clearInterval(timer)
  }, [autoRetry, retryCount, maxAutoRetries, autoRetryDelay, isOnline, handleRetry])

  useEffect(() => { setCountdown(Math.floor(autoRetryDelay / 1000)) }, [autoRetryDelay])

  if (compact) {
    return (
      <div className={`flex items-center gap-3 p-4 bg-[var(--color-error-bg,#ff304010)] border border-[var(--color-error,#ff304050)] rounded-xl ${className}`} role="alert">
        <span className="text-[var(--color-error,#ff3040)] flex-shrink-0">{icon ?? <WifiOff size={20} />}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] text-[var(--color-text-primary,#f5f5f5)]">{displayDescription}</p>
          {autoRetry && retryCount < maxAutoRetries && <p className="text-[12px] text-[var(--color-text-muted,#555)] mt-1">Retrying in {countdown}s...</p>}
        </div>
        {showRetry && <button onClick={handleRetry} disabled={isRetrying} className="px-3 py-1.5 rounded-lg bg-[var(--color-bg-tertiary,#1a1a1a)] text-[var(--color-text-primary,#f5f5f5)] text-[13px] font-medium hover:bg-[var(--color-bg-secondary,#222)] disabled:opacity-50 flex items-center gap-1.5"><RefreshCw size={14} className={isRetrying ? 'animate-spin' : ''} />Retry</button>}
      </div>
    )
  }

  return (
    <div className={`flex flex-col items-center justify-center py-16 px-8 ${className}`} role="alert" aria-live="polite">
      <div className="relative mb-4">
        <div className={`w-16 h-16 rounded-full ${c.iconBg} flex items-center justify-center`}><span className="text-[var(--color-error,#ff3040)]">{displayIcon}</span></div>
        {!isOnline && <div className="absolute inset-0 rounded-full border-2 border-[var(--color-error,#ff3040)] animate-ping opacity-30" />}
      </div>
      <h2 className="text-[20px] font-bold text-[var(--color-text-primary,#f5f5f5)] mb-2 text-center">{displayTitle}</h2>
      <p className="text-[14px] text-[var(--color-text-secondary,#777)] text-center max-w-sm mb-2">{displayDescription}</p>
      {autoRetry && retryCount < maxAutoRetries && <p className="text-[13px] text-[var(--color-text-muted,#555)] mb-4">Retrying in {countdown}s... (attempt {retryCount + 1}/{maxAutoRetries})</p>}
      {autoRetry && retryCount >= maxAutoRetries && <p className="text-[13px] text-[var(--color-warning,#ffad1f)] mb-4">Auto-retry limit reached.</p>}
      <div className="flex items-center gap-2 mb-6"><span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-[var(--color-life,#00ba7c)]' : 'bg-[var(--color-error,#ff3040)]'}`} /><span className="text-[12px] text-[var(--color-text-muted,#555)]">{isOnline ? 'Online' : 'Offline'}</span></div>
      <div className="flex gap-3 flex-wrap justify-center">
        {showRetry && <button onClick={handleRetry} disabled={isRetrying} className="px-5 py-2.5 rounded-xl bg-[var(--color-doom,#ff3040)] text-white text-[14px] font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2"><RefreshCw size={16} className={isRetrying ? 'animate-spin' : ''} />{isRetrying ? 'Retrying...' : 'Retry now'}</button>}
        {showHome && <button onClick={() => navigate('/')} className="px-4 py-2 rounded-xl bg-[var(--color-bg-tertiary,#1a1a1a)] text-[var(--color-text-primary,#f5f5f5)] text-[14px] font-medium border border-[var(--color-border,#333)] hover:bg-[var(--color-bg-secondary,#111)] flex items-center gap-2"><Home size={16} />Go home</button>}
      </div>
    </div>
  )
}

