/**
 * Badges Store Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  useBadgesStore,
  getBadge,
  getBadgesByCategory,
  getRarityColor,
  getRarityBgColor,
  BADGE_DEFINITIONS,
} from './badges'

describe('badges store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useBadgesStore.setState({
      earnedBadges: [{ badgeId: 'early_adopter', earnedAt: Date.now() }],
    })
  })

  describe('initial state', () => {
    it('should have early_adopter badge by default', () => {
      const state = useBadgesStore.getState()
      expect(state.earnedBadges).toHaveLength(1)
      expect(state.earnedBadges[0].badgeId).toBe('early_adopter')
    })
  })

  describe('hasBadge', () => {
    it('should return true for earned badges', () => {
      const { hasBadge } = useBadgesStore.getState()
      expect(hasBadge('early_adopter')).toBe(true)
    })

    it('should return false for unearned badges', () => {
      const { hasBadge } = useBadgesStore.getState()
      expect(hasBadge('first_post')).toBe(false)
    })
  })

  describe('earnBadge', () => {
    it('should add a new badge', () => {
      const { earnBadge } = useBadgesStore.getState()

      const result = earnBadge('first_post')

      expect(result).toBe(true)
      expect(useBadgesStore.getState().hasBadge('first_post')).toBe(true)
    })

    it('should return false if badge already earned', () => {
      const { earnBadge } = useBadgesStore.getState()

      const result = earnBadge('early_adopter')

      expect(result).toBe(false)
    })

    it('should not duplicate badges', () => {
      const { earnBadge } = useBadgesStore.getState()

      earnBadge('first_post')
      earnBadge('first_post')

      const state = useBadgesStore.getState()
      const firstPostBadges = state.earnedBadges.filter(b => b.badgeId === 'first_post')
      expect(firstPostBadges).toHaveLength(1)
    })

    it('should record earnedAt timestamp', () => {
      const before = Date.now()
      const { earnBadge } = useBadgesStore.getState()

      earnBadge('first_post')

      const state = useBadgesStore.getState()
      const badge = state.earnedBadges.find(b => b.badgeId === 'first_post')
      expect(badge?.earnedAt).toBeGreaterThanOrEqual(before)
    })
  })

  describe('getEarnedBadges', () => {
    it('should return earned badges with full details', () => {
      const { earnBadge } = useBadgesStore.getState()

      earnBadge('first_post')

      const earned = useBadgesStore.getState().getEarnedBadges()
      expect(earned.length).toBeGreaterThanOrEqual(2)

      const firstPost = earned.find(b => b.id === 'first_post')
      expect(firstPost).toBeDefined()
      expect(firstPost?.name).toBe('First Words')
      expect(firstPost?.earnedAt).toBeDefined()
    })

    it('should filter out invalid badge IDs', () => {
      useBadgesStore.setState({
        earnedBadges: [
          { badgeId: 'early_adopter', earnedAt: Date.now() },
          { badgeId: 'invalid_badge', earnedAt: Date.now() },
        ],
      })

      const { getEarnedBadges } = useBadgesStore.getState()
      const earned = getEarnedBadges()

      expect(earned).toHaveLength(1)
      expect(earned[0].id).toBe('early_adopter')
    })
  })

  describe('checkPostingBadges', () => {
    it('should earn first_post badge at 1 post', () => {
      const { checkPostingBadges } = useBadgesStore.getState()

      const earned = checkPostingBadges(1, 0)

      expect(earned).toContain('first_post')
    })

    it('should earn posts_10 badge at 10 posts', () => {
      const { checkPostingBadges } = useBadgesStore.getState()

      const earned = checkPostingBadges(10, 0)

      expect(earned).toContain('posts_10')
    })

    it('should earn posts_100 badge at 100 posts', () => {
      const { checkPostingBadges } = useBadgesStore.getState()

      const earned = checkPostingBadges(100, 0)

      expect(earned).toContain('posts_100')
    })

    it('should earn life post badges', () => {
      const { checkPostingBadges } = useBadgesStore.getState()

      const earned = checkPostingBadges(0, 10)

      expect(earned).toContain('first_life_post')
      expect(earned).toContain('life_posts_10')
    })

    it('should not return already earned badges', () => {
      const { earnBadge } = useBadgesStore.getState()

      earnBadge('first_post')
      const earned = useBadgesStore.getState().checkPostingBadges(1, 0)

      expect(earned).not.toContain('first_post')
    })
  })

  describe('checkEngagementBadges', () => {
    it('should earn first_like badge at 1 like', () => {
      const { checkEngagementBadges } = useBadgesStore.getState()

      const earned = checkEngagementBadges(1)

      expect(earned).toContain('first_like')
    })

    it('should earn likes_100 badge at 100 likes', () => {
      const { checkEngagementBadges } = useBadgesStore.getState()

      const earned = checkEngagementBadges(100)

      expect(earned).toContain('likes_100')
    })

    it('should earn likes_1000 badge at 1000 likes', () => {
      const { checkEngagementBadges } = useBadgesStore.getState()

      const earned = checkEngagementBadges(1000)

      expect(earned).toContain('likes_1000')
    })
  })

  describe('checkStreakBadges', () => {
    it('should earn streak_7 badge at 7 days', () => {
      const { checkStreakBadges } = useBadgesStore.getState()

      const earned = checkStreakBadges(7)

      expect(earned).toContain('streak_7')
    })

    it('should earn streak_30 badge at 30 days', () => {
      const { checkStreakBadges } = useBadgesStore.getState()

      const earned = checkStreakBadges(30)

      expect(earned).toContain('streak_30')
    })

    it('should earn streak_100 badge at 100 days', () => {
      const { checkStreakBadges } = useBadgesStore.getState()

      const earned = checkStreakBadges(100)

      expect(earned).toContain('streak_100')
    })
  })

  describe('checkBettingBadges', () => {
    it('should earn first_bet badge', () => {
      const { checkBettingBadges } = useBadgesStore.getState()

      const earned = checkBettingBadges(1, 0, 0)

      expect(earned).toContain('first_bet')
    })

    it('should earn win_streak_3 badge', () => {
      const { checkBettingBadges } = useBadgesStore.getState()

      const earned = checkBettingBadges(3, 3, 0)

      expect(earned).toContain('win_streak_3')
    })

    it('should earn win_streak_5 badge', () => {
      const { checkBettingBadges } = useBadgesStore.getState()

      const earned = checkBettingBadges(5, 5, 0)

      expect(earned).toContain('win_streak_5')
    })

    it('should earn high_roller badge at 1000 bet', () => {
      const { checkBettingBadges } = useBadgesStore.getState()

      const earned = checkBettingBadges(1, 0, 1000)

      expect(earned).toContain('high_roller')
    })
  })

  describe('checkSpecialBadges', () => {
    it('should earn doom_master badge at 10000 doom', () => {
      const { checkSpecialBadges } = useBadgesStore.getState()

      const earned = checkSpecialBadges(10000, 0, 0)

      expect(earned).toContain('doom_master')
    })

    it('should earn life_champion badge at 10000 life', () => {
      const { checkSpecialBadges } = useBadgesStore.getState()

      const earned = checkSpecialBadges(0, 10000, 0)

      expect(earned).toContain('life_champion')
    })

    it('should earn doomsday_prophet badge at 10 correct predictions', () => {
      const { checkSpecialBadges } = useBadgesStore.getState()

      const earned = checkSpecialBadges(0, 0, 10)

      expect(earned).toContain('doomsday_prophet')
    })
  })
})

describe('badge utility functions', () => {
  describe('getBadge', () => {
    it('should return badge by id', () => {
      const badge = getBadge('first_post')

      expect(badge).toBeDefined()
      expect(badge?.name).toBe('First Words')
    })

    it('should return undefined for invalid id', () => {
      const badge = getBadge('invalid_badge')

      expect(badge).toBeUndefined()
    })
  })

  describe('getBadgesByCategory', () => {
    it('should return badges for posting category', () => {
      const badges = getBadgesByCategory('posting')

      expect(badges.length).toBeGreaterThan(0)
      expect(badges.every(b => b.category === 'posting')).toBe(true)
    })

    it('should return badges for engagement category', () => {
      const badges = getBadgesByCategory('engagement')

      expect(badges.length).toBeGreaterThan(0)
      expect(badges.every(b => b.category === 'engagement')).toBe(true)
    })

    it('should return badges for streaks category', () => {
      const badges = getBadgesByCategory('streaks')

      expect(badges.length).toBeGreaterThan(0)
      expect(badges.every(b => b.category === 'streaks')).toBe(true)
    })
  })

  describe('getRarityColor', () => {
    it('should return correct color for each rarity', () => {
      expect(getRarityColor('common')).toBe('#9ca3af')
      expect(getRarityColor('uncommon')).toBe('#22c55e')
      expect(getRarityColor('rare')).toBe('#3b82f6')
      expect(getRarityColor('epic')).toBe('#a855f7')
      expect(getRarityColor('legendary')).toBe('#f59e0b')
    })
  })

  describe('getRarityBgColor', () => {
    it('should return correct background color for each rarity', () => {
      expect(getRarityBgColor('common')).toBe('#9ca3af20')
      expect(getRarityBgColor('uncommon')).toBe('#22c55e20')
      expect(getRarityBgColor('rare')).toBe('#3b82f620')
      expect(getRarityBgColor('epic')).toBe('#a855f720')
      expect(getRarityBgColor('legendary')).toBe('#f59e0b20')
    })
  })

  describe('BADGE_DEFINITIONS', () => {
    it('should have all required badge fields', () => {
      BADGE_DEFINITIONS.forEach(badge => {
        expect(badge.id).toBeDefined()
        expect(badge.name).toBeDefined()
        expect(badge.description).toBeDefined()
        expect(badge.icon).toBeDefined()
        expect(badge.rarity).toBeDefined()
        expect(badge.category).toBeDefined()
      })
    })

    it('should have unique badge IDs', () => {
      const ids = BADGE_DEFINITIONS.map(b => b.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })
  })
})
