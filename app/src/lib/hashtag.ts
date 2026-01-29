/**
 * Hashtag utilities for parsing, extracting, and formatting hashtags
 */

/** Regex pattern for matching hashtags in text */
export const HASHTAG_REGEX = /(?:^|\s)(#[a-zA-Z][a-zA-Z0-9_]{0,29})(?=\s|$|[.,!?;:'"])/g

/** Regex for validating a single hashtag */
export const VALID_HASHTAG_REGEX = /^#[a-zA-Z][a-zA-Z0-9_]{0,29}$/

/**
 * Extract all hashtags from content
 * @param content - Post content string
 * @returns Array of unique hashtags (lowercase, without #)
 */
export function extractHashtags(content: string): string[] {
  const hashtags = new Set<string>()

  // Reset regex state
  HASHTAG_REGEX.lastIndex = 0

  let match
  while ((match = HASHTAG_REGEX.exec(content)) !== null) {
    const tag = match[1].toLowerCase().trim()
    if (isValidHashtag(tag)) {
      // Store without # prefix
      hashtags.add(tag.slice(1))
    }
  }

  return Array.from(hashtags)
}

/**
 * Validate a single hashtag
 */
export function isValidHashtag(tag: string): boolean {
  return VALID_HASHTAG_REGEX.test(tag) && tag.length >= 2 && tag.length <= 31
}

/**
 * Normalize hashtag for storage/comparison
 */
export function normalizeHashtag(tag: string): string {
  // Remove # prefix if present, lowercase
  return tag.replace(/^#/, '').toLowerCase()
}

/**
 * Format hashtag for display (with #)
 */
export function formatHashtag(tag: string): string {
  const normalized = normalizeHashtag(tag)
  return `#${normalized}`
}

/**
 * Parse content into segments of text and hashtags
 */
export function parseContentWithHashtags(
  content: string
): Array<{ type: 'text' | 'hashtag'; value: string }> {
  const parts: Array<{ type: 'text' | 'hashtag'; value: string }> = []
  let lastIndex = 0

  // Reset regex state
  HASHTAG_REGEX.lastIndex = 0

  let match
  while ((match = HASHTAG_REGEX.exec(content)) !== null) {
    const fullMatch = match[0]
    const hashtag = match[1]
    const startIndex = match.index + (fullMatch.length - hashtag.length)

    // Add text before hashtag (including leading space if any)
    if (startIndex > lastIndex) {
      parts.push({ type: 'text', value: content.slice(lastIndex, startIndex) })
    }

    // Add hashtag
    parts.push({ type: 'hashtag', value: hashtag })
    lastIndex = startIndex + hashtag.length
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push({ type: 'text', value: content.slice(lastIndex) })
  }

  return parts
}
