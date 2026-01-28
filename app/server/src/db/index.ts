import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL required')

const sql = postgres(connectionString, { max: 20, idle_timeout: 20 })
export const db = drizzle(sql, { schema })

export async function checkDatabaseConnection(): Promise<boolean> {
  try { await sql`SELECT 1`; return true } catch { return false }
}
