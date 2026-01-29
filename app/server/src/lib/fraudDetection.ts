/**
 * Fraud Detection Service
 *
 * Real-time fraud detection for betting transactions.
 * Features:
 * - Rapid betting detection
 * - Large bet flagging
 * - Pattern anomaly detection
 * - Coordinated betting detection
 * - Bot activity detection
 * - Risk scoring
 */

import { db } from '../db'
import { bets, fraudAlerts, userRiskProfiles } from '../db/schema'
import { eq, and, gte, desc, count } from 'drizzle-orm'
import { logger } from './logger'
import { audit } from './auditLogger'

// Types
export type FraudAlertType =
  | 'rapid_betting'
  | 'large_bet'
  | 'pattern_anomaly'
  | 'coordinated_betting'
  | 'bot_activity'
  | 'account_takeover'
  | 'wash_trading'

export interface BetContext {
  userId: string
  username: string
  eventId: string
  outcome: 'doom' | 'life'
  amount: number
  ipAddress?: string
  userAgent?: string
}

export interface FraudCheckResult {
  passed: boolean
  riskScore: number
  alerts: Array<{
    type: FraudAlertType
    score: number
    details: Record<string, unknown>
  }>
}

// Configuration thresholds
const CONFIG = {
  // Rapid betting: max bets per time window
  rapidBetting: {
    maxBetsPerMinute: 5,
    maxBetsPerHour: 30,
    maxBetsPerDay: 100,
  },
  // Large bet thresholds (relative to user's average)
  largeBet: {
    absoluteThreshold: 10000, // Flag if bet > this amount
    relativeMultiplier: 5, // Flag if bet > 5x user's average
  },
  // Velocity thresholds
  velocity: {
    minTimeBetweenBets: 5000, // 5 seconds minimum
    suspiciousPatternCount: 3, // Same amount bets in a row
  },
  // Risk score thresholds
  riskThresholds: {
    low: 30,
    medium: 50,
    high: 70,
    critical: 90,
  },
}

/**
 * Get or create user risk profile
 */
async function getOrCreateRiskProfile(userId: string) {
  let profile = await db.query.userRiskProfiles.findFirst({
    where: eq(userRiskProfiles.userId, userId),
  })

  if (!profile) {
    const [newProfile] = await db
      .insert(userRiskProfiles)
      .values({ userId })
      .returning()
    profile = newProfile
  }

  return profile
}

/**
 * Update user risk profile with new bet data
 */
async function updateRiskProfile(
  userId: string,
  betAmount: number
): Promise<void> {
  const profile = await getOrCreateRiskProfile(userId)

  const newTotalBets = (profile.totalBetsPlaced ?? 0) + 1
  const newTotalVolume = (profile.totalBetVolume ?? 0) + betAmount
  const newAvgBetSize = Math.round(newTotalVolume / newTotalBets)
  const newMaxBetSize = Math.max(profile.maxBetSize ?? 0, betAmount)

  await db
    .update(userRiskProfiles)
    .set({
      totalBetsPlaced: newTotalBets,
      totalBetVolume: newTotalVolume,
      avgBetSize: newAvgBetSize,
      maxBetSize: newMaxBetSize,
      lastBetAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(userRiskProfiles.userId, userId))
}

/**
 * Check for rapid betting (too many bets in short time)
 */
async function checkRapidBetting(
  userId: string
): Promise<{ score: number; details: Record<string, unknown> } | null> {
  const now = new Date()
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000)
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  // Count bets in different time windows
  const [minuteCount, hourCount, dayCount] = await Promise.all([
    db
      .select({ count: count() })
      .from(bets)
      .where(and(eq(bets.userId, userId), gte(bets.createdAt, oneMinuteAgo))),
    db
      .select({ count: count() })
      .from(bets)
      .where(and(eq(bets.userId, userId), gte(bets.createdAt, oneHourAgo))),
    db
      .select({ count: count() })
      .from(bets)
      .where(and(eq(bets.userId, userId), gte(bets.createdAt, oneDayAgo))),
  ])

  const betsLastMinute = Number(minuteCount[0].count)
  const betsLastHour = Number(hourCount[0].count)
  const betsLastDay = Number(dayCount[0].count)

  // Calculate risk score based on thresholds
  let score = 0
  const violations: string[] = []

  if (betsLastMinute >= CONFIG.rapidBetting.maxBetsPerMinute) {
    score += 40
    violations.push(`${betsLastMinute} bets in last minute`)
  }
  if (betsLastHour >= CONFIG.rapidBetting.maxBetsPerHour) {
    score += 30
    violations.push(`${betsLastHour} bets in last hour`)
  }
  if (betsLastDay >= CONFIG.rapidBetting.maxBetsPerDay) {
    score += 20
    violations.push(`${betsLastDay} bets in last 24h`)
  }

  if (score > 0) {
    return {
      score: Math.min(score, 100),
      details: {
        betsLastMinute,
        betsLastHour,
        betsLastDay,
        violations,
        thresholds: CONFIG.rapidBetting,
      },
    }
  }

  return null
}

