/**
 * ErrorState Component
 *
 * Reusable error state display with multiple variants for different error scenarios.
 * Provides consistent error messaging with appropriate icons, titles, descriptions,
 * and recovery actions across the application.
 *
 * Variants:
 * - network: Connection issues
 * - notFound: 404 / resource not found
 * - serverError: 500 / server errors
 * - empty: No data to display
 * - unauthorized: Authentication required
 */

import {
  WifiOff,
  SearchX,
  ServerCrash,
  Inbox,
  Lock,
  RefreshCw,
  Home,
  LogIn,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'

export type ErrorVariant = 'network' | 'notFound' | 'serverError' | 'empty' | 'unauthorized'

interface ErrorStateProps {
  /** Type of error to display */
  variant: ErrorVariant
  /** Optional custom title (overrides default) */
  title?: string
  /** Optional custom description (overrides default) */
  description?: string
  /** Optional custom icon (overrides default) */
  icon?: ReactNode
  /** Show retry button */
  showRetry?: boolean
  /** Custom retry button text */
  retryText?: string
  /** Callback when retry button is clicked */
  onRetry?: () => void
  /** Show home button */
  showHomeButton?: boolean
  /** Additional CSS classes */
  className?: string
  /** Custom action buttons */
  children?: ReactNode
}

/** Default configuration for each error variant */
const errorConfig: Record<
  ErrorVariant,
  {
    icon: ReactNode
    iconBgClass: string
    iconColorClass: string
    title: string
    description: string
    showRetry: boolean
    retryText: string
  }
> = {
  network: {
    icon: <WifiOff size={32} />,
    iconBgClass: 'bg-[var(--color-error-bg,#ff304020)]',
    iconColorClass: 'text-[var(--color-error,#ff3040)]',
    title: 'Connection lost',
    description: 'Unable to connect to the server. Please check your internet connection and try again.',
    showRetry: true,
    retryText: 'Retry',
  },
  notFound: {
    icon: <SearchX size={32} />,
    iconBgClass: 'bg-[var(--color-warning-bg,#ffad1f20)]',
    iconColorClass: 'text-[var(--color-warning,#ffad1f)]',
    title: 'Not found',
    description: "The page or resource you're looking for doesn't exist or has been moved.",
    showRetry: false,
    retryText: 'Go back',
  },
  serverError: {
    icon: <ServerCrash size={32} />,
    iconBgClass: 'bg-[var(--color-error-bg,#ff304020)]',
    iconColorClass: 'text-[var(--color-error,#ff3040)]',
    title: 'Something went wrong',
    description: 'Our servers are having trouble right now. Please try again in a moment.',
    showRetry: true,
    retryText: 'Try again',
  },
  empty: {
    icon: <Inbox size={32} />,
    iconBgClass: 'bg-[var(--color-bg-tertiary,#1a1a1a)]',
    iconColorClass: 'text-[var(--color-text-muted,#555)]',
    title: 'Nothing here yet',
    description: 'There is no content to display at the moment.',
    showRetry: false,
    retryText: 'Refresh',
  },
  unauthorized: {
    icon: <Lock size={32} />,
    iconBgClass: 'bg-[var(--color-warning-bg,#ffad1f20)]',
    iconColorClass: 'text-[var(--color-warning,#ffad1f)]',
    title: 'Authentication required',
    description: 'You need to sign in to access this content.',
    showRetry: false,
    retryText: 'Sign in',
  },
}

export function ErrorState({
  variant,
  title,
  description,
  icon,
  showRetry,
  retryText,
  onRetry,
  showHomeButton = false,
  className = '',
  children,
}: ErrorStateProps) {
  const navigate = useNavigate()
  const config = errorConfig[variant]

  const displayIcon = icon ?? config.icon
  const displayTitle = title ?? config.title
  const displayDescription = description ?? config.description
  const displayShowRetry = showRetry ?? config.showRetry
  const displayRetryText = retryText ?? config.retryText

  const handleRetry = () => {
    if (onRetry) {
      onRetry()
    } else if (variant === 'notFound') {
      navigate(-1)
    } else {
      window.location.reload()
    }
  }

  const handleGoHome = () => {
    navigate('/')
  }

  const handleSignIn = () => {
    navigate('/profile')
  }

  return (
    <div
      className={`flex flex-col items-center justify-center py-16 px-8 ${className}`}
      role="alert"
      aria-live="polite"
    >
      {/* Icon */}
      <div
        className={`w-16 h-16 rounded-full ${config.iconBgClass} flex items-center justify-center mb-4`}
      >
        <span className={config.iconColorClass}>{displayIcon}</span>
      </div>

      {/* Title */}
      <h2 className="text-[20px] font-bold text-[var(--color-text-primary,#f5f5f5)] mb-2 text-center">
        {displayTitle}
      </h2>

      {/* Description */}
      <p className="text-[14px] text-[var(--color-text-secondary,#777)] text-center max-w-sm mb-6">
        {displayDescription}
      </p>

      {/* Action buttons */}
      <div className="flex gap-3">
        {displayShowRetry && (
          <button
            onClick={handleRetry}
            className="px-5 py-2.5 rounded-xl bg-[var(--color-doom,#ff3040)] text-white text-[14px] font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <RefreshCw size={16} />
            {displayRetryText}
          </button>
        )}

        {variant === 'unauthorized' && (
          <button
            onClick={handleSignIn}
            className="px-5 py-2.5 rounded-xl bg-[var(--color-doom,#ff3040)] text-white text-[14px] font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <LogIn size={16} />
            Connect wallet
          </button>
        )}

        {showHomeButton && (
          <button
            onClick={handleGoHome}
            className="px-5 py-2.5 rounded-xl bg-[var(--color-bg-tertiary,#1a1a1a)] text-[var(--color-text-primary,#f5f5f5)] text-[14px] font-semibold border border-[var(--color-border,#333)] hover:bg-[var(--color-bg-secondary,#111)] transition-colors flex items-center gap-2"
          >
            <Home size={16} />
            Go home
          </button>
        )}
      </div>

      {/* Custom action buttons */}
      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}

/**
 * Convenience wrapper for empty state with custom messaging
 */
export function EmptyState({
  title,
  description,
  icon,
  children,
  className,
}: Omit<ErrorStateProps, 'variant'>) {
  return (
    <ErrorState
      variant="empty"
      title={title}
      description={description}
      icon={icon}
      className={className}
    >
      {children}
    </ErrorState>
  )
}

/**
 * Convenience wrapper for network error state
 */
export function NetworkErrorState({
  onRetry,
  className,
}: {
  onRetry?: () => void
  className?: string
}) {
  return (
    <ErrorState
      variant="network"
      onRetry={onRetry}
      showHomeButton
      className={className}
    />
  )
}

/**
 * Convenience wrapper for server error state
 */
export function ServerErrorState({
  onRetry,
  className,
}: {
  onRetry?: () => void
  className?: string
}) {
  return (
    <ErrorState
      variant="serverError"
      onRetry={onRetry}
      showHomeButton
      className={className}
    />
  )
}
