/**
 * Creator Stats Utilities
 * Issue #117: Build creator monetization dashboard UI
 *
 * Utility functions for creator statistics and earnings calculations.
 */

/** Creator statistics interface */
export interface CreatorStats {
  totalEarnings: number
  monthlyEarnings: number
  followers: number
  posts: number
  engagementRate: number
}

/** Earnings history entry */
export interface EarningsHistoryEntry {
  date: string
  amount: number
  type: 'tip' | 'subscription' | 'content' | 'bonus'
}

/**
 * Calculate engagement rate from interaction metrics
 * @param likes - Total likes
 * @param comments - Total comments
 * @param views - Total views
 * @returns Engagement rate as a percentage (0-100)
 */
export function calculateEngagementRate(likes: number, comments: number, views: number): number {
  if (views <= 0) return 0
  const engagements = likes + comments
  const rate = (engagements / views) * 100
  // Cap at 100% and round to 2 decimal places
  return Math.min(100, Math.round(rate * 100) / 100)
}

/**
 * Format currency amount for display
 * @param amount - Amount in smallest unit (e.g., cents or lamports)
 * @param currency - Currency symbol (default: '$')
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency string
 */
export function formatEarnings(
  amount: number,
  currency: string = '$',
  decimals: number = 2
): string {
  if (amount >= 1_000_000) {
    return `${currency}${(amount / 1_000_000).toFixed(1)}M`
  }
  if (amount >= 1_000) {
    return `${currency}${(amount / 1_000).toFixed(1)}K`
  }
  return `${currency}${amount.toFixed(decimals)}`
}

/**
 * Calculate earnings trend percentage from history
 * Compares current period to previous period
 * @param history - Array of earnings history entries (sorted newest first)
 * @param periodDays - Number of days to compare (default: 30)
 * @returns Trend percentage (positive = growth, negative = decline)
 */
export function getEarningsTrend(
  history: EarningsHistoryEntry[],
  periodDays: number = 30
): number {
  if (history.length === 0) return 0

  const now = Date.now()
  const periodMs = periodDays * 24 * 60 * 60 * 1000

  let currentPeriodTotal = 0
  let previousPeriodTotal = 0

  for (const entry of history) {
    const entryTime = new Date(entry.date).getTime()
    const age = now - entryTime

    if (age <= periodMs) {
      currentPeriodTotal += entry.amount
    } else if (age <= periodMs * 2) {
      previousPeriodTotal += entry.amount
    }
  }

  if (previousPeriodTotal === 0) {
    return currentPeriodTotal > 0 ? 100 : 0
  }

  const change = ((currentPeriodTotal - previousPeriodTotal) / previousPeriodTotal) * 100
  return Math.round(change * 10) / 10
}

/**
 * Format percentage for display
 * @param value - Percentage value
 * @param showSign - Whether to show + for positive values
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, showSign: boolean = true): string {
  const sign = showSign && value > 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

/**
 * Calculate total earnings from history
 * @param history - Array of earnings history entries
 * @returns Total earnings amount
 */
export function calculateTotalEarnings(history: EarningsHistoryEntry[]): number {
  return history.reduce((total, entry) => total + entry.amount, 0)
}

/**
 * Calculate monthly earnings from history
 * @param history - Array of earnings history entries
 * @param month - Month to calculate (default: current month)
 * @returns Monthly earnings amount
 */
export function calculateMonthlyEarnings(history: EarningsHistoryEntry[], month?: Date): number {
  const targetMonth = month || new Date()
  const year = targetMonth.getFullYear()
  const monthIndex = targetMonth.getMonth()

  return history
    .filter((entry) => {
      const entryDate = new Date(entry.date)
      return entryDate.getFullYear() === year && entryDate.getMonth() === monthIndex
    })
    .reduce((total, entry) => total + entry.amount, 0)
}

/**
 * Group earnings history by period
 * @param history - Array of earnings history entries
 * @param period - Grouping period ('day' | 'week' | 'month')
 * @returns Array of grouped earnings with labels
 */
export function groupEarningsByPeriod(
  history: EarningsHistoryEntry[],
  period: 'day' | 'week' | 'month'
): { label: string; amount: number }[] {
  const groups = new Map<string, number>()

  for (const entry of history) {
    const date = new Date(entry.date)
    let key: string

    switch (period) {
      case 'day':
        key = date.toISOString().split('T')[0]
        break
      case 'week':
        // Get start of week (Sunday)
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        key = weekStart.toISOString().split('T')[0]
        break
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        break
    }

    groups.set(key, (groups.get(key) || 0) + entry.amount)
  }

  return Array.from(groups.entries())
    .map(([label, amount]) => ({ label, amount }))
    .sort((a, b) => a.label.localeCompare(b.label))
}
