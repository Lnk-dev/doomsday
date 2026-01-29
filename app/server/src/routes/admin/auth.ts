/**
 * Admin Authentication Routes
 *
 * Handles admin login, logout, session management, and 2FA
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, and, gt } from 'drizzle-orm'
import bcrypt from 'bcrypt'
import { db } from '../../db'
import { adminUsers, adminSessions } from '../../db/schema'
import { generateToken, verifyAdminToken } from '../../lib/jwt'
import type { Context } from 'hono'
import {
  generateSecret,
  generateQRCode,
  verifyToken as verifyTOTP,
  generateBackupCodes,
  hashBackupCode,
  verifyBackupCode,
  formatBackupCode,
  encryptSecret,
} from '../../lib/totp'
import { authRateLimit, sensitiveRateLimit } from '../../middleware/rateLimit'
import { audit } from '../../lib/auditLogger'

const adminAuth = new Hono()

// Constants
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000 // 24 hours
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 15 * 60 * 1000 // 15 minutes

// Dummy hash for constant-time comparison when user doesn't exist (prevents timing attacks)
// This is a valid bcrypt hash that will never match any password
const DUMMY_HASH = '$2b$10$K.0HwpsoPDGaB/atFBmmXOGTw4ceeg33.WrxJx/FeC9.gOMialU5W'

// Validation schemas
const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

const totpSchema = z.object({
  code: z.string().length(6),
})

const setupVerifySchema = z.object({
  code: z.string().length(6),
  secret: z.string(),
})

/**
 * POST /admin/auth/login
 * Initial login - returns partial session if 2FA required
 */
adminAuth.post('/login', authRateLimit, zValidator('json', loginSchema), async (c) => {
  const { username, password } = c.req.valid('json')

  const admin = await db.query.adminUsers.findFirst({
    where: eq(adminUsers.username, username),
  })

  // SECURITY: Always perform password comparison to prevent timing attacks
  // Even if the user doesn't exist, we compare against a dummy hash
  const hashToCompare = admin?.passwordHash || DUMMY_HASH
  const validPassword = await bcrypt.compare(password, hashToCompare)

  // Now check if user exists (after constant-time password check)
  if (!admin) {
    await audit.auth.loginFailed(username, {
      ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
      reason: 'User not found',
    })
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  // Check if account is locked
  if (admin.lockedUntil && admin.lockedUntil > new Date()) {
    const remainingMs = admin.lockedUntil.getTime() - Date.now()
    const remainingMin = Math.ceil(remainingMs / 60000)
    return c.json({ error: `Account locked. Try again in ${remainingMin} minutes.` }, 423)
  }

  // Check password result (comparison was done above)
  if (!validPassword) {
    // Increment failed attempts
    const newAttempts = (admin.failedLoginAttempts || 0) + 1
    const updates: Record<string, unknown> = { failedLoginAttempts: newAttempts }

    if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
      updates.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS)
    }

    await db.update(adminUsers).set(updates).where(eq(adminUsers.id, admin.id))
    await audit.auth.loginFailed(username, {
      ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
      reason: newAttempts >= MAX_LOGIN_ATTEMPTS ? 'Account locked' : 'Invalid password',
    })
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  // Reset failed attempts on successful password
  await db.update(adminUsers).set({
    failedLoginAttempts: 0,
    lockedUntil: null,
  }).where(eq(adminUsers.id, admin.id))

  // Check if 2FA is required
  if (admin.twoFactorEnabled) {
    // Generate a temporary token for 2FA verification
    const tempToken = generateToken({ adminId: admin.id, pending2FA: true }, '5m')
    return c.json({
      requires2FA: true,
      tempToken,
    })
  }

  // No 2FA - create full session
  return createSession(c, admin)
})

/**
 * POST /admin/auth/verify-2fa
 * Verify 2FA code and complete login
 */
adminAuth.post('/verify-2fa', authRateLimit, zValidator('json', totpSchema), async (c) => {
  const { code } = c.req.valid('json')
  const authHeader = c.req.header('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Missing authorization' }, 401)
  }

  const tempToken = authHeader.slice(7)
  const payload = verifyTempToken(tempToken)

  if (!payload || !payload.pending2FA) {
    return c.json({ error: 'Invalid or expired token' }, 401)
  }

  const admin = await db.query.adminUsers.findFirst({
    where: eq(adminUsers.id, payload.adminId),
  })

  if (!admin || !admin.twoFactorSecret) {
    return c.json({ error: 'Invalid session' }, 401)
  }

  // Try TOTP code first
  if (verifyTOTP(code, admin.twoFactorSecret)) {
    return createSession(c, admin)
  }

  // Try backup code
  if (admin.twoFactorBackupCodes) {
    const backupCodes = JSON.parse(admin.twoFactorBackupCodes) as string[]
    const codeIndex = verifyBackupCode(code, backupCodes)

    if (codeIndex >= 0) {
      // Remove used backup code
      backupCodes.splice(codeIndex, 1)
      await db.update(adminUsers).set({
        twoFactorBackupCodes: JSON.stringify(backupCodes),
      }).where(eq(adminUsers.id, admin.id))

      return createSession(c, admin)
    }
  }

  return c.json({ error: 'Invalid 2FA code' }, 401)
})

/**
 * POST /admin/auth/logout
 * Invalidate current session
 */
adminAuth.post('/logout', async (c) => {
  const authHeader = c.req.header('Authorization')

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    await db.delete(adminSessions).where(eq(adminSessions.token, token))
  }

  return c.json({ success: true })
})

