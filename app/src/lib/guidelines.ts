/**
 * Community Guidelines
 *
 * Defines community rules and content violation checking utilities.
 * Used to maintain a healthy community environment on the Doomsday platform.
 */

/**
 * Violation types that can be reported
 */
export const ViolationType = {
  SPAM: 'SPAM',
  HATE_SPEECH: 'HATE_SPEECH',
  HARASSMENT: 'HARASSMENT',
  MISINFORMATION: 'MISINFORMATION',
  NSFW: 'NSFW',
  OTHER: 'OTHER',
} as const

export type ViolationType = (typeof ViolationType)[keyof typeof ViolationType]

/**
 * Severity levels for violations
 */
export type ViolationSeverity = 'warning' | 'temporary_ban' | 'permanent_ban'

/**
 * Community guideline rule definition
 */
export interface CommunityRule {
  id: string
  title: string
  description: string
  violationType: ViolationType
}

/**
 * Community guidelines constant with all rules
 */
export const COMMUNITY_GUIDELINES: CommunityRule[] = [
  {
    id: 'no-hate-speech',
    title: 'No Hate Speech',
    description:
      'Content that promotes hatred, discrimination, or violence against individuals or groups based on race, ethnicity, religion, gender, sexual orientation, disability, or other protected characteristics is strictly prohibited.',
    violationType: ViolationType.HATE_SPEECH,
  },
  {
    id: 'no-spam',
    title: 'No Spam',
    description:
      'Repetitive posts, unsolicited promotions, misleading links, and any form of automated or excessive posting designed to manipulate engagement is not allowed.',
    violationType: ViolationType.SPAM,
  },
  {
    id: 'no-harassment',
    title: 'No Harassment',
    description:
      'Bullying, stalking, doxxing, threats, or any behavior intended to intimidate, harm, or silence other users is prohibited. Treat all community members with respect.',
    violationType: ViolationType.HARASSMENT,
  },
  {
    id: 'no-misinformation',
    title: 'No Misinformation',
    description:
      'Deliberately spreading false information, especially regarding health, safety, or predictions presented as fact without evidence, undermines community trust and is not permitted.',
    violationType: ViolationType.MISINFORMATION,
  },
  {
    id: 'no-nsfw',
    title: 'No NSFW Content',
    description:
      'Sexually explicit content, graphic violence, or other material inappropriate for general audiences is not allowed. Keep content suitable for all users.',
    violationType: ViolationType.NSFW,
  },
  {
    id: 'respect-community',
    title: 'Respect the Community',
    description:
      'Engage constructively with predictions and discussions. While doom-posting is part of our platform, personal attacks and bad-faith engagement harm the community.',
    violationType: ViolationType.OTHER,
  },
  {
    id: 'no-impersonation',
    title: 'No Impersonation',
    description:
      'Do not pretend to be another person, organization, or entity. This includes using misleading usernames, avatars, or claims of false affiliations.',
    violationType: ViolationType.OTHER,
  },
  {
    id: 'no-manipulation',
    title: 'No Market Manipulation',
    description:
      'Coordinated efforts to artificially influence prediction markets, token values, or engagement metrics through deceptive means is strictly prohibited.',
    violationType: ViolationType.SPAM,
  },
]

/**
 * Result of content violation check
 */
export interface ViolationCheckResult {
  hasViolation: boolean
  violationType: ViolationType | null
  confidence: number
  matchedPatterns: string[]
}

/**
 * Patterns for detecting potential violations
 * Note: This is a basic implementation. Production would use ML models.
 */
const VIOLATION_PATTERNS: Record<ViolationType, RegExp[]> = {
  [ViolationType.SPAM]: [
    /(.)\1{10,}/i, // Repeated characters
    /(buy|sell|click|free|winner).{0,20}(now|today|here)/i, // Common spam phrases
    /https?:\/\/[^\s]+\s+https?:\/\/[^\s]+\s+https?:\/\/[^\s]+/i, // Multiple links
  ],
  [ViolationType.HATE_SPEECH]: [
    // Placeholder patterns - production would use comprehensive wordlists
    /\b(kill|murder|death to)\s+(all|every)\s+\w+/i,
  ],
  [ViolationType.HARASSMENT]: [
    /\b(kys|kill yourself|go die)\b/i,
    /\bi('ll|'m going to)\s+(find|hunt|get)\s+you\b/i,
  ],
  [ViolationType.MISINFORMATION]: [
    // Difficult to detect via regex - would need fact-checking API
  ],
  [ViolationType.NSFW]: [
    // NSFW detection would typically use image analysis
    // Text patterns are limited
  ],
  [ViolationType.OTHER]: [],
}

/**
 * Check content for potential guideline violations
 *
 * @param content - The content to check
 * @returns Violation check result
 */
export function checkContentViolation(content: string): ViolationCheckResult {
  const normalizedContent = content.toLowerCase().trim()
  const matchedPatterns: string[] = []
  let detectedType: ViolationType | null = null
  let highestConfidence = 0

  for (const [type, patterns] of Object.entries(VIOLATION_PATTERNS)) {
    for (const pattern of patterns) {
      const match = normalizedContent.match(pattern)
      if (match) {
        matchedPatterns.push(match[0])
        // Simple confidence based on match quality
        const confidence = Math.min(0.5 + matchedPatterns.length * 0.1, 0.9)
        if (confidence > highestConfidence) {
          highestConfidence = confidence
          detectedType = type as ViolationType
        }
      }
    }
  }

  return {
    hasViolation: detectedType !== null,
    violationType: detectedType,
    confidence: highestConfidence,
    matchedPatterns,
  }
}

/**
 * Get severity level for a violation type
 *
 * @param type - The violation type
 * @returns The severity level
 */
export function getViolationSeverity(type: ViolationType): ViolationSeverity {
  switch (type) {
    case ViolationType.HATE_SPEECH:
      return 'permanent_ban'
    case ViolationType.HARASSMENT:
      return 'temporary_ban'
    case ViolationType.NSFW:
      return 'temporary_ban'
    case ViolationType.MISINFORMATION:
      return 'warning'
    case ViolationType.SPAM:
      return 'warning'
    case ViolationType.OTHER:
      return 'warning'
    default:
      return 'warning'
  }
}

/**
 * Get human-readable label for violation type
 *
 * @param type - The violation type
 * @returns Human-readable label
 */
export function getViolationLabel(type: ViolationType): string {
  switch (type) {
    case ViolationType.SPAM:
      return 'Spam'
    case ViolationType.HATE_SPEECH:
      return 'Hate Speech'
    case ViolationType.HARASSMENT:
      return 'Harassment'
    case ViolationType.MISINFORMATION:
      return 'Misinformation'
    case ViolationType.NSFW:
      return 'NSFW Content'
    case ViolationType.OTHER:
      return 'Other'
    default:
      return 'Unknown'
  }
}

/**
 * Get human-readable description for severity
 *
 * @param severity - The severity level
 * @returns Human-readable description
 */
export function getSeverityDescription(severity: ViolationSeverity): string {
  switch (severity) {
    case 'warning':
      return 'A warning will be issued to the account'
    case 'temporary_ban':
      return 'The account may be temporarily suspended'
    case 'permanent_ban':
      return 'The account may be permanently banned'
    default:
      return 'Action may be taken against the account'
  }
}
