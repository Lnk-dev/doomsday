/**
 * Test Fixtures
 * Issue #115: Create test data factories and fixtures
 *
 * Pre-defined mock data for consistent testing across the application.
 * These fixtures provide stable, predictable data for snapshot testing
 * and scenarios that need consistent state.
 */

import type {
  Post,
  Author,
  Comment,
  PredictionEvent,
  UserProfile,
} from '@/types'
import type { TrackedTransaction } from '@/store/transactions'
import type { WalletInfo } from '@/store/wallet'
import type { TransactionStatus } from '@/lib/solana/transaction'

// ============================================================================
// Mock Authors
// ============================================================================

export const MOCK_AUTHORS: Author[] = [
  {
    address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    username: 'cryptodoomer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cryptodoomer',
    verified: true,
  },
  {
    address: '3ZGKmYDrp2jM9tK8E6B6MJfhYxqrU9FZA1Y7KpV8DQMN',
    username: 'hopeful_prepper',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=hopeful_prepper',
    verified: false,
  },
  {
    address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrzYW4w2t6gU5FCBL3JK',
    username: 'tech_prophet',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tech_prophet',
    verified: true,
  },
  {
    address: null,
    username: 'anonymous_watcher',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=anonymous',
    verified: false,
  },
  {
    address: 'BPFLoaderUpgradeab1e11111111111111111111111',
    username: 'climate_sentinel',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=climate_sentinel',
    verified: true,
  },
]

// ============================================================================
// Mock Users
// ============================================================================

export const MOCK_USERS: UserProfile[] = [
  {
    address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    username: 'cryptodoomer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cryptodoomer',
    bio: 'Been predicting the end since 2012. Still waiting.',
    doomBalance: 125000,
    lifeBalance: 5000,
    daysLiving: 0,
    lifeScore: 50,
    activeBets: [
      {
        id: 'bet-1',
        eventId: 'event-ai-singularity',
        userId: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
        side: 'doom',
        amount: 5000,
        createdAt: 1704067200000, // 2024-01-01
      },
    ],
    posts: [],
    joinedAt: 1672531200000, // 2023-01-01
    role: 'doomer',
  },
  {
    address: '3ZGKmYDrp2jM9tK8E6B6MJfhYxqrU9FZA1Y7KpV8DQMN',
    username: 'hopeful_prepper',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=hopeful_prepper',
    bio: 'Preparing for the worst, hoping for the best.',
    doomBalance: 45000,
    lifeBalance: 78000,
    daysLiving: 45,
    lifeScore: 850,
    activeBets: [],
    posts: [],
    joinedAt: 1680307200000, // 2023-04-01
    role: 'prepper',
  },
  {
    address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrzYW4w2t6gU5FCBL3JK',
    username: 'tech_prophet',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tech_prophet',
    bio: 'AI researcher. The singularity is closer than you think.',
    doomBalance: 250000,
    lifeBalance: 12000,
    daysLiving: 5,
    lifeScore: 120,
    activeBets: [
      {
        id: 'bet-2',
        eventId: 'event-ai-singularity',
        userId: '9WzDXwBbmkg8ZTbNMqUxvQRAyrzYW4w2t6gU5FCBL3JK',
        side: 'doom',
        amount: 50000,
        createdAt: 1704153600000, // 2024-01-02
      },
      {
        id: 'bet-3',
        eventId: 'event-economic-collapse',
        userId: '9WzDXwBbmkg8ZTbNMqUxvQRAyrzYW4w2t6gU5FCBL3JK',
        side: 'life',
        amount: 10000,
        createdAt: 1704240000000, // 2024-01-03
      },
    ],
    posts: [],
    joinedAt: 1656633600000, // 2022-07-01
    role: 'preventer',
  },
  {
    address: 'BPFLoaderUpgradeab1e11111111111111111111111',
    username: 'climate_sentinel',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=climate_sentinel',
    bio: 'Climate scientist. Data-driven doom predictions.',
    doomBalance: 89000,
    lifeBalance: 156000,
    daysLiving: 120,
    lifeScore: 2400,
    activeBets: [],
    posts: [],
    joinedAt: 1641024000000, // 2022-01-01
    role: 'life',
  },
]

