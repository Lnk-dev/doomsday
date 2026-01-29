/**
 * Database Schema - Drizzle ORM
 */

import { pgTable, text, timestamp, integer, boolean, pgEnum, uuid, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const postVariantEnum = pgEnum('post_variant', ['doom', 'life'])
export const eventStatusEnum = pgEnum('event_status', ['active', 'resolved_doom', 'resolved_life', 'cancelled'])
export const betOutcomeEnum = pgEnum('bet_outcome', ['doom', 'life'])
export const adminRoleEnum = pgEnum('admin_role', ['super_admin', 'moderator', 'analyst', 'support'])

// Audit log enums
export const auditCategoryEnum = pgEnum('audit_category', [
  'auth',           // Login, logout, 2FA
  'user',           // Profile changes, verification
  'betting',        // Bets placed, claimed, cancelled
  'transfer',       // Token transfers, deposits, withdrawals
  'event',          // Event creation, resolution, voiding
  'moderation',     // Content moderation actions
  'admin',          // Admin actions, role changes
  'system',         // System events, errors
])

export const auditSeverityEnum = pgEnum('audit_severity', [
  'info',           // Normal operations
  'warning',        // Potential issues
  'critical',       // Security/compliance critical
])

// Fraud detection enums
export const fraudAlertStatusEnum = pgEnum('fraud_alert_status', [
  'pending',        // Awaiting review
  'investigating',  // Under investigation
  'confirmed',      // Confirmed fraud
  'dismissed',      // False positive
  'resolved',       // Action taken
])

// Content moderation enums
export const reportReasonEnum = pgEnum('report_reason', [
  'spam',
  'harassment',
  'misinformation',
  'hate_speech',
  'violence',
  'illegal_content',
  'impersonation',
  'self_harm',
  'copyright',
  'other',
])

export const reportStatusEnum = pgEnum('report_status', [
  'pending',
  'under_review',
  'resolved_action_taken',
  'resolved_no_action',
  'dismissed',
  'appealed',
])

export const moderationActionEnum = pgEnum('moderation_action', [
  'warning',
  'hide_post',
  'delete_post',
  'mute_user',
  'suspend_user',
  'ban_user',
  'no_action',
])

export const userAccountStatusEnum = pgEnum('user_account_status', [
  'active',
  'warned',
  'muted',
  'suspended',
  'banned',
])

export const restrictionTypeEnum = pgEnum('restriction_type', [
  'mute',
  'suspend',
  'ban',
])

export const appealStatusEnum = pgEnum('appeal_status', [
  'pending',
  'approved',
  'denied',
])

export const fraudAlertTypeEnum = pgEnum('fraud_alert_type', [
  'rapid_betting',       // Too many bets in short time
  'large_bet',           // Unusually large bet amount
  'pattern_anomaly',     // Unusual betting pattern
  'coordinated_betting', // Multiple accounts betting same way
  'bot_activity',        // Automated betting behavior
  'account_takeover',    // Suspicious login/activity
  'wash_trading',        // Self-trading patterns
])

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  walletAddress: text('wallet_address').unique(),
  email: text('email').unique(),
  emailVerified: boolean('email_verified').default(false),
  username: text('username').notNull().unique(),
  displayName: text('display_name'),
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  verified: boolean('verified').default(false),
  doomBalance: integer('doom_balance').default(100),
  lifeBalance: integer('life_balance').default(0),
  daysLiving: integer('days_living').default(0),
  lifePosts: integer('life_posts').default(0),
  emailPreferences: text('email_preferences'), // JSON stored as text
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [index('users_wallet_idx').on(t.walletAddress), index('users_username_idx').on(t.username), index('users_email_idx').on(t.email)])

