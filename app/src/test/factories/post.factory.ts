/**
 * Post Factory - Generate mock post data for testing
 */

import { faker } from '@faker-js/faker'
import type { Post, PostVariant, Author, ID } from '../../types'
import { createMockAuthor, type CreateMockAuthorOptions } from './user.factory'

export interface CreateMockPostOptions {
  id?: ID
  author?: Author | CreateMockAuthorOptions
  content?: string
  variant?: PostVariant
  createdAt?: number
  linkedEventId?: ID
  likes?: number
  replies?: number
  reposts?: number
  likedBy?: ID[]
  isLiked?: boolean
  originalPostId?: ID
  quoteContent?: string
  repostedBy?: Author
  repostedAt?: number
  repostedByUsers?: ID[]
}

/**
 * Generate doom-themed content
 */
function generateDoomContent(): string {
  const doomPhrases = [
    'The market is showing signs of imminent collapse.',
    'AI advancement is accelerating beyond our control.',
    'Climate data suggests we have less time than predicted.',
    'Economic indicators point to a major correction.',
    'The writing is on the wall for those who can read it.',
    'Another warning sign that most will ignore.',
    'This is how civilizations fall - slowly, then all at once.',
    'We are not prepared for what is coming.',
    'The countdown has already begun.',
    'History repeats itself, and we never learn.',
  ]

  return faker.datatype.boolean(0.3)
    ? faker.helpers.arrayElement(doomPhrases)
    : faker.lorem.paragraph({ min: 1, max: 3 })
}

/**
 * Generate life-themed content
 */
function generateLifeContent(): string {
  const lifePhrases = [
    'Found joy in the simple things today.',
    'Every sunrise is a new opportunity.',
    'Grateful for another day of possibilities.',
    'Choosing hope over fear, one day at a time.',
    'Small acts of kindness ripple outward.',
    'Today I chose to be present and mindful.',
    'Connection with others makes life meaningful.',
    'Growth happens outside our comfort zone.',
    'The best time to start is now.',
    'Finding beauty in unexpected places.',
  ]

  return faker.datatype.boolean(0.3)
    ? faker.helpers.arrayElement(lifePhrases)
    : faker.lorem.paragraph({ min: 1, max: 3 })
}

/**
 * Create a mock Post object
 */
export function createMockPost(options: CreateMockPostOptions = {}): Post {
  const variant = options.variant ?? faker.helpers.arrayElement<PostVariant>(['doom', 'life'])
  const content = options.content ?? (variant === 'doom' ? generateDoomContent() : generateLifeContent())

  const author = options.author
    ? ('username' in options.author && 'address' in options.author
        ? options.author as Author
        : createMockAuthor(options.author as CreateMockAuthorOptions))
    : createMockAuthor()

  const likes = options.likes ?? faker.number.int({ min: 0, max: 500 })
  const likedByCount = Math.min(likes, faker.number.int({ min: 0, max: 20 }))

  return {
    id: options.id ?? faker.string.uuid(),
    author,
    content,
    variant,
    createdAt: options.createdAt ?? faker.date.recent({ days: 7 }).getTime(),
    linkedEventId: options.linkedEventId,
    likes,
    replies: options.replies ?? faker.number.int({ min: 0, max: 50 }),
    reposts: options.reposts ?? faker.number.int({ min: 0, max: 30 }),
    likedBy: options.likedBy ?? Array.from({ length: likedByCount }, () => faker.string.uuid()),
    isLiked: options.isLiked ?? faker.datatype.boolean(0.2),
    originalPostId: options.originalPostId,
    quoteContent: options.quoteContent,
    repostedBy: options.repostedBy,
    repostedAt: options.repostedAt,
    repostedByUsers: options.repostedByUsers,
  }
}

/**
 * Create a doom post with specific settings
 */
export function createMockDoomPost(options: Omit<CreateMockPostOptions, 'variant'> = {}): Post {
  return createMockPost({ ...options, variant: 'doom' })
}

/**
 * Create a life post with specific settings
 */
export function createMockLifePost(options: Omit<CreateMockPostOptions, 'variant'> = {}): Post {
  return createMockPost({ ...options, variant: 'life' })
}

/**
 * Create a repost
 */
export function createMockRepost(
  originalPost: Post,
  repostedBy: Author,
  options: Partial<CreateMockPostOptions> = {}
): Post {
  return createMockPost({
    ...options,
    content: originalPost.content,
    variant: originalPost.variant,
    author: originalPost.author,
    originalPostId: originalPost.id,
    repostedBy,
    repostedAt: options.repostedAt ?? Date.now(),
  })
}

/**
 * Create a quote repost
 */
export function createMockQuoteRepost(
  originalPost: Post,
  quoter: Author,
  quoteContent: string,
  options: Partial<CreateMockPostOptions> = {}
): Post {
  return createMockPost({
    ...options,
    content: quoteContent,
    variant: originalPost.variant,
    author: quoter,
    originalPostId: originalPost.id,
    quoteContent,
  })
}

/**
 * Create multiple mock posts
 */
export function createMockPosts(count: number, options: CreateMockPostOptions = {}): Post[] {
  return Array.from({ length: count }, () => createMockPost(options))
}

/**
 * Create a feed of posts (mix of doom and life)
 */
export function createMockFeed(count: number, variant?: PostVariant): Post[] {
  return Array.from({ length: count }, () =>
    createMockPost({ variant })
  ).sort((a, b) => b.createdAt - a.createdAt)
}
