/**
 * GuidelinesModal Component
 *
 * Modal for displaying community guidelines.
 * Requires user acknowledgment before they can proceed.
 */

import { X, Shield, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { COMMUNITY_GUIDELINES, getViolationLabel } from '@/lib/guidelines'

interface GuidelinesModalProps {
  /** Callback when modal is closed */
  onClose: () => void
  /** Callback when guidelines are accepted */
  onAccept: () => void
  /** Whether to require acknowledgment checkbox */
  requireAcknowledgment?: boolean
  /** Title override */
  title?: string
}

export function GuidelinesModal({
  onClose,
  onAccept,
  requireAcknowledgment = true,
  title = 'Community Guidelines',
}: GuidelinesModalProps) {
  const [acknowledged, setAcknowledged] = useState(false)
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set())

  const toggleRule = (ruleId: string) => {
    setExpandedRules((prev) => {
      const next = new Set(prev)
      if (next.has(ruleId)) {
        next.delete(ruleId)
      } else {
        next.add(ruleId)
      }
      return next
    })
  }

  const expandAll = () => {
    setExpandedRules(new Set(COMMUNITY_GUIDELINES.map((r) => r.id)))
  }

  const collapseAll = () => {
    setExpandedRules(new Set())
  }

  const handleAccept = () => {
    if (requireAcknowledgment && !acknowledged) return
    onAccept()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guidelines-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-[#1a1a1a] rounded-t-3xl sm:rounded-2xl sm:mx-4 max-h-[90vh] flex flex-col">
        {/* Handle bar (mobile) */}
        <div className="flex justify-center pt-3 pb-2 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-[#333]" aria-hidden="true" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#333]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#00ba7c20] flex items-center justify-center">
              <Shield size={20} className="text-[#00ba7c]" />
            </div>
            <h2 id="guidelines-modal-title" className="text-[17px] font-semibold text-white">
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 rounded-full hover:bg-[#333] transition-colors"
            aria-label="Close guidelines dialog"
          >
            <X size={20} className="text-[#777]" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Introduction */}
          <div className="mb-4 p-4 rounded-xl bg-[#0a0a0a] border border-[#333]">
            <p className="text-sm text-[#999]">
              Our community guidelines help maintain a safe and respectful environment for all
              users. Please read and acknowledge these rules before continuing.
            </p>
          </div>

          {/* Expand/Collapse controls */}
          <div className="flex justify-end gap-2 mb-3">
            <button
              onClick={expandAll}
              className="text-xs text-[#00ba7c] hover:text-[#00da8c] transition-colors"
            >
              Expand all
            </button>
            <span className="text-[#333]">|</span>
            <button
              onClick={collapseAll}
              className="text-xs text-[#00ba7c] hover:text-[#00da8c] transition-colors"
            >
              Collapse all
            </button>
          </div>

          {/* Rules list */}
          <div className="space-y-2">
            {COMMUNITY_GUIDELINES.map((rule) => {
              const isExpanded = expandedRules.has(rule.id)
              return (
                <div
                  key={rule.id}
                  className="rounded-xl bg-[#0a0a0a] border border-[#333] overflow-hidden"
                >
                  <button
                    onClick={() => toggleRule(rule.id)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-[#111] transition-colors"
                    aria-expanded={isExpanded}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#00ba7c]" />
                      <span className="font-medium text-white">{rule.title}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp size={18} className="text-[#777]" />
                    ) : (
                      <ChevronDown size={18} className="text-[#777]" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4">
                      <p className="text-sm text-[#999] mb-2">{rule.description}</p>
                      <span className="inline-block px-2 py-1 rounded-md bg-[#222] text-xs text-[#777]">
                        Category: {getViolationLabel(rule.violationType)}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#333]">
          {/* Acknowledgment checkbox */}
          {requireAcknowledgment && (
            <label className="flex items-start gap-3 mb-4 cursor-pointer group">
              <div
                className={`w-5 h-5 mt-0.5 rounded-md border-2 flex items-center justify-center transition-colors ${
                  acknowledged
                    ? 'bg-[#00ba7c] border-[#00ba7c]'
                    : 'border-[#555] group-hover:border-[#777]'
                }`}
              >
                {acknowledged && <Check size={12} className="text-white" />}
              </div>
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="sr-only"
              />
              <span className="text-sm text-[#999]">
                I have read and agree to follow the community guidelines. I understand that
                violations may result in action against my account.
              </span>
            </label>
          )}

          {/* Accept button */}
          <button
            onClick={handleAccept}
            disabled={requireAcknowledgment && !acknowledged}
            className={`w-full py-3 rounded-full font-semibold text-sm transition-colors ${
              !requireAcknowledgment || acknowledged
                ? 'bg-[#00ba7c] text-white hover:bg-[#00da8c]'
                : 'bg-[#333] text-[#666] cursor-not-allowed'
            }`}
          >
            {requireAcknowledgment ? 'Accept & Continue' : 'Close'}
          </button>
        </div>

        {/* Safe area padding for mobile */}
        <div className="h-6 sm:hidden" />
      </div>
    </div>
  )
}
