/**
 * ErrorBoundary Component
 *
 * Catches JavaScript errors in child component tree and displays fallback UI.
 * Prevents entire app from crashing on runtime errors.
 */

import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    // TODO: Send to error reporting service (e.g., Sentry)
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(error, { extra: errorInfo })
    // }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-full bg-[#ff304020] flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} className="text-[#ff3040]" />
            </div>
            <h1 className="text-[20px] font-bold text-white mb-2">
              Something went wrong
            </h1>
            <p className="text-[14px] text-[#777] mb-6">
              The app encountered an unexpected error. This has been logged for investigation.
            </p>
            {this.state.error && (
              <details className="mb-6 text-left">
                <summary className="text-[13px] text-[#555] cursor-pointer hover:text-[#777]">
                  Error details
                </summary>
                <pre className="mt-2 p-3 bg-[#111] rounded-lg text-[12px] text-[#ff3040] overflow-auto max-h-32">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 rounded-lg bg-[#1a1a1a] text-white text-[14px] font-medium hover:bg-[#222] transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="px-4 py-2 rounded-lg bg-[#ff3040] text-white text-[14px] font-medium hover:bg-[#ff3040cc] transition-colors flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Reload App
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
