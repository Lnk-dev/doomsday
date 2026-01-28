/**
 * Spam Detection and Prevention Utilities
 *
 * Provides comprehensive spam detection for user-generated content including:
 * - Content-based detection (patterns, scoring, prohibited content)
 * - Behavior-based detection (rapid posting, duplicates, new account spam)
 * - Configurable thresholds and cooldowns
 */

// ============================================================================
// Configuration Constants
// ============================================================================

/**
 * Configurable thresholds for spam detection
 */
export const SPAM_THRESHOLDS = {
  /** Spam score threshold (0-100) above which content is flagged */
  SPAM_SCORE_THRESHOLD: 70,
  /** Maximum percentage of content that can be ALL CAPS */
  MAX_CAPS_PERCENTAGE: 0.7,
  /** Maximum consecutive repeated characters allowed */
  MAX_REPEATED_CHARS: 5,
  /** Maximum number of exclamation/question marks in a row */
  MAX_CONSECUTIVE_PUNCTUATION: 3,
  /** Minimum account age in days before posting freely */
  MIN_ACCOUNT_AGE_DAYS: 1,
  /** Maximum posts allowed for new accounts (< MIN_ACCOUNT_AGE_DAYS) */
  NEW_ACCOUNT_POST_LIMIT: 5,
  /** Similarity threshold (0-1) for duplicate detection */
  DUPLICATE_SIMILARITY_THRESHOLD: 0.85,
  /** Number of recent posts to check for duplicates */
  DUPLICATE_CHECK_WINDOW: 10,
} as const

/**
 * Rate limiting cooldowns in milliseconds
 */
export const SPAM_COOLDOWNS = {
  /** Minimum time between posts (ms) */
  MIN_POST_INTERVAL: 30_000, // 30 seconds
  /** Minimum time between comments (ms) */
  MIN_COMMENT_INTERVAL: 10_000, // 10 seconds
  /** Time window for rapid posting detection (ms) */
  RAPID_POSTING_WINDOW: 60_000, // 1 minute
  /** Maximum posts allowed in RAPID_POSTING_WINDOW */
  MAX_POSTS_PER_WINDOW: 5,
} as const

/**
 * Regex patterns for detecting prohibited/spam content
 */
