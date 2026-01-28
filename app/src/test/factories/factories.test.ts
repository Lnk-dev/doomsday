/**
 * Test Factories - Unit tests to verify factory functions work correctly
 */

import { describe, it, expect } from 'vitest'
import { createMockUser, createMockUsers, createMockAuthor, createMockAuthors, createMockUsername, createMockWalletAddress, createMockPost, createMockPosts, createMockDoomPost, createMockLifePost, createMockRepost, createMockQuoteRepost, createMockFeed, createMockEvent, createMockEvents, createMockActiveEvent, createMockOccurredEvent, createMockExpiredEvent, createMockBet, createMockBets, createMockDoomBet, createMockLifeBet, createMockBetsForEvent, createMockComment, createMockComments, createMockPendingComment, createMockFailedComment, createMockCommentsForPost, createMockBadge, createMockBadges, createMockEarnedBadge } from './index'
import { TEST_AUTHORS, TEST_USERS, DOOM_POSTS, LIFE_POSTS, ACTIVE_EVENTS } from '../fixtures'

describe('Test Factories', () => {
  describe('User Factories', () => {
    it('should create a mock user with default values', () => {
      const user = createMockUser()
      expect(user.username).toBeTruthy()
      expect(typeof user.doomBalance).toBe('number')
      expect(typeof user.lifeBalance).toBe('number')
      expect(user.activeBets).toEqual([])
      expect(user.posts).toEqual([])
    })

    it('should create a mock user with custom values', () => {
      const user = createMockUser({ username: 'custom_user', doomBalance: 5000, lifeBalance: 1000 })
      expect(user.username).toBe('custom_user')
      expect(user.doomBalance).toBe(5000)
      expect(user.lifeBalance).toBe(1000)
    })

    it('should create multiple users', () => {
      const users = createMockUsers(5)
      expect(users).toHaveLength(5)
      users.forEach(user => expect(user.username).toBeTruthy())
    })

    it('should create a mock author', () => {
      const author = createMockAuthor()
      expect(author.username).toBeTruthy()
      expect(typeof author.verified).toBe('boolean')
    })

    it('should create a mock author with specific username', () => {
      const author = createMockAuthor({ username: 'test_author' })
      expect(author.username).toBe('test_author')
    })

    it('should create multiple authors', () => {
      const authors = createMockAuthors(3)
      expect(authors).toHaveLength(3)
    })

    it('should create valid wallet addresses', () => {
      const address = createMockWalletAddress()
      expect(address).toBeTruthy()
      expect(address.length).toBe(44)
    })

    it('should create valid usernames', () => {
      const username = createMockUsername()
      expect(username).toBeTruthy()
      expect(username.length).toBeLessThanOrEqual(15)
      expect(/^[a-z0-9_]+$/.test(username)).toBe(true)
    })
  })

  describe('Post Factories', () => {
    it('should create a mock post with default values', () => {
      const post = createMockPost()
      expect(post.id).toBeTruthy()
      expect(post.content).toBeTruthy()
      expect(['doom', 'life']).toContain(post.variant)
      expect(post.author.username).toBeTruthy()
      expect(typeof post.likes).toBe('number')
      expect(typeof post.replies).toBe('number')
      expect(typeof post.reposts).toBe('number')
      expect(Array.isArray(post.likedBy)).toBe(true)
    })

    it('should create a doom post', () => {
      const post = createMockDoomPost()
      expect(post.variant).toBe('doom')
    })

    it('should create a life post', () => {
      const post = createMockLifePost()
      expect(post.variant).toBe('life')
    })

    it('should create a post with custom author', () => {
      const author = createMockAuthor({ username: 'custom_author' })
      const post = createMockPost({ author })
      expect(post.author.username).toBe('custom_author')
    })

    it('should create multiple posts', () => {
      const posts = createMockPosts(10)
      expect(posts).toHaveLength(10)
    })

    it('should create a feed sorted by creation time', () => {
      const feed = createMockFeed(5)
      expect(feed).toHaveLength(5)
      for (let i = 1; i < feed.length; i++) {
        expect(feed[i - 1].createdAt).toBeGreaterThanOrEqual(feed[i].createdAt)
      }
    })

    it('should create a repost', () => {
      const original = createMockDoomPost()
      const reposter = createMockAuthor({ username: 'reposter' })
      const repost = createMockRepost(original, reposter)
      expect(repost.content).toBe(original.content)
      expect(repost.originalPostId).toBe(original.id)
      expect(repost.repostedBy?.username).toBe('reposter')
    })

    it('should create a quote repost', () => {
      const original = createMockDoomPost()
      const quoter = createMockAuthor({ username: 'quoter' })
      const quoteContent = 'My thoughts on this'
      const quote = createMockQuoteRepost(original, quoter, quoteContent)
      expect(quote.content).toBe(quoteContent)
      expect(quote.originalPostId).toBe(original.id)
      expect(quote.quoteContent).toBe(quoteContent)
    })
  })

  describe('Event Factories', () => {
    it('should create a mock event with default values', () => {
      const event = createMockEvent()
      expect(event.id).toBeTruthy()
      expect(event.title).toBeTruthy()
      expect(event.description).toBeTruthy()
      expect(['technology', 'economic', 'climate', 'war', 'natural', 'social', 'other']).toContain(event.category)
      expect(['active', 'occurred', 'expired']).toContain(event.status)
      expect(typeof event.doomStake).toBe('number')
      expect(typeof event.lifeStake).toBe('number')
    })

    it('should create an active event', () => {
      const event = createMockActiveEvent()
      expect(event.status).toBe('active')
      expect(event.countdownEnd).toBeGreaterThan(Date.now())
    })

    it('should create an occurred event', () => {
      const event = createMockOccurredEvent()
      expect(event.status).toBe('occurred')
    })

    it('should create an expired event', () => {
      const event = createMockExpiredEvent()
      expect(event.status).toBe('expired')
    })

    it('should create multiple events', () => {
      const events = createMockEvents(5)
      expect(events).toHaveLength(5)
    })
  })

  describe('Bet Factories', () => {
    it('should create a mock bet with default values', () => {
      const bet = createMockBet()
      expect(bet.id).toBeTruthy()
      expect(bet.eventId).toBeTruthy()
      expect(bet.userId).toBeTruthy()
      expect(['doom', 'life']).toContain(bet.side)
      expect(typeof bet.amount).toBe('number')
      expect(bet.amount).toBeGreaterThan(0)
    })

    it('should create a doom bet', () => {
      const bet = createMockDoomBet()
      expect(bet.side).toBe('doom')
    })

    it('should create a life bet', () => {
      const bet = createMockLifeBet()
      expect(bet.side).toBe('life')
    })

    it('should create bets for a specific event', () => {
      const eventId = 'test-event-123'
      const bets = createMockBetsForEvent(eventId, 5)
      expect(bets).toHaveLength(5)
      bets.forEach(bet => expect(bet.eventId).toBe(eventId))
    })

    it('should create multiple bets', () => {
      const bets = createMockBets(10)
      expect(bets).toHaveLength(10)
    })
  })

  describe('Comment Factories', () => {
    it('should create a mock comment with default values', () => {
      const comment = createMockComment()
      expect(comment.id).toBeTruthy()
      expect(comment.postId).toBeTruthy()
      expect(comment.authorUsername).toBeTruthy()
      expect(comment.content).toBeTruthy()
      expect(typeof comment.likes).toBe('number')
      expect(Array.isArray(comment.likedBy)).toBe(true)
    })

    it('should create a pending comment', () => {
      const comment = createMockPendingComment()
      expect(comment.isPending).toBe(true)
    })

    it('should create a failed comment', () => {
      const comment = createMockFailedComment('Network error')
      expect(comment.isPending).toBe(false)
      expect(comment.error).toBe('Network error')
    })

    it('should create comments for a specific post', () => {
      const postId = 'test-post-123'
      const comments = createMockCommentsForPost(postId, 5)
      expect(comments).toHaveLength(5)
      comments.forEach(comment => expect(comment.postId).toBe(postId))
    })

    it('should create multiple comments', () => {
      const comments = createMockComments(10)
      expect(comments).toHaveLength(10)
    })
  })

  describe('Badge Factories', () => {
    it('should create a mock badge with default values', () => {
      const badge = createMockBadge()
      expect(badge.id).toBeTruthy()
      expect(badge.name).toBeTruthy()
      expect(badge.description).toBeTruthy()
      expect(badge.icon).toBeTruthy()
      expect(['common', 'uncommon', 'rare', 'epic', 'legendary']).toContain(badge.rarity)
      expect(['posting', 'engagement', 'streaks', 'betting', 'special']).toContain(badge.category)
    })

    it('should create an earned badge', () => {
      const earnedBadge = createMockEarnedBadge()
      expect(earnedBadge.badgeId).toBeTruthy()
      expect(typeof earnedBadge.earnedAt).toBe('number')
    })

    it('should create multiple badges', () => {
      const badges = createMockBadges(5)
      expect(badges).toHaveLength(5)
    })
  })
})

