/**
 * Rate Limiting Middleware
 *
 * In-memory rate limiter for auth endpoints.
 * Uses sliding window algorithm with IP-based tracking.
 */

import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory store (would use Redis in production for distributed systems)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean every minute

interface RateLimitOptions {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
  keyPrefix?: string // Prefix for rate limit key
}

function getClientIP(c: { req: { header: (name: string) => string | undefined } }): string {
  return (
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
    c.req.header('x-real-ip') ||
    'unknown'
  )
}

export function createRateLimiter(options: RateLimitOptions) {
  const { windowMs, maxRequests, keyPrefix = 'rl' } = options

  return createMiddleware(async (c, next) => {
    const ip = getClientIP(c)
    const key = `${keyPrefix}:${ip}`
    const now = Date.now()

    let entry = rateLimitStore.get(key)

    // Reset if window has passed
    if (!entry || entry.resetAt < now) {
      entry = { count: 0, resetAt: now + windowMs }
      rateLimitStore.set(key, entry)
    }

    entry.count++

    // Set rate limit headers
    c.header('X-RateLimit-Limit', maxRequests.toString())
    c.header('X-RateLimit-Remaining', Math.max(0, maxRequests - entry.count).toString())
    c.header('X-RateLimit-Reset', Math.ceil(entry.resetAt / 1000).toString())

    if (entry.count > maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
      c.header('Retry-After', retryAfter.toString())
      throw new HTTPException(429, {
        message: `Too many requests. Please try again in ${retryAfter} seconds.`,
      })
    }

    await next()
  })
}

// Pre-configured rate limiters for common use cases

// Strict limiter for auth endpoints (5 requests per minute)
export const authRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 5,
  keyPrefix: 'auth',
})

// Moderate limiter for sensitive operations (10 requests per minute)
export const sensitiveRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 10,
  keyPrefix: 'sensitive',
})

// Standard API limiter (100 requests per minute)
export const apiRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 100,
  keyPrefix: 'api',
})
