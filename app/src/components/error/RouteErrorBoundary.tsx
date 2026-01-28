import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] px-8">
          <AlertTriangle size={48} className="text-[#ff3040] mb-4" />
          <h2 className="text-[20px] font-bold text-white mb-2">Something went wrong</h2>
          <p className="text-[15px] text-[#777] text-center mb-6">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-6 py-3 bg-[#ff3040] text-white rounded-full font-semibold hover:bg-[#e62a38] transition-colors"
          >
            <RefreshCw size={18} />
            Try Again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
