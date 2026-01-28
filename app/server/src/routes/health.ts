import { Hono } from 'hono'
import { checkDatabaseConnection } from '../db'

const health = new Hono()

health.get('/', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

health.get('/ready', async (c) => {
  const db = await checkDatabaseConnection()
  return c.json({ status: db ? 'ready' : 'not_ready', checks: { database: db } }, db ? 200 : 503)
})

health.get('/live', (c) => c.json({ status: 'alive', uptime: process.uptime() }))

export default health
