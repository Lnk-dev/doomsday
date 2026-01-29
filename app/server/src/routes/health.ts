import { Hono } from 'hono'
import { checkDatabaseConnection } from '../db'
import { redisHealthCheck, cache } from '../lib/cache'

const health = new Hono()

health.get('/', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

health.get('/ready', async (c) => {
  const [dbOk, redisOk] = await Promise.all([
    checkDatabaseConnection(),
    redisHealthCheck().catch(() => false),
  ])

  const allOk = dbOk && redisOk
  return c.json({
    status: allOk ? 'ready' : 'degraded',
    checks: {
      database: dbOk,
      redis: redisOk,
    },
  }, allOk ? 200 : 503)
})

health.get('/live', (c) => c.json({ status: 'alive', uptime: process.uptime() }))

health.get('/cache', async (c) => {
  const metrics = cache.getMetrics()
  const redisOk = await redisHealthCheck().catch(() => false)

  return c.json({
    status: redisOk ? 'connected' : 'disconnected',
    metrics: {
      hits: metrics.hits,
      misses: metrics.misses,
      errors: metrics.errors,
      hitRate: `${metrics.hitRate.toFixed(2)}%`,
    },
  })
})

export default health