export const PROHIBITED_PATTERNS: RegExp[] = [
  // Crypto/financial scams
  /\b(free\s*crypto|double\s*your\s*(money|crypto|btc|eth))\b/i,
  /\b(send\s*\d+\s*(btc|eth|sol)\s*get\s*\d+\s*back)\b/i,
  /\b(guaranteed\s*(profit|returns|roi))\b/i,
  /\b(get\s*rich\s*quick)\b/i,
  /\b(investment\s*opportunity|limited\s*time\s*offer)\b/i,

  // Phishing patterns
  /\b(verify\s*your\s*(account|wallet)|confirm\s*your\s*identity)\b/i,
  /\b(click\s*(here|this\s*link)\s*to\s*(claim|verify|secure))\b/i,
  /\b(your\s*account\s*(has\s*been|will\s*be)\s*(suspended|locked|compromised))\b/i,

  // Generic spam
  /\b(act\s*now|don'?t\s*miss\s*out|hurry|urgent)\b/i,
  /\b(congratulations\s*you('ve)?\s*won)\b/i,
  /\b(100%\s*(free|guaranteed|safe))\b/i,
  /\b(no\s*risk|risk\s*free)\b/i,

  // Adult/inappropriate content indicators
  /\b(18\+|adult\s*content|xxx)\b/i,

  // Excessive self-promotion
  /\b(follow\s*me|sub(scribe)?\s*to\s*my)\b/i,
  /\b(check\s*out\s*my\s*(link|profile|channel))\b/i,
]

/**
 * Suspicious URL patterns
 */
const SUSPICIOUS_URL_PATTERNS: RegExp[] = [
  // URL shorteners (often used to hide malicious links)
  /\b(bit\.ly|tinyurl|t\.co|goo\.gl|ow\.ly|is\.gd|buff\.ly|adf\.ly|j\.mp)\b/i,
  // IP address URLs
  /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/i,
  // Suspicious TLDs
  /\.(xyz|tk|ml|ga|cf|gq|top|work|click|link|download)\b/i,
  // Long random-looking subdomains
  /https?:\/\/[a-z0-9]{20,}\./i,
]

// ============================================================================
// Types
// ============================================================================

export interface SpamDetectionResult {
  isSpam: boolean
  spamScore: number
  reasons: string[]
}

export interface SpamPatternResult {
  hasSpamPatterns: boolean
  patterns: string[]
}

export interface RecentPost {
  content: string
  timestamp: number
}

// ============================================================================
// Content-Based Detection Functions
// ============================================================================

/**
 * Detect common spam patterns in content
 * Checks for: ALL CAPS, excessive punctuation, repeated characters, suspicious URLs
 *
 * @param content - The content to analyze
 * @returns Object indicating if spam patterns were found and which ones
 */
export function detectSpamPatterns(content: string): SpamPatternResult {
  const patterns: string[] = []

  if (!content || content.trim().length === 0) {
    return { hasSpamPatterns: false, patterns: [] }
  }

  const trimmedContent = content.trim()

  // Check for excessive ALL CAPS
  const letters = trimmedContent.replace(/[^a-zA-Z]/g, '')
  if (letters.length > 10) {
    const upperCount = letters.replace(/[^A-Z]/g, '').length
    const capsRatio = upperCount / letters.length
    if (capsRatio > SPAM_THRESHOLDS.MAX_CAPS_PERCENTAGE) {
      patterns.push('Excessive use of capital letters')
    }
  }

  // Check for excessive consecutive punctuation (!!!, ???, etc.)
  const punctuationRegex = new RegExp(
    `[!?]{${SPAM_THRESHOLDS.MAX_CONSECUTIVE_PUNCTUATION + 1},}`,
    'g'
  )
  if (punctuationRegex.test(trimmedContent)) {
    patterns.push('Excessive punctuation')
  }

  // Check for repeated characters (e.g., "heeeeeelp", "nooooo")
  const repeatedCharsRegex = new RegExp(
    `(.)\\1{${SPAM_THRESHOLDS.MAX_REPEATED_CHARS},}`,
    'gi'
  )
  if (repeatedCharsRegex.test(trimmedContent)) {
    patterns.push('Repeated characters')
  }

  // Check for suspicious URLs
  for (const urlPattern of SUSPICIOUS_URL_PATTERNS) {
    if (urlPattern.test(trimmedContent)) {
      patterns.push('Suspicious URL detected')
      break
    }
  }

  // Check for excessive URLs (more than 3 links)
  const urlMatches = trimmedContent.match(/https?:\/\/[^\s]+/g)
  if (urlMatches && urlMatches.length > 3) {
    patterns.push('Too many links')
  }

  // Check for excessive hashtags
  const hashtagMatches = trimmedContent.match(/#\w+/g)
  if (hashtagMatches && hashtagMatches.length > 10) {
    patterns.push('Excessive hashtags')
  }

  // Check for excessive mentions
  const mentionMatches = trimmedContent.match(/@\w+/g)
  if (mentionMatches && mentionMatches.length > 10) {
    patterns.push('Excessive mentions')
  }

  return {
    hasSpamPatterns: patterns.length > 0,
    patterns,
  }
}

/**
 * Calculate a spam probability score for content
 * Returns a score from 0 (not spam) to 100 (definitely spam)
 *
 * @param content - The content to analyze
 * @returns Spam score between 0 and 100
 */
export function calculateSpamScore(content: string): number {
  if (!content || content.trim().length === 0) {
    return 0
  }

  let score = 0
  const trimmedContent = content.trim()

  // Pattern-based scoring
  const patternResult = detectSpamPatterns(trimmedContent)
  score += patternResult.patterns.length * 15 // Each pattern adds 15 points

  // Prohibited content scoring
  if (containsProhibitedContent(trimmedContent)) {
    score += 40 // Major red flag
  }

  // ALL CAPS scoring (graduated)
  const letters = trimmedContent.replace(/[^a-zA-Z]/g, '')
  if (letters.length > 10) {
    const upperCount = letters.replace(/[^A-Z]/g, '').length
    const capsRatio = upperCount / letters.length
    if (capsRatio > 0.5) {
      score += Math.floor(capsRatio * 20) // Up to 20 points
    }
  }

  // Very short content with links is suspicious
  if (trimmedContent.length < 50 && /https?:\/\//.test(trimmedContent)) {
    score += 15
  }

  // Excessive whitespace/newlines can indicate formatting manipulation
  const whitespaceRatio = (trimmedContent.match(/\s/g)?.length || 0) / trimmedContent.length
  if (whitespaceRatio > 0.5) {
    score += 10
  }

  // Multiple exclamation marks (even if not consecutive)
  const exclamationCount = (trimmedContent.match(/!/g) || []).length
  if (exclamationCount > 5) {
    score += Math.min(exclamationCount - 5, 15) // Up to 15 points
  }

  // Unicode abuse (lots of emojis or special characters)
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]/gu
  const emojiCount = (trimmedContent.match(emojiRegex) || []).length
  if (emojiCount > 10) {
    score += 10
  }

  // Cap the score at 100
  return Math.min(score, 100)
}

/**
 * Check if content contains prohibited words or phrases
 *
 * @param content - The content to check
 * @returns true if prohibited content is found
 */
export function containsProhibitedContent(content: string): boolean {
  if (!content || content.trim().length === 0) {
    return false
  }

  const trimmedContent = content.trim()

  for (const pattern of PROHIBITED_PATTERNS) {
    if (pattern.test(trimmedContent)) {
      return true
    }
  }

  return false
}

// ============================================================================
// Behavior-Based Detection Functions
// ============================================================================

/**
 * Detect if a user is posting too rapidly
 * Checks if posts are coming faster than allowed thresholds
 *
 * @param userId - The user's ID (for logging/tracking purposes)
 * @param timestamps - Array of recent post timestamps (in ms)
 * @returns true if rapid posting is detected
 */
export function isRapidPosting(_userId: string, timestamps: number[]): boolean {
  if (!timestamps || timestamps.length === 0) {
    return false
  }

  // Sort timestamps in descending order (most recent first)
  const sorted = [...timestamps].sort((a, b) => b - a)
  const now = Date.now()

  // Check minimum interval between last post and now
  if (sorted[0] && now - sorted[0] < SPAM_COOLDOWNS.MIN_POST_INTERVAL) {
    return true
  }

  // Check posts within the rapid posting window
  const windowStart = now - SPAM_COOLDOWNS.RAPID_POSTING_WINDOW
  const postsInWindow = sorted.filter((ts) => ts >= windowStart)

  if (postsInWindow.length >= SPAM_COOLDOWNS.MAX_POSTS_PER_WINDOW) {
    return true
  }

  return false
}

/**
 * Detect if content is a duplicate of recent posts
 * Uses simple similarity check based on normalized content comparison
 *
 * @param content - The new content to check
 * @param recentPosts - Array of recent posts to compare against
 * @returns true if duplicate content is detected
 */
export function isDuplicateContent(content: string, recentPosts: RecentPost[]): boolean {
  if (!content || content.trim().length === 0 || !recentPosts || recentPosts.length === 0) {
    return false
  }

  const normalizedContent = normalizeForComparison(content)

  // Check against recent posts (up to the check window limit)
  const postsToCheck = recentPosts.slice(0, SPAM_THRESHOLDS.DUPLICATE_CHECK_WINDOW)

  for (const post of postsToCheck) {
    const normalizedPost = normalizeForComparison(post.content)
    const similarity = calculateSimilarity(normalizedContent, normalizedPost)

    if (similarity >= SPAM_THRESHOLDS.DUPLICATE_SIMILARITY_THRESHOLD) {
      return true
    }
  }

  return false
}

/**
 * Detect suspicious new account behavior
 * New accounts with high post counts are flagged as potential spam
 *
 * @param accountAgeMs - Account age in milliseconds
 * @param postCount - Number of posts the account has made
 * @returns true if the account shows suspicious new account spam patterns
 */
export function isNewAccountSpam(accountAgeMs: number, postCount: number): boolean {
  const accountAgeDays = accountAgeMs / (1000 * 60 * 60 * 24)

  // If account is newer than the minimum age threshold
  if (accountAgeDays < SPAM_THRESHOLDS.MIN_ACCOUNT_AGE_DAYS) {
    // Check if they've exceeded the new account post limit
    if (postCount > SPAM_THRESHOLDS.NEW_ACCOUNT_POST_LIMIT) {
      return true
    }
  }

  // Very new accounts (< 1 hour) with any significant activity
  const accountAgeHours = accountAgeMs / (1000 * 60 * 60)
  if (accountAgeHours < 1 && postCount > 2) {
    return true
  }

  return false
}

// ============================================================================
// Combined Detection Function
// ============================================================================

/**
 * Perform comprehensive spam detection on content
 * Combines content-based and behavior-based checks
 *
 * @param content - The content to analyze
 * @param options - Optional parameters for behavior-based checks
 * @returns Complete spam detection result with score and reasons
 */
export function detectSpam(
  content: string,
  options?: {
    userId?: string
    postTimestamps?: number[]
    recentPosts?: RecentPost[]
    accountAgeMs?: number
    postCount?: number
  }
): SpamDetectionResult {
  const reasons: string[] = []

  // Content-based detection
  const spamScore = calculateSpamScore(content)

  const patternResult = detectSpamPatterns(content)
  if (patternResult.hasSpamPatterns) {
    reasons.push(...patternResult.patterns)
  }

  if (containsProhibitedContent(content)) {
    reasons.push('Contains prohibited content')
  }

  // Behavior-based detection (if options provided)
  if (options) {
    const { userId, postTimestamps, recentPosts, accountAgeMs, postCount } = options

    if (userId && postTimestamps && isRapidPosting(userId, postTimestamps)) {
      reasons.push('Posting too rapidly')
    }

    if (recentPosts && isDuplicateContent(content, recentPosts)) {
      reasons.push('Duplicate content detected')
    }

    if (accountAgeMs !== undefined && postCount !== undefined) {
      if (isNewAccountSpam(accountAgeMs, postCount)) {
        reasons.push('Suspicious new account activity')
      }
    }
  }

  const isSpam =
    spamScore >= SPAM_THRESHOLDS.SPAM_SCORE_THRESHOLD || reasons.length > 0

  return {
    isSpam,
    spamScore,
    reasons,
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Normalize content for comparison (lowercase, remove extra whitespace, etc.)
 */
function normalizeForComparison(content: string): string {
  return content
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .trim()
}

/**
 * Calculate similarity between two strings (0-1)
 * Uses a simple character-based comparison
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1
  if (str1.length === 0 || str2.length === 0) return 0

  // Use Jaccard similarity on word sets for efficiency
  const words1 = new Set(str1.split(' '))
  const words2 = new Set(str2.split(' '))

  const intersection = new Set([...words1].filter((x) => words2.has(x)))
  const union = new Set([...words1, ...words2])

  return intersection.size / union.size
}
