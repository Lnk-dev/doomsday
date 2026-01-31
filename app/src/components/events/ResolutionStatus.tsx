/**
 * ResolutionStatus
 *
 * Displays the current resolution status of an event including:
 * - Status badge
 * - Timeline of resolution stages
 * - Countdown to dispute window end
 */

import { useMemo } from 'react'
import { Clock, Check, AlertTriangle, Scale, Users } from 'lucide-react'
import type { PredictionEvent, DisputeStatus } from '@/types'

interface ResolutionStatusProps {
  event: PredictionEvent
  disputes?: Array<{ status: DisputeStatus }>
}

interface TimelineStage {
  id: string
  label: string
  completed: boolean
  active: boolean
  icon: typeof Clock
}

function formatTimeRemaining(timestamp: number): string {
  const now = Date.now()
  const diff = timestamp - now

  if (diff <= 0) return 'Ended'

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 24) {
    const days = Math.floor(hours / 24)
    return `${days}d ${hours % 24}h`
  }

  return `${hours}h ${minutes}m`
}

export function ResolutionStatus({ event, disputes = [] }: ResolutionStatusProps) {
  const now = Date.now()

  const hasOpenDispute = disputes.some((d) => d.status === 'open' || d.status === 'under_review')
  const hasEscalatedDispute = disputes.some((d) => d.status === 'escalated')

  // Determine current stage
  const stage = useMemo(() => {
    if (!event.deadlines) return 'active'

    if (event.status === 'occurred' || event.status === 'expired') {
      return 'resolved'
    }

    const { bettingDeadline, eventDeadline, disputeWindowEnd } = event.deadlines

    if (now < bettingDeadline) return 'betting'
    if (now < eventDeadline) return 'pending'
    if (!event.proposedOutcome) return 'awaiting_resolution'
    if (now < disputeWindowEnd || hasOpenDispute) return 'dispute_window'
    if (hasEscalatedDispute) return 'community_vote'
    return 'resolved'
  }, [event, now, hasOpenDispute, hasEscalatedDispute])

  // Build timeline
  const timeline: TimelineStage[] = useMemo(() => {
    const stages: TimelineStage[] = [
      { id: 'betting', label: 'Betting', completed: stage !== 'betting' && stage !== 'active', active: stage === 'betting', icon: Clock },
      { id: 'pending', label: 'Event Pending', completed: stage !== 'betting' && stage !== 'pending' && stage !== 'active', active: stage === 'pending', icon: AlertTriangle },
      { id: 'resolution', label: 'Resolution', completed: !!event.proposedOutcome, active: stage === 'awaiting_resolution', icon: Scale },
      { id: 'dispute', label: 'Dispute Window', completed: stage === 'resolved' || stage === 'community_vote', active: stage === 'dispute_window', icon: Clock },
    ]

    if (hasEscalatedDispute) {
      stages.push({ id: 'vote', label: 'Community Vote', completed: stage === 'resolved', active: stage === 'community_vote', icon: Users })
    }

    stages.push({ id: 'final', label: 'Final', completed: stage === 'resolved', active: false, icon: Check })

    return stages
  }, [stage, event.proposedOutcome, hasEscalatedDispute])

  // Status badge config
  const statusConfig = useMemo(() => {
    switch (stage) {
      case 'betting':
        return { label: 'Betting Open', color: '#00ba7c', bgColor: 'rgba(0, 186, 124, 0.15)' }
      case 'pending':
        return { label: 'Event Pending', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.15)' }
      case 'awaiting_resolution':
        return { label: 'Awaiting Resolution', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.15)' }
      case 'dispute_window':
        return { label: 'Dispute Window', color: '#ff3040', bgColor: 'rgba(255, 48, 64, 0.15)' }
      case 'community_vote':
        return { label: 'Community Vote', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.15)' }
      case 'resolved':
        return {
          label: event.status === 'occurred' ? 'Resolved: DOOM' : 'Resolved: LIFE',
          color: event.status === 'occurred' ? '#ff3040' : '#00ba7c',
          bgColor: event.status === 'occurred' ? 'rgba(255, 48, 64, 0.15)' : 'rgba(0, 186, 124, 0.15)',
        }
      default:
        return { label: 'Active', color: '#777', bgColor: 'rgba(119, 119, 119, 0.15)' }
    }
  }, [stage, event.status])

  return (
    <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#333]">
      {/* Status badge */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[13px] text-[#777]">Resolution Status</span>
        <span
          className="px-3 py-1 rounded-full text-[12px] font-semibold"
          style={{ backgroundColor: statusConfig.bgColor, color: statusConfig.color }}
        >
          {statusConfig.label}
        </span>
      </div>

      {/* Proposed outcome */}
      {event.proposedOutcome && (
        <div className="mb-4 p-3 bg-[#222] rounded-lg">
          <span className="text-[11px] text-[#555] block mb-1">Proposed Outcome</span>
          <span className={`text-[14px] font-semibold ${
            event.proposedOutcome === 'doom' ? 'text-[#ff3040]' : 'text-[#00ba7c]'
          }`}>
            {event.proposedOutcome.toUpperCase()}
          </span>
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        {timeline.map((item, index) => {
          const Icon = item.icon
          return (
            <div key={item.id} className="flex items-start gap-3">
              {/* Connector line */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    item.completed
                      ? 'bg-[#00ba7c]'
                      : item.active
                      ? 'bg-[#ff3040]'
                      : 'bg-[#333]'
                  }`}
                >
                  <Icon size={12} className={item.completed || item.active ? 'text-white' : 'text-[#777]'} />
                </div>
                {index < timeline.length - 1 && (
                  <div
                    className={`w-0.5 h-6 ${
                      item.completed ? 'bg-[#00ba7c]' : 'bg-[#333]'
                    }`}
                  />
                )}
              </div>

              {/* Label */}
              <div className="pb-3">
                <span
                  className={`text-[13px] font-medium ${
                    item.active ? 'text-white' : item.completed ? 'text-[#00ba7c]' : 'text-[#555]'
                  }`}
                >
                  {item.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Countdown */}
      {event.deadlines && stage === 'dispute_window' && (
        <div className="mt-4 p-3 bg-[#ff3040]/10 rounded-lg border border-[#ff3040]/30">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-[#ff3040]" />
            <span className="text-[12px] text-[#ff3040]">
              Dispute window ends in {formatTimeRemaining(event.deadlines.disputeWindowEnd)}
            </span>
          </div>
        </div>
      )}

      {stage === 'betting' && event.deadlines && (
        <div className="mt-4 p-3 bg-[#00ba7c]/10 rounded-lg border border-[#00ba7c]/30">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-[#00ba7c]" />
            <span className="text-[12px] text-[#00ba7c]">
              Betting closes in {formatTimeRemaining(event.deadlines.bettingDeadline)}
            </span>
          </div>
        </div>
      )}

      {/* Active disputes indicator */}
      {hasOpenDispute && (
        <div className="mt-4 p-3 bg-[#f59e0b]/10 rounded-lg border border-[#f59e0b]/30">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-[#f59e0b]" />
            <span className="text-[12px] text-[#f59e0b]">
              {disputes.filter((d) => d.status === 'open' || d.status === 'under_review').length} active dispute(s)
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
