/**
 * Quality Score Service
 *
 * Calculates quality scores for prediction events based on:
 * - Quantitative resolution criteria
 * - Verification sources
 * - Creator stake
 * - Description quality
 */

export interface QualityInput {
  resolutionCriteria: Array<{
    conditionType: string
    metric?: string | null
  }>
  verificationSources: Array<{
    isPrimary: boolean
    url?: string | null
  }>
  creatorStake?: {
    amount: number
  } | null
  description: string
}

export type QualityTier = 'bronze' | 'silver' | 'gold' | 'platinum'

export interface QualityResult {
  score: number
  tier: QualityTier
  breakdown: {
    quantitativeCriteria: number
    primarySource: number
    secondarySource: number
    creatorStake: number
    descriptionQuality: number
  }
}

/**
 * Calculate quality score for a prediction event
 *
 * Scoring breakdown:
 * - Quantitative criteria: +20 each, max 40
 * - Primary source with URL: +20
 * - Secondary source: +10
 * - Creator stake: +15 for any, +10 more for 500+
 * - Description length: +5 for 100+ chars
 *
 * @param input - Event data for quality calculation
 * @returns Score (0-100) and tier (bronze/silver/gold/platinum)
 */
export function calculateQualityScore(input: QualityInput): QualityResult {
  const breakdown = {
    quantitativeCriteria: 0,
    primarySource: 0,
    secondarySource: 0,
    creatorStake: 0,
    descriptionQuality: 0,
  }

  // Quantitative criteria (+20 each, max 40)
  // Criteria with a metric defined are considered quantitative
  const quantitativeCriteria = input.resolutionCriteria.filter((c) => c.metric)
  breakdown.quantitativeCriteria = Math.min(quantitativeCriteria.length * 20, 40)

  // Primary source with URL (+20)
  const primaryWithUrl = input.verificationSources.find((s) => s.isPrimary && s.url)
  if (primaryWithUrl) {
    breakdown.primarySource = 20
  }

  // Secondary source (+10)
  const hasSecondary = input.verificationSources.filter((s) => !s.isPrimary).length > 0
  if (hasSecondary) {
    breakdown.secondarySource = 10
  }

  // Creator stake (+15 for any, +10 more for 500+)
  if (input.creatorStake && input.creatorStake.amount > 0) {
    breakdown.creatorStake = 15
    if (input.creatorStake.amount >= 500) {
      breakdown.creatorStake += 10
    }
  }

  // Description length (+5 for 100+ chars)
  if (input.description.length >= 100) {
    breakdown.descriptionQuality = 5
  }

  // Calculate total score
  const score = Math.min(
    breakdown.quantitativeCriteria +
      breakdown.primarySource +
      breakdown.secondarySource +
      breakdown.creatorStake +
      breakdown.descriptionQuality,
    100
  )

  // Determine tier
  const tier = getTierFromScore(score)

  return { score, tier, breakdown }
}

/**
 * Get quality tier from score
 */
export function getTierFromScore(score: number): QualityTier {
  if (score >= 80) return 'platinum'
  if (score >= 60) return 'gold'
  if (score >= 40) return 'silver'
  return 'bronze'
}

/**
 * Get suggestions for improving quality score
 */
export function getQualityImprovements(result: QualityResult): string[] {
  const suggestions: string[] = []

  if (result.breakdown.quantitativeCriteria < 40) {
    const needed = (40 - result.breakdown.quantitativeCriteria) / 20
    suggestions.push(`Add ${needed} more quantitative criterion with a measurable metric`)
  }

  if (result.breakdown.primarySource === 0) {
    suggestions.push('Add a URL to your primary verification source')
  }

  if (result.breakdown.secondarySource === 0) {
    suggestions.push('Add a secondary verification source')
  }

  if (result.breakdown.creatorStake === 0) {
    suggestions.push('Add a creator stake to show confidence in your prediction')
  } else if (result.breakdown.creatorStake === 15) {
    suggestions.push('Increase your stake to 500+ DOOM for a bonus')
  }

  if (result.breakdown.descriptionQuality === 0) {
    suggestions.push('Expand your description to at least 100 characters')
  }

  return suggestions
}
