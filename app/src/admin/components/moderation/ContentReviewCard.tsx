/**
 * Content Review Card
 *
 * Displays a moderation item with content preview and actions
 */

import { useState } from 'react'
import {
  AlertTriangle,
  Flag,
  Check,
  X,
  Ban,
  ArrowUp,
  Loader2,
  MessageSquare,
  FileText,
  Calendar,
  UserCircle,
} from 'lucide-react'
import { formatRelativeTime } from '../../lib/formatDate'
import { useAdminAuthStore } from '../../store/adminAuth'
import type { ModerationItem, ReviewAction } from '../../types/admin'

interface ContentReviewCardProps {
  item: ModerationItem
  onClaim: () => void
  onUnclaim: () => void
  onReview: (action: ReviewAction, notes?: string) => void
  isClaiming?: boolean
}

const CONTENT_TYPE_ICONS: Record<string, React.ElementType> = {
  post: MessageSquare,
  comment: MessageSquare,
  profile: UserCircle,
  event: Calendar,
}

const PRIORITY_STYLES: Record<string, string> = {
  low: 'bg-blue-500/10 text-blue-400',
  medium: 'bg-yellow-500/10 text-yellow-400',
  high: 'bg-orange-500/10 text-orange-400',
  critical: 'bg-red-500/10 text-red-400',
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-gray-500/10 text-gray-400',
  in_progress: 'bg-blue-500/10 text-blue-400',
  approved: 'bg-green-500/10 text-green-400',
  rejected: 'bg-red-500/10 text-red-400',
  escalated: 'bg-purple-500/10 text-purple-400',
}

export function ContentReviewCard({
  item,
  onClaim,
  onUnclaim,
  onReview,
  isClaiming,
}: ContentReviewCardProps) {
  const admin = useAdminAuthStore((state) => state.admin)
  const hasPermission = useAdminAuthStore((state) => state.hasPermission)

  const [isReviewing, setIsReviewing] = useState(false)
  const [reviewNotes, setReviewNotes] = useState('')
  const [showActions, setShowActions] = useState(false)

  const isClaimedByMe = item.claimedBy === admin?.id
  const isClaimed = !!item.claimedBy
  const canReview = hasPermission('moderation.review') && isClaimedByMe

  const ContentIcon = CONTENT_TYPE_ICONS[item.contentType] || FileText

  const handleAction = async (action: ReviewAction) => {
    setIsReviewing(true)
    try {
      await onReview(action, reviewNotes || undefined)
      setReviewNotes('')
      setShowActions(false)
    } finally {
      setIsReviewing(false)
    }
  }

  return (
    <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#222]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#1a1a1a] flex items-center justify-center">
            <ContentIcon className="w-5 h-5 text-[#777]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-medium text-white capitalize">
                {item.contentType}
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${PRIORITY_STYLES[item.priority]}`}>
                {item.priority}
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${STATUS_STYLES[item.status]}`}>
                {item.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-[11px] text-[#555]">
              Reported {formatRelativeTime(item.createdAt)}
            </p>
          </div>
        </div>

        {/* Claim/Unclaim button */}
        {item.status === 'pending' || item.status === 'in_progress' ? (
          <div>
            {!isClaimed ? (
              <button
                onClick={onClaim}
                disabled={isClaiming}
                className="px-3 py-1.5 bg-[#ff3040]/10 text-[#ff3040] hover:bg-[#ff3040]/20 rounded-lg text-[12px] font-medium transition-colors disabled:opacity-50"
              >
                {isClaiming ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  'Claim'
                )}
              </button>
            ) : isClaimedByMe ? (
              <button
                onClick={onUnclaim}
                disabled={isClaiming}
                className="px-3 py-1.5 bg-[#333] text-[#999] hover:bg-[#444] rounded-lg text-[12px] font-medium transition-colors disabled:opacity-50"
              >
                Unclaim
              </button>
            ) : (
              <span className="text-[11px] text-[#555]">
                Claimed by {item.claimedBy}
              </span>
            )}
          </div>
        ) : null}
      </div>

      {/* Content preview */}
      <div className="p-4 border-b border-[#222]">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-[#333] flex items-center justify-center text-white text-[12px] font-medium overflow-hidden">
            {item.authorAvatar ? (
              <img src={item.authorAvatar} alt="" className="w-full h-full object-cover" />
            ) : (
              item.authorUsername.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <p className="text-[13px] font-medium text-white">{item.authorUsername}</p>
            <p className="text-[11px] text-[#555]">Content Author</p>
          </div>
        </div>
        <div className="p-3 bg-[#0a0a0a] rounded-lg">
          <p className="text-[13px] text-[#ccc] whitespace-pre-wrap break-words">
            {item.contentPreview}
          </p>
        </div>
      </div>

      {/* Report info */}
      <div className="p-4 border-b border-[#222]">
        <div className="flex items-start gap-3">
          <Flag className="w-4 h-4 text-[#ff3040] mt-0.5" />
          <div>
            <p className="text-[12px] text-[#777] mb-1">
              Reported by <span className="text-white">{item.reporterUsername}</span>
            </p>
            <p className="text-[13px] text-[#ccc]">{item.reportReason}</p>
          </div>
        </div>
      </div>

      {/* Actions (only show if claimed by me) */}
      {canReview && (
        <div className="p-4">
          {!showActions ? (
            <button
              onClick={() => setShowActions(true)}
              className="w-full py-2 bg-[#1a1a1a] hover:bg-[#222] text-[#999] hover:text-white rounded-lg text-[13px] font-medium transition-colors"
            >
              Review Content
            </button>
          ) : (
            <div className="space-y-3">
              {/* Notes input */}
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add notes (optional)..."
                rows={2}
                className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg text-white text-[13px] placeholder:text-[#555] focus:outline-none focus:border-[#ff3040] transition-colors resize-none"
              />

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleAction('approve')}
                  disabled={isReviewing}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-lg text-[12px] font-medium transition-colors disabled:opacity-50"
                >
                  <Check size={14} />
                  Approve
                </button>
                <button
                  onClick={() => handleAction('remove')}
                  disabled={isReviewing}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-[12px] font-medium transition-colors disabled:opacity-50"
                >
                  <X size={14} />
                  Remove
                </button>
                <button
                  onClick={() => handleAction('warn')}
                  disabled={isReviewing}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 rounded-lg text-[12px] font-medium transition-colors disabled:opacity-50"
                >
                  <AlertTriangle size={14} />
                  Warn
                </button>
                <button
                  onClick={() => handleAction('ban')}
                  disabled={isReviewing}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-[12px] font-medium transition-colors disabled:opacity-50"
                >
                  <Ban size={14} />
                  Ban
                </button>
                <button
                  onClick={() => handleAction('escalate')}
                  disabled={isReviewing}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 rounded-lg text-[12px] font-medium transition-colors disabled:opacity-50"
                >
                  <ArrowUp size={14} />
                  Escalate
                </button>
              </div>

              {/* Cancel */}
              <button
                onClick={() => setShowActions(false)}
                className="w-full py-1.5 text-[12px] text-[#555] hover:text-[#999] transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