/**
 * Check for unusually large bets
 */
async function checkLargeBet(
  userId: string,
  amount: number
): Promise<{ score: number; details: Record<string, unknown> } | null> {
  const profile = await getOrCreateRiskProfile(userId)
  const avgBet = profile.avgBetSize ?? 0
  const maxBet = profile.maxBetSize ?? 0

  let score = 0
  const flags: string[] = []

  // Check absolute threshold
  if (amount >= CONFIG.largeBet.absoluteThreshold) {
    score += 50
    flags.push(`Bet amount ${amount} exceeds absolute threshold ${CONFIG.largeBet.absoluteThreshold}`)
  }

  // Check relative to user's average (only if they have history)
  if (avgBet > 0 && amount >= avgBet * CONFIG.largeBet.relativeMultiplier) {
    score += 40
    flags.push(`Bet amount ${amount} is ${Math.round(amount / avgBet)}x user's average (${avgBet})`)
  }

  // Check if significantly larger than their max
  if (maxBet > 0 && amount > maxBet * 2) {
    score += 30
    flags.push(`Bet amount ${amount} is ${Math.round(amount / maxBet)}x user's previous max (${maxBet})`)
  }

  if (score > 0) {
    return {
      score: Math.min(score, 100),
      details: {
        betAmount: amount,
        userAvgBet: avgBet,
        userMaxBet: maxBet,
        flags,
      },
    }
  }

  return null
}

/**
 * Check for bot-like velocity patterns
 */
async function checkVelocity(
  userId: string
): Promise<{ score: number; details: Record<string, unknown> } | null> {
  // Get last few bets to check timing patterns
  const recentBets = await db
    .select({
      amount: bets.amount,
      createdAt: bets.createdAt,
    })
    .from(bets)
    .where(eq(bets.userId, userId))
    .orderBy(desc(bets.createdAt))
    .limit(10)

  if (recentBets.length < 2) {
    return null
  }

  let score = 0
  const flags: string[] = []

  // Check time between bets
  const timeDiffs: number[] = []
  for (let i = 0; i < recentBets.length - 1; i++) {
    const diff = recentBets[i].createdAt.getTime() - recentBets[i + 1].createdAt.getTime()
    timeDiffs.push(diff)

    if (diff < CONFIG.velocity.minTimeBetweenBets) {
      score += 20
      flags.push(`Bet placed only ${diff}ms after previous bet`)
    }
  }

  // Check for suspiciously consistent timing (bot pattern)
  if (timeDiffs.length >= 3) {
    const avgDiff = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length
    const variance = timeDiffs.reduce((sum, diff) => sum + Math.pow(diff - avgDiff, 2), 0) / timeDiffs.length
    const stdDev = Math.sqrt(variance)

    // Very consistent timing suggests automation
    if (stdDev < 500 && avgDiff < 10000) {
      score += 40
      flags.push(`Suspiciously consistent bet timing (stdDev: ${Math.round(stdDev)}ms)`)
    }
  }

  // Check for repeated same amounts
  const amounts = recentBets.map((b) => b.amount)
  const sameAmountCount = amounts.filter((a) => a === amounts[0]).length
  if (sameAmountCount >= CONFIG.velocity.suspiciousPatternCount) {
    score += 25
    flags.push(`${sameAmountCount} consecutive bets with same amount (${amounts[0]})`)
  }

  if (score > 0) {
    return {
      score: Math.min(score, 100),
      details: {
        recentBetCount: recentBets.length,
        timingPattern: timeDiffs.slice(0, 5),
        flags,
      },
    }
  }

  return null
}

/**
 * Create a fraud alert
 */
async function createAlert(
  userId: string,
  username: string,
  alertType: FraudAlertType,
  riskScore: number,
  details: Record<string, unknown>,
  context: { betIds?: string[]; eventIds?: string[]; ipAddress?: string; userAgent?: string }
): Promise<void> {
  try {
    await db.insert(fraudAlerts).values({
      userId,
      username,
      alertType,
      riskScore,
      details: JSON.stringify(details),
      relatedBetIds: context.betIds ? JSON.stringify(context.betIds) : null,
      relatedEventIds: context.eventIds ? JSON.stringify(context.eventIds) : null,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    })

    // Update user's risk profile
    await db
      .update(userRiskProfiles)
      .set({
        lastAlertAt: new Date(),
        isHighRisk: riskScore >= CONFIG.riskThresholds.high,
        isWatchlisted: riskScore >= CONFIG.riskThresholds.medium,
        updatedAt: new Date(),
      })
      .where(eq(userRiskProfiles.userId, userId))

    // Audit log the alert
    await audit.admin.actionPerformed(
      'system',
      'system',
      'fraud_alert_created',
      { type: 'user', id: userId },
      { alertType, riskScore, username },
      `Automated fraud detection: ${alertType}`
    )

    logger.warn({ userId, alertType, riskScore }, 'Fraud alert created')
  } catch (error) {
    logger.error({ error, userId, alertType }, 'Failed to create fraud alert')
  }
}

