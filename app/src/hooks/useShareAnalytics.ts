/**
 * Share Analytics Hook
 * Issue #78: Enhance social sharing and embed system
 *
 * Track sharing events for analytics.
 */

import { useCallback } from 'react'

export type SharePlatform =
  | 'twitter'
  | 'reddit'
  | 'discord'
  | 'telegram'
  | 'whatsapp'
  | 'email'
  | 'copy'
  | 'native'
  | 'qr'
  | 'embed'

export type ContentType = 'post' | 'event' | 'profile'

export interface ShareEvent {
  eventType: 'share_initiated' | 'share_completed' | 'embed_loaded' | 'embed_clicked'
  contentType: ContentType
  contentId: string
  platform: SharePlatform
  timestamp: number
  userId?: string
  referrer?: string
}

export function useShareAnalytics() {
  const trackShare = useCallback(
    (event: Omit<ShareEvent, 'timestamp'>) => {
      const shareEvent: ShareEvent = {
        ...event,
        timestamp: Date.now(),
      }

      // Log for development
      console.log('[Share Analytics]', shareEvent)

      // Send to Google Analytics if available
      if (typeof window !== 'undefined' && 'gtag' in window) {
        const gtag = (window as { gtag?: (...args: unknown[]) => void }).gtag
        gtag?.('event', 'share', {
          method: event.platform,
          content_type: event.contentType,
          content_id: event.contentId,
        })
      }

      // Store locally for offline analytics
      try {
        const storedEvents = JSON.parse(localStorage.getItem('share_analytics') || '[]')
        storedEvents.push(shareEvent)
        // Keep last 100 events
        localStorage.setItem(
          'share_analytics',
          JSON.stringify(storedEvents.slice(-100))
        )
      } catch (e) {
        console.warn('Failed to store share analytics', e)
      }
    },
    []
  )

  const getShareStats = useCallback(() => {
    try {
      const events: ShareEvent[] = JSON.parse(
        localStorage.getItem('share_analytics') || '[]'
      )

      const platformCounts: Record<string, number> = {}
      const contentTypeCounts: Record<string, number> = {}

      events.forEach((event) => {
        platformCounts[event.platform] = (platformCounts[event.platform] || 0) + 1
        contentTypeCounts[event.contentType] =
          (contentTypeCounts[event.contentType] || 0) + 1
      })

      return {
        totalShares: events.length,
        platformCounts,
        contentTypeCounts,
        recentEvents: events.slice(-10),
      }
    } catch {
      return {
        totalShares: 0,
        platformCounts: {},
        contentTypeCounts: {},
        recentEvents: [],
      }
    }
  }, [])

  return { trackShare, getShareStats }
}
