/**
 * Betting Limits Library
 *
 * Provides exposure management and betting limit calculations for responsible gambling.
 * This module helps users understand their risk exposure and enforce betting limits.
 */

/**
 * Exposure levels based on bet amount relative to bankroll
 */
export const ExposureLevel = {
  /** < 2% of bankroll - Safe betting range */
  LOW: 'LOW',
  /** 2-5% of bankroll - Moderate risk */
  MEDIUM: 'MEDIUM',
  /** 5-10% of bankroll - High risk, caution advised */
  HIGH: 'HIGH',
  /** > 10% of bankroll - Critical risk, should reconsider */
  CRITICAL: 'CRITICAL',
} as const

export type ExposureLevel = (typeof ExposureLevel)[keyof typeof ExposureLevel]

/**
 * Exposure level thresholds as percentages of bankroll
 */
export const EXPOSURE_THRESHOLDS = {
  LOW: 0.02, // 2%
  MEDIUM: 0.05, // 5%
  HIGH: 0.10, // 10%
} as const

/**
 * Recommended max bet percentages for each exposure level
 */
export const RECOMMENDED_MAX_BET = {
  [ExposureLevel.LOW]: 0.02, // 2% of bankroll
  [ExposureLevel.MEDIUM]: 0.05, // 5% of bankroll
  [ExposureLevel.HIGH]: 0.08, // 8% of bankroll
  [ExposureLevel.CRITICAL]: 0.10, // 10% of bankroll (hard cap)
} as const

/**
 * User betting limits configuration
 */
export interface UserLimits {
  /** Maximum bet per single event */
  maxBetPerEvent: number | null
  /** Daily loss limit */
  dailyLossLimit: number | null
  /** Weekly loss limit */
  weeklyLossLimit: number | null
  /** Monthly loss limit */
  monthlyLossLimit: number | null
  /** Cool-off period in hours (minimum time between bets) */
  coolOffPeriodHours: number | null
  /** Last bet timestamp */
  lastBetTimestamp: number | null
}

/**
 * Current exposure state
 */
export interface CurrentExposure {
  /** Total amount currently at risk */
  totalAtRisk: number
  /** Current bankroll */
  bankroll: number
  /** Daily losses so far */
  dailyLosses: number
  /** Weekly losses so far */
  weeklyLosses: number
  /** Monthly losses so far */
  monthlyLosses: number
}

/**
 * Validation result for bet attempts
 */
export interface BetValidationResult {
  /** Whether the bet is allowed */
  allowed: boolean
  /** Reason if bet is not allowed */
  reason?: string
  /** Maximum amount user can bet */
  maxAllowedAmount: number
  /** Current exposure level */
  exposureLevel: ExposureLevel
  /** Warning message if any */
  warning?: string
}

/**
 * Calculate the current exposure level based on total bets and bankroll
 *
 * @param totalBets - Total amount currently at risk
 * @param bankroll - User's total bankroll
 * @returns The calculated exposure level
 */
export function calculateExposure(totalBets: number, bankroll: number): ExposureLevel {
  if (bankroll <= 0) {
    return ExposureLevel.CRITICAL
  }

  const exposureRatio = totalBets / bankroll

  if (exposureRatio < EXPOSURE_THRESHOLDS.LOW) {
    return ExposureLevel.LOW
  }

  if (exposureRatio < EXPOSURE_THRESHOLDS.MEDIUM) {
    return ExposureLevel.MEDIUM
  }

  if (exposureRatio < EXPOSURE_THRESHOLDS.HIGH) {
    return ExposureLevel.HIGH
  }

  return ExposureLevel.CRITICAL
}

/**
 * Calculate the exposure percentage as a number between 0 and 100
 *
 * @param totalBets - Total amount currently at risk
 * @param bankroll - User's total bankroll
 * @returns Exposure percentage (0-100+)
 */
export function calculateExposurePercentage(totalBets: number, bankroll: number): number {
  if (bankroll <= 0) {
    return totalBets > 0 ? 100 : 0
  }

  return (totalBets / bankroll) * 100
}

