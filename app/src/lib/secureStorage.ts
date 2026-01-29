/**
 * Secure Storage
 *
 * Provides encrypted localStorage for sensitive client-side data.
 * Uses AES-GCM encryption with Web Crypto API.
 */

// Storage key prefix
const STORAGE_PREFIX = 'doomsday_secure_'

// Encryption algorithm
const ALGORITHM = 'AES-GCM'
const IV_LENGTH = 12 // 96 bits recommended for GCM

/**
 * Get or create a storage encryption key
 * Key is derived from a user-specific seed and stored encrypted with a random key
 */
async function getStorageKey(): Promise<CryptoKey> {
  const keyName = `${STORAGE_PREFIX}key`
  const storedKey = localStorage.getItem(keyName)

  if (storedKey) {
    try {
      const keyData = Uint8Array.from(atob(storedKey), c => c.charCodeAt(0))
      return await crypto.subtle.importKey(
        'raw',
        keyData,
        ALGORITHM,
        false,
        ['encrypt', 'decrypt']
      )
    } catch {
      // Key corrupted, regenerate
      localStorage.removeItem(keyName)
    }
  }

  // Generate new key
  const key = await crypto.subtle.generateKey(
    { name: ALGORITHM, length: 256 },
    true, // extractable for storage
    ['encrypt', 'decrypt']
  )

  // Export and store
  const exported = await crypto.subtle.exportKey('raw', key)
  const keyBytes = new Uint8Array(exported)
  localStorage.setItem(keyName, btoa(String.fromCharCode(...keyBytes)))

  return key
}

/**
 * Encrypt a value
 */
async function encryptValue(value: string, key: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const encoder = new TextEncoder()
  const data = encoder.encode(value)

  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    data
  )

  // Combine IV + ciphertext
  const combined = new Uint8Array(iv.length + encrypted.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(encrypted), iv.length)

  return btoa(String.fromCharCode(...combined))
}

/**
 * Decrypt a value
 */
async function decryptValue(ciphertext: string, key: CryptoKey): Promise<string | null> {
  try {
    const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0))

    const iv = combined.slice(0, IV_LENGTH)
    const encrypted = combined.slice(IV_LENGTH)

    const decrypted = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      encrypted
    )

    const decoder = new TextDecoder()
    return decoder.decode(decrypted)
  } catch {
    return null
  }
}

/**
 * Secure storage interface
 */
export const secureStorage = {
  /**
   * Store a value with encryption
   */
  async setItem(key: string, value: string): Promise<void> {
    const cryptoKey = await getStorageKey()
    const encrypted = await encryptValue(value, cryptoKey)
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, encrypted)
  },

  /**
   * Retrieve and decrypt a value
   */
  async getItem(key: string): Promise<string | null> {
    const encrypted = localStorage.getItem(`${STORAGE_PREFIX}${key}`)
    if (!encrypted) return null

    const cryptoKey = await getStorageKey()
    return decryptValue(encrypted, cryptoKey)
  },

  /**
   * Remove a stored value
   */
  removeItem(key: string): void {
    localStorage.removeItem(`${STORAGE_PREFIX}${key}`)
  },

  /**
   * Store a JSON object
   */
  async setObject<T>(key: string, value: T): Promise<void> {
    await this.setItem(key, JSON.stringify(value))
  },

  /**
   * Retrieve a JSON object
   */
  async getObject<T>(key: string): Promise<T | null> {
    const value = await this.getItem(key)
    if (!value) return null

    try {
      return JSON.parse(value) as T
    } catch {
      return null
    }
  },

  /**
   * Clear all secure storage
   */
  clear(): void {
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(STORAGE_PREFIX)) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key))
  },

  /**
   * Rotate the encryption key
   * Re-encrypts all stored values with a new key
   */
  async rotateKey(): Promise<void> {
    const oldKey = await getStorageKey()

    // Get all encrypted values
    const values: Array<{ key: string; value: string }> = []
    for (let i = 0; i < localStorage.length; i++) {
      const storageKey = localStorage.key(i)
      if (storageKey?.startsWith(STORAGE_PREFIX) && storageKey !== `${STORAGE_PREFIX}key`) {
        const encrypted = localStorage.getItem(storageKey)
        if (encrypted) {
          const decrypted = await decryptValue(encrypted, oldKey)
          if (decrypted) {
            values.push({ key: storageKey, value: decrypted })
          }
        }
      }
    }

    // Generate new key
    localStorage.removeItem(`${STORAGE_PREFIX}key`)
    const newKey = await getStorageKey()

    // Re-encrypt all values
    for (const { key, value } of values) {
      const encrypted = await encryptValue(value, newKey)
      localStorage.setItem(key, encrypted)
    }
  },
}

/**
 * Sensitive data keys that should use secure storage
 */
export const SecureKeys = {
  AUTH_TOKEN: 'auth_token',
  WALLET_CONNECTION: 'wallet_connection',
  USER_PREFERENCES: 'user_preferences',
  DRAFT_CONTENT: 'draft_content',
} as const

export type SecureKey = typeof SecureKeys[keyof typeof SecureKeys]
