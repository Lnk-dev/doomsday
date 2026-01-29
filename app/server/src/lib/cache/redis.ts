/**
 * Redis Client
 *
 * Connection to Redis for caching and job queues.
 */

import { Redis } from 'ioredis'
import { logger } from '../logger'

// Create Redis client
function createRedisClient(): Redis {
  const redisUrl = process.env.REDIS_URL

  if (redisUrl) {
    // Use connection string (e.g., for Upstash, Redis Cloud)
    return new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          logger.error('Redis connection failed after 3 retries')
          return null // Stop retrying
        }
        return Math.min(times * 200, 2000)
      },
      lazyConnect: true,
    })
  }

  // Local Redis configuration
  return new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      if (times > 3) {
        logger.error('Redis connection failed after 3 retries')
        return null
      }
      return Math.min(times * 200, 2000)
    },
    lazyConnect: true,
  })
}

const redis = createRedisClient()

// Connection event handlers
redis.on('connect', () => {
  logger.info('Redis connected')
})

redis.on('error', (err) => {
  logger.error({ err }, 'Redis error')
})

redis.on('close', () => {
  logger.warn('Redis connection closed')
})

// Graceful shutdown
export async function closeRedis(): Promise<void> {
  await redis.quit()
  logger.info('Redis connection closed gracefully')
}

// Health check
export async function redisHealthCheck(): Promise<boolean> {
  try {
    const pong = await redis.ping()
    return pong === 'PONG'
  } catch {
    return false
  }
}

export default redis