// Admin users for dashboard access
export const adminUsers = pgTable('admin_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: adminRoleEnum('role').notNull().default('support'),
  // Two-factor authentication
  twoFactorEnabled: boolean('two_factor_enabled').default(false),
  twoFactorSecret: text('two_factor_secret'), // Encrypted TOTP secret
  twoFactorBackupCodes: text('two_factor_backup_codes'), // JSON array of hashed backup codes
  // Session management
  lastLoginAt: timestamp('last_login_at'),
  failedLoginAttempts: integer('failed_login_attempts').default(0),
  lockedUntil: timestamp('locked_until'),
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [index('admin_users_username_idx').on(t.username), index('admin_users_email_idx').on(t.email)])

// Admin sessions for tracking active sessions
export const adminSessions = pgTable('admin_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  adminId: uuid('admin_id').notNull().references(() => adminUsers.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [index('admin_sessions_admin_idx').on(t.adminId), index('admin_sessions_token_idx').on(t.token)])

export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  authorId: uuid('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  variant: postVariantEnum('variant').notNull(),
  likes: integer('likes').default(0),
  replies: integer('replies').default(0),
  reposts: integer('reposts').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [index('posts_author_idx').on(t.authorId), index('posts_created_idx').on(t.createdAt)])

export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  authorId: uuid('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  likes: integer('likes').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [index('comments_post_idx').on(t.postId)])

export const likes = pgTable('likes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  postId: uuid('post_id').references(() => posts.id, { onDelete: 'cascade' }),
  commentId: uuid('comment_id').references(() => comments.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [index('likes_user_idx').on(t.userId)])

export const follows = pgTable('follows', {
  id: uuid('id').primaryKey().defaultRandom(),
  followerId: uuid('follower_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  followingId: uuid('following_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [index('follows_follower_idx').on(t.followerId)])

export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  creatorId: uuid('creator_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  status: eventStatusEnum('status').default('active'),
  totalDoomStake: integer('total_doom_stake').default(0),
  totalLifeStake: integer('total_life_stake').default(0),
  endsAt: timestamp('ends_at').notNull(),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [index('events_status_idx').on(t.status)])

export const bets = pgTable('bets', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  outcome: betOutcomeEnum('outcome').notNull(),
  amount: integer('amount').notNull(),
  payout: integer('payout'),
  claimed: boolean('claimed').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [index('bets_event_idx').on(t.eventId)])

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts), comments: many(comments), likes: many(likes),
  followers: many(follows, { relationName: 'following' }),
  following: many(follows, { relationName: 'follower' }),
  verificationRequests: many(verificationRequests),
}))

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, { fields: [posts.authorId], references: [users.id] }),
  comments: many(comments), likes: many(likes),
}))

// Audit logs for compliance (immutable)
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  // Who
  actorId: uuid('actor_id'), // User or admin who performed action (null for system)
  actorType: text('actor_type').notNull(), // 'user', 'admin', 'system'
  actorUsername: text('actor_username'), // Denormalized for immutability
  // What
  action: text('action').notNull(), // e.g., 'bet.placed', 'user.profile_updated'
  category: auditCategoryEnum('category').notNull(),
  severity: auditSeverityEnum('severity').notNull().default('info'),
  // Target resource
  resourceType: text('resource_type'), // e.g., 'bet', 'user', 'event'
  resourceId: uuid('resource_id'),
  // Where
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  requestId: text('request_id'), // For request tracing
  // Details (what changed)
  details: text('details'), // JSON with before/after, amounts, etc.
  // Why (optional reason/notes)
  reason: text('reason'),
  // When
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  // Integrity verification
  previousHash: text('previous_hash'), // Hash of previous log entry for chain
  integrityHash: text('integrity_hash').notNull(), // SHA-256 hash of this entry
}, (t) => [
  index('audit_logs_actor_idx').on(t.actorId),
  index('audit_logs_action_idx').on(t.action),
  index('audit_logs_category_idx').on(t.category),
  index('audit_logs_resource_idx').on(t.resourceType, t.resourceId),
  index('audit_logs_timestamp_idx').on(t.timestamp),
  index('audit_logs_severity_idx').on(t.severity),
])

