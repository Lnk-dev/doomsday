import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import { logger } from './lib/logger'
import { initSentry, captureError } from './lib/sentry'
import { closeDatabase } from './db'
import { requestLogger } from './middleware/logger'
import authRouter from './routes/auth'
import postsRouter from './routes/posts'
import usersRouter from './routes/users'
import eventsRouter from './routes/events'
import healthRouter from './routes/health'

initSentry()

const app = new Hono()

app.use('*', cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }))
app.use('*', requestLogger)

app.route('/auth', authRouter)
app.route('/posts', postsRouter)
app.route('/users', usersRouter)
app.route('/events', eventsRouter)
app.route('/health', healthRouter)

app.get('/', (c) => c.json({ name: 'Doomsday API', version: '1.0.0' }))

app.onError((err, c) => {
  if (err instanceof HTTPException) return c.json({ error: err.message }, err.status)
  captureError(err, { path: c.req.path, method: c.req.method })
  logger.error({ err }, 'Unhandled error')
  return c.json({ error: 'Internal server error' }, 500)
})

app.notFound((c) => c.json({ error: 'Not found' }, 404))

const port = parseInt(process.env.PORT || '3001', 10)

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'Received shutdown signal')
  try {
    await closeDatabase()
    logger.info('Graceful shutdown completed')
    process.exit(0)
  } catch (error) {
    logger.error({ err: error }, 'Error during shutdown')
    process.exit(1)
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

logger.info({ port }, 'Starting server...')
serve({ fetch: app.fetch, port }, (info) => logger.info({ port: info.port }, 'Server running'))

export default app
