/**
 * Toast Component
 *
 * Individual toast notification with icon, message, and dismiss button.
 * Supports success, error, warning, and info types with appropriate styling.
 */

import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import type { Toast as ToastData, ToastType } from '@/store/toast'

interface ToastProps {
  toast: ToastData
  onDismiss: (id: string) => void
}

/** Get icon component for toast type */
function getIcon(type: ToastType) {
  switch (type) {
    case 'success':
      return <CheckCircle className="w-5 h-5 text-[#00ba7c]" />
    case 'error':
      return <AlertCircle className="w-5 h-5 text-[#ff3040]" />
    case 'warning':
      return <AlertTriangle className="w-5 h-5 text-[#ffad1f]" />
    case 'info':
      return <Info className="w-5 h-5 text-[#1d9bf0]" />
  }
}

/** Get border color class for toast type */
function getBorderColor(type: ToastType): string {
  switch (type) {
    case 'success':
      return 'border-l-[#00ba7c]'
    case 'error':
      return 'border-l-[#ff3040]'
    case 'warning':
      return 'border-l-[#ffad1f]'
    case 'info':
      return 'border-l-[#1d9bf0]'
  }
}

export function Toast({ toast, onDismiss }: ToastProps) {
  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3
        bg-[#1a1a1a] border border-[#333333] border-l-4 ${getBorderColor(toast.type)}
        rounded-lg shadow-lg
        animate-toast-in
      `}
      role="alert"
      aria-live="polite"
    >
      {/* Icon */}
      <div className="flex-shrink-0">
        {getIcon(toast.type)}
      </div>

      {/* Message */}
      <p className="flex-1 text-sm text-[#f5f5f5]">
        {toast.message}
      </p>

      {/* Dismiss button */}
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 p-1 rounded hover:bg-[#333333] transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4 text-[#777777]" />
      </button>
    </div>
  )
}
