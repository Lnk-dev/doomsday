/**
 * DisputeButton
 *
 * Button to open dispute modal, only visible during dispute window.
 * Shows stake requirement and remaining time.
 */

import { AlertTriangle, Clock } from 'lucide-react'
import type { PredictionEvent } from '@/types'

interface DisputeButtonProps {
  event: PredictionEvent
  minimumStake: number
  onDispute: () => void
  userBalance: number
}

function formatTimeRemaining(timestamp: number): string {
  const now = Date.now()
  const diff = timestamp - now

  if (diff <= 0) return 'Ended'

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 24) {
    const days = Math.floor(hours / 24)
    return `${days}d ${hours % 24}h remaining`
  }

  return `${hours}h ${minutes}m remaining`
}

export function DisputeButton({
  event,
  minimumStake,
  onDispute,
  userBalance,
}: DisputeButtonProps) {
  const now = Date.now()

  // Check if within dispute window
  const canDispute = event.proposedAt &&
    event.deadlines?.disputeWindowEnd &&
    now < event.deadlines.disputeWindowEnd

  const hasEnoughBalance = userBalance >= minimumStake

  if (!canDispute || !event.proposedOutcome) {
    return null
  }

  return (
    <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#ff3040]/30">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle size={16} className="text-[#ff3040]" />
        <span className="text-[14px] font-semibold text-white">Dispute Resolution</span>
      </div>

      <p className="text-[12px] text-[#999] mb-3">
        The event was resolved as <span className={event.proposedOutcome === 'doom' ? 'text-[#ff3040]' : 'text-[#00ba7c]'}>
          {event.proposedOutcome.toUpperCase()}
        </span>. If you believe this is incorrect, you can file a dispute.
      </p>

      <div className="flex items-center gap-4 mb-4 text-[11px]">
        <div className="flex items-center gap-1 text-[#777]">
          <Clock size={12} />
          <span>{formatTimeRemaining(event.deadlines!.disputeWindowEnd)}</span>
        </div>
        <div className="text-[#777]">
          Min stake: <span className="text-white">{minimumStake} DOOM</span>
        </div>
      </div>

      <button
        onClick={onDispute}
        disabled={!hasEnoughBalance}
        className={`w-full py-3 rounded-lg text-[14px] font-semibold transition-all ${
          hasEnoughBalance
            ? 'bg-[#ff3040] text-white hover:bg-[#ff4050]'
            : 'bg-[#333] text-[#555] cursor-not-allowed'
        }`}
      >
        {hasEnoughBalance ? 'File Dispute' : `Insufficient Balance (need ${minimumStake} DOOM)`}
      </button>
    </div>
  )
}
