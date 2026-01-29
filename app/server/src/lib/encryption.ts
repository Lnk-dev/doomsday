/**
 * Field-Level Encryption
 *
 * Provides encryption at rest for sensitive database fields like:
 * - 2FA secrets
 * - API keys
 * - Other sensitive data
 *
 * Uses AES-256-GCM for authenticated encryption.
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16 // 128 bits
const AUTH_TAG_LENGTH = 16 // 128 bits
const SALT_LENGTH = 32 // 256 bits
const KEY_LENGTH = 32 // 256 bits for AES-256

const isProduction = process.env.NODE_ENV === 'production'

/**
 * Get encryption key from environment
 * Derives a 256-bit key using scrypt for key stretching
 */
function getEncryptionKey(salt: Buffer): Buffer {
  const masterKey = process.env.ENCRYPTION_KEY

  if (!masterKey && isProduction) {
    throw new Error('ENCRYPTION_KEY environment variable must be set in production')
  }

  if (!masterKey) {
    console.warn('[SECURITY WARNING] Using default encryption key - only acceptable in development')
    const defaultKey = 'dev-encryption-key-do-not-use-in-production'
    return scryptSync(defaultKey, salt, KEY_LENGTH)
  }

  if (masterKey.length < 32) {
    console.warn('[SECURITY WARNING] ENCRYPTION_KEY should be at least 32 characters for security')
  }

  return scryptSync(masterKey, salt, KEY_LENGTH)
}

/**
 * Encrypt a string value
 *
 * @param plaintext - The value to encrypt
 * @returns Base64-encoded string containing: salt + iv + authTag + ciphertext
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return ''

  const salt = randomBytes(SALT_LENGTH)
  const key = getEncryptionKey(salt)
  const iv = randomBytes(IV_LENGTH)

  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])

  const authTag = cipher.getAuthTag()

  // Combine all parts: salt (32) + iv (16) + authTag (16) + ciphertext
  const combined = Buffer.concat([salt, iv, authTag, encrypted])

  return combined.toString('base64')
}

/**
 * Decrypt a string value
 *
 * @param ciphertext - Base64-encoded encrypted value from encrypt()
 * @returns Decrypted plaintext, or null if decryption fails
 */
export function decrypt(ciphertext: string): string | null {
  if (!ciphertext) return null

  try {
    const combined = Buffer.from(ciphertext, 'base64')

    // Extract parts
    const salt = combined.subarray(0, SALT_LENGTH)
    const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
    const authTag = combined.subarray(
      SALT_LENGTH + IV_LENGTH,
      SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH
    )
    const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH)

    const key = getEncryptionKey(salt)

    const decipher = createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ])

    return decrypted.toString('utf8')
  } catch (error) {
    // Decryption failed - could be wrong key, corrupted data, or tampering
    console.error('Decryption failed:', error instanceof Error ? error.message : 'Unknown error')
    return null
  }
}

/**
 * Encrypt a JSON object
 */
export function encryptObject<T>(obj: T): string {
  return encrypt(JSON.stringify(obj))
}

/**
 * Decrypt to a JSON object
 */
export function decryptObject<T>(ciphertext: string): T | null {
  const plaintext = decrypt(ciphertext)
  if (!plaintext) return null

  try {
    return JSON.parse(plaintext) as T
  } catch {
    return null
  }
}

/**
 * Re-encrypt data with a new key
 * Useful for key rotation
 */
export function reEncrypt(
  ciphertext: string,
  oldKey: string,
  newKey: string
): string {
  // Temporarily override the environment key
  const originalKey = process.env.ENCRYPTION_KEY

  // Decrypt with old key
  process.env.ENCRYPTION_KEY = oldKey
  const plaintext = decrypt(ciphertext)

  if (!plaintext) {
    process.env.ENCRYPTION_KEY = originalKey
    throw new Error('Failed to decrypt with old key')
  }

  // Encrypt with new key
  process.env.ENCRYPTION_KEY = newKey
  const result = encrypt(plaintext)

  // Restore original
  process.env.ENCRYPTION_KEY = originalKey

  return result
}

/**
 * Check if a value appears to be encrypted
 * (basic check - looks for base64 format with expected length)
 */
export function isEncrypted(value: string): boolean {
  if (!value) return false

  try {
    const decoded = Buffer.from(value, 'base64')
    // Minimum size: salt (32) + iv (16) + authTag (16) + at least 1 byte ciphertext
    return decoded.length >= SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH + 1
  } catch {
    return false
  }
}
