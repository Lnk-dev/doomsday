/**
 * Content Sanitization Utilities
 *
 * Provides XSS protection for user-generated content.
 * Uses DOMPurify to sanitize HTML and prevent script injection.
 */

import DOMPurify from 'dompurify'

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
    .slice(0, 30)
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
