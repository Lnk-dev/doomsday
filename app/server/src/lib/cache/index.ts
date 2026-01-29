/**
 * Cache Module
 *
 * Re-exports all cache functionality
 */

export { default as redis, closeRedis, redisHealthCheck } from './redis'
export { cache, type CacheOptions, type CacheMetrics } from './cacheService'
export {
  CacheTTL,
  CacheKeys,
  CacheTags,
  invalidateUserCache,
  invalidatePostCache,
  invalidateEventCache,
  invalidateLeaderboards,
  invalidateModerationCache,
} from './cacheKeys'
