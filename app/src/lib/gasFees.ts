/**
 * Gas Fee Utilities
 * Issue #104: Gas fee estimation and optimization UI
 *
 * Provides gas fee estimation, formatting, and priority recommendations for Solana transactions.
 */

/**
 * Gas priority levels for transaction processing
 */
export const GasPriority = {
  LOW: 'LOW',
  STANDARD: 'STANDARD',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const

export type GasPriority = (typeof GasPriority)[keyof typeof GasPriority]

/**
 * Gas estimate for a specific priority level
 */
export interface GasEstimate {
  priority: GasPriority
  lamports: number
  usd: number
  estimatedTime: string
}

/**
 * Base gas prices in lamports per priority level
 * These represent the compute unit price for priority fees
 */
export const GAS_PRICES: Record<GasPriority, { lamports: number; timeEstimate: string }> = {
  [GasPriority.LOW]: {
    lamports: 1000,
    timeEstimate: '~60s',
  },
  [GasPriority.STANDARD]: {
    lamports: 5000,
    timeEstimate: '~15s',
  },
  [GasPriority.HIGH]: {
    lamports: 25000,
    timeEstimate: '~5s',
  },
  [GasPriority.URGENT]: {
    lamports: 100000,
    timeEstimate: '~1s',
  },
}

/**
 * Priority level display names
 */
export const PRIORITY_NAMES: Record<GasPriority, string> = {
  [GasPriority.LOW]: 'Low',
  [GasPriority.STANDARD]: 'Standard',
  [GasPriority.HIGH]: 'High',
  [GasPriority.URGENT]: 'Urgent',
}

/**
 * Priority level descriptions
 */
export const PRIORITY_DESCRIPTIONS: Record<GasPriority, string> = {
  [GasPriority.LOW]: 'Cheapest option, may take longer during congestion',
  [GasPriority.STANDARD]: 'Balanced speed and cost for most transactions',
  [GasPriority.HIGH]: 'Faster processing, recommended during high activity',
  [GasPriority.URGENT]: 'Maximum priority, near-instant confirmation',
}

/** Lamports per SOL */
const LAMPORTS_PER_SOL = 1_000_000_000

/** Current SOL price in USD (should be fetched from API in production) */
let currentSolPrice = 150

/**
 * Update the SOL price used for USD calculations
 */
export function setSolPrice(price: number): void {
  currentSolPrice = price
}

/**
 * Get the current SOL price
 */
export function getSolPrice(): number {
  return currentSolPrice
}

/**
 * Convert lamports to SOL
 */
export function lamportsToSol(lamports: number): number {
  return lamports / LAMPORTS_PER_SOL
}

/**
 * Convert lamports to USD
 */
export function lamportsToUsd(lamports: number): number {
  return lamportsToSol(lamports) * currentSolPrice
}

/**
 * Estimate gas fee for a given priority level
 * @param priority - The gas priority level
 * @param networkMultiplier - Optional multiplier for network congestion (1.0 = normal)
 * @returns Gas estimate with lamports, USD, and time
 */
export function estimateGasFee(
  priority: GasPriority,
  networkMultiplier: number = 1.0
): GasEstimate {
  const basePrice = GAS_PRICES[priority]
  const adjustedLamports = Math.round(basePrice.lamports * networkMultiplier)

  return {
    priority,
    lamports: adjustedLamports,
    usd: lamportsToUsd(adjustedLamports),
    estimatedTime: basePrice.timeEstimate,
  }
}

/**
 * All gas priority values as an array
 */
export const GAS_PRIORITY_VALUES: GasPriority[] = [
  GasPriority.LOW,
  GasPriority.STANDARD,
  GasPriority.HIGH,
  GasPriority.URGENT,
]

/**
 * Get gas estimates for all priority levels
 * @param networkMultiplier - Optional multiplier for network congestion
 * @returns Array of gas estimates for all priorities
 */
export function getAllGasEstimates(networkMultiplier: number = 1.0): GasEstimate[] {
  return GAS_PRIORITY_VALUES.map((priority) =>
    estimateGasFee(priority, networkMultiplier)
  )
}

/**
 * Format gas fee in SOL and USD
 * @param lamports - Fee amount in lamports
 * @returns Formatted string with SOL and USD values
 */
export function formatGasFee(lamports: number): { sol: string; usd: string; combined: string } {
  const sol = lamportsToSol(lamports)
  const usd = lamportsToUsd(lamports)

  const solStr = sol < 0.0001 ? '<0.0001' : sol.toFixed(6).replace(/\.?0+$/, '')
  const usdStr = usd < 0.01 ? '<$0.01' : `$${usd.toFixed(2)}`

  return {
    sol: `${solStr} SOL`,
    usd: usdStr,
    combined: `${solStr} SOL (${usdStr})`,
  }
}

/**
 * Urgency levels for transaction priority recommendations
 */
export type UrgencyLevel = 'low' | 'normal' | 'high' | 'critical'

/**
 * Get recommended priority based on urgency level
 * @param urgency - The urgency level of the transaction
 * @returns Recommended gas priority
 */
export function getRecommendedPriority(urgency: UrgencyLevel): GasPriority {
  switch (urgency) {
    case 'low':
      return GasPriority.LOW
    case 'normal':
      return GasPriority.STANDARD
    case 'high':
      return GasPriority.HIGH
    case 'critical':
      return GasPriority.URGENT
    default:
      return GasPriority.STANDARD
  }
}

/**
 * Calculate potential savings between two priority levels
 * @param fromPriority - Higher priority level
 * @param toPriority - Lower priority level
 * @returns Savings in lamports and USD
 */
export function calculateSavings(
  fromPriority: GasPriority,
  toPriority: GasPriority
): { lamports: number; usd: number } {
  const fromEstimate = estimateGasFee(fromPriority)
  const toEstimate = estimateGasFee(toPriority)

  const savingsLamports = Math.max(0, fromEstimate.lamports - toEstimate.lamports)

  return {
    lamports: savingsLamports,
    usd: lamportsToUsd(savingsLamports),
  }
}

/**
 * Network congestion levels
 */
export type CongestionLevel = 'low' | 'normal' | 'high' | 'very-high'

/**
 * Get congestion level description
 */
export function getCongestionDescription(level: CongestionLevel): string {
  switch (level) {
    case 'low':
      return 'Network is quiet. Lower fees recommended.'
    case 'normal':
      return 'Normal network activity. Standard fees should work well.'
    case 'high':
      return 'Network is busy. Consider higher priority for faster confirmation.'
    case 'very-high':
      return 'Network congestion detected. Higher fees strongly recommended.'
    default:
      return 'Network status unknown.'
  }
}

/**
 * Get congestion level color for UI display
 */
export function getCongestionColor(level: CongestionLevel): string {
  switch (level) {
    case 'low':
      return '#00ff00' // Life green
    case 'normal':
      return '#1d9bf0' // Info blue
    case 'high':
      return '#ffad1f' // Warning yellow
    case 'very-high':
      return '#ff3040' // Doom red
    default:
      return '#777777' // Muted
  }
}
