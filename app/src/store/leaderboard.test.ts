/**
 * Leaderboard Store Tests
 */

import { describe, it, expect } from 'vitest'
import { useLeaderboardStore } from './leaderboard'

describe('leaderboard store', () => {
  describe('initial state', () => {
    it('should have leaderboards for all categories', () => {
      const state = useLeaderboardStore.getState()
      expect(state.leaderboards).toBeDefined()
      expect(state.leaderboards.doomer).toBeDefined()
      expect(state.leaderboards.life).toBeDefined()
      expect(state.leaderboards.prepper).toBeDefined()
      expect(state.leaderboards.salvation).toBeDefined()
      expect(state.leaderboards.preventer).toBeDefined()
    })

    it('should have 10 entries per leaderboard', () => {
      const state = useLeaderboardStore.getState()
      expect(state.leaderboards.doomer).toHaveLength(10)
      expect(state.leaderboards.life).toHaveLength(10)
      expect(state.leaderboards.prepper).toHaveLength(10)
      expect(state.leaderboards.salvation).toHaveLength(10)
      expect(state.leaderboards.preventer).toHaveLength(10)
    })
  })

  describe('getLeaderboard', () => {
    it('should return doomer leaderboard', () => {
      const { getLeaderboard } = useLeaderboardStore.getState()
      const leaderboard = getLeaderboard('doomer')

      expect(leaderboard).toHaveLength(10)
      expect(leaderboard[0].rank).toBe(1)
    })

    it('should return life leaderboard', () => {
      const { getLeaderboard } = useLeaderboardStore.getState()
      const leaderboard = getLeaderboard('life')

      expect(leaderboard).toHaveLength(10)
      expect(leaderboard[0].rank).toBe(1)
    })

    it('should return prepper leaderboard', () => {
      const { getLeaderboard } = useLeaderboardStore.getState()
      const leaderboard = getLeaderboard('prepper')

      expect(leaderboard).toHaveLength(10)
    })

    it('should return salvation leaderboard', () => {
      const { getLeaderboard } = useLeaderboardStore.getState()
      const leaderboard = getLeaderboard('salvation')

      expect(leaderboard).toHaveLength(10)
    })

    it('should return preventer leaderboard', () => {
      const { getLeaderboard } = useLeaderboardStore.getState()
      const leaderboard = getLeaderboard('preventer')

      expect(leaderboard).toHaveLength(10)
    })

    it('should return entries with required fields', () => {
      const { getLeaderboard } = useLeaderboardStore.getState()
      const leaderboard = getLeaderboard('doomer')

      leaderboard.forEach((entry) => {
        expect(entry.rank).toBeDefined()
        expect(entry.user).toBeDefined()
        expect(entry.user.username).toBeDefined()
        expect(entry.score).toBeDefined()
        expect(entry.change).toBeDefined()
      })
    })

    it('should have ranks in ascending order', () => {
      const { getLeaderboard } = useLeaderboardStore.getState()
      const leaderboard = getLeaderboard('doomer')

      for (let i = 0; i < leaderboard.length; i++) {
        expect(leaderboard[i].rank).toBe(i + 1)
      }
    })

    it('should have top 3 users verified', () => {
      const { getLeaderboard } = useLeaderboardStore.getState()
      const leaderboard = getLeaderboard('doomer')

      expect(leaderboard[0].user.verified).toBe(true)
      expect(leaderboard[1].user.verified).toBe(true)
      expect(leaderboard[2].user.verified).toBe(true)
    })
  })

  describe('getUserRank', () => {
    it('should return rank for existing user', () => {
      const { getUserRank, getLeaderboard } = useLeaderboardStore.getState()
      const leaderboard = getLeaderboard('doomer')
      const firstUser = leaderboard[0].user.username

      const rank = getUserRank('doomer', firstUser)

      expect(rank).toBe(1)
    })

    it('should return null for non-existing user', () => {
      const { getUserRank } = useLeaderboardStore.getState()

      const rank = getUserRank('doomer', 'nonexistent_user')

      expect(rank).toBeNull()
    })

    it('should return correct rank for different positions', () => {
      const { getUserRank, getLeaderboard } = useLeaderboardStore.getState()
      const leaderboard = getLeaderboard('life')

      const thirdUser = leaderboard[2].user.username
      const rank = getUserRank('life', thirdUser)

      expect(rank).toBe(3)
    })

    it('should work across different categories', () => {
      const { getUserRank, getLeaderboard } = useLeaderboardStore.getState()

      const doomerUser = getLeaderboard('doomer')[0].user.username
      const lifeUser = getLeaderboard('life')[0].user.username

      // Doomer user should not be found in life category
      expect(getUserRank('life', doomerUser)).toBeNull()
      // Life user should be found in life category
      expect(getUserRank('life', lifeUser)).toBe(1)
    })
  })

  describe('leaderboard entry structure', () => {
    it('should have scores in descending order', () => {
      const { getLeaderboard } = useLeaderboardStore.getState()
      const leaderboard = getLeaderboard('doomer')

      for (let i = 1; i < leaderboard.length; i++) {
        expect(leaderboard[i - 1].score).toBeGreaterThanOrEqual(leaderboard[i].score)
      }
    })

    it('should have change values within expected range', () => {
      const { getLeaderboard } = useLeaderboardStore.getState()
      const leaderboard = getLeaderboard('doomer')

      leaderboard.forEach((entry) => {
        expect(entry.change).toBeGreaterThanOrEqual(-3)
        expect(entry.change).toBeLessThanOrEqual(3)
      })
    })

    it('should have unique usernames per category', () => {
      const { getLeaderboard } = useLeaderboardStore.getState()
      const leaderboard = getLeaderboard('prepper')

      const usernames = leaderboard.map((e) => e.user.username)
      const uniqueUsernames = new Set(usernames)

      expect(uniqueUsernames.size).toBe(usernames.length)
    })
  })
})