/**
 * GET /admin/auth/me
 * Get current admin user info
 */
adminAuth.get('/me', async (c) => {
  const admin = await getAuthenticatedAdmin(c)
  if (!admin) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  return c.json({
    id: admin.id,
    username: admin.username,
    email: admin.email,
    role: admin.role,
    createdAt: admin.createdAt.getTime(),
    lastLoginAt: admin.lastLoginAt?.getTime(),
    twoFactorEnabled: admin.twoFactorEnabled,
  })
})

/**
 * POST /admin/auth/2fa/setup
 * Start 2FA setup - generate secret and QR code
 */
adminAuth.post('/2fa/setup', sensitiveRateLimit, async (c) => {
  const admin = await getAuthenticatedAdmin(c)
  if (!admin) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  if (admin.twoFactorEnabled) {
    return c.json({ error: '2FA is already enabled' }, 400)
  }

  const secret = generateSecret()
  const qrCode = await generateQRCode(secret, admin.username)

  return c.json({
    secret,
    qrCode,
  })
})

/**
 * POST /admin/auth/2fa/verify-setup
 * Verify setup code and enable 2FA
 */
adminAuth.post('/2fa/verify-setup', sensitiveRateLimit, zValidator('json', setupVerifySchema), async (c) => {
  const admin = await getAuthenticatedAdmin(c)
  if (!admin) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const { code, secret } = c.req.valid('json')

  if (!verifyTOTP(code, secret)) {
    return c.json({ error: 'Invalid verification code' }, 400)
  }

  // Generate backup codes
  const backupCodes = generateBackupCodes()
  const hashedBackupCodes = backupCodes.map(hashBackupCode)

  // Encrypt the secret before storing
  const encryptedSecret = encryptSecret(secret)

  // Enable 2FA
  await db.update(adminUsers).set({
    twoFactorEnabled: true,
    twoFactorSecret: encryptedSecret,
    twoFactorBackupCodes: JSON.stringify(hashedBackupCodes),
    updatedAt: new Date(),
  }).where(eq(adminUsers.id, admin.id))

  // Audit log 2FA enabled
  await audit.auth.twoFactorEnabled(admin.id, admin.username)

  return c.json({
    success: true,
    backupCodes: backupCodes.map(formatBackupCode),
  })
})

/**
 * POST /admin/auth/2fa/disable
 * Disable 2FA (requires password confirmation)
 */
adminAuth.post('/2fa/disable', sensitiveRateLimit, zValidator('json', z.object({ password: z.string() })), async (c) => {
  const admin = await getAuthenticatedAdmin(c)
  if (!admin) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const { password } = c.req.valid('json')

  // Verify password
  const validPassword = await bcrypt.compare(password, admin.passwordHash)
  if (!validPassword) {
    return c.json({ error: 'Invalid password' }, 401)
  }

  // Disable 2FA
  await db.update(adminUsers).set({
    twoFactorEnabled: false,
    twoFactorSecret: null,
    twoFactorBackupCodes: null,
    updatedAt: new Date(),
  }).where(eq(adminUsers.id, admin.id))

  // Audit log 2FA disabled
  await audit.auth.twoFactorDisabled(admin.id, admin.username)

  return c.json({ success: true })
})

/**
 * POST /admin/auth/2fa/regenerate-backup-codes
 * Generate new backup codes (requires current 2FA code)
 */
adminAuth.post('/2fa/regenerate-backup-codes', sensitiveRateLimit, zValidator('json', totpSchema), async (c) => {
  const admin = await getAuthenticatedAdmin(c)
  if (!admin) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  if (!admin.twoFactorEnabled || !admin.twoFactorSecret) {
    return c.json({ error: '2FA is not enabled' }, 400)
  }

  const { code } = c.req.valid('json')

  if (!verifyTOTP(code, admin.twoFactorSecret)) {
    return c.json({ error: 'Invalid 2FA code' }, 401)
  }

  // Generate new backup codes
  const backupCodes = generateBackupCodes()
  const hashedBackupCodes = backupCodes.map(hashBackupCode)

  await db.update(adminUsers).set({
    twoFactorBackupCodes: JSON.stringify(hashedBackupCodes),
    updatedAt: new Date(),
  }).where(eq(adminUsers.id, admin.id))

  return c.json({
    backupCodes: backupCodes.map(formatBackupCode),
  })
})

// Helper functions

async function createSession(c: Context, admin: typeof adminUsers.$inferSelect) {
  const token = generateToken({ adminId: admin.id })
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)
  const ipAddress = c.req.header('x-forwarded-for') || c.req.header('x-real-ip')
  const userAgent = c.req.header('user-agent')

  // Store session
  await db.insert(adminSessions).values({
    adminId: admin.id,
    token,
    ipAddress,
    userAgent,
    expiresAt,
  })

  // Update last login
  await db.update(adminUsers).set({
    lastLoginAt: new Date(),
  }).where(eq(adminUsers.id, admin.id))

  // Audit log successful admin login
  await audit.admin.login(admin.id, admin.username, { ip: ipAddress, userAgent })

  return c.json({
    token,
    admin: {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      role: admin.role,
      createdAt: admin.createdAt.getTime(),
      lastLoginAt: Date.now(),
    },
    expiresAt: expiresAt.getTime(),
  })
}

async function getAuthenticatedAdmin(c: Context) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.slice(7)

  // Find valid session
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

function verifyTempToken(token: string): { adminId: string; pending2FA?: boolean } | null {
  const payload = verifyAdminToken(token)
  if (!payload) return null
  return payload
}

export default adminAuth
