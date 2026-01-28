/**
 * Test Data Factories
 * Issue #115: Create test data factories and fixtures
 *
 * Factory functions for generating mock data in tests.
 * Each factory generates unique IDs, has sensible defaults,
 * and allows partial overrides.
 */

import type {
  Post,
  Author,
  Comment,
  PredictionEvent,
  EventCategory,
  PostVariant,
  UserProfile,
  UserRole,
  Bet,
} from '@/types'
import type { TrackedTransaction } from '@/store/transactions'
import type { WalletInfo } from '@/store/wallet'
import type { TransactionStatus } from '@/lib/solana/transaction'

// ============================================================================
// ID Generation
// ============================================================================

let idCounter = 0

/**
 * Generate a unique ID for test entities
 * Uses crypto.randomUUID if available, falls back to counter-based ID
 */
export function generateTestId(prefix = 'test'): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`
  }
  idCounter += 1
  return `${prefix}-${idCounter}-${Date.now()}`
}

/**
 * Reset the ID counter (useful between test suites)
 */
export function resetIdCounter(): void {
  idCounter = 0
}

// ============================================================================
// Type Definitions for Factory Overrides
// ============================================================================

export type PostOverrides = Partial<Omit<Post, 'author'>> & {
  author?: Partial<Author>
}

export type UserOverrides = Partial<Omit<UserProfile, 'activeBets' | 'posts'>> & {
  activeBets?: Partial<Bet>[]
  posts?: PostOverrides[]
}

export type EventOverrides = Partial<Omit<PredictionEvent, 'createdBy'>> & {
  createdBy?: Partial<Author>
}

export type TransactionOverrides = Partial<TrackedTransaction>

export type WalletOverrides = Partial<WalletInfo>

export type CommentOverrides = Partial<Comment>

export type AuthorOverrides = Partial<Author>

// ============================================================================
// Author Factory
// ============================================================================

/**
 * Create a mock Author object
 */
export function createAuthor(overrides: AuthorOverrides = {}): Author {
  const id = generateTestId('author')
  return {
    address: `wallet-${id}`,
    username: `user_${id.slice(0, 8)}`,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`,
    verified: false,
    ...overrides,
  }
}

/**
 * Create multiple mock Author objects
 */
export function createAuthors(count: number, overrides: AuthorOverrides = {}): Author[] {
  return Array.from({ length: count }, () => createAuthor(overrides))
}

// ============================================================================
// Post Factory
// ============================================================================

/**
 * Create a mock Post object
 */
export function createPost(overrides: PostOverrides = {}): Post {
  const id = generateTestId('post')
  const { author: authorOverrides, ...postOverrides } = overrides

  return {
    id,
    author: createAuthor(authorOverrides),
    content: `This is test post content for ${id}. It contains some meaningful text for testing purposes.`,
    variant: 'doom' as PostVariant,
    createdAt: Date.now() - Math.floor(Math.random() * 86400000), // Random time in last 24h
    likes: Math.floor(Math.random() * 100),
    replies: Math.floor(Math.random() * 20),
    reposts: Math.floor(Math.random() * 10),
    likedBy: [],
    isLiked: false,
    ...postOverrides,
  }
}

/**
 * Create multiple mock Post objects
 */
export function createPosts(count: number, overrides: PostOverrides = {}): Post[] {
  return Array.from({ length: count }, () => createPost(overrides))
}

/**
 * Create a doom post
 */
export function createDoomPost(overrides: PostOverrides = {}): Post {
  return createPost({
    variant: 'doom',
    content: 'The world is ending! AI will take over everything!',
    ...overrides,
  })
}

/**
 * Create a life post
 */
export function createLifePost(overrides: PostOverrides = {}): Post {
  return createPost({
    variant: 'life',
    content: 'Today I planted a garden and felt hope for the future!',
    ...overrides,
  })
}

// ============================================================================
// User Factory
// ============================================================================

/**
 * Create a mock UserProfile object
 */
