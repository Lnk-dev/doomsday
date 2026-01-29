/**
 * Toast Container Component
 *
 * Displays toast notifications in the corner of the screen.
 */

import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { useToastStore, type Toast, type ToastType } from '@/lib/notifications'

const icons: Record<ToastType, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const colors: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: {
    bg: 'bg-green-900/20',
    border: 'border-green-500/30',
    icon: 'text-green-400',
  },
  error: {
    bg: 'bg-red-900/20',
    border: 'border-red-500/30',
    icon: 'text-red-400',
  },
  warning: {
    bg: 'bg-yellow-900/20',
    border: 'border-yellow-500/30',
    icon: 'text-yellow-400',
  },
  info: {
    bg: 'bg-blue-900/20',
    border: 'border-blue-500/30',
    icon: 'text-blue-400',
  },
}

function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useToastStore()
  const Icon = icons[toast.type]
  const color = colors[toast.type]

  return (
    <div
      className={`relative flex items-start gap-3 p-4 rounded-lg border ${color.bg} ${color.border} backdrop-blur-sm shadow-lg max-w-sm animate-slide-in`}
    >
      <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${color.icon}`} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{toast.title}</p>
        {toast.message && (
          <p className="text-sm text-[#888] mt-1">{toast.message}</p>
        )}
        {toast.action && (
          <button
            onClick={toast.action.onClick}
            className="text-sm text-white underline mt-2 hover:no-underline"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      <button
        onClick={() => removeToast(toast.id)}
        className="flex-shrink-0 text-[#666] hover:text-white transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export function ToastContainer() {
  const { toasts } = useToastStore()

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}