// ============================================================================
// Mock Posts
// ============================================================================

export const MOCK_POSTS: Post[] = [
  {
    id: 'post-doom-1',
    author: MOCK_AUTHORS[0],
    content: 'AI just beat another benchmark. We have maybe 5 years before AGI. The countdown has begun. #AITakeover #Doom',
    variant: 'doom',
    createdAt: 1704326400000, // 2024-01-04
    linkedEventId: 'event-ai-singularity',
    likes: 1247,
    replies: 89,
    reposts: 234,
    likedBy: ['user-1', 'user-2', 'user-3'],
    isLiked: false,
  },
  {
    id: 'post-doom-2',
    author: MOCK_AUTHORS[2],
    content: 'Just analyzed the latest economic data. Central banks are running out of options. This debt bubble will pop. #EconomicCollapse',
    variant: 'doom',
    createdAt: 1704240000000, // 2024-01-03
    linkedEventId: 'event-economic-collapse',
    likes: 892,
    replies: 156,
    reposts: 178,
    likedBy: ['user-4', 'user-5'],
    isLiked: true,
  },
  {
    id: 'post-life-1',
    author: MOCK_AUTHORS[1],
    content: 'Started a community garden today. 20 families joined! Sometimes the small things matter most. #Life #Hope #Community',
    variant: 'life',
    createdAt: 1704153600000, // 2024-01-02
    likes: 2341,
    replies: 45,
    reposts: 567,
    likedBy: ['user-1', 'user-6', 'user-7', 'user-8'],
    isLiked: false,
  },
  {
    id: 'post-doom-3',
    author: MOCK_AUTHORS[4],
    content: 'New climate data in. Arctic ice loss accelerating faster than models predicted. Tipping points approaching. #ClimateEmergency',
    variant: 'doom',
    createdAt: 1704067200000, // 2024-01-01
    linkedEventId: 'event-climate-tipping',
    likes: 3456,
    replies: 234,
    reposts: 890,
    likedBy: [],
    isLiked: false,
  },
  {
    id: 'post-life-2',
    author: MOCK_AUTHORS[3],
    content: 'Day 30 of my positivity streak! Turns out focusing on solutions instead of problems actually helps. Who knew? #LifeStreak',
    variant: 'life',
    createdAt: 1703980800000, // 2023-12-31
    likes: 1567,
    replies: 78,
    reposts: 234,
    likedBy: ['user-2', 'user-9'],
    isLiked: true,
  },
  {
    id: 'post-doom-4',
    author: MOCK_AUTHORS[0],
    content: 'Reposting because this aged well. Called the market crash 6 months ago.',
    variant: 'doom',
    createdAt: 1703894400000, // 2023-12-30
    likes: 567,
    replies: 23,
    reposts: 89,
    likedBy: [],
    isLiked: false,
    originalPostId: 'post-old-1',
    repostedBy: MOCK_AUTHORS[0],
    repostedAt: 1703894400000,
  },
]

// ============================================================================
// Mock Events
// ============================================================================

