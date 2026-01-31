/**
 * DeadlineSelector
 *
 * Component for selecting event deadlines with visual timeline.
 * Includes betting deadline, event deadline, and resolution deadline.
 */

import { useMemo, useCallback } from 'react'
import { Calendar, AlertCircle, Clock } from 'lucide-react'

interface DeadlineSelectorProps {
  bettingDeadline: string
  eventDeadline: string
  resolutionDeadline: string
  onBettingDeadlineChange: (date: string) => void
  onEventDeadlineChange: (date: string) => void
  onResolutionDeadlineChange: (date: string) => void
}

const presets = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
  { label: '1 year', days: 365 },
]

function formatDateForInput(date: Date): string {
  return date.toISOString().slice(0, 16)
}

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return 'Not set'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function DeadlineSelector({
  bettingDeadline,
  eventDeadline,
  resolutionDeadline,
  onBettingDeadlineChange,
  onEventDeadlineChange,
  onResolutionDeadlineChange,
}: DeadlineSelectorProps) {
  const now = useMemo(() => new Date(), [])
  const minDate = formatDateForInput(now)

  // Validation
  const validationErrors = useMemo(() => {
    const errors: string[] = []

    if (bettingDeadline && eventDeadline) {
      if (new Date(bettingDeadline) >= new Date(eventDeadline)) {
        errors.push('Betting deadline must be before event deadline')
      }
    }

    if (eventDeadline && resolutionDeadline) {
      if (new Date(eventDeadline) >= new Date(resolutionDeadline)) {
        errors.push('Event deadline must be before resolution deadline')
      }
    }

    if (bettingDeadline && new Date(bettingDeadline) <= now) {
      errors.push('Betting deadline must be in the future')
    }

    return errors
  }, [bettingDeadline, eventDeadline, resolutionDeadline, now])

  // Apply preset
  const applyPreset = useCallback((days: number) => {
    const betting = addDays(now, Math.max(1, Math.floor(days * 0.8)))
    const event = addDays(now, days)
    const resolution = addDays(now, days + 7)

    onBettingDeadlineChange(formatDateForInput(betting))
    onEventDeadlineChange(formatDateForInput(event))
    onResolutionDeadlineChange(formatDateForInput(resolution))
  }, [now, onBettingDeadlineChange, onEventDeadlineChange, onResolutionDeadlineChange])

  // Timeline progress calculation
  const timelineProgress = useMemo(() => {
    if (!bettingDeadline || !eventDeadline || !resolutionDeadline) return null

    const start = now.getTime()
    const bettingTime = new Date(bettingDeadline).getTime()
    const eventTime = new Date(eventDeadline).getTime()
    const resolutionTime = new Date(resolutionDeadline).getTime()
    const total = resolutionTime - start

    if (total <= 0) return null

    return {
      betting: Math.max(0, Math.min(100, ((bettingTime - start) / total) * 100)),
      event: Math.max(0, Math.min(100, ((eventTime - start) / total) * 100)),
    }
  }, [now, bettingDeadline, eventDeadline, resolutionDeadline])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <label className="text-[13px] text-[#777]">Event Deadlines</label>
      </div>

      {/* Presets */}
      <div>
        <label className="text-[12px] text-[#555] mb-2 block">Quick Presets</label>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset.days}
              type="button"
              onClick={() => applyPreset(preset.days)}
              className="px-4 py-2 bg-[#222] text-[#999] text-[13px] rounded-lg hover:bg-[#333] hover:text-white transition-all"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <div className="p-3 bg-[#1f0a0a] rounded-lg border border-[#ff3040]/30">
          <div className="flex items-center gap-2 text-[#ff3040] mb-1">
            <AlertCircle size={14} />
            <span className="text-[12px] font-medium">Please fix:</span>
          </div>
          <ul className="text-[11px] text-[#ff3040] pl-5 space-y-0.5">
            {validationErrors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Timeline visualization */}
      {timelineProgress && validationErrors.length === 0 && (
        <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#333]">
          <label className="text-[12px] text-[#555] mb-3 block">Timeline Preview</label>
          <div className="relative h-2 bg-[#333] rounded-full">
            {/* Betting deadline marker */}
            <div
              className="absolute top-0 w-3 h-3 -mt-0.5 bg-[#f59e0b] rounded-full border-2 border-black"
              style={{ left: `${timelineProgress.betting}%` }}
            />
            {/* Event deadline marker */}
            <div
              className="absolute top-0 w-3 h-3 -mt-0.5 bg-[#ff3040] rounded-full border-2 border-black"
              style={{ left: `${timelineProgress.event}%` }}
            />
            {/* Resolution deadline marker (end) */}
            <div className="absolute top-0 right-0 w-3 h-3 -mt-0.5 bg-[#00ba7c] rounded-full border-2 border-black" />
          </div>
          <div className="flex justify-between mt-3 text-[10px]">
            <span className="text-[#f59e0b]">Betting</span>
            <span className="text-[#ff3040]">Event</span>
            <span className="text-[#00ba7c]">Resolution</span>
          </div>
        </div>
      )}

      {/* Deadline inputs */}
      <div className="space-y-4">
        {/* Betting Deadline */}
        <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#333]">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-[#f59e0b]/20 flex items-center justify-center">
              <Clock size={12} className="text-[#f59e0b]" />
            </div>
            <div>
              <span className="text-[13px] font-medium text-white">Betting Deadline</span>
              <p className="text-[11px] text-[#555]">Last moment to place bets</p>
            </div>
          </div>
          <input
            type="datetime-local"
            value={bettingDeadline}
            min={minDate}
            onChange={(e) => onBettingDeadlineChange(e.target.value)}
            className="w-full bg-[#222] text-[14px] text-white p-3 rounded-lg outline-none focus:ring-1 focus:ring-[#f59e0b]"
          />
          {bettingDeadline && (
            <p className="text-[11px] text-[#777] mt-2 flex items-center gap-1">
              <Calendar size={10} />
              {formatDisplayDate(bettingDeadline)}
            </p>
          )}
        </div>

        {/* Event Deadline */}
        <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#333]">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-[#ff3040]/20 flex items-center justify-center">
              <AlertCircle size={12} className="text-[#ff3040]" />
            </div>
            <div>
              <span className="text-[13px] font-medium text-white">Event Deadline</span>
              <p className="text-[11px] text-[#555]">When the predicted event should occur by</p>
            </div>
          </div>
          <input
            type="datetime-local"
            value={eventDeadline}
            min={bettingDeadline || minDate}
            onChange={(e) => onEventDeadlineChange(e.target.value)}
            className="w-full bg-[#222] text-[14px] text-white p-3 rounded-lg outline-none focus:ring-1 focus:ring-[#ff3040]"
          />
          {eventDeadline && (
            <p className="text-[11px] text-[#777] mt-2 flex items-center gap-1">
              <Calendar size={10} />
              {formatDisplayDate(eventDeadline)}
            </p>
          )}
        </div>

        {/* Resolution Deadline */}
        <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#333]">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-[#00ba7c]/20 flex items-center justify-center">
              <Calendar size={12} className="text-[#00ba7c]" />
            </div>
            <div>
              <span className="text-[13px] font-medium text-white">Resolution Deadline</span>
              <p className="text-[11px] text-[#555]">Final deadline to resolve the event</p>
            </div>
          </div>
          <input
            type="datetime-local"
            value={resolutionDeadline}
            min={eventDeadline || minDate}
            onChange={(e) => onResolutionDeadlineChange(e.target.value)}
            className="w-full bg-[#222] text-[14px] text-white p-3 rounded-lg outline-none focus:ring-1 focus:ring-[#00ba7c]"
          />
          {resolutionDeadline && (
            <p className="text-[11px] text-[#777] mt-2 flex items-center gap-1">
              <Calendar size={10} />
              {formatDisplayDate(resolutionDeadline)}
            </p>
          )}
          <p className="text-[10px] text-[#555] mt-2">
            A 24-hour dispute window will be added after resolution
          </p>
        </div>
      </div>
    </div>
  )
}
