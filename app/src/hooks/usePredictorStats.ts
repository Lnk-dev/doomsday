/**
 * usePredictorStats Hook
 *
 * Provides the current user's predictor statistics, tier, and progress.
 * Combines prediction data with tier calculations for easy consumption.
 */

import { useMemo } from 'react'
import { usePredictionsStore, type PredictionStats } from '@/store/predictions'
import { useUserStore } from '@/store/user'
import {
  PredictorTier,
  calculatePredictorTier,
  getPredictorBadgeInfo,
  getNextTierProgress,
  type PredictorBadgeInfo,
} from '@/lib/predictorBadges'

/**
 * Extended stats including tier information
 */
export interface PredictorStatsWithTier extends PredictionStats {
  /** Current predictor tier */
  tier: PredictorTier
  /** Badge info for current tier */
  badgeInfo: PredictorBadgeInfo
  /** Progress towards next tier (null if at max) */
  nextTierProgress: ReturnType<typeof getNextTierProgress>
}

/**
 * Hook to get current user's predictor statistics and tier
 *
 * @returns Predictor stats including tier, badge info, and progress
 */
export function usePredictorStats(): PredictorStatsWithTier {
  const author = useUserStore((state) => state.author)
  const getPredictionStats = usePredictionsStore((state) => state.getPredictionStats)

  return useMemo(() => {
    // Get user ID - use username as fallback for anonymous users
    const userId = author.address || author.username

    // Get base prediction stats
    const stats = getPredictionStats(userId)

    // Calculate tier based on stats
    const tier = calculatePredictorTier(stats.total, stats.accuracy)

    // Get badge info for current tier
    const badgeInfo = getPredictorBadgeInfo(tier)

    // Get progress towards next tier
    const nextTierProgress = getNextTierProgress(tier, stats.total, stats.accuracy)

    return {
      ...stats,
      tier,
      badgeInfo,
      nextTierProgress,
    }
  }, [author.address, author.username, getPredictionStats])
}

/**
 * Hook to get predictor stats for a specific user
 *
 * @param userId - User ID to get stats for
 * @returns Predictor stats including tier, badge info, and progress
 */
export function usePredictorStatsForUser(userId: string): PredictorStatsWithTier {
  const getPredictionStats = usePredictionsStore((state) => state.getPredictionStats)

  return useMemo(() => {
    // Get base prediction stats
    const stats = getPredictionStats(userId)

    // Calculate tier based on stats
    const tier = calculatePredictorTier(stats.total, stats.accuracy)

    // Get badge info for current tier
    const badgeInfo = getPredictorBadgeInfo(tier)

    // Get progress towards next tier
    const nextTierProgress = getNextTierProgress(tier, stats.total, stats.accuracy)

    return {
      ...stats,
      tier,
      badgeInfo,
      nextTierProgress,
    }
  }, [userId, getPredictionStats])
}

/**
 * Hook to check if user qualifies for a specific tier
 *
 * @param targetTier - The tier to check qualification for
 * @returns Whether user qualifies for the tier
 */
export function useQualifiesForTier(targetTier: PredictorTier): boolean {
  const { tier } = usePredictorStats()

  return useMemo(() => {
    const tierOrder: PredictorTier[] = [
      PredictorTier.NOVICE,
      PredictorTier.AMATEUR,
      PredictorTier.SKILLED,
      PredictorTier.EXPERT,
      PredictorTier.MASTER,
      PredictorTier.ORACLE,
    ]

    const currentIndex = tierOrder.indexOf(tier)
    const targetIndex = tierOrder.indexOf(targetTier)

    return currentIndex >= targetIndex
  }, [tier, targetTier])
}
