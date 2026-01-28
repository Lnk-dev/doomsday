/**
 * Badge Factory - Generate mock badge data for testing
 */

import { faker } from '@faker-js/faker'
import type { Badge, BadgeRarity, BadgeCategory, EarnedBadge } from '../../store/badges'

export interface CreateMockBadgeOptions {
  id?: string
  name?: string
  description?: string
  icon?: string
  rarity?: BadgeRarity
  category?: BadgeCategory
}

export interface CreateMockEarnedBadgeOptions {
  badgeId?: string
  earnedAt?: number
}

const BADGE_RARITIES: BadgeRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary']
const BADGE_CATEGORIES: BadgeCategory[] = ['posting', 'engagement', 'streaks', 'betting', 'special']
const BADGE_ICONS = ['pen', 'file-text', 'book-open', 'heart', 'sun', 'thumbs-up', 'star', 'award', 'flame', 'zap', 'crown', 'dice', 'trending-up', 'trophy', 'gem', 'sparkles', 'check-circle', 'skull', 'eye']
const BADGE_NAMES_BY_CATEGORY: Record<BadgeCategory, string[]> = {
  posting: ['First Words', 'Getting Started', 'Prolific Writer', 'Life Affirmer', 'Beacon of Hope'],
  engagement: ['Appreciated', 'Popular', 'Influencer', 'Community Builder', 'Viral Voice'],
  streaks: ['Week Warrior', 'Monthly Master', 'Century Legend', 'Unstoppable', 'Eternal Flame'],
  betting: ['Risk Taker', 'Lucky Streak', 'Fortune Favored', 'High Roller', 'Oracle'],
  special: ['Early Adopter', 'Verified', 'Doom Master', 'Life Champion', 'Doomsday Prophet'],
}

export function createMockBadge(options: CreateMockBadgeOptions = {}): Badge {
  const category = options.category ?? faker.helpers.arrayElement(BADGE_CATEGORIES)
  const name = options.name ?? faker.helpers.arrayElement(BADGE_NAMES_BY_CATEGORY[category])
  return {
    id: options.id ?? faker.string.alphanumeric(10).toLowerCase(),
    name,
    description: options.description ?? faker.lorem.sentence({ min: 4, max: 8 }),
    icon: options.icon ?? faker.helpers.arrayElement(BADGE_ICONS),
    rarity: options.rarity ?? faker.helpers.arrayElement(BADGE_RARITIES),
    category,
  }
}

export function createMockEarnedBadge(options: CreateMockEarnedBadgeOptions = {}): EarnedBadge {
  return {
    badgeId: options.badgeId ?? faker.string.alphanumeric(10).toLowerCase(),
    earnedAt: options.earnedAt ?? faker.date.past({ years: 1 }).getTime(),
  }
}

export function createMockBadgeWithRarity(rarity: BadgeRarity, options: Omit<CreateMockBadgeOptions, 'rarity'> = {}): Badge {
  return createMockBadge({ ...options, rarity })
}

export function createMockBadgeWithCategory(category: BadgeCategory, options: Omit<CreateMockBadgeOptions, 'category'> = {}): Badge {
  return createMockBadge({ ...options, category })
}

export function createMockBadges(count: number, options: CreateMockBadgeOptions = {}): Badge[] {
  return Array.from({ length: count }, () => createMockBadge(options))
}

export function createMockEarnedBadges(count: number, options: CreateMockEarnedBadgeOptions = {}): EarnedBadge[] {
  return Array.from({ length: count }, () => createMockEarnedBadge(options))
}

export function createMockBadgeSet(category: BadgeCategory): Badge[] {
  const names = BADGE_NAMES_BY_CATEGORY[category]
  const rarities: BadgeRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary']
  return names.map((name, index) => createMockBadge({ name, category, rarity: rarities[index % rarities.length] }))
}

export function createMockEarnedBadgesWithDefinitions(count: number): { badges: Badge[]; earnedBadges: EarnedBadge[] } {
  const badges = createMockBadges(count)
  const earnedBadges = badges.map(badge => createMockEarnedBadge({ badgeId: badge.id }))
  return { badges, earnedBadges }
}
