/**
 * Admin Dashboard Type Definitions
 */

// Admin roles with their permission levels
export type AdminRole = 'super_admin' | 'moderator' | 'analyst' | 'support'

// Admin user from the backend
export interface AdminUser {
  id: string
  username: string
  email: string
  role: AdminRole
  createdAt: number
  lastLoginAt?: number
  twoFactorEnabled?: boolean
}

// Admin session
export interface AdminSession {
  token: string
  admin: AdminUser
  expiresAt: number
}

// Login request/response
export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  admin: AdminUser
  expiresAt: number
}

// User management types
export interface UserView {
  id: string
  username: string
  email?: string
  avatar?: string
  status: 'active' | 'banned' | 'warned'
  createdAt: number
  lastActiveAt?: number
  postCount: number
  betCount: number
  warningCount: number
}

export interface UserDetail extends UserView {
  bio?: string
  doomBalance: number
  lifeBalance: number
  posts: UserPost[]
  bets: UserBet[]
  warnings: UserWarning[]
  auditLog: AuditLogEntry[]
}

export interface UserPost {
  id: string
  content: string
  createdAt: number
  likes: number
  replies: number
}

export interface UserBet {
  id: string
  eventId: string
  eventTitle: string
  outcome: 'doom' | 'life'
  amount: number
  status: 'pending' | 'won' | 'lost' | 'cancelled'
  createdAt: number
}

export interface UserWarning {
  id: string
  message: string
  severity: 'low' | 'medium' | 'high'
  issuedBy: string
  createdAt: number
}

export interface UserFilters {
  query?: string
  status?: 'all' | 'active' | 'banned' | 'warned'
  sortBy?: 'username' | 'createdAt' | 'lastActiveAt' | 'postCount'
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedUsers {
  users: UserView[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Moderation types
export type ModerationStatus = 'pending' | 'in_progress' | 'approved' | 'rejected' | 'escalated'
export type ContentType = 'post' | 'comment' | 'profile' | 'event'
export type ModerationPriority = 'low' | 'medium' | 'high' | 'critical'

export interface ModerationItem {
  id: string
  contentType: ContentType
  contentId: string
  contentPreview: string
  reporterId: string
  reporterUsername: string
  reportReason: string
  status: ModerationStatus
  priority: ModerationPriority
  claimedBy?: string
  claimedAt?: number
  createdAt: number
  // Content author info
  authorId: string
  authorUsername: string
  authorAvatar?: string
}

export interface ModerationStats {
  pending: number
  inProgress: number
  resolvedToday: number
  highPriority: number
}

export interface ModerationQueue {
  items: ModerationItem[]
  stats: ModerationStats
}

export type ReviewAction = 'approve' | 'remove' | 'warn' | 'ban' | 'escalate'

export interface ReviewRequest {
  action: ReviewAction
  notes?: string
  warningSeverity?: 'low' | 'medium' | 'high'
  banDuration?: number // in days, undefined = permanent
}

// Analytics types
export type TimeRange = '24h' | '7d' | '30d' | '90d' | 'all'

export interface OverviewMetrics {
  // User metrics
  dau: number
  dauChange: number
  wau: number
  wauChange: number
  mau: number
  mauChange: number
  totalUsers: number
  userGrowth: number
  // Content metrics
  totalPosts: number
  postsChange: number
  totalBets: number
  betsChange: number
  totalVolume: number
  volumeChange: number
  // Event metrics
  activeEvents: number
  resolvedEvents: number
  pendingEvents: number
  // Moderation metrics
  pendingModeration: number
  reportedContent: number
}

export interface TimeseriesDataPoint {
  timestamp: number
  value: number
}

export interface TimeseriesData {
  metric: string
  data: TimeseriesDataPoint[]
}

export interface LeaderboardEntry {
  rank: number
  userId: string
  username: string
  avatar?: string
  value: number
  label: string
}

export type LeaderboardType = 'bettors' | 'posters' | 'earners' | 'events'

export interface LeaderboardData {
  type: LeaderboardType
  entries: LeaderboardEntry[]
  timeRange: TimeRange
}

// Event resolution types
export interface PendingEvent {
  id: string
  title: string
  description: string
  createdBy: string
  createdAt: number
  endDate: number
  totalVolume: number
  doomVolume: number
  lifeVolume: number
  bettorCount: number
  status: 'active' | 'ended' | 'resolved' | 'voided'
}

export interface EventResolutionDetails extends PendingEvent {
  bets: EventBet[]
  payoutPreview: PayoutPreview
}

export interface EventBet {
  userId: string
  username: string
  outcome: 'doom' | 'life'
  amount: number
  potentialPayout: number
}

export interface PayoutPreview {
  winningOutcome: 'doom' | 'life'
  totalPayout: number
  winners: number
  losers: number
}

export interface ResolveEventRequest {
  outcome: 'doom' | 'life'
  notes: string
}

export interface VoidEventRequest {
  reason: string
}

// Audit log
export interface AuditLogEntry {
  id: string
  action: string
  targetType: 'user' | 'post' | 'comment' | 'event' | 'moderation'
  targetId: string
  performedBy: string
  performedByUsername: string
  details?: Record<string, unknown>
  createdAt: number
}

// Permissions
export type Permission =
  | 'users.view'
  | 'users.ban'
  | 'users.unban'
  | 'users.warn'
  | 'moderation.view'
  | 'moderation.claim'
  | 'moderation.review'
  | 'analytics.view'
  | 'events.view'
  | 'events.resolve'
  | 'events.void'
  | '*'

// 2FA types
export interface TwoFactorSetupResponse {
  secret: string
  qrCode: string
}

export interface TwoFactorVerifyRequest {
  code: string
  secret: string
}

export interface TwoFactorVerifyResponse {
  success: boolean
  backupCodes: string[]
}

export interface TwoFactorDisableRequest {
  password: string
}

export interface TwoFactorRegenerateRequest {
  code: string
}

export interface TwoFactorRegenerateResponse {
  backupCodes: string[]
}

export interface Verify2FARequest {
  code: string
}

export interface LoginResponseWith2FA extends LoginResponse {
  requires2FA?: boolean
  tempToken?: string
}
