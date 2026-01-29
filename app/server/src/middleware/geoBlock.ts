/**
 * Geo-Blocking Middleware
 *
 * Restricts betting features based on user location.
 */

import { createMiddleware } from 'hono/factory'
import { getGeoFromHeaders, getClientIp, getGeoFromIp, isBettingAllowed, type GeoLocation } from '../lib/geo'
import { logger } from '../lib/logger'

declare module 'hono' {
  interface ContextVariableMap {
    geo: GeoLocation | null
    bettingAllowed: boolean
  }
}

/**
 * Middleware to detect and store user's geo location
 */
export const geoDetection = createMiddleware(async (c, next) => {
  const headers = c.req.raw.headers

  // Try to get geo from headers first (faster, more reliable behind CDN)
  let geo = getGeoFromHeaders(headers)

  // Fall back to IP lookup if no header-based geo
  if (!geo) {
    const ip = getClientIp(c.req.raw, headers)
    if (ip && ip !== '0.0.0.0') {
      // Only do IP lookup for routes that need it
      // For performance, consider caching results
      geo = await getGeoFromIp(ip)
    }
  }

  // Store in context
  c.set('geo', geo)

  // Determine if betting is allowed
  if (geo) {
    const { allowed } = isBettingAllowed(geo.countryCode, geo.region)
    c.set('bettingAllowed', allowed)
  } else {
    // If we can't determine location, default to allowed
    // (Could be more restrictive based on compliance requirements)
    c.set('bettingAllowed', true)
  }

  await next()
})

/**
 * Middleware to block betting endpoints in restricted regions
 */
export const requireBettingAccess = createMiddleware(async (c, next) => {
  const bettingAllowed = c.get('bettingAllowed')
  const geo = c.get('geo')

  if (!bettingAllowed) {
    logger.info({
      country: geo?.countryCode,
      path: c.req.path,
    }, 'Betting access blocked due to geo restriction')

    return c.json({
      error: 'Service not available',
      message: 'Betting features are not available in your region.',
      code: 'GEO_RESTRICTED',
      countryCode: geo?.countryCode,
    }, 403)
  }

  await next()
})

/**
 * Middleware to check social feature access
 */
export const requireSocialAccess = createMiddleware(async (c, next) => {
  const geo = c.get('geo')

  if (geo) {
    const { allowed, reason } = await import('../lib/geo').then(m => m.isSocialAllowed(geo.countryCode))

    if (!allowed) {
      logger.info({
        country: geo.countryCode,
        path: c.req.path,
      }, 'Social access blocked due to geo restriction')

      return c.json({
        error: 'Service not available',
        message: reason || 'This service is not available in your region.',
        code: 'GEO_RESTRICTED',
      }, 403)
    }
  }

  await next()
})