// Fraud alerts for suspicious activity
export const fraudAlerts = pgTable('fraud_alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  // Target user
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  username: text('username').notNull(), // Denormalized
  // Alert details
  alertType: fraudAlertTypeEnum('alert_type').notNull(),
  status: fraudAlertStatusEnum('status').notNull().default('pending'),
  riskScore: integer('risk_score').notNull(), // 0-100
  // Evidence
  details: text('details').notNull(), // JSON with evidence data
  relatedBetIds: text('related_bet_ids'), // JSON array of bet IDs
  relatedEventIds: text('related_event_ids'), // JSON array of event IDs
  // Context
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  // Resolution
  reviewedBy: uuid('reviewed_by').references(() => adminUsers.id),
  reviewedAt: timestamp('reviewed_at'),
  resolution: text('resolution'), // Admin notes on resolution
  actionTaken: text('action_taken'), // e.g., 'banned', 'warned', 'none'
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('fraud_alerts_user_idx').on(t.userId),
  index('fraud_alerts_status_idx').on(t.status),
  index('fraud_alerts_type_idx').on(t.alertType),
  index('fraud_alerts_risk_idx').on(t.riskScore),
  index('fraud_alerts_created_idx').on(t.createdAt),
])

// User risk profiles for ongoing monitoring
export const userRiskProfiles = pgTable('user_risk_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  // Risk scores
  overallRiskScore: integer('overall_risk_score').notNull().default(0), // 0-100
  bettingRiskScore: integer('betting_risk_score').notNull().default(0),
  velocityRiskScore: integer('velocity_risk_score').notNull().default(0),
  patternRiskScore: integer('pattern_risk_score').notNull().default(0),
  // Flags
  isHighRisk: boolean('is_high_risk').default(false),
  isWatchlisted: boolean('is_watchlisted').default(false),
  isBanned: boolean('is_banned').default(false),
  // Stats for pattern detection
  totalBetsPlaced: integer('total_bets_placed').default(0),
  totalBetVolume: integer('total_bet_volume').default(0),
  avgBetSize: integer('avg_bet_size').default(0),
  maxBetSize: integer('max_bet_size').default(0),
  betsLast24h: integer('bets_last_24h').default(0),
  betsLastHour: integer('bets_last_hour').default(0),
  // Last activity
  lastBetAt: timestamp('last_bet_at'),
  lastAlertAt: timestamp('last_alert_at'),
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('user_risk_profiles_risk_idx').on(t.overallRiskScore),
  index('user_risk_profiles_high_risk_idx').on(t.isHighRisk),
  index('user_risk_profiles_watchlist_idx').on(t.isWatchlisted),
])

// Content reports from users
export const reports = pgTable('reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  // What is being reported
  postId: uuid('post_id').references(() => posts.id, { onDelete: 'cascade' }),
  commentId: uuid('comment_id').references(() => comments.id, { onDelete: 'cascade' }),
  // Who
  reportedUserId: uuid('reported_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  reporterId: uuid('reporter_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  // Report details
  reason: reportReasonEnum('reason').notNull(),
  details: text('details'), // Additional context from reporter
  status: reportStatusEnum('status').notNull().default('pending'),
  // Resolution
  reviewedBy: uuid('reviewed_by').references(() => adminUsers.id),
  reviewedAt: timestamp('reviewed_at'),
  reviewNotes: text('review_notes'),
  actionTaken: moderationActionEnum('action_taken'),
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('reports_post_idx').on(t.postId),
  index('reports_reported_user_idx').on(t.reportedUserId),
  index('reports_reporter_idx').on(t.reporterId),
  index('reports_status_idx').on(t.status),
  index('reports_created_idx').on(t.createdAt),
])

// User warnings
export const userWarnings = pgTable('user_warnings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  reason: text('reason').notNull(),
  issuedBy: uuid('issued_by').notNull().references(() => adminUsers.id),
  reportId: uuid('report_id').references(() => reports.id),
  // Acknowledgment
  acknowledged: boolean('acknowledged').default(false),
  acknowledgedAt: timestamp('acknowledged_at'),
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('user_warnings_user_idx').on(t.userId),
  index('user_warnings_created_idx').on(t.createdAt),
])

