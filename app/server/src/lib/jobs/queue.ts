/**
 * Job Queue System
 *
 * BullMQ-based job queue for background processing.
 * Supports: emails, event resolution, batch payouts, notifications
 */

import { Queue, Worker, Job, QueueEvents } from 'bullmq'
import { logger } from '../logger'

// Redis connection config (reuse from cache)
const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
}

// Parse REDIS_URL if provided
function getConnection() {
  const redisUrl = process.env.REDIS_URL
  if (redisUrl) {
    const url = new URL(redisUrl)
    return {
      host: url.hostname,
      port: parseInt(url.port || '6379', 10),
      password: url.password || undefined,
    }
  }
  return connection
}

/**
 * Queue names
 */
export const QueueNames = {
  EMAIL: 'email',
  NOTIFICATIONS: 'notifications',
  EVENT_RESOLUTION: 'event-resolution',
  BATCH_PAYOUTS: 'batch-payouts',
  ANALYTICS: 'analytics',
  CLEANUP: 'cleanup',
} as const

export type QueueName = (typeof QueueNames)[keyof typeof QueueNames]

/**
 * Default job options
 */
const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 1000, // Start with 1 second
  },
  removeOnComplete: {
    age: 24 * 3600, // Keep completed jobs for 24 hours
    count: 1000,    // Keep last 1000 completed jobs
  },
  removeOnFail: {
    age: 7 * 24 * 3600, // Keep failed jobs for 7 days
  },
}

/**
 * Queue registry
 */
const queues = new Map<QueueName, Queue>()
const workers = new Map<QueueName, Worker>()
const queueEvents = new Map<QueueName, QueueEvents>()

/**
 * Get or create a queue
 */
export function getQueue(name: QueueName): Queue {
  if (!queues.has(name)) {
    const queue = new Queue(name, {
      connection: getConnection(),
      defaultJobOptions,
    })
    queues.set(name, queue)

    // Set up queue events for monitoring
    const events = new QueueEvents(name, { connection: getConnection() })
    queueEvents.set(name, events)

    events.on('completed', ({ jobId }) => {
      logger.debug({ queue: name, jobId }, 'Job completed')
    })

    events.on('failed', ({ jobId, failedReason }) => {
      logger.error({ queue: name, jobId, reason: failedReason }, 'Job failed')
    })
  }

  return queues.get(name)!
}

/**
 * Job handler type
 */
export type JobHandler<T = unknown> = (job: Job<T>) => Promise<void>

/**
 * Register a worker for a queue
 */
export function registerWorker<T = unknown>(
  name: QueueName,
  handler: JobHandler<T>,
  options: { concurrency?: number } = {}
): Worker {
  const { concurrency = 5 } = options

  if (workers.has(name)) {
    logger.warn({ queue: name }, 'Worker already registered, replacing')
    workers.get(name)?.close()
  }

  const worker = new Worker(
    name,
    async (job: Job<T>) => {
      const startTime = Date.now()
      logger.info({ queue: name, jobId: job.id, jobName: job.name }, 'Processing job')

      try {
        await handler(job)
        const duration = Date.now() - startTime
        logger.info({ queue: name, jobId: job.id, duration }, 'Job completed')
      } catch (error) {
        const duration = Date.now() - startTime
        logger.error({ queue: name, jobId: job.id, duration, error }, 'Job failed')
        throw error
      }
    },
    {
      connection: getConnection(),
      concurrency,
    }
  )

  worker.on('error', (error) => {
    logger.error({ queue: name, error }, 'Worker error')
  })

  workers.set(name, worker)
  logger.info({ queue: name, concurrency }, 'Worker registered')

  return worker
}

/**
 * Add a job to a queue
 */
export async function addJob<T = unknown>(
  queueName: QueueName,
  jobName: string,
  data: T,
  options?: {
    delay?: number
    priority?: number
    attempts?: number
    jobId?: string
  }
): Promise<Job<T>> {
  const queue = getQueue(queueName)
  const job = await queue.add(jobName, data, {
    ...options,
    jobId: options?.jobId,
  })

  logger.debug({
    queue: queueName,
    jobId: job.id,
    jobName,
    delay: options?.delay,
  }, 'Job added')

  return job
}

/**
 * Add multiple jobs to a queue
 */
export async function addBulkJobs<T = unknown>(
  queueName: QueueName,
  jobs: Array<{ name: string; data: T; opts?: { delay?: number; priority?: number } }>
): Promise<Job<T>[]> {
  const queue = getQueue(queueName)
  const addedJobs = await queue.addBulk(jobs)

  logger.info({
    queue: queueName,
    count: jobs.length,
  }, 'Bulk jobs added')

  return addedJobs
}

/**
 * Schedule a recurring job
 */
export async function scheduleRecurringJob<T = unknown>(
  queueName: QueueName,
  jobName: string,
  data: T,
  pattern: string // Cron pattern
): Promise<void> {
  const queue = getQueue(queueName)

  await queue.add(jobName, data, {
    repeat: {
      pattern,
    },
    jobId: `recurring:${jobName}`,
  })

  logger.info({
    queue: queueName,
    jobName,
    pattern,
  }, 'Recurring job scheduled')
}

/**
 * Get queue statistics
 */
export async function getQueueStats(queueName: QueueName) {
  const queue = getQueue(queueName)

  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ])

  return {
    name: queueName,
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + delayed,
  }
}

/**
 * Get all queue statistics
 */
export async function getAllQueueStats() {
  const stats = await Promise.all(
    Object.values(QueueNames).map((name) => getQueueStats(name))
  )

  return stats.reduce(
    (acc, stat) => {
      acc[stat.name] = stat
      return acc
    },
    {} as Record<QueueName, Awaited<ReturnType<typeof getQueueStats>>>
  )
}

/**
 * Pause a queue
 */
export async function pauseQueue(queueName: QueueName): Promise<void> {
  const queue = getQueue(queueName)
  await queue.pause()
  logger.info({ queue: queueName }, 'Queue paused')
}

/**
 * Resume a queue
 */
export async function resumeQueue(queueName: QueueName): Promise<void> {
  const queue = getQueue(queueName)
  await queue.resume()
  logger.info({ queue: queueName }, 'Queue resumed')
}

/**
 * Retry failed jobs in a queue
 */
export async function retryFailedJobs(queueName: QueueName): Promise<number> {
  const queue = getQueue(queueName)
  const failed = await queue.getFailed()

  let retried = 0
  for (const job of failed) {
    await job.retry()
    retried++
  }

  logger.info({ queue: queueName, retried }, 'Retried failed jobs')
  return retried
}

/**
 * Clean old jobs from a queue
 */
export async function cleanQueue(
  queueName: QueueName,
  gracePeriod = 24 * 3600 * 1000 // 24 hours in ms
): Promise<void> {
  const queue = getQueue(queueName)

  await Promise.all([
    queue.clean(gracePeriod, 1000, 'completed'),
    queue.clean(gracePeriod * 7, 1000, 'failed'),
  ])

  logger.info({ queue: queueName }, 'Queue cleaned')
}

/**
 * Gracefully close all queues and workers
 */
export async function closeAllQueues(): Promise<void> {
  logger.info('Closing all job queues...')

  // Close workers first
  await Promise.all(
    Array.from(workers.values()).map((worker) => worker.close())
  )

  // Close queue events
  await Promise.all(
    Array.from(queueEvents.values()).map((events) => events.close())
  )

  // Close queues
  await Promise.all(
    Array.from(queues.values()).map((queue) => queue.close())
  )

  workers.clear()
  queueEvents.clear()
  queues.clear()

  logger.info('All job queues closed')
}
