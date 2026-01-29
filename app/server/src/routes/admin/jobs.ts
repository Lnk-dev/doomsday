/**
 * Admin Jobs Routes
 *
 * Endpoints for monitoring and managing background jobs.
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, and, gt } from 'drizzle-orm'
import { db } from '../../db'
import { adminUsers, adminSessions, type AdminUser } from '../../db/schema'
import type { Context } from 'hono'
import {
  QueueNames,
  getAllQueueStats,
  addJob,
  type QueueName,
} from '../../lib/jobs'
import { getQueue, pauseQueue, resumeQueue, retryFailedJobs } from '../../lib/jobs/queue'

// Extend context for admin
type AdminContext = Context & {
  get(key: 'admin'): AdminUser
  set(key: 'admin', value: AdminUser): void
}

const adminJobs = new Hono()

/**
 * Middleware to check admin authentication and super_admin role
 */
async function requireJobsAccess(c: AdminContext, next: () => Promise<void>) {
  const admin = await getAuthenticatedAdmin(c)

  if (!admin) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  // Only super_admin can access job management
  if (admin.role !== 'super_admin') {
    return c.json({ error: 'Insufficient permissions' }, 403)
  }

  c.set('admin', admin)
  await next()
}

/**
 * GET /admin/jobs/stats
 * Get all queue statistics
 */
adminJobs.get('/stats', requireJobsAccess, async (c) => {
  const stats = await getAllQueueStats()
  return c.json(stats)
})

/**
 * GET /admin/jobs/queues/:name
 * Get detailed info for a specific queue
 */
adminJobs.get('/queues/:name', requireJobsAccess, async (c) => {
  const name = c.req.param('name') as QueueName

  if (!Object.values(QueueNames).includes(name)) {
    return c.json({ error: 'Invalid queue name' }, 400)
  }

  const queue = getQueue(name)

  const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
    queue.getWaiting(0, 10),
    queue.getActive(0, 10),
    queue.getCompleted(0, 10),
    queue.getFailed(0, 10),
    queue.getDelayed(0, 10),
    queue.isPaused(),
  ])

  return c.json({
    name,
    paused,
    jobs: {
      waiting: waiting.map(formatJob),
      active: active.map(formatJob),
      completed: completed.map(formatJob),
      failed: failed.map(formatJob),
      delayed: delayed.map(formatJob),
    },
  })
})

/**
 * POST /admin/jobs/queues/:name/pause
 * Pause a queue
 */
adminJobs.post('/queues/:name/pause', requireJobsAccess, async (c) => {
  const name = c.req.param('name') as QueueName

  if (!Object.values(QueueNames).includes(name)) {
    return c.json({ error: 'Invalid queue name' }, 400)
  }

  await pauseQueue(name)
  return c.json({ success: true, message: `Queue ${name} paused` })
})

/**
 * POST /admin/jobs/queues/:name/resume
 * Resume a queue
 */
adminJobs.post('/queues/:name/resume', requireJobsAccess, async (c) => {
  const name = c.req.param('name') as QueueName

  if (!Object.values(QueueNames).includes(name)) {
    return c.json({ error: 'Invalid queue name' }, 400)
  }

  await resumeQueue(name)
  return c.json({ success: true, message: `Queue ${name} resumed` })
})

/**
 * POST /admin/jobs/queues/:name/retry
 * Retry all failed jobs in a queue
 */
adminJobs.post('/queues/:name/retry', requireJobsAccess, async (c) => {
  const name = c.req.param('name') as QueueName

  if (!Object.values(QueueNames).includes(name)) {
    return c.json({ error: 'Invalid queue name' }, 400)
  }

  const retried = await retryFailedJobs(name)
  return c.json({ success: true, retried })
})

/**
 * POST /admin/jobs/test
 * Add a test job (for debugging)
 */
const testJobSchema = z.object({
  queue: z.enum(['email', 'notifications', 'analytics', 'cleanup']),
  data: z.record(z.unknown()).optional(),
})

adminJobs.post('/test', requireJobsAccess, zValidator('json', testJobSchema), async (c) => {
  const { queue, data } = c.req.valid('json')

  const job = await addJob(queue as QueueName, 'test-job', {
    type: 'test',
    timestamp: new Date().toISOString(),
    ...data,
  })

  return c.json({
    success: true,
    jobId: job.id,
    queue,
  })
})

// Helper functions
function formatJob(job: { id?: string; name: string; data: unknown; timestamp?: number; failedReason?: string }) {
  return {
    id: job.id,
    name: job.name,
    data: job.data,
    timestamp: job.timestamp,
    failedReason: job.failedReason,
  }
}

async function getAuthenticatedAdmin(c: Context) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.slice(7)

  const session = await db.query.adminSessions.findFirst({
    where: and(
      eq(adminSessions.token, token),
      gt(adminSessions.expiresAt, new Date())
    ),
  })

  if (!session) {
    return null
  }

  return db.query.adminUsers.findFirst({
    where: eq(adminUsers.id, session.adminId),
  })
}

export default adminJobs
