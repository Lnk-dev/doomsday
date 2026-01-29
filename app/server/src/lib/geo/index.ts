/**
 * Geo Module
 *
 * Exports geo detection and restriction functionality.
 */

export {
  getGeoFromHeaders,
  getGeoFromIp,
  getClientIp,
  type GeoLocation,
} from './detection'

export {
  isBettingAllowed,
  isSocialAllowed,
  getRestrictionInfo,
  getRestrictedCountriesList,
  BETTING_RESTRICTED_COUNTRIES,
  type GeoRestriction,
} from './restrictions'
