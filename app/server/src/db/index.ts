import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'
import { createLogger } from '../lib/logger'

const logger = createLogger('database')

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL required')

const poolConfig = {
  max: parseInt(process.env.DB_POOL_MAX || '20', 10),
  idle_timeout: parseInt(process.env.DB_IDLE_TIMEOUT || '20', 10),
  connect_timeout: parseInt(process.env.DB_CONNECT_TIMEOUT || '10', 10),
  max_lifetime: 60 * 30,
  prepare: process.env.DB_PREPARE !== 'false',
  onnotice: (notice: postgres.Notice) => logger.debug({ notice: notice.message }, 'PostgreSQL notice'),
}

const sql = postgres(connectionString, poolConfig)
export const db = drizzle(sql, { schema })

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const start = Date.now()
    await sql`SELECT 1`
    logger.debug({ duration: Date.now() - start }, 'Database health check passed')
    return true
  } catch (error) {
    logger.error({ err: error }, 'Database health check failed')
    return false
  }
}

export function getPoolStats() {
  return { max: poolConfig.max, idleTimeout: poolConfig.idle_timeout, connectTimeout: poolConfig.connect_timeout }
}

export async function closeDatabase(): Promise<void> {
  logger.info('Closing database connections...')
  await sql.end()
  logger.info('Database connections closed')
}

export { sql }
