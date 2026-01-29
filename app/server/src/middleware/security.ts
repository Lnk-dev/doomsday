/**
 * Security Middleware
 *
 * Provides security headers and protections against common web vulnerabilities.
 * Based on OWASP security recommendations.
 */

import { createMiddleware } from 'hono/factory'
import type { Context } from 'hono'

const isProduction = process.env.NODE_ENV === 'production'

/**
 * Security headers configuration
 */
interface SecurityHeadersOptions {
  // Content Security Policy
  contentSecurityPolicy?: {
    defaultSrc?: string[]
    scriptSrc?: string[]
    styleSrc?: string[]
    imgSrc?: string[]
    fontSrc?: string[]
    connectSrc?: string[]
    frameSrc?: string[]
    frameAncestors?: string[]
    reportUri?: string
  }
  // HTTP Strict Transport Security
  hsts?: {
    maxAge?: number
    includeSubDomains?: boolean
    preload?: boolean
  }
  // Frame options
  frameOptions?: 'DENY' | 'SAMEORIGIN'
  // Content type options
  contentTypeOptions?: boolean
  // XSS Protection (legacy, but still useful for older browsers)
  xssProtection?: boolean
  // Referrer Policy
  referrerPolicy?: string
  // Permissions Policy (formerly Feature-Policy)
  permissionsPolicy?: Record<string, string[]>
}

const defaultOptions: SecurityHeadersOptions = {
  contentSecurityPolicy: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for UI frameworks
    imgSrc: ["'self'", 'data:', 'https:'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    connectSrc: ["'self'", 'wss:', 'https:'],
    frameSrc: ["'none'"],
    frameAncestors: ["'none'"],
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  frameOptions: 'DENY',
  contentTypeOptions: true,
  xssProtection: true,
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: {
    accelerometer: [],
    camera: [],
    geolocation: [],
    gyroscope: [],
    magnetometer: [],
    microphone: [],
    payment: [],
    usb: [],
  },
}

/**
 * Build Content-Security-Policy header value
 */
function buildCSP(csp: NonNullable<SecurityHeadersOptions['contentSecurityPolicy']>): string {
  const directives: string[] = []

  if (csp.defaultSrc?.length) {
    directives.push(`default-src ${csp.defaultSrc.join(' ')}`)
  }
  if (csp.scriptSrc?.length) {
    directives.push(`script-src ${csp.scriptSrc.join(' ')}`)
  }
  if (csp.styleSrc?.length) {
    directives.push(`style-src ${csp.styleSrc.join(' ')}`)
  }
  if (csp.imgSrc?.length) {
    directives.push(`img-src ${csp.imgSrc.join(' ')}`)
  }
  if (csp.fontSrc?.length) {
    directives.push(`font-src ${csp.fontSrc.join(' ')}`)
  }
  if (csp.connectSrc?.length) {
    directives.push(`connect-src ${csp.connectSrc.join(' ')}`)
  }
  if (csp.frameSrc?.length) {
    directives.push(`frame-src ${csp.frameSrc.join(' ')}`)
  }
  if (csp.frameAncestors?.length) {
    directives.push(`frame-ancestors ${csp.frameAncestors.join(' ')}`)
  }
  if (csp.reportUri) {
    directives.push(`report-uri ${csp.reportUri}`)
  }

  return directives.join('; ')
}

/**
 * Build Permissions-Policy header value
 */
function buildPermissionsPolicy(policy: Record<string, string[]>): string {
  return Object.entries(policy)
    .map(([feature, allowlist]) => {
      if (allowlist.length === 0) {
        return `${feature}=()`
      }
      return `${feature}=(${allowlist.join(' ')})`
    })
    .join(', ')
}

/**
 * Security headers middleware
 */
export function securityHeaders(options: SecurityHeadersOptions = {}) {
  const config = { ...defaultOptions, ...options }

  return createMiddleware(async (c: Context, next: () => Promise<void>) => {
    await next()

    // Content-Security-Policy
    if (config.contentSecurityPolicy) {
      const cspValue = buildCSP(config.contentSecurityPolicy)
      // Use Report-Only in development for easier debugging
      if (isProduction) {
        c.header('Content-Security-Policy', cspValue)
      } else {
        c.header('Content-Security-Policy-Report-Only', cspValue)
      }
    }

    // HTTP Strict Transport Security (only in production with HTTPS)
    if (config.hsts && isProduction) {
      let hstsValue = `max-age=${config.hsts.maxAge}`
      if (config.hsts.includeSubDomains) {
        hstsValue += '; includeSubDomains'
      }
      if (config.hsts.preload) {
        hstsValue += '; preload'
      }
      c.header('Strict-Transport-Security', hstsValue)
    }

    // X-Frame-Options (clickjacking protection)
    if (config.frameOptions) {
      c.header('X-Frame-Options', config.frameOptions)
    }

    // X-Content-Type-Options (MIME sniffing protection)
    if (config.contentTypeOptions) {
      c.header('X-Content-Type-Options', 'nosniff')
    }

    // X-XSS-Protection (legacy XSS protection)
    if (config.xssProtection) {
      c.header('X-XSS-Protection', '1; mode=block')
    }

    // Referrer-Policy
    if (config.referrerPolicy) {
      c.header('Referrer-Policy', config.referrerPolicy)
    }

    // Permissions-Policy
    if (config.permissionsPolicy) {
      c.header('Permissions-Policy', buildPermissionsPolicy(config.permissionsPolicy))
    }

    // Additional security headers
    c.header('X-DNS-Prefetch-Control', 'off')
    c.header('X-Download-Options', 'noopen')
    c.header('X-Permitted-Cross-Domain-Policies', 'none')
  })
}

/**
 * API-specific security headers (less restrictive CSP for JSON responses)
 */
export const apiSecurityHeaders = securityHeaders({
  contentSecurityPolicy: {
    defaultSrc: ["'none'"],
    frameAncestors: ["'none'"],
  },
})

/**
 * Default security headers for web responses
 */
export const webSecurityHeaders = securityHeaders()
