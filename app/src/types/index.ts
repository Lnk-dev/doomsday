/**
 * Core type definitions for Doomsday platform
 *
 * These types define the data structures used throughout the application
 * for posts, users, events, and the prediction market.
 */

/** Unique identifier type for entities */
export type ID = string

/** Unix timestamp in milliseconds */
export type Timestamp = number

/**
 * Post variant determines the visual styling and feed placement
 * - doom: Red accent, appears in doom-scroll
 * - life: Green accent, appears in life feed, costs $DOOM to post
 */
export type PostVariant = 'doom' | 'life'

/**
 * User role based on their primary activity
 */
export type UserRole = 'doomer' | 'prepper' | 'preventer' | 'believer' | 'life'

/**
 * Author information attached to posts and comments
 */
export interface Author {
  /** Wallet address or null for anonymous */
  address: string | null
  /** Display username */
  username: string
  /** Profile picture URL */
  avatar?: string
  /** Is this a verified account */
  verified?: boolean
}

/**
 * Media attachment type for posts
 */
export interface MediaAttachment {
  id: ID
  /** Type of media */
  type: 'image' | 'gif' | 'video'
  /** URL or base64 data URI */
  url: string
  /** Thumbnail URL for videos */
  thumbnailUrl?: string
  /** Original filename */
  filename?: string
  /** File size in bytes */
  size: number
  /** Image width in pixels */
  width?: number
  /** Image height in pixels */
  height?: number
  /** Alt text for accessibility */
  alt?: string
}

/**
 * Post entity - used for both doom-scroll and life posts
 */
export interface Post {
  id: ID
  author: Author
  content: string
  variant: PostVariant
  /** Unix timestamp of creation */
  createdAt: Timestamp
  /** Associated prediction event ID */
  linkedEventId?: ID
  /** Engagement metrics */
  likes: number
  replies: number
  reposts: number
  /** IDs of users who liked this post */
  likedBy: ID[]
  /** Has current user liked this post */
  isLiked?: boolean
  /** If this is a repost, the original post ID */
  originalPostId?: ID
  /** If this is a quote repost, the quote content */
  quoteContent?: string
  /** User who reposted (for attribution) */
  repostedBy?: Author
  /** Timestamp of the repost action */
  repostedAt?: Timestamp
  /** IDs of users who reposted this post */
  repostedByUsers?: ID[]
  /** Media attachments (max 4) */
  media?: MediaAttachment[]
}

/**
 * Prediction event categories
 */
export type EventCategory =
  | 'technology'
  | 'economic'
  | 'climate'
  | 'war'
  | 'natural'
  | 'social'
  | 'other'

/**
 * Event status in its lifecycle
 */
export type EventStatus = 'active' | 'occurred' | 'expired'

/**
 * Quality tier based on event quality score
 */
export type QualityTier = 'bronze' | 'silver' | 'gold' | 'platinum'

/**
 * Resolution type determines how an event is resolved
 */
export type ResolutionType = 'automatic' | 'oracle' | 'multi_sig' | 'community'

/**
 * Condition type for resolution criteria
 */
export type ConditionType = 'threshold' | 'occurrence' | 'geographic'

/**
 * Operator for threshold conditions
 */
export type ThresholdOperator = 'gte' | 'lte' | 'eq' | 'between'

/**
 * Source type for verification sources
 */
export type VerificationSourceType = 'government' | 'academic' | 'news' | 'api' | 'official'

/**
 * Resolution criterion defines a single condition for event resolution
 */
export interface ResolutionCriterion {
  id?: ID
  conditionType: ConditionType
  description: string
  metric?: string
  operator?: ThresholdOperator
  thresholdValue?: number
  unit?: string
  geographicScope?: string
}

/**
 * Verification source for checking event resolution
 */
export interface VerificationSource {
  id?: ID
  isPrimary: boolean
  name: string
  url?: string
  sourceType?: VerificationSourceType
}

/**
 * Event deadlines for the event lifecycle
 */
export interface EventDeadlines {
  bettingDeadline: Timestamp
  eventDeadline: Timestamp
  resolutionDeadline: Timestamp
  disputeWindowEnd: Timestamp
}

/**
 * Creator stake on their own event
 */
export interface CreatorStake {
  amount: number
  outcome: 'doom' | 'life'
}

/**
 * Prediction event - a doom scenario with a countdown
 */
