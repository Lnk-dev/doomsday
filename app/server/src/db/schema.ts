/**
 * Database Schema - Drizzle ORM
 */

import { pgTable, text, timestamp, integer, boolean, pgEnum, uuid, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const postVariantEnum = pgEnum('post_variant', ['doom', 'life'])
export const eventStatusEnum = pgEnum('event_status', ['active', 'resolved_doom', 'resolved_life', 'cancelled'])
export const betOutcomeEnum = pgEnum('bet_outcome', ['doom', 'life'])

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  walletAddress: text('wallet_address').unique(),
  username: text('username').notNull().unique(),
  displayName: text('display_name'),
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  verified: boolean('verified').default(false),
  doomBalance: integer('doom_balance').default(100),
  lifeBalance: integer('life_balance').default(0),
  daysLiving: integer('days_living').default(0),
  lifePosts: integer('life_posts').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [index('users_wallet_idx').on(t.walletAddress), index('users_username_idx').on(t.username)])

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
}))

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, { fields: [posts.authorId], references: [users.id] }),
  comments: many(comments), likes: many(likes),
}))

export type User = typeof users.$inferSelect
export type Post = typeof posts.$inferSelect
export type Event = typeof events.$inferSelect
