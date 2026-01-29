/**
 * useSpamDetection Hook
 *
 * A custom hook for integrating spam detection into post/comment creation.
 * Provides real-time spam analysis with configurable options.
 *
 * Features:
 * - Content-based spam detection
 * - Behavior-based detection (rapid posting, duplicates)
 * - Debounced analysis to avoid excessive processing
 * - Caches recent detection results
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import {
  detectSpam,
  isRapidPosting,
  SPAM_THRESHOLDS,
  SPAM_COOLDOWNS,
  type SpamDetectionResult,
  type RecentPost,
} from '@/lib/spam'

// ============================================================================
// Types
// ============================================================================

export interface UseSpamDetectionOptions {
  /** User ID for behavior tracking */
  userId?: string
  /** Account creation timestamp (ms) */
  accountCreatedAt?: number
  /** User's total post count */
  userPostCount?: number
  /** Enable real-time analysis as user types */
  enableRealTimeAnalysis?: boolean
  /** Debounce delay for real-time analysis (ms) */
  debounceDelay?: number
  /** Custom spam score threshold override */
  customThreshold?: number
}

export interface UseSpamDetectionReturn {
  /** Whether current content is flagged as spam */
  isSpam: boolean
  /** Spam probability score (0-100) */
  spamScore: number
  /** Reasons why content was flagged */
  reasons: string[]
  /** Whether analysis is currently running */
  isAnalyzing: boolean
  /** Whether user can post (not rate limited) */
  canPost: boolean
  /** Time until user can post again (ms), 0 if can post now */
  cooldownRemaining: number
  /** Analyze content manually */
  analyzeContent: (content: string) => SpamDetectionResult
  /** Record a new post timestamp */
  recordPost: (content: string) => void
  /** Reset the detection state */
  reset: () => void
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for spam detection in post/comment creation
 */
export function useSpamDetection(
  options: UseSpamDetectionOptions = {}
): UseSpamDetectionReturn {
  const {
    userId = 'anonymous',
    accountCreatedAt,
    userPostCount = 0,
    // These are reserved for future real-time analysis features
    enableRealTimeAnalysis: _enableRealTimeAnalysis = true,
    debounceDelay: _debounceDelay = 300,
    customThreshold,
  } = options
  void _enableRealTimeAnalysis
  void _debounceDelay

  // State
  const [isSpam, setIsSpam] = useState(false)
  const [spamScore, setSpamScore] = useState(0)
  const [reasons, setReasons] = useState<string[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [cooldownRemaining, setCooldownRemaining] = useState(0)

  // Refs for tracking post history
  const postTimestampsRef = useRef<number[]>([])
  const recentPostsRef = useRef<RecentPost[]>([])
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const cooldownIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Calculate account age - use state initializer to capture Date.now() once
  const [mountTime] = useState(() => Date.now())
  const accountAgeMs = useMemo(() => {
    if (!accountCreatedAt) return undefined
    return mountTime - accountCreatedAt
  }, [accountCreatedAt, mountTime])

  // Effective spam threshold
  const spamThreshold = customThreshold ?? SPAM_THRESHOLDS.SPAM_SCORE_THRESHOLD

  // Check if user can post (rate limiting)
  const canPost = useMemo(() => {
    if (postTimestampsRef.current.length === 0) return true
    return !isRapidPosting(userId, postTimestampsRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, cooldownRemaining]) // cooldownRemaining triggers re-evaluation

  // Analyze content
  const analyzeContent = useCallback(
    (content: string): SpamDetectionResult => {
      const result = detectSpam(content, {
        userId,
        postTimestamps: postTimestampsRef.current,
        recentPosts: recentPostsRef.current,
        accountAgeMs,
        postCount: userPostCount,
      })

      // Apply custom threshold if set
      const effectiveIsSpam =
        result.spamScore >= spamThreshold || result.reasons.length > 0

      return {
        ...result,
        isSpam: effectiveIsSpam,
      }
    },
    [userId, accountAgeMs, userPostCount, spamThreshold]
  )

  // Update cooldown timer
  const updateCooldown = useCallback(() => {
    if (postTimestampsRef.current.length === 0) {
      setCooldownRemaining(0)
      return
    }

    const lastPost = postTimestampsRef.current[0]
    const timeSinceLastPost = Date.now() - lastPost
    const remaining = Math.max(0, SPAM_COOLDOWNS.MIN_POST_INTERVAL - timeSinceLastPost)

    setCooldownRemaining(remaining)

    // Set up interval to update cooldown
    if (remaining > 0) {
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current)
      }

      cooldownIntervalRef.current = setInterval(() => {
        const newRemaining = Math.max(
          0,
          SPAM_COOLDOWNS.MIN_POST_INTERVAL - (Date.now() - lastPost)
        )
        setCooldownRemaining(newRemaining)

        if (newRemaining === 0 && cooldownIntervalRef.current) {
          clearInterval(cooldownIntervalRef.current)
          cooldownIntervalRef.current = null
        }
      }, 1000)
    }
  }, [])

  // Record a post and update tracking
  const recordPost = useCallback((content: string) => {
    const now = Date.now()

    // Add to timestamps
    postTimestampsRef.current = [now, ...postTimestampsRef.current].slice(0, 20)

    // Add to recent posts
    recentPostsRef.current = [
      { content, timestamp: now },
      ...recentPostsRef.current,
    ].slice(0, SPAM_THRESHOLDS.DUPLICATE_CHECK_WINDOW)

    // Calculate cooldown
    updateCooldown()
  }, [updateCooldown])

  // Reset state
  const reset = useCallback(() => {
    setIsSpam(false)
    setSpamScore(0)
    setReasons([])
    setIsAnalyzing(false)

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current)
      }
    }
  }, [])

  // Expose debouncedAnalyze for external use
  // Components can call this with content from their input
  useEffect(() => {
    // Initial cooldown check on mount
    updateCooldown()
  }, [updateCooldown])

  return {
    isSpam,
    spamScore,
    reasons,
    isAnalyzing,
    canPost,
    cooldownRemaining,
    analyzeContent,
    recordPost,
    reset,
  }
}

export default useSpamDetection
