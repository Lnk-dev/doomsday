/**
 * Predictor Badges - Expert predictor verification system
 *
 * Defines predictor tiers based on prediction history and accuracy.
 * Users progress through tiers as they make more accurate predictions.
 */

/**
 * Predictor tier levels from beginner to master
 */
export const PredictorTier = {
  NOVICE: 'NOVICE',
  AMATEUR: 'AMATEUR',
  SKILLED: 'SKILLED',
  EXPERT: 'EXPERT',
  MASTER: 'MASTER',
  ORACLE: 'ORACLE',
} as const

export type PredictorTier = (typeof PredictorTier)[keyof typeof PredictorTier]

/**
 * Requirements for each predictor tier
 */
export interface TierThreshold {
  /** Minimum number of resolved predictions */
  minPredictions: number
  /** Minimum accuracy percentage (0-100) */
  minAccuracy: number
}

/**
 * Tier thresholds defining requirements for each level
 */
export const PREDICTOR_THRESHOLDS: Record<PredictorTier, TierThreshold> = {
  [PredictorTier.NOVICE]: {
    minPredictions: 0,
    minAccuracy: 0,
  },
  [PredictorTier.AMATEUR]: {
    minPredictions: 10,
    minAccuracy: 50,
  },
  [PredictorTier.SKILLED]: {
    minPredictions: 50,
    minAccuracy: 60,
  },
  [PredictorTier.EXPERT]: {
    minPredictions: 100,
    minAccuracy: 70,
  },
  [PredictorTier.MASTER]: {
    minPredictions: 250,
    minAccuracy: 75,
  },
  [PredictorTier.ORACLE]: {
    minPredictions: 500,
    minAccuracy: 80,
  },
}

/**
 * Badge info returned for display
 */
export interface PredictorBadgeInfo {
  /** Tier identifier */
  tier: PredictorTier
  /** Display title */
  title: string
  /** Badge icon name */
  icon: string
  /** Primary color for the badge */
  color: string
  /** Background color for the badge */
  bgColor: string
  /** Description of the tier */
  description: string
}

/**
 * Badge info for each predictor tier
 */
const BADGE_INFO: Record<PredictorTier, Omit<PredictorBadgeInfo, 'tier'>> = {
  [PredictorTier.NOVICE]: {
    title: 'Novice Predictor',
    icon: 'circle',
    color: '#9ca3af', // gray
    bgColor: '#9ca3af20',
    description: 'Just starting out',
  },
  [PredictorTier.AMATEUR]: {
    title: 'Amateur Predictor',
    icon: 'target',
    color: '#cd7f32', // bronze
    bgColor: '#cd7f3220',
    description: 'Building prediction skills',
  },
  [PredictorTier.SKILLED]: {
    title: 'Skilled Predictor',
    icon: 'crosshair',
    color: '#c0c0c0', // silver
    bgColor: '#c0c0c020',
    description: 'Reliable prediction track record',
  },
  [PredictorTier.EXPERT]: {
    title: 'Expert Predictor',
    icon: 'award',
    color: '#ffd700', // gold
    bgColor: '#ffd70020',
    description: 'Proven expertise in predictions',
  },
  [PredictorTier.MASTER]: {
    title: 'Master Predictor',
    icon: 'gem',
    color: '#e5e4e2', // platinum
    bgColor: '#e5e4e220',
    description: 'Elite prediction accuracy',
  },
  [PredictorTier.ORACLE]: {
    title: 'Oracle',
    icon: 'eye',
    color: '#b9f2ff', // diamond/rainbow
    bgColor: 'linear-gradient(135deg, #ff000020, #ff7f0020, #ffff0020, #00ff0020, #0000ff20, #4b008220, #9400d320)',
    description: 'Legendary foresight',
  },
}

/**
 * Calculate the predictor tier based on prediction count and accuracy
 *
 * @param predictions - Total number of resolved predictions
 * @param accuracy - Accuracy percentage (0-100)
 * @returns The highest tier the user qualifies for
 */
export function calculatePredictorTier(predictions: number, accuracy: number): PredictorTier {
  // Check tiers from highest to lowest
  const tierOrder: PredictorTier[] = [
    PredictorTier.ORACLE,
    PredictorTier.MASTER,
    PredictorTier.EXPERT,
    PredictorTier.SKILLED,
    PredictorTier.AMATEUR,
    PredictorTier.NOVICE,
  ]

  for (const tier of tierOrder) {
    const threshold = PREDICTOR_THRESHOLDS[tier]
    if (predictions >= threshold.minPredictions && accuracy >= threshold.minAccuracy) {
      return tier
    }
  }

  return PredictorTier.NOVICE
}

/**
 * Get badge display information for a predictor tier
 *
 * @param tier - The predictor tier
 * @returns Badge info including icon, colors, and description
 */
export function getPredictorBadgeInfo(tier: PredictorTier): PredictorBadgeInfo {
  return {
    tier,
    ...BADGE_INFO[tier],
  }
}

/**
 * Get the next tier and progress towards it
 *
 * @param currentTier - Current predictor tier
 * @param predictions - Current prediction count
 * @param accuracy - Current accuracy percentage
 * @returns Next tier info and progress, or null if at max tier
 */
export function getNextTierProgress(
  currentTier: PredictorTier,
  predictions: number,
  accuracy: number
): {
  nextTier: PredictorTier
  predictionsNeeded: number
  accuracyNeeded: number
  predictionsProgress: number
  accuracyProgress: number
} | null {
  const tierOrder: PredictorTier[] = [
    PredictorTier.NOVICE,
    PredictorTier.AMATEUR,
    PredictorTier.SKILLED,
    PredictorTier.EXPERT,
    PredictorTier.MASTER,
    PredictorTier.ORACLE,
  ]

  const currentIndex = tierOrder.indexOf(currentTier)
  if (currentIndex === tierOrder.length - 1) {
    // Already at max tier
    return null
  }

  const nextTier = tierOrder[currentIndex + 1]
  const nextThreshold = PREDICTOR_THRESHOLDS[nextTier]

  const predictionsNeeded = Math.max(0, nextThreshold.minPredictions - predictions)
  const accuracyNeeded = Math.max(0, nextThreshold.minAccuracy - accuracy)

  // Calculate progress as percentage towards next tier
  const prevThreshold = PREDICTOR_THRESHOLDS[currentTier]
  const predictionRange = nextThreshold.minPredictions - prevThreshold.minPredictions
  const accuracyRange = nextThreshold.minAccuracy - prevThreshold.minAccuracy

  const predictionsProgress = predictionRange > 0
    ? Math.min(100, ((predictions - prevThreshold.minPredictions) / predictionRange) * 100)
    : 100

  const accuracyProgress = accuracyRange > 0
    ? Math.min(100, ((accuracy - prevThreshold.minAccuracy) / accuracyRange) * 100)
    : 100

  return {
    nextTier,
    predictionsNeeded,
    accuracyNeeded,
    predictionsProgress,
    accuracyProgress,
  }
}
