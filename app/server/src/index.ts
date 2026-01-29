import 'dotenv/config'
import { createServer } from 'http'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import { logger } from './lib/logger'
import { initSentry, captureError } from './lib/sentry'
import { closeDatabase } from './db'
import { requestLogger } from './middleware/logger'
import { requestId } from './middleware/requestId'
import { apiSecurityHeaders } from './middleware/security'
import { initializeWebSocket, getConnectionStats } from './lib/websocket'
import authRouter from './routes/auth'
import postsRouter from './routes/posts'
import usersRouter from './routes/users'
import eventsRouter from './routes/events'
import healthRouter from './routes/health'
import adminAuthRouter from './routes/admin/auth'
import adminAuditRouter from './routes/admin/audit'
import adminFraudRouter from './routes/admin/fraud'

initSentry()

const app = new Hono()

app.use('*', requestId)
app.use('*', apiSecurityHeaders)
app.use('*', cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }))
app.use('*', requestLogger)

app.route('/auth', authRouter)
app.route('/posts', postsRouter)
app.route('/users', usersRouter)
app.route('/events', eventsRouter)
app.route('/health', healthRouter)
app.route('/admin/auth', adminAuthRouter)
app.route('/admin/audit', adminAuditRouter)
app.route('/admin/fraud', adminFraudRouter)

app.get('/', (c) => c.json({ name: 'Doomsday API', version: '1.0.0' }))

app.onError((err, c) => {
  if (err instanceof HTTPException) return c.json({ error: err.message }, err.status)
  captureError(err, { path: c.req.path, method: c.req.method })
  logger.error({ err }, 'Unhandled error')
  return c.json({ error: 'Internal server error' }, 500)
})

app.notFound((c) => c.json({ error: 'Not found' }, 404))

const port = parseInt(process.env.PORT || '3001', 10)

// Create HTTP server and attach WebSocket
const httpServer = createServer(async (req, res) => {
  // Let Hono handle HTTP requests
  const response = await app.fetch(
    new Request(`http://localhost:${port}${req.url}`, {
      method: req.method,
      headers: req.headers as HeadersInit,
    })
  )

  res.statusCode = response.status
  response.headers.forEach((value, key) => {
    res.setHeader(key, value)
  })

  const body = await response.text()
  res.end(body)
})

// Initialize WebSocket
const io = initializeWebSocket(httpServer)

// Add WebSocket stats to health endpoint
app.get('/ws/stats', async (c) => {
  const stats = await getConnectionStats()
  return c.json(stats)
})

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'Received shutdown signal')
  try {
    // Close WebSocket connections
    io.close()
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

logger.info({ port }, 'Starting server with WebSocket support...')
httpServer.listen(port, () => {
  logger.info({ port }, 'Server running with WebSocket support')
})

export { io }
export default app
