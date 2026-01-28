/**
 * Leaderboard Store
 *
 * Zustand store for managing leaderboard data.
 * In a real app, this would fetch from an API.
 * For now, uses mock data.
 */

import { create } from 'zustand'
import type { LeaderboardEntry, LeaderboardCategory, Author } from '@/types'

interface LeaderboardState {
  /** Leaderboard entries by category */
  leaderboards: Record<LeaderboardCategory, LeaderboardEntry[]>

  // Actions
  /** Get leaderboard for a category */
  getLeaderboard: (category: LeaderboardCategory) => LeaderboardEntry[]
  /** Get user's rank in a category */
  getUserRank: (category: LeaderboardCategory, username: string) => number | null
}

/**
 * Generate mock leaderboard data
 */
function generateMockLeaderboard(category: LeaderboardCategory): LeaderboardEntry[] {
  const names: Record<LeaderboardCategory, string[]> = {
    doomer: ['doomprophet', 'endtimeswatcher', 'cassandrav2', 'collapseseer', 'voidwatcher', 'darkfuture', 'duskhorizon', 'finaldays99', 'nightowl', 'lasthope'],
    life: ['lifeliver', 'sunrisewatcher', 'presentmoment', 'hopeholder', 'daydreamer', 'lightseer', 'joykeeper', 'peacefinder', 'stillbreathing', 'everliving'],
    prepper: ['bunkerbuilder', 'stockpiler', 'offgridder', 'survivalist', 'readyforall', 'prepking', 'supplychain', 'selfreliant', 'homesteader', 'bugoutbag'],
    salvation: ['truebeliever', 'faithkeeper', 'redeemed', 'soulseeker', 'divinewatch', 'holyroller', 'spiritguide', 'blessedone', 'chosen', 'remnant'],
    preventer: ['changemaker', 'activist', 'guardian', 'protector', 'defender', 'peacemaker', 'bridgebuilder', 'uniter', 'healer', 'hopebringer'],
  }

  const categoryNames = names[category]
  const baseScores: Record<LeaderboardCategory, number> = {
    doomer: 1250000,
    life: 980000,
    prepper: 750000,
    salvation: 620000,
    preventer: 890000,
  }

  return categoryNames.map((username, index) => ({
    rank: index + 1,
    user: {
      address: null,
      username,
      verified: index < 3,
    } as Author,
    score: Math.floor(baseScores[category] * (1 - index * 0.08) + Math.random() * 10000),
    change: Math.floor(Math.random() * 7) - 3, // -3 to +3
  }))
}

const initialLeaderboards: Record<LeaderboardCategory, LeaderboardEntry[]> = {
  doomer: generateMockLeaderboard('doomer'),
  life: generateMockLeaderboard('life'),
  prepper: generateMockLeaderboard('prepper'),
  salvation: generateMockLeaderboard('salvation'),
  preventer: generateMockLeaderboard('preventer'),
}

export const useLeaderboardStore = create<LeaderboardState>()((_set, get) => ({
  leaderboards: initialLeaderboards,

  getLeaderboard: (category) => {
    return get().leaderboards[category] || []
  },

  getUserRank: (category, username) => {
    const leaderboard = get().leaderboards[category]
    const entry = leaderboard.find((e) => e.user.username === username)
    return entry?.rank ?? null
  },
}))
