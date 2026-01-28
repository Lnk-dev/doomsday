/**
 * Rate Limiting Utilities
 *
 * Provides client-side rate limiting, debouncing, and throttling
 * to prevent abuse and improve user experience.
 */

/**
 * Pre-configured rate limits for common actions
 * windowMs: Time window in milliseconds
 * maxRequests: Maximum requests allowed in the window
 */
export const RATE_LIMITS = {
  POST_CREATE: {
    windowMs: 60000, // 1 minute
    maxRequests: 5,
  },
  COMMENT_CREATE: {
    windowMs: 60000, // 1 minute
    maxRequests: 10,
  },
  LIKE_ACTION: {
    windowMs: 1000, // 1 second
    maxRequests: 5,
  },
  BET_PLACE: {
    windowMs: 10000, // 10 seconds
    maxRequests: 3,
  },
} as const

export type RateLimitConfig = {
  windowMs: number
  maxRequests: number
}

/**
 * Sliding window rate limiter
 * Tracks requests within a time window and allows/denies based on limits
 */
export class SlidingWindowRateLimiter {
  private requests: Map<string, number[]> = new Map()
  private windowMs: number
  private maxRequests: number

  constructor(config: RateLimitConfig) {
    this.windowMs = config.windowMs
    this.maxRequests = config.maxRequests
  }

  /**
   * Check if an action is allowed for a given key
   * @param key - Unique identifier (e.g., user ID, action type)
   * @returns Object with allowed status and remaining requests
   */
  check(key: string): { allowed: boolean; remaining: number; resetMs: number } {
    const now = Date.now()
    const windowStart = now - this.windowMs

    // Get existing requests for this key
    let timestamps = this.requests.get(key) || []

    // Filter out requests outside the window
    timestamps = timestamps.filter((ts) => ts > windowStart)

    // Calculate remaining requests
    const remaining = Math.max(0, this.maxRequests - timestamps.length)

    // Calculate time until window resets
    const oldestRequest = timestamps[0]
    const resetMs = oldestRequest ? oldestRequest + this.windowMs - now : 0

    return {
      allowed: timestamps.length < this.maxRequests,
      remaining,
      resetMs: Math.max(0, resetMs),
    }
  }

  /**
   * Record a request for a given key
   * @param key - Unique identifier
   * @returns Whether the request was allowed
   */
  record(key: string): boolean {
    const { allowed } = this.check(key)

    if (allowed) {
      const now = Date.now()
      const windowStart = now - this.windowMs

      // Get and filter timestamps
      let timestamps = this.requests.get(key) || []
      timestamps = timestamps.filter((ts) => ts > windowStart)

      // Add new timestamp
      timestamps.push(now)
      this.requests.set(key, timestamps)
    }

    return allowed
  }

  /**
   * Reset rate limit for a key
   * @param key - Unique identifier
   */
  reset(key: string): void {
    this.requests.delete(key)
  }

  /**
   * Clear all rate limit data
   */
  clear(): void {
    this.requests.clear()
  }
}

/**
 * Create a debounced function that delays invoking func until after
 * wait milliseconds have elapsed since the last time it was invoked
 * @param func - Function to debounce
 * @param wait - Milliseconds to wait
 * @returns Debounced function with cancel method
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): T & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const debounced = function (this: unknown, ...args: Parameters<T>) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      func.apply(this, args)
      timeoutId = null
    }, wait)
  } as T & { cancel: () => void }

  debounced.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  return debounced
}

/**
 * Create a throttled function that only invokes func at most once
 * per every wait milliseconds
 * @param func - Function to throttle
 * @param wait - Milliseconds to wait between invocations
 * @returns Throttled function with cancel method
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): T & { cancel: () => void } {
  let lastCall = 0
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const throttled = function (this: unknown, ...args: Parameters<T>) {
    const now = Date.now()
    const remaining = wait - (now - lastCall)

    if (remaining <= 0) {
      if (timeoutId !== null) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      lastCall = now
      func.apply(this, args)
    } else if (timeoutId === null) {
      timeoutId = setTimeout(() => {
        lastCall = Date.now()
        timeoutId = null
        func.apply(this, args)
      }, remaining)
    }
  } as T & { cancel: () => void }

  throttled.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  return throttled
}

// ============================================================================
// Pre-configured Rate Limiters
// ============================================================================

/**
 * Rate limiter for post creation
 */
export const postCreateLimiter = new SlidingWindowRateLimiter(RATE_LIMITS.POST_CREATE)

/**
 * Rate limiter for comment creation
 */
export const commentCreateLimiter = new SlidingWindowRateLimiter(RATE_LIMITS.COMMENT_CREATE)

/**
 * Rate limiter for like actions
 */
export const likeActionLimiter = new SlidingWindowRateLimiter(RATE_LIMITS.LIKE_ACTION)

/**
 * Rate limiter for bet placement
 */
export const betPlaceLimiter = new SlidingWindowRateLimiter(RATE_LIMITS.BET_PLACE)

/**
 * Helper to create a rate-limited version of an async function
 * @param func - Async function to rate limit
 * @param limiter - Rate limiter to use
 * @param keyFn - Function to generate key from arguments
 * @returns Rate-limited version of the function
 */
export function withRateLimit<T extends (...args: unknown[]) => Promise<unknown>>(
  func: T,
  limiter: SlidingWindowRateLimiter,
  keyFn: (...args: Parameters<T>) => string
): (...args: Parameters<T>) => Promise<ReturnType<T> | { rateLimited: true; resetMs: number }> {
  return async (...args: Parameters<T>) => {
    const key = keyFn(...args)
    const { allowed, resetMs } = limiter.check(key)

    if (!allowed) {
      return { rateLimited: true, resetMs }
    }

    limiter.record(key)
    return func(...args) as Promise<ReturnType<T>>
  }
}
