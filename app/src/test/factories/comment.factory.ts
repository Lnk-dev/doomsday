/**
 * Comment Factory - Generate mock comment data for testing
 */

import { faker } from '@faker-js/faker'
import type { Comment, ID } from '../../types'

export interface CreateMockCommentOptions {
  id?: ID
  postId?: ID
  authorUsername?: string
  authorAvatar?: string
  content?: string
  createdAt?: number
  likes?: number
  likedBy?: ID[]
  isPending?: boolean
  error?: string
}

function generateCommentContent(): string {
  const phrases = ['This is exactly what I was thinking.', 'Great point!', 'I disagree, but I see where you are coming from.', 'Can you elaborate?', 'Source?', 'Well said.', 'Interesting perspective.', 'Thanks for sharing.']
  return faker.datatype.boolean(0.4) ? faker.helpers.arrayElement(phrases) : faker.lorem.sentence({ min: 3, max: 10 })
}

export function createMockComment(options: CreateMockCommentOptions = {}): Comment {
  const likes = options.likes ?? faker.number.int({ min: 0, max: 100 })
  const likedByCount = Math.min(likes, faker.number.int({ min: 0, max: 10 }))

  return {
    id: options.id ?? faker.string.uuid(),
    postId: options.postId ?? faker.string.uuid(),
    authorUsername: options.authorUsername ?? faker.internet.username().toLowerCase().slice(0, 15),
    authorAvatar: options.authorAvatar ?? (faker.datatype.boolean(0.6) ? faker.image.avatar() : undefined),
    content: options.content ?? generateCommentContent(),
    createdAt: options.createdAt ?? faker.date.recent({ days: 7 }).getTime(),
    likes,
    likedBy: options.likedBy ?? Array.from({ length: likedByCount }, () => faker.string.uuid()),
    isPending: options.isPending,
    error: options.error,
  }
}

export function createMockPendingComment(options: Omit<CreateMockCommentOptions, 'isPending'> = {}): Comment {
  return createMockComment({ ...options, isPending: true })
}

export function createMockFailedComment(errorMessage: string = 'Failed to post comment', options: Omit<CreateMockCommentOptions, 'isPending' | 'error'> = {}): Comment {
  return createMockComment({ ...options, isPending: false, error: errorMessage })
}

export function createMockCommentsForPost(postId: ID, count: number, options: Omit<CreateMockCommentOptions, 'postId'> = {}): Comment[] {
  return Array.from({ length: count }, () => createMockComment({ ...options, postId })).sort((a, b) => a.createdAt - b.createdAt)
}

export function createMockComments(count: number, options: CreateMockCommentOptions = {}): Comment[] {
  return Array.from({ length: count }, () => createMockComment(options))
}

export function createMockCommentThread(postId: ID, depth: number = 5): Comment[] {
  const users = Array.from({ length: 3 }, () => faker.internet.username().toLowerCase().slice(0, 15))
  const baseTime = Date.now() - depth * 60000
  return Array.from({ length: depth }, (_, i) => createMockComment({ postId, authorUsername: users[i % users.length], createdAt: baseTime + i * 60000 }))
}
