/**
 * TLS Enforcement Middleware
 *
 * Ensures all requests in production use HTTPS.
 * Adds security headers for transport layer security.
 */

import { createMiddleware } from 'hono/factory'
import { logger } from '../lib/logger'

const isProduction = process.env.NODE_ENV === 'production'

/**
 * Redirect HTTP to HTTPS in production
 * Works behind load balancers that set X-Forwarded-Proto
 */
export const enforceHttps = createMiddleware(async (c, next) => {
  if (!isProduction) {
    return next()
  }

  const proto = c.req.header('x-forwarded-proto')
  const host = c.req.header('host')

  // If behind a load balancer with HTTPS termination
  if (proto === 'http' && host) {
    const url = new URL(c.req.url)
    url.protocol = 'https:'
    url.host = host

    logger.info({ host, path: url.pathname }, 'Redirecting HTTP to HTTPS')
    return c.redirect(url.toString(), 301)
  }

  return next()
})

/**
 * TLS security headers
 * These complement HSTS and other security headers
 */
export const tlsHeaders = createMiddleware(async (c, next) => {
  // HSTS - enforce HTTPS for 1 year with subdomains
  // Note: Only effective over HTTPS, browsers ignore over HTTP
  if (isProduction) {
    c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }

  // Expect-CT - Certificate Transparency enforcement
  // Helps detect misissued certificates
  if (isProduction) {
    c.header('Expect-CT', 'max-age=86400, enforce')
  }

  return next()
})

/**
 * TLS version checking utility
 * For use in health checks to verify TLS configuration
 */
export function getTlsInfo(req: Request): {
  protocol: string | null
  tlsVersion: string | null
  cipher: string | null
} {
  return {
    protocol: req.headers.get('x-forwarded-proto'),
    tlsVersion: req.headers.get('x-tls-version'), // Set by some load balancers
    cipher: req.headers.get('x-tls-cipher'), // Set by some load balancers
  }
}
