/**
 * TOTP (Time-based One-Time Password) Utilities
 *
 * Provides functions for 2FA setup, verification, and backup codes.
 * Secrets are encrypted at rest using AES-256-GCM.
 */

import { generateSecret as genSecret, generateURI, verifySync } from 'otplib'
import * as QRCode from 'qrcode'
import { randomBytes, createHash } from 'crypto'
import { encrypt, decrypt, isEncrypted } from './encryption'

const APP_NAME = 'Doomsday Admin'

/**
 * Generate a new TOTP secret
 */
export function generateSecret(): string {
  return genSecret()
}

/**
 * Encrypt a TOTP secret for storage
 */
export function encryptSecret(secret: string): string {
  return encrypt(secret)
}

/**
 * Decrypt a stored TOTP secret
 * Handles both encrypted and legacy unencrypted secrets
 */
export function decryptSecret(encryptedSecret: string): string | null {
  if (!encryptedSecret) return null

  // Check if this is an encrypted value
  if (isEncrypted(encryptedSecret)) {
    return decrypt(encryptedSecret)
  }

  // Legacy unencrypted secret (base32 format, typically 32 chars)
  // Return as-is for backwards compatibility during migration
  return encryptedSecret
}

/**
 * Generate a QR code data URL for TOTP setup
 */
export async function generateQRCode(secret: string, username: string): Promise<string> {
  const otpauth = generateURI({
    issuer: APP_NAME,
    label: username,
    secret,
    algorithm: 'sha1',
    digits: 6,
    period: 30,
  })
  return QRCode.toDataURL(otpauth)
}

/**
 * Verify a TOTP token
 * Automatically decrypts the secret if it's encrypted
 */
export function verifyToken(token: string, storedSecret: string): boolean {
  try {
    // Decrypt the secret if it's encrypted
    const secret = decryptSecret(storedSecret)
    if (!secret) {
      return false
    }

    const result = verifySync({ token, secret })
    return result.valid
  } catch {
    return false
  }
}

/**
 * Generate backup codes (8 codes, 8 characters each)
 */
export function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = []
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = randomBytes(4).toString('hex').toUpperCase()
    codes.push(code)
  }
  return codes
}

/**
 * Hash a backup code for storage
 */
export function hashBackupCode(code: string): string {
  return createHash('sha256').update(code.toUpperCase()).digest('hex')
}

/**
 * Verify a backup code against stored hashes
 * Returns the index of the matched code, or -1 if not found
 */
export function verifyBackupCode(code: string, hashedCodes: string[]): number {
  const inputHash = hashBackupCode(code)
  return hashedCodes.findIndex(hash => hash === inputHash)
}

/**
 * Format backup codes for display (with dashes for readability)
 */
export function formatBackupCode(code: string): string {
  return `${code.slice(0, 4)}-${code.slice(4)}`
}