export const MOCK_EVENTS: PredictionEvent[] = [
  {
    id: 'event-ai-singularity',
    title: 'AI Singularity',
    description: 'Artificial General Intelligence surpasses human intelligence, leading to rapid recursive self-improvement.',
    category: 'technology',
    countdownEnd: 1798761600000, // 2027-01-01
    doomStake: 2500000,
    lifeStake: 1800000,
    status: 'active',
    linkedPosts: ['post-doom-1'],
    createdAt: 1672531200000, // 2023-01-01
    createdBy: MOCK_AUTHORS[2],
  },
  {
    id: 'event-economic-collapse',
    title: 'Global Economic Collapse',
    description: 'Systemic failure of global financial markets leading to widespread economic depression exceeding the Great Depression.',
    category: 'economic',
    countdownEnd: 1735689600000, // 2025-01-01
    doomStake: 4500000,
    lifeStake: 3200000,
    status: 'active',
    linkedPosts: ['post-doom-2'],
    createdAt: 1680307200000, // 2023-04-01
    createdBy: MOCK_AUTHORS[0],
  },
  {
    id: 'event-climate-tipping',
    title: 'Climate Tipping Point',
    description: 'Irreversible climate feedback loops trigger catastrophic environmental changes including mass extinction events.',
    category: 'climate',
    countdownEnd: 1861920000000, // 2029-01-01
    doomStake: 1890000,
    lifeStake: 3560000,
    status: 'active',
    linkedPosts: ['post-doom-3'],
    createdAt: 1656633600000, // 2022-07-01
    createdBy: MOCK_AUTHORS[4],
  },
  {
    id: 'event-pandemic-x',
    title: 'Pandemic X',
    description: 'Novel pathogen causes global pandemic with mortality rate exceeding 5% and no effective treatment.',
    category: 'natural',
    countdownEnd: 1767225600000, // 2026-01-01
    doomStake: 1450000,
    lifeStake: 1980000,
    status: 'active',
    linkedPosts: [],
    createdAt: 1688169600000, // 2023-07-01
    createdBy: MOCK_AUTHORS[1],
  },
  {
    id: 'event-nuclear-incident',
    title: 'Nuclear Incident',
    description: 'Major nuclear event involving detonation of nuclear weapon in conflict or terrorist attack.',
    category: 'war',
    countdownEnd: 1751328000000, // 2025-07-01
    doomStake: 780000,
    lifeStake: 2340000,
    status: 'active',
    linkedPosts: [],
    createdAt: 1696118400000, // 2023-10-01
    createdBy: MOCK_AUTHORS[3],
  },
  {
    id: 'event-y2k-expired',
    title: 'Y2K Bug Resurfaces',
    description: 'Legacy Y2K-related bugs cause widespread infrastructure failures.',
    category: 'technology',
    countdownEnd: 1577836800000, // 2020-01-01
    doomStake: 50000,
    lifeStake: 500000,
    status: 'expired',
    linkedPosts: [],
    createdAt: 1546300800000, // 2019-01-01
    createdBy: MOCK_AUTHORS[0],
  },
]

// ============================================================================
// Mock Transactions
// ============================================================================

export const MOCK_TRANSACTIONS: TrackedTransaction[] = [
  {
    id: 'tx-1',
    signature: '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d5kRFYXEHvWoYJh5YQ3dkYtTCxMH9HXVdG5jVpGz',
    status: 'confirmed' as TransactionStatus,
    type: 'bet',
    description: 'Placed bet on AI Singularity (DOOM)',
    createdAt: 1704326400000,
    updatedAt: 1704326460000,
  },
  {
    id: 'tx-2',
    signature: '3Jz5vLrHxwvqYdqNk8eTWpjJqBcmFcQYxGHqWDPYCnYnGxvqBzYLfDcA1Xp4Nm7R8sT9uVwX2yZaB',
    status: 'confirmed' as TransactionStatus,
    type: 'transfer',
    description: 'Transferred 1000 DOOM to hopeful_prepper',
    createdAt: 1704240000000,
    updatedAt: 1704240120000,
  },
  {
    id: 'tx-3',
    signature: '2KpHxwYrVmZqJnLsT4RfGhYi9Wk3MjBvCxDzE5aFgHnJqLm8NoPrStUvWxYz1A2bCdEfGhIjKl',
    status: 'failed' as TransactionStatus,
    type: 'stake',
    description: 'Failed to stake 5000 DOOM',
    error: {
      type: 'INSUFFICIENT_SOL',
      message: 'Insufficient SOL for transaction fee',
      recoverable: true,
      retryable: true,
    },
    createdAt: 1704153600000,
    updatedAt: 1704153660000,
  },
  {
    id: 'tx-4',
    status: 'pending' as TransactionStatus,
    type: 'swap',
    description: 'Swapping 500 LIFE for DOOM',
    createdAt: 1704326500000,
    updatedAt: 1704326500000,
  },
  {
    id: 'tx-5',
    signature: '4ZqYxWvUtSrQpOnMlKjIhGfEdCbAz9y8X7w6V5u4T3s2R1qPnMkLjHgFeDcBaY',
    status: 'confirming' as TransactionStatus,
    type: 'unstake',
    description: 'Unstaking 2000 DOOM from Climate Tipping Point',
    createdAt: 1704326300000,
    updatedAt: 1704326350000,
  },
]

// ============================================================================
// Mock Wallets
// ============================================================================