export interface PredictionEvent {
  id: ID
  title: string
  description: string
  category: EventCategory
  /** Unix timestamp when countdown ends */
  countdownEnd: Timestamp
  /** Total $DOOM staked on doom outcome */
  doomStake: number
  /** Total $DOOM staked on life outcome */
  lifeStake: number
  status: EventStatus
  /** Post IDs discussing this event */
  linkedPosts: ID[]
  createdAt: Timestamp
  createdBy: Author
  /** On-chain event ID (if synced from blockchain) */
  onChainEventId?: number
  /** On-chain PDA address (if synced from blockchain) */
  onChainPDA?: string
  /** Quality score (0-100) */
  qualityScore?: number
  /** Quality tier based on score */
  qualityTier?: QualityTier
  /** Resolution type */
  resolutionType?: ResolutionType
  /** Resolution criteria */
  resolutionCriteria?: ResolutionCriterion[]
  /** Verification sources */
  verificationSources?: VerificationSource[]
  /** Event deadlines */
  deadlines?: EventDeadlines
  /** Creator stake */
  creatorStake?: CreatorStake
  /** Proposed outcome (if resolved) */
  proposedOutcome?: 'doom' | 'life'
  /** When resolution was proposed */
  proposedAt?: Timestamp
}

/**
 * Dispute status
 */
export type DisputeStatus = 'open' | 'under_review' | 'escalated' | 'upheld' | 'rejected'

/**
 * Dispute against an event resolution
 */
export interface Dispute {
  id: ID
  eventId: ID
  disputer: Author
  stakeAmount: number
  reason: string
  evidence: string[]
  status: DisputeStatus
  outcome?: 'original_stands' | 'reversed' | 'cancelled'
  createdAt: Timestamp
  resolvedAt?: Timestamp
}

/**
 * Resolution evidence submitted for disputes
 */
export interface ResolutionEvidence {
  id: ID
  eventId: ID
  submittedBy: ID
  evidenceType: 'url' | 'screenshot' | 'api_response'
  content: string
  createdAt: Timestamp
}

/**
 * User bet on a prediction event
 */
export interface Bet {
  id: ID
  eventId: ID
  userId: ID
  /** doom = event will happen, life = event won't happen */
  side: 'doom' | 'life'
  amount: number
  createdAt: Timestamp
}

/**
 * User profile and stats
 */
export interface UserProfile {
  address: string | null
  username: string
  avatar?: string
  bio?: string
  /** $DOOM token balance */
  doomBalance: number
  /** $LIFE token balance */
  lifeBalance: number
  /** Number of consecutive days with life posts */
  daysLiving: number
  /** Life score for leaderboard */
  lifeScore: number
  /** Active bets */
  activeBets: Bet[]
  /** User's posts */
  posts: Post[]
  joinedAt: Timestamp
  role: UserRole
}

/**
 * Leaderboard entry
 */
export interface LeaderboardEntry {
  rank: number
  user: Author
  score: number
  /** Rank change from previous day (positive = moved up) */
  change: number
}

/**
 * Leaderboard category
 */
export type LeaderboardCategory = 'doomer' | 'life' | 'prepper' | 'salvation' | 'preventer'

/**
 * Comment on a post
 */
export interface Comment {
  id: ID
  postId: ID
  authorUsername: string
  authorAvatar?: string
  content: string
  createdAt: Timestamp
  likes: number
  likedBy: ID[]
  /** Whether comment is pending server confirmation */
  isPending?: boolean
  /** Error message if comment failed */
  error?: string
}

/**
 * Token transaction for analytics tracking
 */
export interface TokenTransaction {
  id: ID
  /** Transaction type: earn (received) or spend (sent/used) */
  type: 'earn' | 'spend'
  /** Which token was involved */
  tokenType: 'doom' | 'life'
  /** Amount of tokens */
  amount: number
  /** Source/reason for the transaction */
  source:
    | 'bet_win'
    | 'bet_place'
    | 'life_post'
    | 'donation_sent'
    | 'donation_received'
    | 'initial'
    | 'streak_bonus'
  /** Human-readable description */
  description: string
  /** When the transaction occurred */
  createdAt: Timestamp
}

/**
 * Message delivery status
 */
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed'

/**
 * Participant info in a conversation
 */
export interface ConversationParticipant {
  id: ID
  username: string
  displayName: string | null
  avatarUrl: string | null
  verified: boolean
}

/**
 * Individual message in a conversation
 */
export interface Message {
  id: ID
  senderId: ID
  sender?: ConversationParticipant
  content: string
  status: MessageStatus
  replyTo?: {
    id: ID
    content: string
    senderId: ID
  } | null
  isDeleted: boolean
  createdAt: Timestamp
}

/**
 * Conversation between two users
 */
export interface Conversation {
  id: ID
  otherUser: ConversationParticipant
  lastMessage: {
    content: string
    senderId: ID
    createdAt: Timestamp
  } | null
  unreadCount: number
  isMuted: boolean
  isArchived: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}
