/**
 * DisputeModal
 *
 * Modal for filing a dispute against an event resolution.
 * Includes reason textarea, evidence URLs, and stake input.
 */

import { useState, useCallback } from 'react'
import { X, AlertTriangle, Plus, Trash2, Link, Coins } from 'lucide-react'
import type { PredictionEvent } from '@/types'

interface DisputeModalProps {
  event: PredictionEvent
  minimumStake: number
  userBalance: number
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { reason: string; evidence: string[]; stakeAmount: number }) => Promise<void>
}

const MIN_REASON_LENGTH = 20
const MAX_REASON_LENGTH = 1000
const MAX_EVIDENCE_URLS = 5

export function DisputeModal({
  event,
  minimumStake,
  userBalance,
  isOpen,
  onClose,
  onSubmit,
}: DisputeModalProps) {
  const [reason, setReason] = useState('')
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([''])
  const [stakeAmount, setStakeAmount] = useState(minimumStake)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isReasonValid = reason.length >= MIN_REASON_LENGTH && reason.length <= MAX_REASON_LENGTH
  const isStakeValid = stakeAmount >= minimumStake && stakeAmount <= userBalance
  const validEvidenceUrls = evidenceUrls.filter((url) => {
    if (!url) return false
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  })
  const isFormValid = isReasonValid && isStakeValid

  const addEvidenceUrl = useCallback(() => {
    if (evidenceUrls.length < MAX_EVIDENCE_URLS) {
      setEvidenceUrls([...evidenceUrls, ''])
    }
  }, [evidenceUrls])

  const removeEvidenceUrl = useCallback((index: number) => {
    setEvidenceUrls(evidenceUrls.filter((_, i) => i !== index))
  }, [evidenceUrls])

  const updateEvidenceUrl = useCallback((index: number, value: string) => {
    const newUrls = [...evidenceUrls]
    newUrls[index] = value
    setEvidenceUrls(newUrls)
  }, [evidenceUrls])

  const handleSubmit = useCallback(async () => {
    if (!isFormValid || isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      await onSubmit({
        reason,
        evidence: validEvidenceUrls,
        stakeAmount,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit dispute')
    } finally {
      setIsSubmitting(false)
    }
  }, [isFormValid, isSubmitting, reason, validEvidenceUrls, stakeAmount, onSubmit, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-lg bg-[#111] rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#333]">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-[#ff3040]" />
            <h2 className="text-[16px] font-semibold text-white">File Dispute</h2>
          </div>
          <button onClick={onClose} className="text-[#777] hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Event info */}
          <div className="p-3 bg-[#1a1a1a] rounded-lg">
            <span className="text-[11px] text-[#555] block mb-1">Disputing resolution of</span>
            <p className="text-[14px] text-white font-medium">{event.title}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[11px] text-[#777]">Current outcome:</span>
              <span className={`text-[12px] font-semibold ${
                event.proposedOutcome === 'doom' ? 'text-[#ff3040]' : 'text-[#00ba7c]'
              }`}>
                {event.proposedOutcome?.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="text-[13px] text-[#777] mb-2 block">
              Reason for dispute *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value.slice(0, MAX_REASON_LENGTH))}
              placeholder="Explain why you believe this resolution is incorrect..."
              rows={4}
              className="w-full bg-[#1a1a1a] text-[14px] text-white placeholder-[#555] p-3 rounded-lg outline-none focus:ring-2 focus:ring-[#ff3040] resize-none"
            />
            <div className="flex justify-between mt-1">
              <span className={`text-[11px] ${reason.length < MIN_REASON_LENGTH ? 'text-[#ff3040]' : 'text-[#555]'}`}>
                Min {MIN_REASON_LENGTH} characters
              </span>
              <span className={`text-[11px] ${reason.length > MAX_REASON_LENGTH - 100 ? 'text-[#ff3040]' : 'text-[#555]'}`}>
                {reason.length}/{MAX_REASON_LENGTH}
              </span>
            </div>
          </div>

          {/* Evidence URLs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[13px] text-[#777]">
                Evidence URLs (optional)
              </label>
              {evidenceUrls.length < MAX_EVIDENCE_URLS && (
                <button
                  onClick={addEvidenceUrl}
                  className="flex items-center gap-1 text-[12px] text-[#ff3040]"
                >
                  <Plus size={12} />
                  Add URL
                </button>
              )}
            </div>
            <div className="space-y-2">
              {evidenceUrls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <div className="relative flex-1">
                    <Link size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => updateEvidenceUrl(index, e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-[#1a1a1a] text-[13px] text-white placeholder-[#555] p-3 pl-9 rounded-lg outline-none focus:ring-1 focus:ring-[#ff3040]"
                    />
                  </div>
                  {evidenceUrls.length > 1 && (
                    <button
                      onClick={() => removeEvidenceUrl(index)}
                      className="p-3 bg-[#1a1a1a] text-[#777] hover:text-[#ff3040] rounded-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-[#555] mt-1">
              Links to articles, screenshots, or data that support your dispute
            </p>
          </div>

          {/* Stake amount */}
          <div>
            <label className="text-[13px] text-[#777] mb-2 block">
              Dispute Stake *
            </label>
            <div className="relative">
              <Coins size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
              <input
                type="number"
                value={stakeAmount || ''}
                onChange={(e) => setStakeAmount(parseInt(e.target.value) || 0)}
                min={minimumStake}
                max={userBalance}
                className="w-full bg-[#1a1a1a] text-[16px] text-white p-3 pl-10 pr-16 rounded-lg outline-none focus:ring-2 focus:ring-[#ff3040]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-[#777]">
                DOOM
              </span>
            </div>
            <div className="flex justify-between mt-1 text-[11px]">
              <span className={stakeAmount < minimumStake ? 'text-[#ff3040]' : 'text-[#555]'}>
                Minimum: {minimumStake} DOOM
              </span>
              <span className={stakeAmount > userBalance ? 'text-[#ff3040]' : 'text-[#555]'}>
                Balance: {userBalance.toLocaleString()} DOOM
              </span>
            </div>
          </div>

          {/* Warning */}
          <div className="p-3 bg-[#1f0a0a] rounded-lg border border-[#ff3040]/30">
            <p className="text-[11px] text-[#ff3040]">
              <strong>Warning:</strong> Your stake will be forfeited if the dispute is rejected.
              If upheld, you'll receive your stake back plus a portion of the platform fees.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-[#1f0a0a] rounded-lg border border-[#ff3040]/30">
              <p className="text-[12px] text-[#ff3040]">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#333]">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-[#1a1a1a] text-white text-[14px] font-semibold rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isFormValid || isSubmitting}
              className={`flex-1 py-3 text-[14px] font-semibold rounded-lg ${
                isFormValid && !isSubmitting
                  ? 'bg-[#ff3040] text-white'
                  : 'bg-[#333] text-[#555] cursor-not-allowed'
              }`}
            >
              {isSubmitting ? 'Submitting...' : `Submit Dispute (${stakeAmount} DOOM)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
