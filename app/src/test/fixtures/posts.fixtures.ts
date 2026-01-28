/**
 * Post Fixtures - Static test data for post-related tests
 */

import type { Post, PostVariant } from '../../types'
import { TEST_AUTHORS } from './users.fixtures'

const NOW = Date.now()
const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

export const DOOM_POSTS = {
  short: { id: 'doom-post-short-001', author: TEST_AUTHORS.doomer, content: 'The market is about to crash.', variant: 'doom' as PostVariant, createdAt: NOW - HOUR, likes: 15, replies: 3, reposts: 2, likedBy: ['user-1', 'user-2', 'user-3'], isLiked: false } as Post,
  medium: { id: 'doom-post-medium-001', author: TEST_AUTHORS.verified, content: 'AI will replace 50% of jobs by 2030. The writing is on the wall for those paying attention.', variant: 'doom' as PostVariant, createdAt: NOW - 2 * HOUR, likes: 42, replies: 12, reposts: 8, likedBy: ['user-1', 'user-2', 'user-3', 'user-4', 'user-5'], isLiked: true } as Post,
  long: { id: 'doom-post-long-001', author: TEST_AUTHORS.regular, content: 'Climate change is accelerating faster than predicted. We are seeing record temperatures, unprecedented wildfires, and glacial melt at alarming rates.', variant: 'doom' as PostVariant, createdAt: NOW - DAY, likes: 156, replies: 45, reposts: 23, likedBy: Array.from({ length: 20 }, (_, i) => `user-${i + 1}`), isLiked: false, linkedEventId: 'event-climate-001' } as Post,
  noEngagement: { id: 'doom-post-no-engagement-001', author: TEST_AUTHORS.anonymous, content: 'This prediction will be ignored.', variant: 'doom' as PostVariant, createdAt: NOW - 3 * DAY, likes: 0, replies: 0, reposts: 0, likedBy: [], isLiked: false } as Post,
} as const

export const LIFE_POSTS = {
  short: { id: 'life-post-short-001', author: TEST_AUTHORS.lifer, content: 'Today I chose to be present.', variant: 'life' as PostVariant, createdAt: NOW - 30 * 60 * 1000, likes: 25, replies: 5, reposts: 3, likedBy: ['user-1', 'user-2', 'user-3', 'user-4'], isLiked: true } as Post,
  medium: { id: 'life-post-medium-001', author: TEST_AUTHORS.verified, content: 'Despite everything, I found beauty in a simple sunset today. Sometimes that is enough.', variant: 'life' as PostVariant, createdAt: NOW - 4 * HOUR, likes: 89, replies: 18, reposts: 12, likedBy: Array.from({ length: 15 }, (_, i) => `user-${i + 1}`), isLiked: false } as Post,
  long: { id: 'life-post-long-001', author: TEST_AUTHORS.regular, content: 'Started learning a new skill this week. It is never too late to grow and improve ourselves.', variant: 'life' as PostVariant, createdAt: NOW - 2 * DAY, likes: 234, replies: 67, reposts: 45, likedBy: Array.from({ length: 30 }, (_, i) => `user-${i + 1}`), isLiked: true } as Post,
} as const

export const REPOST_FIXTURES = {
  simpleRepost: { id: 'repost-001', author: TEST_AUTHORS.doomer, content: DOOM_POSTS.medium.content, variant: 'doom' as PostVariant, createdAt: NOW - HOUR, likes: 5, replies: 1, reposts: 0, likedBy: ['user-1'], isLiked: false, originalPostId: DOOM_POSTS.medium.id, repostedBy: TEST_AUTHORS.lifer, repostedAt: NOW - HOUR, repostedByUsers: [TEST_AUTHORS.lifer.username] } as Post,
  quoteRepost: { id: 'quote-repost-001', author: TEST_AUTHORS.lifer, content: 'This is an important perspective that needs more attention.', variant: 'doom' as PostVariant, createdAt: NOW - 2 * HOUR, likes: 12, replies: 4, reposts: 1, likedBy: ['user-1', 'user-2'], isLiked: false, originalPostId: DOOM_POSTS.long.id, quoteContent: 'This is an important perspective that needs more attention.' } as Post,
} as const

export const ALL_POSTS: Post[] = [...Object.values(DOOM_POSTS), ...Object.values(LIFE_POSTS), ...Object.values(REPOST_FIXTURES)].sort((a, b) => b.createdAt - a.createdAt)
export const DOOM_FEED: Post[] = Object.values(DOOM_POSTS).sort((a, b) => b.createdAt - a.createdAt)
export const LIFE_FEED: Post[] = Object.values(LIFE_POSTS).sort((a, b) => b.createdAt - a.createdAt)

export const POST_CONTENT = {
  doom: { short: 'The market is about to crash.', medium: 'AI will replace 50% of jobs by 2030.', long: 'Climate change is accelerating faster than predicted.' },
  life: { short: 'Today I chose to be present.', medium: 'Despite everything, I found beauty in a simple sunset today.', long: 'Started learning a new skill this week.' },
} as const