// User restrictions (mutes, suspensions, bans)
export const userRestrictions = pgTable('user_restrictions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: restrictionTypeEnum('type').notNull(),
  reason: text('reason').notNull(),
  issuedBy: uuid('issued_by').notNull().references(() => adminUsers.id),
  reportId: uuid('report_id').references(() => reports.id),
  // Duration
  expiresAt: timestamp('expires_at'), // null = permanent
  // Appeal
  appealId: uuid('appeal_id'),
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  revokedAt: timestamp('revoked_at'),
  revokedBy: uuid('revoked_by').references(() => adminUsers.id),
}, (t) => [
  index('user_restrictions_user_idx').on(t.userId),
  index('user_restrictions_type_idx').on(t.type),
  index('user_restrictions_expires_idx').on(t.expiresAt),
])

// Appeals against moderation actions
export const appeals = pgTable('appeals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  restrictionId: uuid('restriction_id').references(() => userRestrictions.id),
  reportId: uuid('report_id').references(() => reports.id),
  // Appeal content
  reason: text('reason').notNull(),
  status: appealStatusEnum('status').notNull().default('pending'),
  // Review
  reviewedBy: uuid('reviewed_by').references(() => adminUsers.id),
  reviewNotes: text('review_notes'),
  reviewedAt: timestamp('reviewed_at'),
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('appeals_user_idx').on(t.userId),
  index('appeals_status_idx').on(t.status),
  index('appeals_created_idx').on(t.createdAt),
])

// Moderation log for audit trail
export const moderationLogs = pgTable('moderation_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  // Action details
  action: moderationActionEnum('action').notNull(),
  moderatorId: uuid('moderator_id').notNull().references(() => adminUsers.id),
  moderatorUsername: text('moderator_username').notNull(), // Denormalized
  // Target
  postId: uuid('post_id').references(() => posts.id, { onDelete: 'set null' }),
  targetUserId: uuid('target_user_id').references(() => users.id, { onDelete: 'set null' }),
  targetUsername: text('target_username'), // Denormalized
  reportId: uuid('report_id').references(() => reports.id),
  // Context
  reason: text('reason').notNull(),
  notes: text('notes'),
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('moderation_logs_moderator_idx').on(t.moderatorId),
  index('moderation_logs_target_idx').on(t.targetUserId),
  index('moderation_logs_action_idx').on(t.action),
  index('moderation_logs_created_idx').on(t.createdAt),
])

// Hidden posts (soft delete for moderation)
export const hiddenPosts = pgTable('hidden_posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }).unique(),
  hiddenBy: uuid('hidden_by').notNull().references(() => adminUsers.id),
  reason: text('reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('hidden_posts_post_idx').on(t.postId),
])

// Verification request status enum
export const verificationStatusEnum = pgEnum('verification_status', [
  'pending',      // Awaiting review
  'approved',     // Verified
  'rejected',     // Rejected
  'revoked',      // Previously approved, now revoked
])

// Verification type enum
export const verificationTypeEnum = pgEnum('verification_type', [
  'notable',      // Notable person/organization
  'creator',      // Content creator
  'business',     // Business account
  'official',     // Official account
])

// Verification requests
export const verificationRequests = pgTable('verification_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  // Request details
  type: verificationTypeEnum('type').notNull(),
  status: verificationStatusEnum('status').notNull().default('pending'),
  // Supporting information
  realName: text('real_name').notNull(),
  category: text('category').notNull(), // e.g., "journalist", "athlete", "brand"
  description: text('description').notNull(), // Why they should be verified
  evidenceUrls: text('evidence_urls'), // JSON array of URLs (social links, articles, etc.)
  // Contact info for verification
  publicEmail: text('public_email'),
  websiteUrl: text('website_url'),
  // Review
  reviewedBy: uuid('reviewed_by').references(() => adminUsers.id),
  reviewNotes: text('review_notes'),
  rejectionReason: text('rejection_reason'),
  reviewedAt: timestamp('reviewed_at'),
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('verification_requests_user_idx').on(t.userId),
  index('verification_requests_status_idx').on(t.status),
  index('verification_requests_created_idx').on(t.createdAt),
])