/**
 * Get the maximum safe bet size for a given exposure level
 *
 * @param bankroll - User's total bankroll
 * @param exposureLevel - Target exposure level to maintain
 * @returns Maximum recommended bet amount
 */
export function getMaxBetForExposure(
  bankroll: number,
  exposureLevel: ExposureLevel = ExposureLevel.LOW
): number {
  if (bankroll <= 0) {
    return 0
  }

  const maxPercentage = RECOMMENDED_MAX_BET[exposureLevel]
  return Math.floor(bankroll * maxPercentage * 100) / 100 // Round down to 2 decimal places
}

/**
 * Get maximum bet considering current exposure
 *
 * @param bankroll - User's total bankroll
 * @param currentAtRisk - Amount currently at risk
 * @param targetLevel - Target exposure level
 * @returns Maximum additional bet amount
 */
export function getMaxAdditionalBet(
  bankroll: number,
  currentAtRisk: number,
  targetLevel: ExposureLevel = ExposureLevel.MEDIUM
): number {
  if (bankroll <= 0) {
    return 0
  }

  const maxTotalExposure = bankroll * RECOMMENDED_MAX_BET[targetLevel]
  const remainingCapacity = maxTotalExposure - currentAtRisk

  return Math.max(0, Math.floor(remainingCapacity * 100) / 100)
}

/**
 * Validate if a bet amount is allowed given user limits and current exposure
 *
 * @param amount - Proposed bet amount
 * @param userLimits - User's configured betting limits
 * @param currentExposure - Current exposure state
 * @returns Validation result with allowed status and details
 */
export function validateBetAmount(
  amount: number,
  userLimits: UserLimits,
  currentExposure: CurrentExposure
): BetValidationResult {
  const { totalAtRisk, bankroll, dailyLosses, weeklyLosses, monthlyLosses } = currentExposure
  const {
    maxBetPerEvent,
    dailyLossLimit,
    weeklyLossLimit,
    monthlyLossLimit,
    coolOffPeriodHours,
    lastBetTimestamp,
  } = userLimits

  // Calculate current exposure level
  const exposureLevel = calculateExposure(totalAtRisk + amount, bankroll)

  // Calculate maximum allowed amount based on various limits
  let maxAllowedAmount = bankroll

  // Check cool-off period
  if (coolOffPeriodHours && lastBetTimestamp) {
    const hoursSinceLastBet = (Date.now() - lastBetTimestamp) / (1000 * 60 * 60)
    if (hoursSinceLastBet < coolOffPeriodHours) {
      const remainingMinutes = Math.ceil((coolOffPeriodHours - hoursSinceLastBet) * 60)
      return {
        allowed: false,
        reason: `Cool-off period active. Please wait ${remainingMinutes} minutes.`,
        maxAllowedAmount: 0,
        exposureLevel,
      }
    }
  }

  // Check max bet per event
  if (maxBetPerEvent !== null) {
    maxAllowedAmount = Math.min(maxAllowedAmount, maxBetPerEvent)
    if (amount > maxBetPerEvent) {
      return {
        allowed: false,
        reason: `Exceeds max bet per event ($${maxBetPerEvent.toFixed(2)})`,
        maxAllowedAmount: maxBetPerEvent,
        exposureLevel,
      }
    }
  }

  // Check daily loss limit
  if (dailyLossLimit !== null) {
    const remainingDaily = dailyLossLimit - dailyLosses
    maxAllowedAmount = Math.min(maxAllowedAmount, remainingDaily)
    if (amount > remainingDaily) {
      return {
        allowed: false,
        reason: `Exceeds daily loss limit. Remaining: $${remainingDaily.toFixed(2)}`,
        maxAllowedAmount: Math.max(0, remainingDaily),
        exposureLevel,
      }
    }
  }

  // Check weekly loss limit
  if (weeklyLossLimit !== null) {
    const remainingWeekly = weeklyLossLimit - weeklyLosses
    maxAllowedAmount = Math.min(maxAllowedAmount, remainingWeekly)
    if (amount > remainingWeekly) {
      return {
        allowed: false,
        reason: `Exceeds weekly loss limit. Remaining: $${remainingWeekly.toFixed(2)}`,
        maxAllowedAmount: Math.max(0, remainingWeekly),
        exposureLevel,
      }
    }
  }

  // Check monthly loss limit
  if (monthlyLossLimit !== null) {
    const remainingMonthly = monthlyLossLimit - monthlyLosses
    maxAllowedAmount = Math.min(maxAllowedAmount, remainingMonthly)
    if (amount > remainingMonthly) {
      return {
        allowed: false,
        reason: `Exceeds monthly loss limit. Remaining: $${remainingMonthly.toFixed(2)}`,
        maxAllowedAmount: Math.max(0, remainingMonthly),
        exposureLevel,
      }
    }
  }

  // Check if bet would exceed bankroll
  if (amount > bankroll) {
    return {
      allowed: false,
      reason: 'Insufficient balance',
      maxAllowedAmount: bankroll,
      exposureLevel,
    }
  }

  // Generate warning for high exposure
  let warning: string | undefined
  if (exposureLevel === ExposureLevel.HIGH) {
    warning = 'This bet will put you at high exposure. Consider reducing the amount.'
  } else if (exposureLevel === ExposureLevel.CRITICAL) {
    warning = 'Critical exposure level! This bet puts significant funds at risk.'
  }

  return {
    allowed: true,
    maxAllowedAmount: Math.max(0, maxAllowedAmount),
    exposureLevel,
    warning,
  }
}