export function createUser(overrides: UserOverrides = {}): UserProfile {
  const id = generateTestId('user')
  const { activeBets = [], posts = [], ...userOverrides } = overrides

  return {
    address: `wallet-${id}`,
    username: `user_${id.slice(0, 8)}`,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`,
    bio: 'A test user exploring the Doomsday platform.',
    doomBalance: Math.floor(Math.random() * 10000),
    lifeBalance: Math.floor(Math.random() * 5000),
    daysLiving: Math.floor(Math.random() * 30),
    lifeScore: Math.floor(Math.random() * 1000),
    activeBets: activeBets.map(bet => createBet(bet)),
    posts: posts.map(post => createPost(post)),
    joinedAt: Date.now() - Math.floor(Math.random() * 30 * 86400000), // Random in last 30 days
    role: 'doomer' as UserRole,
    ...userOverrides,
  }
}

/**
 * Create multiple mock UserProfile objects
 */
export function createUsers(count: number, overrides: UserOverrides = {}): UserProfile[] {
  return Array.from({ length: count }, () => createUser(overrides))
}

/**
 * Create a doomer user profile
 */
export function createDoomer(overrides: UserOverrides = {}): UserProfile {
  return createUser({
    role: 'doomer',
    doomBalance: 50000 + Math.floor(Math.random() * 50000),
    bio: 'The end is nigh. Preparing for the inevitable.',
    ...overrides,
  })
}

/**
 * Create a life-focused user profile
 */
export function createLifeUser(overrides: UserOverrides = {}): UserProfile {
  return createUser({
    role: 'life',
    lifeBalance: 50000 + Math.floor(Math.random() * 50000),
    daysLiving: 30 + Math.floor(Math.random() * 100),
    bio: 'Living life to the fullest, spreading positivity.',
    ...overrides,
  })
}

// ============================================================================
// Event Factory
// ============================================================================

const EVENT_CATEGORIES: EventCategory[] = [
  'technology',
  'economic',
  'climate',
  'war',
  'natural',
  'social',
  'other',
]

const EVENT_TITLES: Record<EventCategory, string[]> = {
  technology: ['AI Takeover', 'Quantum Computing Threat', 'Cyber Attack on Infrastructure'],
  economic: ['Market Crash 2025', 'Hyperinflation Event', 'Banking System Collapse'],
  climate: ['Ice Sheet Collapse', 'Extreme Weather Event', 'Sea Level Crisis'],
  war: ['Regional Conflict Escalation', 'Nuclear Incident', 'Cyber Warfare'],
  natural: ['Supervolcano Eruption', 'Pandemic X', 'Asteroid Impact'],
  social: ['Mass Migration Crisis', 'Civil Unrest Wave', 'Food Security Crisis'],
  other: ['Unknown Event', 'Black Swan Event', 'Unforeseen Crisis'],
}

/**
 * Create a mock PredictionEvent object
 */
export function createEvent(overrides: EventOverrides = {}): PredictionEvent {
  const id = generateTestId('event')
  const { createdBy: createdByOverrides, ...eventOverrides } = overrides

  const category = eventOverrides.category || EVENT_CATEGORIES[Math.floor(Math.random() * EVENT_CATEGORIES.length)]
  const titles = EVENT_TITLES[category]
  const title = eventOverrides.title || titles[Math.floor(Math.random() * titles.length)]

  return {
    id,
    title,
    description: `A prediction event about ${title.toLowerCase()}. This event tracks the likelihood of this scenario occurring.`,
    category,
    countdownEnd: Date.now() + Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000), // Random in next year
    doomStake: Math.floor(Math.random() * 100000),
    lifeStake: Math.floor(Math.random() * 100000),
    status: 'active',
    linkedPosts: [],
    createdAt: Date.now() - Math.floor(Math.random() * 30 * 86400000), // Random in last 30 days
    createdBy: createAuthor(createdByOverrides),
    ...eventOverrides,
  }
}

/**
 * Create multiple mock PredictionEvent objects
 */
export function createEvents(count: number, overrides: EventOverrides = {}): PredictionEvent[] {
  return Array.from({ length: count }, () => createEvent(overrides))
}

/**
 * Create an active event
 */
export function createActiveEvent(overrides: EventOverrides = {}): PredictionEvent {
  return createEvent({
    status: 'active',
    countdownEnd: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
    ...overrides,
  })
}

/**
 * Create an expired event
 */
export function createExpiredEvent(overrides: EventOverrides = {}): PredictionEvent {
  return createEvent({
    status: 'expired',
    countdownEnd: Date.now() - 24 * 60 * 60 * 1000, // 1 day ago
    ...overrides,
  })
}

// ============================================================================
// Bet Factory
// ============================================================================

/**
 * Create a mock Bet object
 */
export function createBet(overrides: Partial<Bet> = {}): Bet {
  const id = generateTestId('bet')
  return {
    id,
    eventId: generateTestId('event'),
    userId: generateTestId('user'),
    side: Math.random() > 0.5 ? 'doom' : 'life',
    amount: Math.floor(Math.random() * 1000) + 100,
    createdAt: Date.now() - Math.floor(Math.random() * 7 * 86400000), // Random in last 7 days
    ...overrides,
  }
}

/**
 * Create multiple mock Bet objects
 */
export function createBets(count: number, overrides: Partial<Bet> = {}): Bet[] {
  return Array.from({ length: count }, () => createBet(overrides))
}

// ============================================================================
// Transaction Factory
// ============================================================================

const TRANSACTION_TYPES: TrackedTransaction['type'][] = [
  'transfer',
  'stake',
  'unstake',
  'swap',
  'bet',
  'other',
]

// Transaction statuses for reference (not directly used, types imported from source)
// 'pending' | 'signing' | 'sending' | 'confirming' | 'confirmed' | 'failed'

/**
 * Create a mock TrackedTransaction object
 */
export function createTransaction(overrides: TransactionOverrides = {}): TrackedTransaction {
  const id = generateTestId('tx')
  const type = overrides.type || TRANSACTION_TYPES[Math.floor(Math.random() * TRANSACTION_TYPES.length)]
  const now = Date.now()

  return {
    id,
    signature: `sig-${id}-${Math.random().toString(36).substring(2, 15)}`,
    status: 'confirmed' as TransactionStatus,
    type,
    description: `${type.charAt(0).toUpperCase() + type.slice(1)} transaction`,
    createdAt: now - Math.floor(Math.random() * 86400000), // Random in last 24h
    updatedAt: now,
    ...overrides,
  }
}

/**
 * Create multiple mock TrackedTransaction objects
 */
export function createTransactions(count: number, overrides: TransactionOverrides = {}): TrackedTransaction[] {
  return Array.from({ length: count }, () => createTransaction(overrides))
}

/**
 * Create a pending transaction
 */
export function createPendingTransaction(overrides: TransactionOverrides = {}): TrackedTransaction {
  return createTransaction({
    status: 'pending',
    signature: undefined,
    ...overrides,
  })
}

/**
 * Create a failed transaction
 */
export function createFailedTransaction(overrides: TransactionOverrides = {}): TrackedTransaction {
  return createTransaction({
    status: 'failed',
    error: {
      type: 'NETWORK',
      message: 'Transaction failed due to network error',
      recoverable: true,
      retryable: true,
    },
    ...overrides,
  })
}

// ============================================================================
// Wallet Factory
// ============================================================================

const WALLET_TYPES = ['Phantom', 'Solflare', 'Backpack', 'Glow', 'Coinbase']

/**
 * Create a mock WalletInfo object
 */
export function createWallet(overrides: WalletOverrides = {}): WalletInfo {
  const id = generateTestId('wallet')
  const now = Date.now()

  return {
    address: `${id.slice(0, 4)}...${id.slice(-4)}`,
    nickname: undefined,
    solBalance: Math.random() * 10, // 0-10 SOL
    doomBalance: Math.floor(Math.random() * 100000),
    lifeBalance: Math.floor(Math.random() * 50000),
    lastBalanceSync: now - Math.floor(Math.random() * 3600000), // Random in last hour
    connectedAt: now - Math.floor(Math.random() * 7 * 86400000), // Random in last 7 days
    walletType: WALLET_TYPES[Math.floor(Math.random() * WALLET_TYPES.length)],
    ...overrides,
  }
}

/**
 * Create multiple mock WalletInfo objects
 */
export function createWallets(count: number, overrides: WalletOverrides = {}): WalletInfo[] {
  return Array.from({ length: count }, () => createWallet(overrides))
}

/**
 * Create a wallet with specific balances
 */
export function createWalletWithBalances(
  sol: number,
  doom: number,
  life: number,
  overrides: WalletOverrides = {}
): WalletInfo {
  return createWallet({
    solBalance: sol,
    doomBalance: doom,
    lifeBalance: life,
    lastBalanceSync: Date.now(),
    ...overrides,
  })
}

// ============================================================================
// Comment Factory
// ============================================================================

/**
 * Create a mock Comment object
 */
export function createComment(overrides: CommentOverrides = {}): Comment {
  const id = generateTestId('comment')

  return {
    id,
    postId: generateTestId('post'),
    authorUsername: `user_${id.slice(0, 8)}`,
    authorAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`,
    content: `This is a test comment for ${id}. It provides feedback on the post.`,
    createdAt: Date.now() - Math.floor(Math.random() * 86400000), // Random in last 24h
    likes: Math.floor(Math.random() * 50),
    likedBy: [],
    isPending: false,
    ...overrides,
  }
}

/**
 * Create multiple mock Comment objects
 */
export function createComments(count: number, overrides: CommentOverrides = {}): Comment[] {
  return Array.from({ length: count }, () => createComment(overrides))
}

/**
 * Create a pending comment (not yet confirmed by server)
 */
export function createPendingComment(overrides: CommentOverrides = {}): Comment {
  return createComment({
    isPending: true,
    ...overrides,
  })
}

/**
 * Create a comment with an error
 */
export function createErrorComment(overrides: CommentOverrides = {}): Comment {
  return createComment({
    isPending: false,
    error: 'Failed to post comment. Please try again.',
    ...overrides,
  })
}
