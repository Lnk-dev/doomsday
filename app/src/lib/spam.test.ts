import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  detectSpamPatterns,
  calculateSpamScore,
  containsProhibitedContent,
  isRapidPosting,
  isDuplicateContent,
  isNewAccountSpam,
  detectSpam,
  SPAM_THRESHOLDS,
  SPAM_COOLDOWNS,
  type RecentPost,
} from './spam'

describe('Spam Detection Utilities', () => {
  // ============================================================================
  // detectSpamPatterns Tests
  // ============================================================================
  describe('detectSpamPatterns', () => {
    it('should return no patterns for normal content', () => {
      const result = detectSpamPatterns('This is a normal post about something interesting.')
      expect(result.hasSpamPatterns).toBe(false)
      expect(result.patterns).toHaveLength(0)
    })

    it('should detect excessive ALL CAPS', () => {
      const result = detectSpamPatterns('THIS IS ALL CAPS AND VERY ANNOYING TO READ')
      expect(result.hasSpamPatterns).toBe(true)
      expect(result.patterns).toContain('Excessive use of capital letters')
    })

    it('should not flag short caps content', () => {
      const result = detectSpamPatterns('OK')
      expect(result.hasSpamPatterns).toBe(false)
    })

    it('should detect excessive punctuation', () => {
      const result = detectSpamPatterns('Check this out!!!!!!!')
      expect(result.hasSpamPatterns).toBe(true)
      expect(result.patterns).toContain('Excessive punctuation')
    })

    it('should detect repeated characters', () => {
      const result = detectSpamPatterns('Heeeeeeeelp me please')
      expect(result.hasSpamPatterns).toBe(true)
      expect(result.patterns).toContain('Repeated characters')
    })

    it('should detect suspicious URLs', () => {
      const result = detectSpamPatterns('Check out this link: https://bit.ly/abc123')
      expect(result.hasSpamPatterns).toBe(true)
      expect(result.patterns).toContain('Suspicious URL detected')
    })

    it('should detect IP address URLs', () => {
      const result = detectSpamPatterns('Visit http://192.168.1.1/scam')
      expect(result.hasSpamPatterns).toBe(true)
      expect(result.patterns).toContain('Suspicious URL detected')
    })

    it('should detect too many links', () => {
      const result = detectSpamPatterns(
        'Link1: https://a.com Link2: https://b.com Link3: https://c.com Link4: https://d.com'
      )
      expect(result.hasSpamPatterns).toBe(true)
      expect(result.patterns).toContain('Too many links')
    })

    it('should detect excessive hashtags', () => {
      const hashtags = Array.from({ length: 12 }, (_, i) => `#tag${i}`).join(' ')
      const result = detectSpamPatterns(`Check this out ${hashtags}`)
      expect(result.hasSpamPatterns).toBe(true)
      expect(result.patterns).toContain('Excessive hashtags')
    })

    it('should detect excessive mentions', () => {
      const mentions = Array.from({ length: 12 }, (_, i) => `@user${i}`).join(' ')
      const result = detectSpamPatterns(`Hey ${mentions}`)
      expect(result.hasSpamPatterns).toBe(true)
      expect(result.patterns).toContain('Excessive mentions')
    })

    it('should handle empty content', () => {
      const result = detectSpamPatterns('')
      expect(result.hasSpamPatterns).toBe(false)
      expect(result.patterns).toHaveLength(0)
    })

    it('should handle null/undefined content', () => {
      const result = detectSpamPatterns(null as unknown as string)
      expect(result.hasSpamPatterns).toBe(false)
    })
  })

  // ============================================================================
  // calculateSpamScore Tests
  // ============================================================================
  describe('calculateSpamScore', () => {
    it('should return 0 for normal content', () => {
      const score = calculateSpamScore('This is a perfectly normal post.')
      expect(score).toBe(0)
    })

    it('should return higher scores for spammy content', () => {
      const normalScore = calculateSpamScore('Nice post!')
      const spammyScore = calculateSpamScore('FREE CRYPTO!!!! DOUBLE YOUR MONEY NOW!!!!')
      expect(spammyScore).toBeGreaterThan(normalScore)
    })

    it('should add points for each spam pattern detected', () => {
      const score1 = calculateSpamScore('CAPS ONLY MESSAGE HERE')
      const score2 = calculateSpamScore('CAPS ONLY MESSAGE HERE!!!!!!!!')
      expect(score2).toBeGreaterThan(score1) // Additional punctuation penalty
    })

    it('should penalize short content with links', () => {
      const scoreWithoutLink = calculateSpamScore('Check out!')
      const scoreWithLink = calculateSpamScore('Check out! https://example.com')
      expect(scoreWithLink).toBeGreaterThan(scoreWithoutLink)
    })

    it('should penalize excessive exclamation marks', () => {
      const score = calculateSpamScore('Wow! Amazing! Incredible! Fantastic! Unbelievable! Awesome!')
      expect(score).toBeGreaterThan(0)
    })

    it('should cap score at 100', () => {
      const extremeSpam = 'FREE CRYPTO!!!!!!! SEND 1 BTC GET 2 BACK!!!!! https://bit.ly/scam CLICK NOW!!!! ' +
        Array(20).fill('#FREE').join(' ') + ' ' + Array(20).fill('@everyone').join(' ')
      const score = calculateSpamScore(extremeSpam)
      expect(score).toBeLessThanOrEqual(100)
    })

    it('should return 0 for empty content', () => {
      expect(calculateSpamScore('')).toBe(0)
      expect(calculateSpamScore('   ')).toBe(0)
    })
  })

  // ============================================================================
  // containsProhibitedContent Tests
  // ============================================================================
  describe('containsProhibitedContent', () => {
    it('should return false for normal content', () => {
      expect(containsProhibitedContent('Just a normal message')).toBe(false)
    })

    it('should detect crypto scam phrases', () => {
      expect(containsProhibitedContent('Double your crypto today!')).toBe(true)
      expect(containsProhibitedContent('Send 1 BTC get 2 back')).toBe(true)
      expect(containsProhibitedContent('Guaranteed profit on this deal!')).toBe(true)
    })

    it('should detect phishing phrases', () => {
      expect(containsProhibitedContent('Verify your account now')).toBe(true)
      expect(containsProhibitedContent('Click here to claim your prize')).toBe(true)
      expect(containsProhibitedContent('Your account has been suspended')).toBe(true)
    })

    it('should detect urgency spam', () => {
      expect(containsProhibitedContent('ACT NOW before its too late')).toBe(true)
      expect(containsProhibitedContent("Don't miss out on this opportunity")).toBe(true)
    })

    it('should detect winner scams', () => {
      expect(containsProhibitedContent("Congratulations you've won!")).toBe(true)
    })

    it('should be case insensitive', () => {
      expect(containsProhibitedContent('DOUBLE YOUR CRYPTO')).toBe(true)
      expect(containsProhibitedContent('double your crypto')).toBe(true)
      expect(containsProhibitedContent('DoUbLe YoUr CrYpTo')).toBe(true)
    })

    it('should return false for empty content', () => {
      expect(containsProhibitedContent('')).toBe(false)
      expect(containsProhibitedContent('   ')).toBe(false)
    })
  })

  // ============================================================================
  // isRapidPosting Tests
  // ============================================================================
  describe('isRapidPosting', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should return false for first post', () => {
      expect(isRapidPosting('user1', [])).toBe(false)
    })

    it('should return true if posting too soon after last post', () => {
      const now = Date.now()
      const timestamps = [now - 10_000] // 10 seconds ago (less than MIN_POST_INTERVAL)
      expect(isRapidPosting('user1', timestamps)).toBe(true)
    })

    it('should return false if enough time has passed', () => {
      const now = Date.now()
      const timestamps = [now - 60_000] // 1 minute ago
      expect(isRapidPosting('user1', timestamps)).toBe(false)
    })

    it('should detect rapid posting within time window', () => {
      const now = Date.now()
      // 5 posts in last minute
      const timestamps = [
        now - 10_000,
        now - 20_000,
        now - 30_000,
        now - 40_000,
        now - 50_000,
      ]
      expect(isRapidPosting('user1', timestamps)).toBe(true)
    })

    it('should not flag spread out posts', () => {
      const now = Date.now()
      // Posts spread across 10 minutes
      const timestamps = [
        now - 120_000,  // 2 min ago
        now - 240_000,  // 4 min ago
        now - 360_000,  // 6 min ago
      ]
      expect(isRapidPosting('user1', timestamps)).toBe(false)
    })
  })

  // ============================================================================
  // isDuplicateContent Tests
  // ============================================================================
  describe('isDuplicateContent', () => {
    it('should return false for no recent posts', () => {
      expect(isDuplicateContent('New post', [])).toBe(false)
    })

    it('should detect exact duplicate content', () => {
      const recentPosts: RecentPost[] = [
        { content: 'Hello world!', timestamp: Date.now() - 1000 },
      ]
      expect(isDuplicateContent('Hello world!', recentPosts)).toBe(true)
    })

    it('should detect similar content with minor differences', () => {
      const recentPosts: RecentPost[] = [
        { content: 'Check out this amazing product!', timestamp: Date.now() - 1000 },
      ]
      // Very similar content
      expect(isDuplicateContent('Check out this amazing product', recentPosts)).toBe(true)
    })

    it('should not flag different content', () => {
      const recentPosts: RecentPost[] = [
        { content: 'I love sunny days', timestamp: Date.now() - 1000 },
      ]
      expect(isDuplicateContent('Rainy weather is here', recentPosts)).toBe(false)
    })

    it('should check multiple recent posts', () => {
      const recentPosts: RecentPost[] = [
        { content: 'First post', timestamp: Date.now() - 1000 },
        { content: 'Second post', timestamp: Date.now() - 2000 },
        { content: 'Spam message here', timestamp: Date.now() - 3000 },
      ]
      expect(isDuplicateContent('Spam message here!', recentPosts)).toBe(true)
    })

    it('should handle empty content', () => {
      const recentPosts: RecentPost[] = [
        { content: 'Some post', timestamp: Date.now() },
      ]
      expect(isDuplicateContent('', recentPosts)).toBe(false)
    })

    it('should respect duplicate check window limit', () => {
      // Create more posts than the window allows
      const recentPosts: RecentPost[] = Array.from(
        { length: SPAM_THRESHOLDS.DUPLICATE_CHECK_WINDOW + 5 },
        (_, i) => ({
          content: `Post number ${i}`,
          timestamp: Date.now() - i * 1000,
        })
      )
      // Content matches a post outside the window - should not be detected
      const outsideWindowContent = `Post number ${SPAM_THRESHOLDS.DUPLICATE_CHECK_WINDOW + 2}`
      expect(isDuplicateContent(outsideWindowContent, recentPosts)).toBe(false)
    })
  })

  // ============================================================================
  // isNewAccountSpam Tests
  // ============================================================================
  describe('isNewAccountSpam', () => {
    const ONE_DAY = 24 * 60 * 60 * 1000
    const ONE_HOUR = 60 * 60 * 1000

    it('should return false for established accounts', () => {
      expect(isNewAccountSpam(7 * ONE_DAY, 100)).toBe(false) // 7 day old account
    })

    it('should return false for new accounts with few posts', () => {
      expect(isNewAccountSpam(ONE_HOUR / 2, 1)).toBe(false) // 30 min old, 1 post
    })

    it('should flag new accounts with many posts', () => {
      expect(isNewAccountSpam(ONE_HOUR / 2, 10)).toBe(true) // 30 min old, 10 posts
    })

    it('should flag very new accounts with moderate activity', () => {
      expect(isNewAccountSpam(30 * 60 * 1000, 3)).toBe(true) // 30 min old, 3 posts
    })

    it('should not flag accounts just over threshold', () => {
      expect(isNewAccountSpam(ONE_DAY + 1000, 20)).toBe(false) // Just over 1 day
    })

    it('should respect the new account post limit', () => {
      const newAccountAge = ONE_HOUR * 12 // 12 hours
      expect(isNewAccountSpam(newAccountAge, SPAM_THRESHOLDS.NEW_ACCOUNT_POST_LIMIT)).toBe(false)
      expect(isNewAccountSpam(newAccountAge, SPAM_THRESHOLDS.NEW_ACCOUNT_POST_LIMIT + 1)).toBe(true)
    })
  })

  // ============================================================================
  // detectSpam (Combined) Tests
  // ============================================================================
  describe('detectSpam', () => {
    it('should return not spam for clean content', () => {
      const result = detectSpam('This is a clean and normal post.')
      expect(result.isSpam).toBe(false)
      expect(result.spamScore).toBeLessThan(SPAM_THRESHOLDS.SPAM_SCORE_THRESHOLD)
      expect(result.reasons).toHaveLength(0)
    })

    it('should flag obvious spam', () => {
      const result = detectSpam('FREE CRYPTO!!!! DOUBLE YOUR MONEY NOW!!!! Click https://bit.ly/scam')
      expect(result.isSpam).toBe(true)
      expect(result.spamScore).toBeGreaterThan(0)
      expect(result.reasons.length).toBeGreaterThan(0)
    })

    it('should include content-based reasons', () => {
      // Need more than 10 letters for caps detection to trigger
      const result = detectSpam('THIS IS A LONGER MESSAGE WITH ALL CAPS!!!!!!')
      expect(result.reasons).toContain('Excessive use of capital letters')
      expect(result.reasons).toContain('Excessive punctuation')
    })

    it('should check prohibited content', () => {
      const result = detectSpam('Get rich quick with this one simple trick')
      expect(result.isSpam).toBe(true)
      expect(result.reasons).toContain('Contains prohibited content')
    })

    it('should include behavior-based checks when options provided', () => {
      const now = Date.now()
      const result = detectSpam('Normal looking post', {
        userId: 'user1',
        postTimestamps: [now - 5000, now - 10000, now - 15000, now - 20000, now - 25000],
        accountAgeMs: 30 * 60 * 1000, // 30 minutes
        postCount: 10,
      })
      expect(result.isSpam).toBe(true)
      expect(result.reasons).toContain('Posting too rapidly')
      expect(result.reasons).toContain('Suspicious new account activity')
    })

    it('should detect duplicate content when recent posts provided', () => {
      const result = detectSpam('Buy my product now!', {
        recentPosts: [
          { content: 'Buy my product now!', timestamp: Date.now() - 1000 },
        ],
      })
      expect(result.isSpam).toBe(true)
      expect(result.reasons).toContain('Duplicate content detected')
    })

    it('should handle missing optional parameters', () => {
      const result = detectSpam('Normal post', {
        userId: 'user1',
        // Missing other optional parameters
      })
      expect(result.isSpam).toBe(false)
    })

    it('should return consistent structure', () => {
      const result = detectSpam('Any content')
      expect(result).toHaveProperty('isSpam')
      expect(result).toHaveProperty('spamScore')
      expect(result).toHaveProperty('reasons')
      expect(typeof result.isSpam).toBe('boolean')
      expect(typeof result.spamScore).toBe('number')
      expect(Array.isArray(result.reasons)).toBe(true)
    })
  })

  // ============================================================================
  // Configuration Constants Tests
  // ============================================================================
  describe('Configuration Constants', () => {
    it('should have valid SPAM_THRESHOLDS', () => {
      expect(SPAM_THRESHOLDS.SPAM_SCORE_THRESHOLD).toBeGreaterThan(0)
      expect(SPAM_THRESHOLDS.SPAM_SCORE_THRESHOLD).toBeLessThanOrEqual(100)
      expect(SPAM_THRESHOLDS.MAX_CAPS_PERCENTAGE).toBeGreaterThan(0)
      expect(SPAM_THRESHOLDS.MAX_CAPS_PERCENTAGE).toBeLessThanOrEqual(1)
      expect(SPAM_THRESHOLDS.DUPLICATE_SIMILARITY_THRESHOLD).toBeGreaterThan(0)
      expect(SPAM_THRESHOLDS.DUPLICATE_SIMILARITY_THRESHOLD).toBeLessThanOrEqual(1)
    })

    it('should have valid SPAM_COOLDOWNS', () => {
      expect(SPAM_COOLDOWNS.MIN_POST_INTERVAL).toBeGreaterThan(0)
      expect(SPAM_COOLDOWNS.MIN_COMMENT_INTERVAL).toBeGreaterThan(0)
      expect(SPAM_COOLDOWNS.RAPID_POSTING_WINDOW).toBeGreaterThan(0)
      expect(SPAM_COOLDOWNS.MAX_POSTS_PER_WINDOW).toBeGreaterThan(0)
    })
  })
})
