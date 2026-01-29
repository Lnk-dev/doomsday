/**
 * Token Analytics
 * Issue #57: Add analytics dashboard for users
 *
 * Functions for calculating token flow metrics.
 */

import type { TokenTransaction } from '@/types'
import type { TimeRange } from './postAnalytics'

export interface TokenAnalytics {
  currentDoom: number
  currentLife: number
  totalEarned: { doom: number; life: number }
  totalSpent: { doom: number; life: number }
  netFlow: { doom: number; life: number }
  bySource: Record<string, { earned: number; spent: number }>
  balanceOverTime: { date: string; doom: number; life: number }[]
}

const TIME_RANGES: Record<TimeRange, number> = {
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
  all: Infinity,
}

/**
 * Calculate analytics for a user's token transactions
 */
export function calculateTokenAnalytics(
  transactions: TokenTransaction[],
  currentDoom: number,
  currentLife: number,
  timeRange: TimeRange
): TokenAnalytics {
  const now = Date.now()
  const rangeMs = TIME_RANGES[timeRange]

  // Filter transactions within time range
  const filtered =
    timeRange === 'all'
      ? transactions
      : transactions.filter((t) => now - t.createdAt <= rangeMs)

  // Calculate totals earned
  const totalEarned = filtered
    .filter((t) => t.type === 'earn')
    .reduce(
      (acc, t) => {
        acc[t.tokenType] += t.amount
        return acc
      },
      { doom: 0, life: 0 }
    )

  // Calculate totals spent
  const totalSpent = filtered
    .filter((t) => t.type === 'spend')
    .reduce(
      (acc, t) => {
        acc[t.tokenType] += t.amount
        return acc
      },
      { doom: 0, life: 0 }
    )

  // Group by source
  const bySource = filtered.reduce(
    (acc, t) => {
      if (!acc[t.source]) acc[t.source] = { earned: 0, spent: 0 }
      if (t.type === 'earn') acc[t.source].earned += t.amount
      else acc[t.source].spent += t.amount
      return acc
    },
    {} as Record<string, { earned: number; spent: number }>
  )

  return {
    currentDoom: Math.round(currentDoom * 100) / 100,
    currentLife: Math.round(currentLife * 100) / 100,
    totalEarned: {
      doom: Math.round(totalEarned.doom * 100) / 100,
      life: Math.round(totalEarned.life * 100) / 100,
    },
    totalSpent: {
      doom: Math.round(totalSpent.doom * 100) / 100,
      life: Math.round(totalSpent.life * 100) / 100,
    },
    netFlow: {
      doom: Math.round((totalEarned.doom - totalSpent.doom) * 100) / 100,
      life: Math.round((totalEarned.life - totalSpent.life) * 100) / 100,
    },
    bySource,
    balanceOverTime: calculateRunningBalance(transactions),
  }
}

/**
 * Calculate running balance over time for visualization
 */
function calculateRunningBalance(
  transactions: TokenTransaction[]
): { date: string; doom: number; life: number }[] {
  // Sort by date
  const sorted = [...transactions].sort((a, b) => a.createdAt - b.createdAt)

  // Start with initial balances
  let doom = 100 // Default starting balance
  let life = 0

  const grouped: Record<string, { doom: number; life: number }> = {}

  sorted.forEach((t) => {
    const date = new Date(t.createdAt).toISOString().split('T')[0]
    if (t.type === 'earn') {
      if (t.tokenType === 'doom') doom += t.amount
      else life += t.amount
    } else {
      if (t.tokenType === 'doom') doom -= t.amount
      else life -= t.amount
    }
    grouped[date] = { doom, life }
  })

  return Object.entries(grouped)
    .map(([date, balances]) => ({ date, ...balances }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Get human-readable source name
 */
export function getSourceDisplayName(source: TokenTransaction['source']): string {
  const names: Record<TokenTransaction['source'], string> = {
    bet_win: 'Bet Winnings',
    bet_place: 'Bets Placed',
    life_post: 'Life Posts',
    donation_sent: 'Donations Sent',
    donation_received: 'Donations Received',
    initial: 'Initial Balance',
    streak_bonus: 'Streak Bonus',
  }
  return names[source] || source
}
