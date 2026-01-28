/**
 * User Factory - Generate mock user data for testing
 */

import { faker } from '@faker-js/faker'
import type { Author, UserProfile, UserRole, Bet, Post } from '../../types'

export interface CreateMockUserOptions {
  address?: string | null
  username?: string
  avatar?: string
  verified?: boolean
  bio?: string
  doomBalance?: number
  lifeBalance?: number
  daysLiving?: number
  lifeScore?: number
  activeBets?: Bet[]
  posts?: Post[]
  joinedAt?: number
  role?: UserRole
}

export interface CreateMockAuthorOptions {
  address?: string | null
  username?: string
  avatar?: string
  verified?: boolean
}

/**
 * Generate a realistic wallet address
 */
export function createMockWalletAddress(): string {
  return faker.string.alphanumeric({ length: 44, casing: 'mixed' })
}

/**
 * Generate a mock username
 */
export function createMockUsername(): string {
  return faker.internet.username().toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 15)
}

/**
 * Create a mock Author object
 */
export function createMockAuthor(options: CreateMockAuthorOptions = {}): Author {
  return {
    address: options.address !== undefined ? options.address : (faker.datatype.boolean() ? createMockWalletAddress() : null),
    username: options.username ?? createMockUsername(),
    avatar: options.avatar ?? (faker.datatype.boolean(0.7) ? faker.image.avatar() : undefined),
    verified: options.verified ?? faker.datatype.boolean(0.1),
  }
}

/**
 * Create a mock UserProfile object
 */
export function createMockUser(options: CreateMockUserOptions = {}): UserProfile {
  const roles: UserRole[] = ['doomer', 'prepper', 'preventer', 'believer', 'life']

  return {
    address: options.address !== undefined ? options.address : (faker.datatype.boolean() ? createMockWalletAddress() : null),
    username: options.username ?? createMockUsername(),
    avatar: options.avatar ?? (faker.datatype.boolean(0.7) ? faker.image.avatar() : undefined),
    bio: options.bio ?? (faker.datatype.boolean(0.6) ? faker.lorem.sentence({ min: 5, max: 20 }) : undefined),
    doomBalance: options.doomBalance ?? faker.number.int({ min: 0, max: 10000 }),
    lifeBalance: options.lifeBalance ?? faker.number.int({ min: 0, max: 5000 }),
    daysLiving: options.daysLiving ?? faker.number.int({ min: 0, max: 365 }),
    lifeScore: options.lifeScore ?? faker.number.int({ min: 0, max: 100000 }),
    activeBets: options.activeBets ?? [],
    posts: options.posts ?? [],
    joinedAt: options.joinedAt ?? faker.date.past({ years: 1 }).getTime(),
    role: options.role ?? faker.helpers.arrayElement(roles),
  }
}

/**
 * Create multiple mock users
 */
export function createMockUsers(count: number, options: CreateMockUserOptions = {}): UserProfile[] {
  return Array.from({ length: count }, () => createMockUser(options))
}

/**
 * Create multiple mock authors
 */
export function createMockAuthors(count: number, options: CreateMockAuthorOptions = {}): Author[] {
  return Array.from({ length: count }, () => createMockAuthor(options))
}