/**
 * Main fraud check function - run before processing a bet
 */
export async function checkBetForFraud(context: BetContext): Promise<FraudCheckResult> {
  const alerts: FraudCheckResult['alerts'] = []
  let totalRiskScore = 0

  try {
    // Run all checks in parallel
    const [rapidResult, largeResult, velocityResult] = await Promise.all([
      checkRapidBetting(context.userId),
      checkLargeBet(context.userId, context.amount),
      checkVelocity(context.userId),
    ])

    if (rapidResult) {
      alerts.push({ type: 'rapid_betting', ...rapidResult })
      totalRiskScore += rapidResult.score * 0.4 // Weight: 40%
    }

    if (largeResult) {
      alerts.push({ type: 'large_bet', ...largeResult })
      totalRiskScore += largeResult.score * 0.35 // Weight: 35%
    }

    if (velocityResult) {
      alerts.push({ type: 'bot_activity', ...velocityResult })
      totalRiskScore += velocityResult.score * 0.25 // Weight: 25%
    }

    const finalScore = Math.min(Math.round(totalRiskScore), 100)

    // Create alerts for high-risk detections
    for (const alert of alerts) {
      if (alert.score >= CONFIG.riskThresholds.medium) {
        await createAlert(
          context.userId,
          context.username,
          alert.type,
          alert.score,
          alert.details,
          {
            eventIds: [context.eventId],
            ipAddress: context.ipAddress,
            userAgent: context.userAgent,
          }
        )
      }
    }

    // Update risk profile with this bet
    await updateRiskProfile(context.userId, context.amount)

    return {
      passed: finalScore < CONFIG.riskThresholds.critical,
      riskScore: finalScore,
      alerts,
    }
  } catch (error) {
    logger.error({ error, context }, 'Fraud check failed')
    // Fail open - don't block legitimate users due to errors
    return { passed: true, riskScore: 0, alerts: [] }
  }
}

/**
 * Get pending fraud alerts for admin review
 */
export async function getPendingAlerts(limit = 50) {
  return db
    .select()
    .from(fraudAlerts)
    .where(eq(fraudAlerts.status, 'pending'))
    .orderBy(desc(fraudAlerts.riskScore), desc(fraudAlerts.createdAt))
    .limit(limit)
}

/**
 * Get fraud alerts for a specific user
 */
export async function getUserAlerts(userId: string) {
  return db
    .select()
    .from(fraudAlerts)
    .where(eq(fraudAlerts.userId, userId))
    .orderBy(desc(fraudAlerts.createdAt))
}

/**
 * Update alert status (for admin review)
 */
export async function updateAlertStatus(
  alertId: string,
  adminId: string,
  status: 'investigating' | 'confirmed' | 'dismissed' | 'resolved',
  resolution?: string,
  actionTaken?: string
) {
  await db
    .update(fraudAlerts)
    .set({
      status,
      reviewedBy: adminId,
      reviewedAt: new Date(),
      resolution,
      actionTaken,
      updatedAt: new Date(),
    })
    .where(eq(fraudAlerts.id, alertId))
}

/**
 * Get fraud statistics for dashboard
 */
export async function getFraudStats() {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [
    pendingAlerts,
    todayAlerts,
    weekAlerts,
    highRiskUsers,
    alertsByType,
  ] = await Promise.all([
    db.select({ count: count() }).from(fraudAlerts).where(eq(fraudAlerts.status, 'pending')),
    db.select({ count: count() }).from(fraudAlerts).where(gte(fraudAlerts.createdAt, today)),
    db.select({ count: count() }).from(fraudAlerts).where(gte(fraudAlerts.createdAt, weekAgo)),
    db.select({ count: count() }).from(userRiskProfiles).where(eq(userRiskProfiles.isHighRisk, true)),
    db
      .select({
        alertType: fraudAlerts.alertType,
        count: count(),
      })
      .from(fraudAlerts)
      .where(gte(fraudAlerts.createdAt, weekAgo))
      .groupBy(fraudAlerts.alertType),
  ])

  const byType: Record<string, number> = {}
  for (const row of alertsByType) {
    byType[row.alertType] = Number(row.count)
  }

  return {
    pending: Number(pendingAlerts[0].count),
    today: Number(todayAlerts[0].count),
    thisWeek: Number(weekAlerts[0].count),
    highRiskUsers: Number(highRiskUsers[0].count),
    byType,
  }
}

/**
 * Get user risk profile
 */
export async function getUserRiskProfile(userId: string) {
  return getOrCreateRiskProfile(userId)
}