describe('Test Fixtures', () => {
  describe('User Fixtures', () => {
    it('should have TEST_AUTHORS with required authors', () => {
      expect(TEST_AUTHORS.anonymous).toBeDefined()
      expect(TEST_AUTHORS.verified).toBeDefined()
      expect(TEST_AUTHORS.regular).toBeDefined()
      expect(TEST_AUTHORS.doomer).toBeDefined()
      expect(TEST_AUTHORS.lifer).toBeDefined()
    })

    it('should have correct author structure', () => {
      const author = TEST_AUTHORS.anonymous
      expect(author.username).toBe('anonymous_user')
      expect(author.address).toBeNull()
    })

    it('should have TEST_USERS with required users', () => {
      expect(TEST_USERS.newUser).toBeDefined()
      expect(TEST_USERS.activeDoomer).toBeDefined()
      expect(TEST_USERS.lifeEnthusiast).toBeDefined()
      expect(TEST_USERS.whale).toBeDefined()
    })
  })

  describe('Post Fixtures', () => {
    it('should have DOOM_POSTS with various lengths', () => {
      expect(DOOM_POSTS.short).toBeDefined()
      expect(DOOM_POSTS.medium).toBeDefined()
      expect(DOOM_POSTS.long).toBeDefined()
    })

    it('should have LIFE_POSTS with various lengths', () => {
      expect(LIFE_POSTS.short).toBeDefined()
      expect(LIFE_POSTS.medium).toBeDefined()
      expect(LIFE_POSTS.long).toBeDefined()
    })

    it('should have correct post variants', () => {
      expect(DOOM_POSTS.short.variant).toBe('doom')
      expect(LIFE_POSTS.short.variant).toBe('life')
    })
  })

  describe('Event Fixtures', () => {
    it('should have ACTIVE_EVENTS', () => {
      expect(ACTIVE_EVENTS.aiTakeover).toBeDefined()
      expect(ACTIVE_EVENTS.marketCrash).toBeDefined()
      expect(ACTIVE_EVENTS.heatwave).toBeDefined()
    })

    it('should have active status for active events', () => {
      expect(ACTIVE_EVENTS.aiTakeover.status).toBe('active')
      expect(ACTIVE_EVENTS.marketCrash.status).toBe('active')
    })
  })
})