export const MOCK_WALLETS: WalletInfo[] = [
  {
    address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    nickname: 'Main Wallet',
    solBalance: 5.234,
    doomBalance: 125000,
    lifeBalance: 5000,
    lastBalanceSync: 1704326400000,
    connectedAt: 1672531200000,
    walletType: 'Phantom',
  },
  {
    address: '3ZGKmYDrp2jM9tK8E6B6MJfhYxqrU9FZA1Y7KpV8DQMN',
    nickname: 'Trading Wallet',
    solBalance: 12.567,
    doomBalance: 45000,
    lifeBalance: 78000,
    lastBalanceSync: 1704326300000,
    connectedAt: 1680307200000,
    walletType: 'Solflare',
  },
  {
    address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrzYW4w2t6gU5FCBL3JK',
    nickname: undefined,
    solBalance: 0.5,
    doomBalance: 250000,
    lifeBalance: 12000,
    lastBalanceSync: 1704326200000,
    connectedAt: 1656633600000,
    walletType: 'Backpack',
  },
]

// ============================================================================
// Mock Comments
// ============================================================================

export const MOCK_COMMENTS: Comment[] = [
  {
    id: 'comment-1',
    postId: 'post-doom-1',
    authorUsername: 'hopeful_prepper',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=hopeful_prepper',
    content: 'I think you are overestimating the speed of AI progress. Lots of hype, not so much reality.',
    createdAt: 1704327000000,
    likes: 45,
    likedBy: ['user-10', 'user-11'],
    isPending: false,
  },
  {
    id: 'comment-2',
    postId: 'post-doom-1',
    authorUsername: 'tech_prophet',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tech_prophet',
    content: 'As someone in the field, I can confirm. The rate of improvement is exponential. This is not hype.',
    createdAt: 1704328000000,
    likes: 123,
    likedBy: ['user-1', 'user-12', 'user-13'],
    isPending: false,
  },
  {
    id: 'comment-3',
    postId: 'post-life-1',
    authorUsername: 'anonymous_watcher',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=anonymous',
    content: 'This is exactly what we need more of. Building community resilience instead of doom scrolling.',
    createdAt: 1704154000000,
    likes: 234,
    likedBy: [],
    isPending: false,
  },
  {
    id: 'comment-4',
    postId: 'post-doom-3',
    authorUsername: 'cryptodoomer',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cryptodoomer',
    content: 'Can you share the source for this data?',
    createdAt: 1704068000000,
    likes: 12,
    likedBy: [],
    isPending: false,
  },
  {
    id: 'comment-5',
    postId: 'post-doom-3',
    authorUsername: 'climate_sentinel',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=climate_sentinel',
    content: 'Link to the full study: https://example.com/climate-data-2024',
    createdAt: 1704069000000,
    likes: 89,
    likedBy: ['user-14'],
    isPending: false,
  },
]

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get a specific mock user by username
 */
export function getMockUser(username: string): UserProfile | undefined {
  return MOCK_USERS.find(user => user.username === username)
}

/**
 * Get a specific mock post by ID
 */
export function getMockPost(id: string): Post | undefined {
  return MOCK_POSTS.find(post => post.id === id)
}

/**
 * Get a specific mock event by ID
 */
export function getMockEvent(id: string): PredictionEvent | undefined {
  return MOCK_EVENTS.find(event => event.id === id)
}

/**
 * Get comments for a specific post
 */
export function getMockCommentsForPost(postId: string): Comment[] {
  return MOCK_COMMENTS.filter(comment => comment.postId === postId)
}

/**
 * Get doom posts only
 */
export function getDoomPosts(): Post[] {
  return MOCK_POSTS.filter(post => post.variant === 'doom')
}

/**
 * Get life posts only
 */
export function getLifePosts(): Post[] {
  return MOCK_POSTS.filter(post => post.variant === 'life')
}

/**
 * Get active events only
 */
export function getActiveEvents(): PredictionEvent[] {
  return MOCK_EVENTS.filter(event => event.status === 'active')
}

/**
 * Get pending transactions
 */
export function getPendingTransactions(): TrackedTransaction[] {
  return MOCK_TRANSACTIONS.filter(tx => tx.status !== 'confirmed' && tx.status !== 'failed')
}
