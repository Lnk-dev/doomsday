/**
 * User Fixtures - Static test data for user-related tests
 */

import type { Author, UserProfile, UserRole } from '../../types'

export const TEST_AUTHORS = {
  anonymous: { address: null, username: 'anonymous_user' } as Author,
  verified: { address: 'ABC123XYZ456DEF789GHI012JKL345MNO678PQR901', username: 'verified_doomer', avatar: 'https://example.com/avatar/verified.png', verified: true } as Author,
  regular: { address: 'REG123USER456WALLET789ADDRESS012EXAMPLE345', username: 'regular_user', avatar: 'https://example.com/avatar/regular.png', verified: false } as Author,
  doomer: { address: 'DOOM123SCROLL456USER789WALLET012ADDRESS345', username: 'doom_prophet', avatar: 'https://example.com/avatar/doomer.png', verified: false } as Author,
  lifer: { address: 'LIFE123AFFIRMER456USER789WALLET012ADDR345', username: 'life_affirmer', avatar: 'https://example.com/avatar/lifer.png', verified: true } as Author,
} as const

export const TEST_USERS = {
  newUser: { address: 'NEW123USER456JUST789JOINED012PLATFORM345', username: 'new_user', avatar: undefined, bio: undefined, doomBalance: 100, lifeBalance: 0, daysLiving: 0, lifeScore: 0, activeBets: [], posts: [], joinedAt: Date.now(), role: 'doomer' as UserRole } as UserProfile,
  activeDoomer: { address: 'ACTIVE123DOOMER456HIGH789DOOM012BALANCE345', username: 'active_doomer', avatar: 'https://example.com/avatar/active_doomer.png', bio: 'Predicting doom since 2024', doomBalance: 5000, lifeBalance: 200, daysLiving: 0, lifeScore: 500, activeBets: [], posts: [], joinedAt: Date.now() - 90 * 24 * 60 * 60 * 1000, role: 'doomer' as UserRole } as UserProfile,
  lifeEnthusiast: { address: 'LIFE123ENTHUSIAST456HIGH789SCORE012USER345', username: 'life_enthusiast', avatar: 'https://example.com/avatar/life_enthusiast.png', bio: 'Finding beauty in every day', doomBalance: 1000, lifeBalance: 3000, daysLiving: 45, lifeScore: 15000, activeBets: [], posts: [], joinedAt: Date.now() - 60 * 24 * 60 * 60 * 1000, role: 'life' as UserRole } as UserProfile,
  whale: { address: 'WHALE123BIG456TOKENS789HOLDER012ADDRESS345', username: 'token_whale', avatar: 'https://example.com/avatar/whale.png', bio: 'High stakes, high rewards', doomBalance: 50000, lifeBalance: 25000, daysLiving: 100, lifeScore: 100000, activeBets: [], posts: [], joinedAt: Date.now() - 365 * 24 * 60 * 60 * 1000, role: 'prepper' as UserRole } as UserProfile,
  anonymousUser: { address: null, username: 'anon_123', avatar: undefined, bio: 'Just observing', doomBalance: 100, lifeBalance: 0, daysLiving: 0, lifeScore: 0, activeBets: [], posts: [], joinedAt: Date.now() - 7 * 24 * 60 * 60 * 1000, role: 'believer' as UserRole } as UserProfile,
} as const

export const TEST_USER_LIST: UserProfile[] = Object.values(TEST_USERS)
export const TEST_AUTHOR_LIST: Author[] = Object.values(TEST_AUTHORS)
