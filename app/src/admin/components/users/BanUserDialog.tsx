/**
 * Ban User Dialog
 *
 * Confirmation dialog for banning a user
 */

import { useState } from 'react'
import { X, Ban, Loader2 } from 'lucide-react'
import { adminApi } from '../../lib/adminApi'
import type { UserView } from '../../types/admin'

interface BanUserDialogProps {
  user: UserView
  onClose: () => void
  onSuccess: () => void
}

const DURATION_OPTIONS = [
  { value: 1, label: '1 day' },
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
  { value: 0, label: 'Permanent' },
]

export function BanUserDialog({ user, onClose, onSuccess }: BanUserDialogProps) {
  const [reason, setReason] = useState('')
  const [duration, setDuration] = useState<number>(7)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError('Please provide a reason for the ban')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      await adminApi.banUser(user.id, reason.trim(), duration || undefined)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to ban user')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-md bg-[#111] border border-[#222] rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#222]">
          <div className="flex items-center gap-2 text-red-500">
            <Ban size={20} />
            <h2 className="text-[17px] font-semibold">Ban User</h2>
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
            Are you sure you want to ban <span className="font-semibold text-white">{user.username}</span>?
          </p>

          {/* Duration selector */}
          <div>
            <label className="block text-[13px] font-medium text-[#999] mb-2">
              Ban Duration
            </label>
            <div className="flex flex-wrap gap-2">
              {DURATION_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setDuration(option.value)}
                  disabled={isSubmitting}
                  className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                    duration === option.value
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-[#1a1a1a] text-[#777] border border-[#333] hover:text-white'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reason input */}
          <div>
            <label className="block text-[13px] font-medium text-[#999] mb-2">
              Reason <span className="text-red-400">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide a reason for the ban..."
              disabled={isSubmitting}
              rows={3}
              className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-white text-[14px] placeholder:text-[#555] focus:outline-none focus:border-red-500 transition-colors resize-none disabled:opacity-50"
            />
          </div>

          {/* Error message */}
          {error && (
            <p className="text-[13px] text-red-400">{error}</p>
          )}

          {/* Warning */}
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-[12px] text-red-400">
              {duration === 0
                ? 'This will permanently ban the user from the platform.'
                : `This will ban the user for ${DURATION_OPTIONS.find(o => o.value === duration)?.label}.`}
              {' '}They will not be able to log in or use the platform during this time.
            </p>
          </div>
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
            disabled={isSubmitting || !reason.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-[13px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Banning...
              </>
            ) : (
              <>
                <Ban size={14} />
                Ban User
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
