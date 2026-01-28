/**
 * ReportModal Component
 *
 * Modal for reporting content that violates community guidelines.
 * Allows users to:
 * - Select violation type
 * - Add optional details
 * - Submit report
 */

import { X, AlertTriangle, Check } from 'lucide-react'
import { useState } from 'react'
import {
  ViolationType,
  getViolationLabel,
  getSeverityDescription,
  getViolationSeverity,
} from '@/lib/guidelines'
import { useReportsStore } from '@/store/reports'

interface ReportModalProps {
  /** ID of the content being reported */
  contentId: string
  /** Type of content being reported */
  contentType?: 'post' | 'comment'
  /** ID of the user submitting the report */
  reporterId: string
  /** Callback when modal is closed */
  onClose: () => void
  /** Callback when report is submitted successfully */
  onSuccess?: () => void
}

export function ReportModal({
  contentId,
  contentType = 'post',
  reporterId,
  onClose,
  onSuccess,
}: ReportModalProps) {
  const [selectedType, setSelectedType] = useState<ViolationType | null>(null)
  const [details, setDetails] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { reportContent, hasUserReported } = useReportsStore()

  const violationTypes = Object.values(ViolationType)

  const handleSubmit = () => {
    if (!selectedType) {
      setError('Please select a violation type')
      return
    }

    // Check if already reported
    if (hasUserReported(contentId, reporterId)) {
      setError('You have already reported this content')
      return
    }

    try {
      reportContent(contentId, reporterId, selectedType, details, contentType)
      setSubmitted(true)
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 1500)
    } catch {
      setError('Failed to submit report. Please try again.')
    }
  }

  if (submitted) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Success Modal */}
        <div className="relative w-full max-w-md mx-4 bg-[#1a1a1a] rounded-2xl p-6 animate-scale-in">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-[#00ba7c20] flex items-center justify-center mb-4">
              <Check size={32} className="text-[#00ba7c]" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Report Submitted</h2>
            <p className="text-[#777] text-sm">
              Thank you for helping keep our community safe. We will review your report shortly.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-[#1a1a1a] rounded-t-3xl sm:rounded-2xl sm:mx-4 max-h-[90vh] overflow-y-auto">
        {/* Handle bar (mobile) */}
        <div className="flex justify-center pt-3 pb-2 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-[#333]" aria-hidden="true" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#333]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#ff444420] flex items-center justify-center">
              <AlertTriangle size={20} className="text-[#ff4444]" />
            </div>
            <h2 id="report-modal-title" className="text-[17px] font-semibold text-white">
              Report Content
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 rounded-full hover:bg-[#333] transition-colors"
            aria-label="Close report dialog"
          >
            <X size={20} className="text-[#777]" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-[#ff444420] border border-[#ff4444] text-[#ff4444] text-sm">
              {error}
            </div>
          )}

          {/* Violation type selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-[#999] mb-3">
              Why are you reporting this {contentType}?
            </label>
            <div className="space-y-2">
              {violationTypes.map((type) => {
                const isSelected = selectedType === type
                const severity = getViolationSeverity(type)
                return (
                  <button
                    key={type}
                    onClick={() => {
                      setSelectedType(type)
                      setError(null)
                    }}
                    className={`w-full p-4 rounded-xl text-left transition-colors ${
                      isSelected
                        ? 'bg-[#ff444420] border-2 border-[#ff4444]'
                        : 'bg-[#0a0a0a] border-2 border-transparent hover:bg-[#222]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-medium ${isSelected ? 'text-white' : 'text-[#ccc]'}`}>
                        {getViolationLabel(type)}
                      </span>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-[#ff4444] flex items-center justify-center">
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <p className="mt-2 text-xs text-[#777]">{getSeverityDescription(severity)}</p>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Additional details */}
          <div className="mb-6">
            <label htmlFor="report-details" className="block text-sm font-medium text-[#999] mb-2">
              Additional details (optional)
            </label>
            <textarea
              id="report-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide any additional context that might help us review this report..."
              className="w-full h-24 px-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-xl text-white text-sm placeholder-[#555] resize-none focus:outline-none focus:border-[#ff4444] transition-colors"
              maxLength={500}
            />
            <p className="mt-1 text-xs text-[#555] text-right">{details.length}/500</p>
          </div>

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={!selectedType}
            className={`w-full py-3 rounded-full font-semibold text-sm transition-colors ${
              selectedType
                ? 'bg-[#ff4444] text-white hover:bg-[#ff5555]'
                : 'bg-[#333] text-[#666] cursor-not-allowed'
            }`}
          >
            Submit Report
          </button>

          {/* Disclaimer */}
          <p className="mt-4 text-xs text-[#555] text-center">
            False reports may result in action against your account. Please only report genuine
            violations.
          </p>
        </div>

        {/* Safe area padding for mobile */}
        <div className="h-6 sm:hidden" />
      </div>
    </div>
  )
}
