/**
 * Mention Parsing Utilities
 * Issue #56: Add @mentions and user tagging
 *
 * Utilities for extracting and validating @mentions from post content.
 */

/**
 * Regex pattern for matching @mentions
 * - Starts with @
 * - Username: 1-30 alphanumeric chars, underscores allowed
 * - Cannot start/end with underscore
 * - Case insensitive matching
 */
export const MENTION_REGEX = /@([a-zA-Z0-9](?:[a-zA-Z0-9_]{0,28}[a-zA-Z0-9])?)/g

/**
 * Extract all unique usernames mentioned in content
 */
export function extractMentions(content: string): string[] {
  const matches = content.matchAll(MENTION_REGEX)
  const usernames = new Set<string>()

  for (const match of matches) {
    usernames.add(match[1].toLowerCase())
  }

  return Array.from(usernames)
}

/**
 * Validate a single username format
 */
export function isValidUsername(username: string): boolean {
  const pattern = /^[a-zA-Z0-9](?:[a-zA-Z0-9_]{0,28}[a-zA-Z0-9])?$/
  return pattern.test(username)
}

/**
 * Check if a position in text is within a mention
 */
export function getMentionAtPosition(
  content: string,
  cursorPosition: number
): { username: string; start: number; end: number } | null {
  const regex = /@([a-zA-Z0-9](?:[a-zA-Z0-9_]{0,28}[a-zA-Z0-9])?)/g
  let match

  while ((match = regex.exec(content)) !== null) {
    const start = match.index
    const end = start + match[0].length

    if (cursorPosition >= start && cursorPosition <= end) {
      return {
        username: match[1],
        start,
        end,
      }
    }
  }

  return null
}

/**
 * Find the mention being typed at cursor position
 * Returns the partial username being typed or null if not in a mention
 */
export function getPartialMentionAtCursor(
  content: string,
  cursorPosition: number
): { query: string; start: number } | null {
  const textBeforeCursor = content.slice(0, cursorPosition)

  // Find @ symbol before cursor (not preceded by word char)
  const mentionMatch = textBeforeCursor.match(/(?:^|[^a-zA-Z0-9_])@([a-zA-Z0-9_]*)$/)

  if (mentionMatch) {
    const query = mentionMatch[1]
    const start = cursorPosition - query.length - 1 // Position of @
    return { query, start }
  }

  return null
}

/**
 * Replace a mention at a specific position with a new username
 */
export function replaceMentionAtPosition(
  content: string,
  start: number,
  cursorPosition: number,
  newUsername: string
): { newContent: string; newCursorPosition: number } {
  const beforeMention = content.slice(0, start)
  const afterCursor = content.slice(cursorPosition)

  const newContent = `${beforeMention}@${newUsername} ${afterCursor}`
  const newCursorPosition = start + newUsername.length + 2 // @username + space

  return { newContent, newCursorPosition }
}
