/**
 * Warn User Dialog
 *
 * Dialog for issuing a warning to a user
 */

import { useState } from 'react'
import { X, AlertTriangle, Loader2 } from 'lucide-react'
import { adminApi } from '../../lib/adminApi'
import type { UserView } from '../../types/admin'

interface WarnUserDialogProps {
  user: UserView
  onClose: () => void
  onSuccess: () => void
}

type Severity = 'low' | 'medium' | 'high'

const SEVERITY_OPTIONS: { value: Severity; label: string; description: string }[] = [
  { value: 'low', label: 'Low', description: 'Minor guideline violation' },
  { value: 'medium', label: 'Medium', description: 'Repeated or notable violation' },
  { value: 'high', label: 'High', description: 'Serious violation, may lead to ban' },
]

export function WarnUserDialog({ user, onClose, onSuccess }: WarnUserDialogProps) {
  const [message, setMessage] = useState('')
  const [severity, setSeverity] = useState<Severity>('low')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!message.trim()) {
      setError('Please provide a warning message')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      await adminApi.warnUser(user.id, message.trim(), severity)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to warn user')
      setIsSubmitting(false)
    }
  }

  const severityColors = {
    low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    high: 'bg-red-500/20 text-red-400 border-red-500/30',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-md bg-[#111] border border-[#222] rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#222]">
          <div className="flex items-center gap-2 text-yellow-500">
            <AlertTriangle size={20} />
            <h2 className="text-[17px] font-semibold">Warn User</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg hover:bg-[#222] text-[#777] hover:text-white transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <p className="text-[14px] text-[#ccc]">
            Issue a warning to <span className="font-semibold text-white">{user.username}</span>
          </p>

          {/* Current warning count */}
          {user.warningCount > 0 && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-[12px] text-yellow-400">
                This user already has {user.warningCount} warning{user.warningCount !== 1 ? 's' : ''}.
              </p>
            </div>
          )}

          {/* Severity selector */}
          <div>
            <label className="block text-[13px] font-medium text-[#999] mb-2">
              Severity
            </label>
            <div className="space-y-2">
              {SEVERITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSeverity(option.value)}
                  disabled={isSubmitting}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    severity === option.value
                      ? severityColors[option.value]
                      : 'bg-[#1a1a1a] text-[#777] border-[#333] hover:text-white hover:border-[#444]'
                  }`}
                >
                  <div className="text-left">
                    <p className="text-[13px] font-medium">{option.label}</p>
                    <p className="text-[11px] opacity-70">{option.description}</p>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    severity === option.value
                      ? 'border-current bg-current'
                      : 'border-[#555]'
                  }`}>
                    {severity === option.value && (
                      <div className="w-full h-full rounded-full bg-[#111] scale-50" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Message input */}
          <div>
            <label className="block text-[13px] font-medium text-[#999] mb-2">
              Warning Message <span className="text-red-400">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Explain the reason for this warning..."
              disabled={isSubmitting}
              rows={3}
              className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-white text-[14px] placeholder:text-[#555] focus:outline-none focus:border-yellow-500 transition-colors resize-none disabled:opacity-50"
            />
            <p className="text-[11px] text-[#555] mt-1">
              This message will be visible to the user.
            </p>
          </div>

          {/* Error message */}
          {error && (
            <p className="text-[13px] text-red-400">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-[#222]">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-[13px] font-medium text-[#777] hover:text-white transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !message.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg text-[13px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <AlertTriangle size={14} />
                Send Warning
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
