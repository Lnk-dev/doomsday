/**
 * Geo Restrictions Configuration
 *
 * Defines which countries/regions are restricted from betting features.
 */

export interface GeoRestriction {
  countryCode: string
  name: string
  bettingAllowed: boolean
  socialAllowed: boolean
  reason?: string
}

/**
 * Countries where betting is fully restricted
 */
export const BETTING_RESTRICTED_COUNTRIES = new Set([
  // United States (varies by state, but generally restricted)
  'US',
  // China - strict gambling prohibition
  'CN',
  // North Korea
  'KP',
  // Iran
  'IR',
  // Syria
  'SY',
  // Cuba
  'CU',
  // Russia - gambling restrictions
  'RU',
  // India - most states prohibit
  'IN',
  // Pakistan
  'PK',
  // Afghanistan
  'AF',
  // Singapore - strict gambling laws
  'SG',
  // United Arab Emirates
  'AE',
  // Saudi Arabia
  'SA',
  // Kuwait
  'KW',
  // Qatar
  'QA',
  // Bahrain
  'BH',
  // Oman
  'OM',
  // Jordan
  'JO',
  // Lebanon
  'LB',
  // Iraq
  'IQ',
  // Yemen
  'YE',
  // Brunei
  'BN',
  // Bangladesh
  'BD',
  // Cambodia - for citizens (tourists exempt)
  'KH',
])

/**
 * US states where betting might be restricted
 * (For more granular US restrictions when region data is available)
 */
export const BETTING_RESTRICTED_US_STATES = new Set([
  // States with explicit online gambling bans
  'UT', // Utah
  'HI', // Hawaii
  // Add more as regulations change
])

/**
 * Check if betting is allowed for a location
 */
export function isBettingAllowed(countryCode: string, region?: string): {
  allowed: boolean
  reason?: string
} {
  // Fully restricted countries
  if (BETTING_RESTRICTED_COUNTRIES.has(countryCode)) {
    return {
      allowed: false,
      reason: `Online betting is not available in this region.`,
    }
  }

  // US state-level restrictions
  if (countryCode === 'US' && region) {
    if (BETTING_RESTRICTED_US_STATES.has(region)) {
      return {
        allowed: false,
        reason: `Online betting is not available in ${region}.`,
      }
    }
  }

  // Default: allowed
  return { allowed: true }
}

/**
 * Check if social features are allowed
 * (Generally more permissive than betting)
 */
export function isSocialAllowed(countryCode: string): {
  allowed: boolean
  reason?: string
} {
  // Only fully sanctioned countries are blocked from social
  const sanctionedCountries = new Set(['KP', 'SY', 'IR', 'CU'])

  if (sanctionedCountries.has(countryCode)) {
    return {
      allowed: false,
      reason: 'Service not available in this region.',
    }
  }

  return { allowed: true }
}

/**
 * Get restriction info for a country
 */
export function getRestrictionInfo(countryCode: string, region?: string): GeoRestriction {
  const betting = isBettingAllowed(countryCode, region)
  const social = isSocialAllowed(countryCode)

  return {
    countryCode,
    name: countryCode, // Would use getCountryName from detection
    bettingAllowed: betting.allowed,
    socialAllowed: social.allowed,
    reason: betting.reason || social.reason,
  }
}

/**
 * Get list of restricted countries for disclosure
 */
export function getRestrictedCountriesList(): string[] {
  return Array.from(BETTING_RESTRICTED_COUNTRIES).sort()
}
