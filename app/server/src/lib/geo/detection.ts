/**
 * Geo Detection Service
 *
 * Provides IP-based location detection for compliance purposes.
 * Uses IP headers from load balancers or falls back to IP lookup.
 */

import { logger } from '../logger'

export interface GeoLocation {
  country: string
  countryCode: string
  region?: string
  city?: string
  isVpn?: boolean
  isProxy?: boolean
  confidence: number
}

// In production, integrate with MaxMind GeoIP2 or similar service
// For now, use a simplified implementation with IP header parsing

/**
 * Get geo location from request headers
 */
export function getGeoFromHeaders(headers: Headers): GeoLocation | null {
  // CloudFlare headers
  const cfCountry = headers.get('cf-ipcountry')
  if (cfCountry && cfCountry !== 'XX') {
    return {
      country: getCountryName(cfCountry),
      countryCode: cfCountry,
      confidence: 0.9,
    }
  }

  // Vercel/AWS headers
  const xCountry = headers.get('x-vercel-ip-country') || headers.get('x-country-code')
  if (xCountry) {
    return {
      country: getCountryName(xCountry),
      countryCode: xCountry,
      confidence: 0.85,
    }
  }

  return null
}

/**
 * Get geo location from IP address
 * In production, use MaxMind GeoIP2 database
 */
export async function getGeoFromIp(ip: string): Promise<GeoLocation | null> {
  // Skip localhost/private IPs
  if (isPrivateIp(ip)) {
    return {
      country: 'Local',
      countryCode: 'XX',
      confidence: 1.0,
    }
  }

  try {
    // In production, use MaxMind:
    // const reader = await Reader.open('/path/to/GeoLite2-Country.mmdb')
    // const response = reader.country(ip)
    // return {
    //   country: response.country?.names.en ?? 'Unknown',
    //   countryCode: response.country?.isoCode ?? 'XX',
    //   confidence: 0.95,
    // }

    // Development fallback - use free IP-API service
    // Note: Has rate limits, use MaxMind in production
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city,proxy`)

    if (!response.ok) {
      return null
    }

    const data = await response.json() as {
      status: string
      country?: string
      countryCode?: string
      regionName?: string
      city?: string
      proxy?: boolean
    }

    if (data.status !== 'success') {
      return null
    }

    return {
      country: data.country ?? 'Unknown',
      countryCode: data.countryCode ?? 'XX',
      region: data.regionName,
      city: data.city,
      isProxy: data.proxy,
      confidence: 0.8,
    }
  } catch (error) {
    logger.error({ error, ip }, 'Failed to get geo location from IP')
    return null
  }
}

/**
 * Get client IP from request
 */
export function getClientIp(request: Request, headers: Headers): string {
  // CloudFlare
  const cfIp = headers.get('cf-connecting-ip')
  if (cfIp) return cfIp

  // Standard proxy headers
  const xForwardedFor = headers.get('x-forwarded-for')
  if (xForwardedFor) {
    // Take first IP in chain (original client)
    return xForwardedFor.split(',')[0].trim()
  }

  const xRealIp = headers.get('x-real-ip')
  if (xRealIp) return xRealIp

  // Fallback - this won't work behind proxies
  return '0.0.0.0'
}

/**
 * Check if IP is private/localhost
 */
function isPrivateIp(ip: string): boolean {
  const parts = ip.split('.').map(Number)

  // Localhost
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') {
    return true
  }

  // 10.x.x.x
  if (parts[0] === 10) return true

  // 172.16.x.x - 172.31.x.x
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true

  // 192.168.x.x
  if (parts[0] === 192 && parts[1] === 168) return true

  return false
}

/**
 * Convert country code to name
 */
function getCountryName(code: string): string {
  const countries: Record<string, string> = {
    'US': 'United States',
    'GB': 'United Kingdom',
    'CA': 'Canada',
    'AU': 'Australia',
    'DE': 'Germany',
    'FR': 'France',
    'JP': 'Japan',
    'CN': 'China',
    'IN': 'India',
    'BR': 'Brazil',
    'RU': 'Russia',
    'KR': 'South Korea',
    'IT': 'Italy',
    'ES': 'Spain',
    'MX': 'Mexico',
    'NL': 'Netherlands',
    'SE': 'Sweden',
    'CH': 'Switzerland',
    'SG': 'Singapore',
    'HK': 'Hong Kong',
    'XX': 'Unknown',
    // Add more as needed
  }

  return countries[code] || code
}
