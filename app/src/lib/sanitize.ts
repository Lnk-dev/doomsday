/**
 * Content Sanitization Utilities
 *
 * Provides XSS protection for user-generated content.
 * Uses DOMPurify to sanitize HTML and prevent script injection.
 */

import DOMPurify from 'dompurify'
import { INPUT_LIMITS } from './validation'

/**
 * Dangerous URL protocols that should be blocked
 */
const DANGEROUS_PROTOCOLS = [
  'javascript:',
  'vbscript:',
  'data:',
  'file:',
  'about:',
  'blob:',
]

/**
 * Patterns that indicate dangerous content
 */
const DANGEROUS_PATTERNS = [
  /<\s*script/i,
  /<\s*iframe/i,
  /<\s*object/i,
  /<\s*embed/i,
  /javascript\s*:/i,
  /vbscript\s*:/i,
  /on\w+\s*=/i,
  /data\s*:[^,]*;base64/i,
]

/**
 * Sanitize user-generated text content.
 * Strips all HTML tags and entities, returning plain text.
 */
export function sanitizeText(input: string): string {
  if (!input) return ''

  // Remove all HTML tags
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No tags allowed
    ALLOWED_ATTR: [], // No attributes allowed
  })
}

/**
 * Sanitize content that may contain safe HTML.
 * Allows basic formatting but strips dangerous elements.
 */
export function sanitizeHtml(input: string): string {
  if (!input) return ''

  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ADD_ATTR: ['target'], // Allow target attribute
    FORCE_BODY: true,
  })
}

/**
 * Escape special characters for safe display.
 * Use when rendering text that should NOT be interpreted as HTML.
 */
export function escapeHtml(input: string): string {
  if (!input) return ''

  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }

  return input.replace(/[&<>"']/g, (char) => htmlEscapes[char])
}

/**
 * Validate and sanitize a username.
 * Only allows alphanumeric characters and underscores.
 */
export function sanitizeUsername(input: string): string {
  if (!input) return ''

  return input
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, INPUT_LIMITS.USERNAME_MAX)
}

/**
 * Validate a URL is safe (http/https only).
 */
export function isValidUrl(input: string): boolean {
  try {
    const url = new URL(input)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

// ============================================================================
// Enhanced Sanitization Functions
// ============================================================================

/**
 * Sanitize a URL by removing dangerous protocols
 * Returns empty string if URL is invalid or uses dangerous protocol
 * @param input - URL to sanitize
 * @returns Sanitized URL or empty string
 */
export function sanitizeUrl(input: string): string {
  if (!input) return ''

  const trimmed = input.trim()

  // Check for dangerous protocols
  const lowerUrl = trimmed.toLowerCase()
  for (const protocol of DANGEROUS_PROTOCOLS) {
    if (lowerUrl.startsWith(protocol)) {
      return ''
    }
  }

  // Validate URL format
  try {
    const url = new URL(trimmed)
    // Only allow http and https
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return ''
    }
    return trimmed
  } catch {
    // If it's not a valid URL, return empty
    return ''
  }
}

/**
 * Sanitize user bio content
 * Strips HTML, enforces length limit, removes dangerous patterns
 * @param input - Bio content to sanitize
 * @returns Sanitized bio
 */
export function sanitizeBio(input: string): string {
  if (!input) return ''

  // Strip all HTML
  let sanitized = sanitizeText(input)

  // Trim whitespace
  sanitized = sanitized.trim()

  // Enforce length limit
  if (sanitized.length > INPUT_LIMITS.BIO_MAX) {
    sanitized = sanitized.slice(0, INPUT_LIMITS.BIO_MAX)
  }

  return sanitized
}

/**
 * Sanitize post content
 * Strips dangerous HTML, enforces length limit
 * @param input - Post content to sanitize
 * @returns Sanitized post content
 */
export function sanitizePostContent(input: string): string {
  if (!input) return ''

  // Strip all HTML tags
  let sanitized = sanitizeText(input)

  // Trim whitespace
  sanitized = sanitized.trim()

  // Enforce length limit
  if (sanitized.length > INPUT_LIMITS.POST_CONTENT_MAX) {
    sanitized = sanitized.slice(0, INPUT_LIMITS.POST_CONTENT_MAX)
  }

  return sanitized
}

/**
 * Sanitize event title
 * Strips HTML, enforces length limit
 * @param input - Event title to sanitize
 * @returns Sanitized event title
 */
export function sanitizeEventTitle(input: string): string {
  if (!input) return ''

  // Strip all HTML
  let sanitized = sanitizeText(input)

  // Trim whitespace
  sanitized = sanitized.trim()

  // Enforce length limit
  if (sanitized.length > INPUT_LIMITS.EVENT_TITLE_MAX) {
    sanitized = sanitized.slice(0, INPUT_LIMITS.EVENT_TITLE_MAX)
  }

  return sanitized
}

/**
 * Sanitize event description
 * Strips dangerous HTML, enforces length limit
 * @param input - Event description to sanitize
 * @returns Sanitized event description
 */
export function sanitizeEventDescription(input: string): string {
  if (!input) return ''

  // Strip all HTML
  let sanitized = sanitizeText(input)

  // Trim whitespace
  sanitized = sanitized.trim()

  // Enforce length limit
  if (sanitized.length > INPUT_LIMITS.EVENT_DESCRIPTION_MAX) {
    sanitized = sanitized.slice(0, INPUT_LIMITS.EVENT_DESCRIPTION_MAX)
  }

  return sanitized
}

/**
 * Quick check for dangerous content patterns
 * Use this for fast preliminary checks before more thorough sanitization
 * @param input - Content to check
 * @returns true if dangerous patterns are detected
 */
export function containsDangerousContent(input: string): boolean {
  if (!input) return false

  // Check against all dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(input)) {
      return true
    }
  }

  // Check for dangerous URL protocols in any part of the string
  const lowerInput = input.toLowerCase()
  for (const protocol of DANGEROUS_PROTOCOLS) {
    if (lowerInput.includes(protocol)) {
      return true
    }
  }

  return false
}
