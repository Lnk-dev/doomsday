/**
 * Badges Store - User achievements and badges
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type BadgeRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
export type BadgeCategory = 'posting' | 'engagement' | 'streaks' | 'betting' | 'special'

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  rarity: BadgeRarity
  category: BadgeCategory
}

export interface EarnedBadge {
  badgeId: string
  earnedAt: number
}

export const BADGE_DEFINITIONS: Badge[] = [
  // Posting badges
  { id: 'first_post', name: 'First Words', description: 'Create your first post', icon: 'pen', rarity: 'common', category: 'posting' },
  { id: 'posts_10', name: 'Getting Started', description: 'Create 10 posts', icon: 'file-text', rarity: 'uncommon', category: 'posting' },
  { id: 'posts_100', name: 'Prolific Writer', description: 'Create 100 posts', icon: 'book-open', rarity: 'rare', category: 'posting' },
  { id: 'first_life_post', name: 'Life Affirmer', description: 'Create your first life post', icon: 'heart', rarity: 'common', category: 'posting' },
  { id: 'life_posts_10', name: 'Beacon of Hope', description: 'Create 10 life posts', icon: 'sun', rarity: 'uncommon', category: 'posting' },

  // Engagement badges
  { id: 'first_like', name: 'Appreciated', description: 'Receive your first like', icon: 'thumbs-up', rarity: 'common', category: 'engagement' },
  { id: 'likes_100', name: 'Popular', description: 'Receive 100 likes', icon: 'star', rarity: 'rare', category: 'engagement' },
  { id: 'likes_1000', name: 'Influencer', description: 'Receive 1000 likes', icon: 'award', rarity: 'epic', category: 'engagement' },

  // Streak badges
  { id: 'streak_7', name: 'Week Warrior', description: 'Maintain a 7-day streak', icon: 'flame', rarity: 'uncommon', category: 'streaks' },
  { id: 'streak_30', name: 'Monthly Master', description: 'Maintain a 30-day streak', icon: 'zap', rarity: 'rare', category: 'streaks' },
  { id: 'streak_100', name: 'Century Legend', description: 'Maintain a 100-day streak', icon: 'crown', rarity: 'legendary', category: 'streaks' },

  // Betting badges
  { id: 'first_bet', name: 'Risk Taker', description: 'Place your first bet', icon: 'dice', rarity: 'common', category: 'betting' },
  { id: 'win_streak_3', name: 'Lucky Streak', description: 'Win 3 bets in a row', icon: 'trending-up', rarity: 'uncommon', category: 'betting' },
  { id: 'win_streak_5', name: 'Fortune Favored', description: 'Win 5 bets in a row', icon: 'trophy', rarity: 'rare', category: 'betting' },
  { id: 'high_roller', name: 'High Roller', description: 'Bet 1000 tokens at once', icon: 'gem', rarity: 'epic', category: 'betting' },

  // Special badges
  { id: 'early_adopter', name: 'Early Adopter', description: 'Join during beta', icon: 'sparkles', rarity: 'rare', category: 'special' },
  { id: 'verified', name: 'Verified', description: 'Verify your identity', icon: 'check-circle', rarity: 'uncommon', category: 'special' },
  { id: 'doom_master', name: 'Doom Master', description: 'Accumulate 10000 $DOOM', icon: 'skull', rarity: 'epic', category: 'special' },
  { id: 'life_champion', name: 'Life Champion', description: 'Accumulate 10000 $LIFE', icon: 'heart', rarity: 'epic', category: 'special' },
  { id: 'doomsday_prophet', name: 'Doomsday Prophet', description: 'Predict 10 events correctly', icon: 'eye', rarity: 'legendary', category: 'special' },
]

export const getBadge = (id: string): Badge | undefined =>
  BADGE_DEFINITIONS.find(b => b.id === id)

export const getBadgesByCategory = (category: BadgeCategory): Badge[] =>
  BADGE_DEFINITIONS.filter(b => b.category === category)

export const getRarityColor = (rarity: BadgeRarity): string => {
  const colors: Record<BadgeRarity, string> = {
    common: '#9ca3af',
    uncommon: '#22c55e',
    rare: '#3b82f6',
    epic: '#a855f7',
    legendary: '#f59e0b',
  }
  return colors[rarity]
}

export const getRarityBgColor = (rarity: BadgeRarity): string => {
  const colors: Record<BadgeRarity, string> = {
    common: '#9ca3af20',
    uncommon: '#22c55e20',
    rare: '#3b82f620',
    epic: '#a855f720',
    legendary: '#f59e0b20',
  }
  return colors[rarity]
}

interface BadgesState {
  earnedBadges: EarnedBadge[]
  hasBadge: (badgeId: string) => boolean
  earnBadge: (badgeId: string) => boolean
  getEarnedBadges: () => (Badge & { earnedAt: number })[]
  checkPostingBadges: (postCount: number, lifePostCount: number) => string[]
  checkEngagementBadges: (totalLikes: number) => string[]
  checkStreakBadges: (currentStreak: number) => string[]
  checkBettingBadges: (betCount: number, winStreak: number, highestBet: number) => string[]
  checkSpecialBadges: (doomBalance: number, lifeBalance: number, correctPredictions: number) => string[]
}

export const useBadgesStore = create<BadgesState>()(
  persist(
    (set, get) => ({
      earnedBadges: [{ badgeId: 'early_adopter', earnedAt: Date.now() }], // Everyone gets early adopter for now

      hasBadge: (badgeId) => get().earnedBadges.some(b => b.badgeId === badgeId),

      earnBadge: (badgeId) => {
        if (get().hasBadge(badgeId)) return false
        set(state => ({
          earnedBadges: [...state.earnedBadges, { badgeId, earnedAt: Date.now() }]
        }))
        return true
      },

      getEarnedBadges: () => {
        return get().earnedBadges
          .map(eb => {
            const badge = getBadge(eb.badgeId)
            return badge ? { ...badge, earnedAt: eb.earnedAt } : null
          })
          .filter((b): b is Badge & { earnedAt: number } => b !== null)
      },

      checkPostingBadges: (postCount, lifePostCount) => {
        const earned: string[] = []
        const { earnBadge } = get()
        if (postCount >= 1 && earnBadge('first_post')) earned.push('first_post')
        if (postCount >= 10 && earnBadge('posts_10')) earned.push('posts_10')
        if (postCount >= 100 && earnBadge('posts_100')) earned.push('posts_100')
        if (lifePostCount >= 1 && earnBadge('first_life_post')) earned.push('first_life_post')
        if (lifePostCount >= 10 && earnBadge('life_posts_10')) earned.push('life_posts_10')
        return earned
      },

      checkEngagementBadges: (totalLikes) => {
        const earned: string[] = []
        const { earnBadge } = get()
        if (totalLikes >= 1 && earnBadge('first_like')) earned.push('first_like')
        if (totalLikes >= 100 && earnBadge('likes_100')) earned.push('likes_100')
        if (totalLikes >= 1000 && earnBadge('likes_1000')) earned.push('likes_1000')
        return earned
      },

      checkStreakBadges: (currentStreak) => {
        const earned: string[] = []
        const { earnBadge } = get()
        if (currentStreak >= 7 && earnBadge('streak_7')) earned.push('streak_7')
        if (currentStreak >= 30 && earnBadge('streak_30')) earned.push('streak_30')
        if (currentStreak >= 100 && earnBadge('streak_100')) earned.push('streak_100')
        return earned
      },

      checkBettingBadges: (betCount, winStreak, highestBet) => {
        const earned: string[] = []
        const { earnBadge } = get()
        if (betCount >= 1 && earnBadge('first_bet')) earned.push('first_bet')
        if (winStreak >= 3 && earnBadge('win_streak_3')) earned.push('win_streak_3')
        if (winStreak >= 5 && earnBadge('win_streak_5')) earned.push('win_streak_5')
        if (highestBet >= 1000 && earnBadge('high_roller')) earned.push('high_roller')
        return earned
      },

      checkSpecialBadges: (doomBalance, lifeBalance, correctPredictions) => {
        const earned: string[] = []
        const { earnBadge } = get()
        if (doomBalance >= 10000 && earnBadge('doom_master')) earned.push('doom_master')
        if (lifeBalance >= 10000 && earnBadge('life_champion')) earned.push('life_champion')
        if (correctPredictions >= 10 && earnBadge('doomsday_prophet')) earned.push('doomsday_prophet')
        return earned
      },
    }),
    { name: 'doomsday-badges' }
  )
)
