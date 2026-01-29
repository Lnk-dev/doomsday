/**
 * Input Sanitization Library
 *
 * Server-side sanitization to prevent stored XSS attacks.
 * Works alongside frontend escaping as defense-in-depth.
 */

/**
 * HTML entities to escape
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
}

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(input: string): string {
  return input.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char)
}

/**
 * Remove all HTML tags from input
 */
export function stripHtml(input: string): string {
  return input
    // Remove script tags and their contents
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove style tags and their contents
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Remove all HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove HTML entities that could be used for XSS
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/data:/gi, 'data-blocked:')
}

/**
 * Sanitize user-generated content (posts, comments, bios)
 *
 * - Removes all HTML tags
 * - Removes dangerous patterns (javascript:, event handlers)
 * - Normalizes whitespace
 * - Trims to max length
 */
export function sanitizeUserContent(input: string, maxLength?: number): string {
  // Remove control characters except newlines (\x0A) and tabs (\x09)
  // Using character code checks instead of regex to avoid eslint no-control-regex
  let sanitized = ''
  for (const char of input) {
    const code = char.charCodeAt(0)
    // Allow printable ASCII, newlines (10), tabs (9), and extended characters
    if (code === 9 || code === 10 || (code >= 32 && code !== 127)) {
      sanitized += char
    }
  }

  // Strip HTML tags
  sanitized = stripHtml(sanitized)

  // Remove zero-width characters (can be used for homograph attacks)
  sanitized = sanitized.replace(/[\u200B-\u200D\uFEFF]/g, '')

  // Normalize unicode to prevent homograph attacks
  sanitized = sanitized.normalize('NFKC')

  // Normalize whitespace (collapse multiple spaces, preserve single newlines)
  sanitized = sanitized
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ') // Collapse spaces and tabs
    .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
    .trim()

  // Enforce max length if provided
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength)
  }

  return sanitized
}

/**
 * Sanitize username
 *
 * - Only allows alphanumeric and underscores
 * - Converts to lowercase
 */
export function sanitizeUsername(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 30)
}

/**
 * Sanitize display name
 *
 * - Allows more characters than username
 * - Removes HTML and control characters
 */
export function sanitizeDisplayName(input: string): string {
  return sanitizeUserContent(input, 50)
    .replace(/\n/g, ' ') // No newlines in display names
    .trim()
}

/**
 * Sanitize URL
 *
 * - Only allows http and https protocols
 * - Blocks javascript: and data: URIs
 */
export function sanitizeUrl(input: string): string | null {
  try {
    const url = new URL(input)

    // Only allow http and https
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null
    }

    // Block URLs with credentials
    if (url.username || url.password) {
      return null
    }

    return url.toString()
  } catch {
    return null
  }
}

/**
 * Sanitize avatar URL
 *
 * - Must be valid https URL
 * - Must be from allowed domains
 */
const ALLOWED_AVATAR_DOMAINS = [
  'githubusercontent.com',
  'gravatar.com',
  'cloudflare-ipfs.com',
  'storage.googleapis.com',
  's3.amazonaws.com',
  'ipfs.io',
]

export function sanitizeAvatarUrl(input: string): string | null {
  const url = sanitizeUrl(input)
  if (!url) return null

  try {
    const parsed = new URL(url)

    // Must be HTTPS
    if (parsed.protocol !== 'https:') {
      return null
    }

    // Check against allowed domains
    const isAllowed = ALLOWED_AVATAR_DOMAINS.some(
      (domain) => parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
    )

    if (!isAllowed) {
      // If not from allowed domain, return null (or could return a default)
      return null
    }

    return url
  } catch {
    return null
  }
}

/**
 * Create a sanitization middleware helper for Zod schemas
 */
export const sanitizers = {
  content: (maxLength: number) => (val: string) => sanitizeUserContent(val, maxLength),
  username: sanitizeUsername,
  displayName: sanitizeDisplayName,
  url: sanitizeUrl,
  avatarUrl: sanitizeAvatarUrl,
}
