/**
 * ToastContainer Component
 *
 * Container for rendering stacked toast notifications.
 * Positioned at top-right of the viewport with proper z-index layering.
 */

import { useToastStore } from '@/store/toast'
import { Toast } from './Toast'

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts)
  const removeToast = useToastStore((state) => state.removeToast)

  if (toasts.length === 0) {
    return null
  }

  return (
    <div
      className="fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-50 flex flex-col gap-2 pointer-events-none"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} onDismiss={removeToast} />
        </div>
      ))}
    </div>
  )
}
