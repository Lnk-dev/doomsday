/**
 * ErrorBoundary Component - Catches React errors and displays fallback UI
 */

import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react'
import { classifyError, getUserFriendlyMessage } from '@/lib/errorHandling'
import type { AppError } from '@/lib/errorHandling'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  fallbackRender?: (props: { error: Error; resetErrorBoundary: () => void }) => ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  onReset?: () => void
  showDetails?: boolean
  compact?: boolean
  boundaryId?: string
}

interface State {
  hasError: boolean
  error: Error | null
  appError: AppError | null
  showErrorDetails: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, appError: null, showErrorDetails: false }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error, appError: classifyError(error) }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`ErrorBoundary${this.props.boundaryId ? ` [${this.props.boundaryId}]` : ''} caught:`, error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  handleReset = () => { this.props.onReset?.(); this.setState({ hasError: false, error: null, appError: null, showErrorDetails: false }) }
  handleReload = () => { window.location.reload() }
  handleGoHome = () => { window.location.href = '/' }
  toggleDetails = () => { this.setState((s) => ({ showErrorDetails: !s.showErrorDetails })) }

  render() {
    const { hasError, error, appError, showErrorDetails } = this.state
    const { fallback, fallbackRender, showDetails = import.meta.env.DEV, compact } = this.props

    if (hasError) {
      if (fallback) return fallback
      if (fallbackRender && error) return fallbackRender({ error, resetErrorBoundary: this.handleReset })

      const userMessage = appError ? getUserFriendlyMessage(appError) : 'Something went wrong'

      if (compact) {
        return (
          <div className="flex items-center gap-3 p-4 bg-[var(--color-error-bg,#ff304010)] border border-[var(--color-error,#ff304050)] rounded-xl" role="alert">
            <AlertTriangle size={20} className="text-[var(--color-error,#ff3040)] flex-shrink-0" />
            <p className="flex-1 text-[14px] text-[var(--color-text-primary,#f5f5f5)]">{userMessage}</p>
            <button onClick={this.handleReset} className="px-3 py-1.5 rounded-lg bg-[var(--color-bg-tertiary,#1a1a1a)] text-[var(--color-text-primary,#f5f5f5)] text-[13px] font-medium hover:bg-[var(--color-bg-secondary,#222)] transition-colors">Retry</button>
          </div>
        )
      }

      return (
        <div className="min-h-screen bg-[var(--color-bg-primary,#000)] flex items-center justify-center p-4" role="alert">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--color-error-bg,#ff304020)] flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} className="text-[var(--color-error,#ff3040)]" />
            </div>
            <h1 className="text-[20px] font-bold text-[var(--color-text-primary,#f5f5f5)] mb-2">Something went wrong</h1>
            <p className="text-[14px] text-[var(--color-text-secondary,#777)] mb-6">{userMessage}</p>
            {showDetails && error && (
              <div className="mb-6 text-left">
                <button onClick={this.toggleDetails} className="flex items-center gap-2 text-[13px] text-[var(--color-text-muted,#555)] hover:text-[var(--color-text-secondary,#777)] w-full">
                  {showErrorDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}{showErrorDetails ? 'Hide' : 'Show'} error details
                </button>
                {showErrorDetails && (
                  <div className="mt-2 p-3 bg-[var(--color-bg-tertiary,#111)] rounded-lg overflow-hidden">
                    <p className="text-[12px] text-[var(--color-error,#ff3040)] font-medium mb-1">{error.name}</p>
                    <pre className="text-[11px] text-[var(--color-text-secondary,#888)] overflow-auto max-h-32 whitespace-pre-wrap">{error.message}</pre>
                    {error.stack && <pre className="text-[10px] text-[var(--color-text-muted,#555)] overflow-auto max-h-24 mt-2 whitespace-pre-wrap">{error.stack}</pre>}
                  </div>
                )}
              </div>
            )}
            <div className="flex gap-3 justify-center flex-wrap">
              <button onClick={this.handleReset} className="px-4 py-2 rounded-xl bg-[var(--color-bg-tertiary,#1a1a1a)] text-[var(--color-text-primary,#f5f5f5)] text-[14px] font-medium hover:bg-[var(--color-bg-secondary,#222)] transition-colors">Try Again</button>
              <button onClick={this.handleGoHome} className="px-4 py-2 rounded-xl bg-[var(--color-bg-tertiary,#1a1a1a)] text-[var(--color-text-primary,#f5f5f5)] text-[14px] font-medium hover:bg-[var(--color-bg-secondary,#222)] transition-colors flex items-center gap-2"><Home size={16} />Go Home</button>
              <button onClick={this.handleReload} className="px-4 py-2 rounded-xl bg-[var(--color-doom,#ff3040)] text-white text-[14px] font-medium hover:opacity-90 transition-opacity flex items-center gap-2"><RefreshCw size={16} />Reload App</button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export function FunctionalErrorBoundary(props: Props) { return <ErrorBoundary {...props} /> }

export function RouteErrorBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary boundaryId="route" onError={(e, i) => console.error('Route error:', e, i)}>{children}</ErrorBoundary>
}
