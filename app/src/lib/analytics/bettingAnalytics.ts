/**
 * Betting Analytics
 * Issue #57: Add analytics dashboard for users
 *
 * Functions for calculating betting performance metrics.
 */

import type { Bet, PredictionEvent, EventCategory } from '@/types'
import type { TimeRange } from './postAnalytics'

export interface BettingAnalytics {
  totalBets: number
  activeBets: number
  resolvedBets: number
  wins: number
  losses: number
  winRate: number
  totalStaked: number
  totalWinnings: number
  netProfitLoss: number
  roi: number
  bySide: { doom: number; life: number }
  byCategory: Record<
    EventCategory,
    { bets: number; wins: number; staked: number }
  >
  betsOverTime: { date: string; amount: number; count: number }[]
}

const TIME_RANGES: Record<TimeRange, number> = {
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
  all: Infinity,
}

/**
 * Calculate analytics for a user's betting activity
 */
export function calculateBettingAnalytics(
  bets: Bet[],
  events: Record<string, PredictionEvent>,
  timeRange: TimeRange
): BettingAnalytics {
  const now = Date.now()
  const rangeMs = TIME_RANGES[timeRange]

  // Filter bets within time range
  const filteredBets =
    timeRange === 'all'
      ? bets
      : bets.filter((b) => now - b.createdAt <= rangeMs)

  // Separate active and resolved bets
  const activeBets = filteredBets.filter((b) => {
    const event = events[b.eventId]
    return event?.status === 'active'
  })

  const resolvedBets = filteredBets.filter((b) => {
    const event = events[b.eventId]
    return event?.status === 'occurred' || event?.status === 'expired'
  })

  // Calculate wins: doom wins if occurred, life wins if expired
  const wins = resolvedBets.filter((b) => {
    const event = events[b.eventId]
    return (
      (b.side === 'doom' && event?.status === 'occurred') ||
      (b.side === 'life' && event?.status === 'expired')
    )
  })

  const totalStaked = filteredBets.reduce((sum, b) => sum + b.amount, 0)

  // Calculate winnings (simplified pari-mutuel)
  const totalWinnings = wins.reduce((sum, b) => {
    const event = events[b.eventId]
    if (!event) return sum
    const pool = event.doomStake + event.lifeStake
    const myPool = b.side === 'doom' ? event.doomStake : event.lifeStake
    // Proportional share of total pool
    return sum + (myPool > 0 ? (b.amount / myPool) * pool : b.amount * 2)
  }, 0)

  // Group by category
  const byCategory = filteredBets.reduce(
    (acc, bet) => {
      const event = events[bet.eventId]
      if (!event) return acc
      const cat = event.category
      if (!acc[cat]) acc[cat] = { bets: 0, wins: 0, staked: 0 }
      acc[cat].bets++
      acc[cat].staked += bet.amount
      // Check if this bet won
      const isWin =
        (bet.side === 'doom' && event.status === 'occurred') ||
        (bet.side === 'life' && event.status === 'expired')
      if (isWin) acc[cat].wins++
      return acc
    },
    {} as Record<EventCategory, { bets: number; wins: number; staked: number }>
  )

  return {
    totalBets: filteredBets.length,
    activeBets: activeBets.length,
    resolvedBets: resolvedBets.length,
    wins: wins.length,
    losses: resolvedBets.length - wins.length,
    winRate: resolvedBets.length
      ? Math.round((wins.length / resolvedBets.length) * 1000) / 10
      : 0,
    totalStaked: Math.round(totalStaked * 100) / 100,
    totalWinnings: Math.round(totalWinnings * 100) / 100,
    netProfitLoss: Math.round((totalWinnings - totalStaked) * 100) / 100,
    roi: totalStaked
      ? Math.round(((totalWinnings - totalStaked) / totalStaked) * 1000) / 10
      : 0,
    bySide: {
      doom: filteredBets.filter((b) => b.side === 'doom').length,
      life: filteredBets.filter((b) => b.side === 'life').length,
    },
    byCategory,
    betsOverTime: groupBetsByDate(filteredBets),
  }
}

/**
 * Group bets by date for time series visualization
 */
function groupBetsByDate(
  bets: Bet[]
): { date: string; amount: number; count: number }[] {
  const grouped: Record<string, { amount: number; count: number }> = {}

  bets.forEach((bet) => {
    const date = new Date(bet.createdAt).toISOString().split('T')[0]
    if (!grouped[date]) grouped[date] = { amount: 0, count: 0 }
    grouped[date].amount += bet.amount
    grouped[date].count++
  })

  return Object.entries(grouped)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date))
}
