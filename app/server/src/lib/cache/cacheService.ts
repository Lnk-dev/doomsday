/**
 * Cache Service
 *
 * High-level caching abstraction with:
 * - Key prefixing
 * - TTL management
 * - Tag-based invalidation
 * - Metrics tracking
 * - Graceful degradation
 */

import redis from './redis'
import { logger } from '../logger'

export interface CacheOptions {
  /** Time to live in seconds (default: 3600 = 1 hour) */
  ttl?: number
  /** Tags for group invalidation */
  tags?: string[]
}

export interface CacheMetrics {
  hits: number
  misses: number
  errors: number
}

class CacheService {
  private static instance: CacheService
  private prefix = 'doomsday:'
  private metrics: CacheMetrics = { hits: 0, misses: 0, errors: 0 }
  private enabled = true

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService()
    }
    return CacheService.instance
  }

  private buildKey(key: string): string {
    return `${this.prefix}${key}`
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled) return null

    try {
      const cached = await redis.get(this.buildKey(key))
      if (!cached) {
        this.metrics.misses++
        return null
      }

      this.metrics.hits++
      return JSON.parse(cached) as T
    } catch (error) {
      this.metrics.errors++
      logger.warn({ error, key }, 'Cache get error')
      return null
    }
  }

  /**
   * Set a value in cache
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    if (!this.enabled) return

    const { ttl = 3600, tags = [] } = options
    const fullKey = this.buildKey(key)

    try {
      const serialized = JSON.stringify(value)

      if (ttl > 0) {
        await redis.setex(fullKey, ttl, serialized)
      } else {
        await redis.set(fullKey, serialized)
      }

      // Store tags for invalidation
      for (const tag of tags) {
        await redis.sadd(this.buildKey(`tag:${tag}`), fullKey)
        // Set TTL on tag set to prevent memory leaks
        await redis.expire(this.buildKey(`tag:${tag}`), ttl + 3600)
      }
    } catch (error) {
      this.metrics.errors++
      logger.warn({ error, key }, 'Cache set error')
    }
  }

  /**
   * Delete a specific key
   */
  async delete(key: string): Promise<void> {
    try {
      await redis.del(this.buildKey(key))
    } catch (error) {
      logger.warn({ error, key }, 'Cache delete error')
    }
  }

  /**
   * Delete all keys with a specific tag
   */
  async deleteByTag(tag: string): Promise<number> {
    try {
      const tagKey = this.buildKey(`tag:${tag}`)
      const keys = await redis.smembers(tagKey)

      if (keys.length > 0) {
        await redis.del(...keys)
        await redis.del(tagKey)
      }

      return keys.length
    } catch (error) {
      logger.warn({ error, tag }, 'Cache deleteByTag error')
      return 0
    }
  }

  /**
   * Delete keys matching a pattern
   */
  async deleteByPattern(pattern: string): Promise<number> {
    try {
      const keys = await redis.keys(this.buildKey(pattern))
      if (keys.length > 0) {
        await redis.del(...keys)
      }
      return keys.length
    } catch (error) {
      logger.warn({ error, pattern }, 'Cache deleteByPattern error')
      return 0
    }
  }

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      return (await redis.exists(this.buildKey(key))) === 1
    } catch {
      return false
    }
  }

  /**
   * Get remaining TTL for a key
   */
  async getTTL(key: string): Promise<number> {
    try {
      return await redis.ttl(this.buildKey(key))
    } catch {
      return -1
    }
  }

  /**
   * Atomic increment
   */
  async increment(key: string, amount = 1): Promise<number> {
    try {
      return await redis.incrby(this.buildKey(key), amount)
    } catch {
      return 0
    }
  }

  /**
   * Get or set pattern - fetch from cache or execute fetcher
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Try cache first
    const cached = await this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    // Fetch fresh data
    const data = await fetcher()

    // Store in cache (don't await to not block response)
    this.set(key, data, options).catch(() => {})

    return data
  }

  /**
   * Get cache metrics
   */
  getMetrics(): CacheMetrics & { hitRate: number } {
    const total = this.metrics.hits + this.metrics.misses
    return {
      ...this.metrics,
      hitRate: total > 0 ? (this.metrics.hits / total) * 100 : 0,
    }
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = { hits: 0, misses: 0, errors: 0 }
  }

  /**
   * Disable caching (useful for testing)
   */
  disable(): void {
    this.enabled = false
  }

  /**
   * Enable caching
   */
  enable(): void {
    this.enabled = true
  }
}

export const cache = CacheService.getInstance()