/**
 * Get display color for exposure level
 *
 * @param level - Exposure level
 * @returns CSS color value
 */
export function getExposureColor(level: ExposureLevel): string {
  switch (level) {
    case ExposureLevel.LOW:
      return '#00ba7c' // Green
    case ExposureLevel.MEDIUM:
      return '#f59e0b' // Yellow/Amber
    case ExposureLevel.HIGH:
      return '#f97316' // Orange
    case ExposureLevel.CRITICAL:
      return '#ff3040' // Red (doom color)
    default:
      return '#666'
  }
}

/**
 * Get display label for exposure level
 *
 * @param level - Exposure level
 * @returns Human-readable label
 */
export function getExposureLabel(level: ExposureLevel): string {
  switch (level) {
    case ExposureLevel.LOW:
      return 'Low Risk'
    case ExposureLevel.MEDIUM:
      return 'Moderate'
    case ExposureLevel.HIGH:
      return 'High Risk'
    case ExposureLevel.CRITICAL:
      return 'Critical'
    default:
      return 'Unknown'
  }
}

/**
 * Format currency amount
 *
 * @param amount - Amount to format
 * @returns Formatted string
 */
export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`
}

/**
 * Calculate suggested bet based on bankroll and risk tolerance
 *
 * @param bankroll - User's total bankroll
 * @param riskTolerance - 'conservative' | 'moderate' | 'aggressive'
 * @returns Suggested bet amount
 */
export function getSuggestedBetAmount(
  bankroll: number,
  riskTolerance: 'conservative' | 'moderate' | 'aggressive' = 'moderate'
): number {
  const percentages = {
    conservative: 0.01, // 1%
    moderate: 0.02, // 2%
    aggressive: 0.05, // 5%
  }

  return Math.floor(bankroll * percentages[riskTolerance] * 100) / 100
}

/**
 * Create default user limits
 */
export function createDefaultUserLimits(): UserLimits {
  return {
    maxBetPerEvent: null,
    dailyLossLimit: null,
    weeklyLossLimit: null,
    monthlyLossLimit: null,
    coolOffPeriodHours: null,
    lastBetTimestamp: null,
  }
}

/**
 * Create default current exposure
 */
export function createDefaultExposure(bankroll: number = 0): CurrentExposure {
  return {
    totalAtRisk: 0,
    bankroll,
    dailyLosses: 0,
    weeklyLosses: 0,
    monthlyLosses: 0,
  }
}
