/**
 * ErrorFallback Component - Generic error display for fallback UI
 */

import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { classifyError, getUserFriendlyMessage } from '@/lib/errorHandling'
import type { AppError } from '@/lib/errorHandling'

type Variant = 'page' | 'card' | 'inline'

interface Props {
  error?: Error | AppError | null
  title?: string
  description?: string
  variant?: Variant
  showRetry?: boolean
  retryText?: string
  onRetry?: () => void
  showBack?: boolean
  showHome?: boolean
  icon?: ReactNode
  className?: string
  children?: ReactNode
}

export function ErrorFallback({ error, title = 'Something went wrong', description, variant = 'page', showRetry = true, retryText = 'Try again', onRetry, showBack = false, showHome = false, icon, className = '', children }: Props) {
  const navigate = useNavigate()
  let displayDescription = description
  if (!displayDescription && error) {
    const appError = 'type' in error ? (error as AppError) : classifyError(error as Error)
    displayDescription = getUserFriendlyMessage(appError)
  }
  if (!displayDescription) displayDescription = 'An unexpected error occurred. Please try again.'

  const handleRetry = () => onRetry ? onRetry() : window.location.reload()
  const iconElement = icon ?? <AlertTriangle size={variant === 'inline' ? 18 : 32} />

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-3 p-3 bg-[var(--color-error-bg,#ff304010)] border border-[var(--color-error,#ff304050)] rounded-lg ${className}`} role="alert">
        <span className="text-[var(--color-error,#ff3040)] flex-shrink-0">{iconElement}</span>
        <p className="flex-1 text-[13px] text-[var(--color-text-primary,#f5f5f5)]">{displayDescription}</p>
        {showRetry && <button onClick={handleRetry} className="px-3 py-1 rounded-lg bg-[var(--color-bg-tertiary,#1a1a1a)] text-[var(--color-text-primary,#f5f5f5)] text-[12px] font-medium hover:bg-[var(--color-bg-secondary,#222)] flex items-center gap-1.5"><RefreshCw size={12} />{retryText}</button>}
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <div className={`p-6 bg-[var(--color-bg-tertiary,#111)] border border-[var(--color-border,#333)] rounded-xl ${className}`} role="alert">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-[var(--color-error-bg,#ff304020)] flex items-center justify-center mb-3"><span className="text-[var(--color-error,#ff3040)]">{iconElement}</span></div>
          <h3 className="text-[16px] font-semibold text-[var(--color-text-primary,#f5f5f5)] mb-1">{title}</h3>
          <p className="text-[13px] text-[var(--color-text-secondary,#777)] mb-4">{displayDescription}</p>
          <div className="flex gap-2 flex-wrap justify-center">
            {showBack && <button onClick={() => navigate(-1)} className="px-3 py-1.5 rounded-lg bg-[var(--color-bg-primary,#000)] text-[var(--color-text-primary,#f5f5f5)] text-[13px] font-medium hover:bg-[var(--color-bg-secondary,#1a1a1a)] flex items-center gap-1.5"><ArrowLeft size={14} />Go back</button>}
            {showRetry && <button onClick={handleRetry} className="px-3 py-1.5 rounded-lg bg-[var(--color-doom,#ff3040)] text-white text-[13px] font-medium hover:opacity-90 flex items-center gap-1.5"><RefreshCw size={14} />{retryText}</button>}
            {showHome && <button onClick={() => navigate('/')} className="px-3 py-1.5 rounded-lg bg-[var(--color-bg-primary,#000)] text-[var(--color-text-primary,#f5f5f5)] text-[13px] font-medium hover:bg-[var(--color-bg-secondary,#1a1a1a)] flex items-center gap-1.5"><Home size={14} />Home</button>}
          </div>
          {children && <div className="mt-4">{children}</div>}
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col items-center justify-center py-16 px-8 ${className}`} role="alert" aria-live="polite">
      <div className="w-16 h-16 rounded-full bg-[var(--color-error-bg,#ff304020)] flex items-center justify-center mb-4"><span className="text-[var(--color-error,#ff3040)]">{iconElement}</span></div>
      <h2 className="text-[20px] font-bold text-[var(--color-text-primary,#f5f5f5)] mb-2 text-center">{title}</h2>
      <p className="text-[14px] text-[var(--color-text-secondary,#777)] text-center max-w-sm mb-6">{displayDescription}</p>
      <div className="flex gap-3 flex-wrap justify-center">
        {showBack && <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-xl bg-[var(--color-bg-tertiary,#1a1a1a)] text-[var(--color-text-primary,#f5f5f5)] text-[14px] font-medium border border-[var(--color-border,#333)] hover:bg-[var(--color-bg-secondary,#111)] flex items-center gap-2"><ArrowLeft size={16} />Go back</button>}
        {showRetry && <button onClick={handleRetry} className="px-5 py-2.5 rounded-xl bg-[var(--color-doom,#ff3040)] text-white text-[14px] font-semibold hover:opacity-90 flex items-center gap-2"><RefreshCw size={16} />{retryText}</button>}
        {showHome && <button onClick={() => navigate('/')} className="px-4 py-2 rounded-xl bg-[var(--color-bg-tertiary,#1a1a1a)] text-[var(--color-text-primary,#f5f5f5)] text-[14px] font-medium border border-[var(--color-border,#333)] hover:bg-[var(--color-bg-secondary,#111)] flex items-center gap-2"><Home size={16} />Go home</button>}
      </div>
      {children && <div className="mt-6">{children}</div>}
    </div>
  )
}