export const verificationRequestsRelations = relations(verificationRequests, ({ one }) => ({
  user: one(users, { fields: [verificationRequests.userId], references: [users.id] }),
  reviewer: one(adminUsers, { fields: [verificationRequests.reviewedBy], references: [adminUsers.id] }),
}))

// Message status enum
export const messageStatusEnum = pgEnum('message_status', [
  'sending',
  'sent',
  'delivered',
  'read',
  'failed',
])

// Conversations table
export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  // Participants (always 2 for DMs)
  participant1Id: uuid('participant1_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  participant2Id: uuid('participant2_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  // Last message info (denormalized for efficient listing)
  lastMessageId: uuid('last_message_id'),
  lastMessageContent: text('last_message_content'),
  lastMessageSenderId: uuid('last_message_sender_id'),
  lastMessageAt: timestamp('last_message_at'),
  // Per-user settings (stored as JSON)
  participant1Muted: boolean('participant1_muted').default(false),
  participant2Muted: boolean('participant2_muted').default(false),
  participant1Archived: boolean('participant1_archived').default(false),
  participant2Archived: boolean('participant2_archived').default(false),
  // Unread counts
  participant1Unread: integer('participant1_unread').default(0),
  participant2Unread: integer('participant2_unread').default(0),
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('conversations_participant1_idx').on(t.participant1Id),
  index('conversations_participant2_idx').on(t.participant2Id),
  index('conversations_updated_idx').on(t.updatedAt),
])

// Messages table
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  senderId: uuid('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  status: messageStatusEnum('status').default('sent'),
  // Reply support - self-reference handled via SQL, not Drizzle reference to avoid circular type
  replyToId: uuid('reply_to_id'),
  // Soft delete
  isDeleted: boolean('is_deleted').default(false),
  deletedAt: timestamp('deleted_at'),
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('messages_conversation_idx').on(t.conversationId),
  index('messages_sender_idx').on(t.senderId),
  index('messages_created_idx').on(t.createdAt),
])

// Message read receipts (optional, for detailed tracking)
export const messageReadReceipts = pgTable('message_read_receipts', {
  id: uuid('id').primaryKey().defaultRandom(),
  messageId: uuid('message_id').notNull().references(() => messages.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  readAt: timestamp('read_at').defaultNow().notNull(),
}, (t) => [
  index('message_read_receipts_message_idx').on(t.messageId),
  index('message_read_receipts_user_idx').on(t.userId),
])

// Conversation relations
export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  participant1: one(users, { fields: [conversations.participant1Id], references: [users.id], relationName: 'participant1' }),
  participant2: one(users, { fields: [conversations.participant2Id], references: [users.id], relationName: 'participant2' }),
  messages: many(messages),
}))

// Message relations
// Note: replyTo self-relation is handled manually in queries to avoid circular type inference
export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, { fields: [messages.conversationId], references: [conversations.id] }),
  sender: one(users, { fields: [messages.senderId], references: [users.id] }),
}))

export type User = typeof users.$inferSelect
export type Post = typeof posts.$inferSelect
export type Event = typeof events.$inferSelect
export type AdminUser = typeof adminUsers.$inferSelect
export type AdminSession = typeof adminSessions.$inferSelect
export type AuditLog = typeof auditLogs.$inferSelect
export type FraudAlert = typeof fraudAlerts.$inferSelect
export type UserRiskProfile = typeof userRiskProfiles.$inferSelect
export type Report = typeof reports.$inferSelect
export type UserWarning = typeof userWarnings.$inferSelect
export type UserRestriction = typeof userRestrictions.$inferSelect
export type Appeal = typeof appeals.$inferSelect
export type ModerationLog = typeof moderationLogs.$inferSelect
export type VerificationRequest = typeof verificationRequests.$inferSelect
export type Conversation = typeof conversations.$inferSelect
export type Message = typeof messages.$inferSelect
