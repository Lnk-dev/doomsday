#!/usr/bin/env npx ts-node

/**
 * Key Rotation Script
 *
 * Rotates encryption keys for sensitive data stored in the database.
 * Should be run periodically (recommended: every 90 days) or after
 * any suspected key compromise.
 *
 * Usage:
 *   OLD_ENCRYPTION_KEY=<old> NEW_ENCRYPTION_KEY=<new> npx ts-node scripts/rotate-keys.ts
 *
 * Prerequisites:
 * - Database access
 * - Both old and new encryption keys
 * - Run during low-traffic period
 */

import 'dotenv/config'
import { eq } from 'drizzle-orm'
import { db } from '../src/db'
import { adminUsers } from '../src/db/schema'
import { reEncrypt } from '../src/lib/encryption'

const OLD_KEY = process.env.OLD_ENCRYPTION_KEY
const NEW_KEY = process.env.NEW_ENCRYPTION_KEY

interface RotationResult {
  table: string
  field: string
  recordId: string
  success: boolean
  error?: string
}

async function rotateAdminSecrets(): Promise<RotationResult[]> {
  const results: RotationResult[] = []

  console.log('Rotating admin user secrets...')

  const admins = await db.select().from(adminUsers)

  for (const admin of admins) {
    // Rotate 2FA secret if exists
    if (admin.twoFactorSecret) {
      try {
        const newSecret = reEncrypt(admin.twoFactorSecret, OLD_KEY!, NEW_KEY!)
        await db.update(adminUsers)
          .set({ twoFactorSecret: newSecret })
          .where(eq(adminUsers.id, admin.id))

        results.push({
          table: 'admin_users',
          field: 'two_factor_secret',
          recordId: admin.id,
          success: true,
        })
      } catch (error) {
        results.push({
          table: 'admin_users',
          field: 'two_factor_secret',
          recordId: admin.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    // Rotate backup codes if exists
    if (admin.twoFactorBackupCodes) {
      try {
        const newCodes = reEncrypt(admin.twoFactorBackupCodes, OLD_KEY!, NEW_KEY!)
        await db.update(adminUsers)
          .set({ twoFactorBackupCodes: newCodes })
          .where(eq(adminUsers.id, admin.id))

        results.push({
          table: 'admin_users',
          field: 'two_factor_backup_codes',
          recordId: admin.id,
          success: true,
        })
      } catch (error) {
        results.push({
          table: 'admin_users',
          field: 'two_factor_backup_codes',
          recordId: admin.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }
  }

  return results
}

async function main(): Promise<void> {
  console.log('='.repeat(60))
  console.log('ENCRYPTION KEY ROTATION')
  console.log('='.repeat(60))
  console.log()

  // Validate environment
  if (!OLD_KEY) {
    console.error('ERROR: OLD_ENCRYPTION_KEY environment variable required')
    process.exit(1)
  }

  if (!NEW_KEY) {
    console.error('ERROR: NEW_ENCRYPTION_KEY environment variable required')
    process.exit(1)
  }

  if (OLD_KEY === NEW_KEY) {
    console.error('ERROR: OLD and NEW keys must be different')
    process.exit(1)
  }

  console.log('Starting key rotation...')
  console.log()

  const allResults: RotationResult[] = []

  // Rotate admin secrets
  const adminResults = await rotateAdminSecrets()
  allResults.push(...adminResults)

  // Add more rotation functions here as needed
  // const userResults = await rotateUserSecrets()
  // allResults.push(...userResults)

  // Summary
  console.log()
  console.log('='.repeat(60))
  console.log('ROTATION SUMMARY')
  console.log('='.repeat(60))

  const successful = allResults.filter(r => r.success)
  const failed = allResults.filter(r => !r.success)

  console.log(`Total records processed: ${allResults.length}`)
  console.log(`Successful: ${successful.length}`)
  console.log(`Failed: ${failed.length}`)

  if (failed.length > 0) {
    console.log()
    console.log('FAILED ROTATIONS:')
    for (const result of failed) {
      console.log(`  - ${result.table}.${result.field} (${result.recordId}): ${result.error}`)
    }
    process.exit(1)
  }

  console.log()
  console.log('Key rotation completed successfully!')
  console.log()
  console.log('NEXT STEPS:')
  console.log('1. Update ENCRYPTION_KEY in production environment')
  console.log('2. Restart all application instances')
  console.log('3. Verify encryption/decryption still works')
  console.log('4. Securely delete the old encryption key')
  console.log()
}

main().catch((error) => {
  console.error('Fatal error during key rotation:', error)
  process.exit(1)
})
