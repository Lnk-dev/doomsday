/**
 * Admin Events Page
 *
 * Event resolution and management
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Calendar,
  Loader2,
  Check,
  X,
  AlertTriangle,
  Users,
  Wallet,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import { formatRelativeTime } from '../lib/formatDate'
import { adminApi } from '../lib/adminApi'
import { useAdminAuthStore } from '../store/adminAuth'
import type { PendingEvent, EventResolutionDetails } from '../types/admin'

export function AdminEventsPage() {
  const hasPermission = useAdminAuthStore((state) => state.hasPermission)
  const canResolve = hasPermission('events.resolve')
  const canVoid = hasPermission('events.void')

  const [events, setEvents] = useState<PendingEvent[]>([])
  const [selectedEvent, setSelectedEvent] = useState<EventResolutionDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Resolution dialog state
  const [showResolveDialog, setShowResolveDialog] = useState(false)
  const [showVoidDialog, setShowVoidDialog] = useState(false)
  const [resolveOutcome, setResolveOutcome] = useState<'doom' | 'life'>('doom')
  const [resolveNotes, setResolveNotes] = useState('')
  const [voidReason, setVoidReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await adminApi.getPendingEvents()
      setEvents(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const handleSelectEvent = async (event: PendingEvent) => {
    try {
      setIsLoadingDetails(true)
      const details = await adminApi.getEventResolutionDetails(event.id)
      setSelectedEvent(details)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load event details')
    } finally {
      setIsLoadingDetails(false)
    }
  }

  const handleResolve = async () => {
    if (!selectedEvent || !resolveNotes.trim()) return

    try {
      setIsSubmitting(true)
      await adminApi.resolveEvent(selectedEvent.id, {
        outcome: resolveOutcome,
        notes: resolveNotes.trim(),
      })
      setShowResolveDialog(false)
      setSelectedEvent(null)
      setResolveNotes('')
      fetchEvents()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve event')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVoid = async () => {
    if (!selectedEvent || !voidReason.trim()) return

    try {
      setIsSubmitting(true)
      await adminApi.voidEvent(selectedEvent.id, {
        reason: voidReason.trim(),
      })
      setShowVoidDialog(false)
      setSelectedEvent(null)
      setVoidReason('')
      fetchEvents()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to void event')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusColor = (status: PendingEvent['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-400'
      case 'ended':
        return 'bg-yellow-500/10 text-yellow-400'
      case 'resolved':
        return 'bg-blue-500/10 text-blue-400'
      case 'voided':
        return 'bg-gray-500/10 text-gray-400'
      default:
        return 'bg-gray-500/10 text-gray-400'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-[20px] font-semibold text-white">Event Resolution</h2>
        <p className="text-[14px] text-[#777]">Resolve pending events and process payouts</p>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-[14px] text-red-400">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Events list */}
        <div className="space-y-4">
          <h3 className="text-[15px] font-medium text-white">Pending Events</h3>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-6 h-6 text-[#ff3040] animate-spin" />
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4 bg-[#111] border border-[#222] rounded-xl">
              <Calendar className="w-12 h-12 text-[#333]" />
              <p className="text-[14px] text-[#555]">No pending events</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <button
                  key={event.id}
                  onClick={() => handleSelectEvent(event)}
                  className={`w-full text-left p-4 bg-[#111] border rounded-xl transition-colors ${
                    selectedEvent?.id === event.id
                      ? 'border-[#ff3040]'
                      : 'border-[#222] hover:border-[#333]'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-[14px] font-medium text-white line-clamp-2">
                      {event.title}
                    </h4>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ml-2 flex-shrink-0 ${getStatusColor(event.status)}`}>
                      {event.status}
                    </span>
                  </div>
                  <p className="text-[12px] text-[#777] mb-3 line-clamp-2">
                    {event.description}
                  </p>
                  <div className="flex items-center gap-4 text-[11px] text-[#555]">
                    <span className="flex items-center gap-1">
                      <Wallet size={12} />
                      {event.totalVolume.toLocaleString()} vol
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={12} />
                      {event.bettorCount} bettors
                    </span>
                    <span>
                      Ends {formatRelativeTime(event.endDate)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Event details */}
        <div className="space-y-4">
          <h3 className="text-[15px] font-medium text-white">Event Details</h3>

          {isLoadingDetails ? (
            <div className="flex items-center justify-center h-64 bg-[#111] border border-[#222] rounded-xl">
              <Loader2 className="w-6 h-6 text-[#ff3040] animate-spin" />
            </div>
          ) : !selectedEvent ? (
            <div className="flex flex-col items-center justify-center h-64 bg-[#111] border border-[#222] rounded-xl">
              <p className="text-[14px] text-[#555]">Select an event to view details</p>
            </div>
          ) : (
            <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
              {/* Event info */}
              <div className="p-4 border-b border-[#222]">
                <h4 className="text-[16px] font-medium text-white mb-2">{selectedEvent.title}</h4>
                <p className="text-[13px] text-[#999] mb-4">{selectedEvent.description}</p>

                {/* Volume breakdown */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="p-3 bg-[#0a0a0a] rounded-lg text-center">
                    <p className="text-[18px] font-bold text-white">
                      {selectedEvent.totalVolume.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-[#555]">Total Volume</p>
                  </div>
                  <div className="p-3 bg-[#0a0a0a] rounded-lg text-center">
                    <p className="text-[18px] font-bold text-red-400">
                      {selectedEvent.doomVolume.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-[#555]">DOOM</p>
                  </div>
                  <div className="p-3 bg-[#0a0a0a] rounded-lg text-center">
                    <p className="text-[18px] font-bold text-green-400">
                      {selectedEvent.lifeVolume.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-[#555]">LIFE</p>
                  </div>
                </div>

                {/* Distribution bar */}
                <div className="h-2 bg-[#222] rounded-full overflow-hidden flex">
                  <div
                    className="bg-red-500"
                    style={{
                      width: `${(selectedEvent.doomVolume / selectedEvent.totalVolume) * 100}%`,
                    }}
                  />
                  <div
                    className="bg-green-500"
                    style={{
                      width: `${(selectedEvent.lifeVolume / selectedEvent.totalVolume) * 100}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-[10px] text-[#555]">
                  <span>
                    DOOM {((selectedEvent.doomVolume / selectedEvent.totalVolume) * 100).toFixed(1)}%
                  </span>
                  <span>
                    LIFE {((selectedEvent.lifeVolume / selectedEvent.totalVolume) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Payout preview */}
              {selectedEvent.payoutPreview && (
                <div className="p-4 border-b border-[#222]">
                  <h5 className="text-[13px] font-medium text-white mb-3">Payout Preview</h5>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setResolveOutcome('doom')}
                      className={`p-3 rounded-lg border transition-colors ${
                        resolveOutcome === 'doom'
                          ? 'bg-red-500/10 border-red-500/30 text-red-400'
                          : 'bg-[#0a0a0a] border-[#222] text-[#777] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingDown size={16} />
                        <span className="font-medium">DOOM Wins</span>
                      </div>
                      <p className="text-[11px] opacity-70">
                        {selectedEvent.bets.filter((b) => b.outcome === 'doom').length} winners
                      </p>
                    </button>
                    <button
                      onClick={() => setResolveOutcome('life')}
                      className={`p-3 rounded-lg border transition-colors ${
                        resolveOutcome === 'life'
                          ? 'bg-green-500/10 border-green-500/30 text-green-400'
                          : 'bg-[#0a0a0a] border-[#222] text-[#777] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp size={16} />
                        <span className="font-medium">LIFE Wins</span>
                      </div>
                      <p className="text-[11px] opacity-70">
                        {selectedEvent.bets.filter((b) => b.outcome === 'life').length} winners
                      </p>
                    </button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="p-4">
                <div className="flex gap-3">
                  {canResolve && selectedEvent.status === 'ended' && (
                    <button
                      onClick={() => setShowResolveDialog(true)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#ff3040] hover:bg-[#e02838] text-white rounded-lg text-[13px] font-medium transition-colors"
                    >
                      <Check size={16} />
                      Resolve Event
                    </button>
                  )}
                  {canVoid && (selectedEvent.status === 'active' || selectedEvent.status === 'ended') && (
                    <button
                      onClick={() => setShowVoidDialog(true)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#333] hover:bg-[#444] text-white rounded-lg text-[13px] font-medium transition-colors"
                    >
                      <X size={16} />
                      Void Event
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resolve Dialog */}
      {showResolveDialog && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowResolveDialog(false)} />
          <div className="relative w-full max-w-md bg-[#111] border border-[#222] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[#222]">
              <h3 className="text-[17px] font-semibold text-white">Resolve Event</h3>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-[14px] text-[#ccc]">
                Resolving "{selectedEvent.title}" with{' '}
                <span className={resolveOutcome === 'doom' ? 'text-red-400' : 'text-green-400'}>
                  {resolveOutcome.toUpperCase()}
                </span>{' '}
                as the winning outcome.
              </p>

              <div className="p-3 bg-[#0a0a0a] rounded-lg">
                <p className="text-[12px] text-[#777] mb-1">Total Payout</p>
                <p className="text-[20px] font-bold text-white">
                  {selectedEvent.payoutPreview.totalPayout.toLocaleString()} tokens
                </p>
                <p className="text-[11px] text-[#555]">
                  to {selectedEvent.payoutPreview.winners} winners
                </p>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#999] mb-2">
                  Resolution Notes <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  placeholder="Explain the resolution decision..."
                  rows={3}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-white text-[14px] placeholder:text-[#555] focus:outline-none focus:border-[#ff3040] transition-colors resize-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t border-[#222]">
              <button
                onClick={() => setShowResolveDialog(false)}
                disabled={isSubmitting}
                className="px-4 py-2 text-[13px] font-medium text-[#777] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                disabled={isSubmitting || !resolveNotes.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-[#ff3040] hover:bg-[#e02838] text-white rounded-lg text-[13px] font-medium transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Check size={14} />
                )}
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Void Dialog */}
      {showVoidDialog && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowVoidDialog(false)} />
          <div className="relative w-full max-w-md bg-[#111] border border-[#222] rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 p-4 border-b border-[#222]">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <h3 className="text-[17px] font-semibold text-white">Void Event</h3>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-[14px] text-[#ccc]">
                Are you sure you want to void "{selectedEvent.title}"?
              </p>

              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-[12px] text-yellow-400">
                  All bets will be refunded to bettors. This action cannot be undone.
                </p>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#999] mb-2">
                  Void Reason <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  placeholder="Explain why this event is being voided..."
                  rows={3}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-white text-[14px] placeholder:text-[#555] focus:outline-none focus:border-yellow-500 transition-colors resize-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t border-[#222]">
              <button
                onClick={() => setShowVoidDialog(false)}
                disabled={isSubmitting}
                className="px-4 py-2 text-[13px] font-medium text-[#777] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleVoid}
                disabled={isSubmitting || !voidReason.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg text-[13px] font-medium transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <X size={14} />
                )}
                Void Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
