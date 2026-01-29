/**
 * Geo Routes
 *
 * Endpoints for geo-location and restriction information.
 */

import { Hono } from 'hono'
import {
  getGeoFromHeaders,
  getClientIp,
  getGeoFromIp,
  isBettingAllowed,
  getRestrictedCountriesList,
} from '../lib/geo'

const geo = new Hono()

/**
 * GET /geo/status
 * Get current user's geo status and restrictions
 */
geo.get('/status', async (c) => {
  const headers = c.req.raw.headers

  // Try header-based geo first
  let geoData = getGeoFromHeaders(headers)

  // Fall back to IP lookup
  if (!geoData) {
    const ip = getClientIp(c.req.raw, headers)
    if (ip && ip !== '0.0.0.0') {
      geoData = await getGeoFromIp(ip)
    }
  }

  if (!geoData) {
    return c.json({
      detected: false,
      bettingAllowed: true, // Default to allowed if can't detect
      message: 'Location could not be determined',
    })
  }

  const betting = isBettingAllowed(geoData.countryCode, geoData.region)

  return c.json({
    detected: true,
    country: geoData.country,
    countryCode: geoData.countryCode,
    region: geoData.region,
    bettingAllowed: betting.allowed,
    reason: betting.reason,
    confidence: geoData.confidence,
    isVpn: geoData.isVpn,
    isProxy: geoData.isProxy,
  })
})

/**
 * GET /geo/restricted-countries
 * Get list of countries where betting is restricted
 */
geo.get('/restricted-countries', (c) => {
  const countries = getRestrictedCountriesList()

  return c.json({
    count: countries.length,
    countries,
    notice: 'Online betting features are not available in these regions.',
  })
})

/**
 * GET /geo/check/:countryCode
 * Check if a specific country is restricted
 */
geo.get('/check/:countryCode', (c) => {
  const countryCode = c.req.param('countryCode').toUpperCase()
  const betting = isBettingAllowed(countryCode)

  return c.json({
    countryCode,
    bettingAllowed: betting.allowed,
    reason: betting.reason,
  })
})

export default geo
