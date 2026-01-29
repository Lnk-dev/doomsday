import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { formatRelativeTime, formatDateTime, formatDate } from './formatDate'

describe('formatDate utilities', () => {
  beforeEach(() => {
    // Mock Date.now() to a fixed point in time
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('formatRelativeTime', () => {
    it('should return "just now" for recent timestamps', () => {
      const now = Date.now()
      expect(formatRelativeTime(now)).toBe('just now')
      expect(formatRelativeTime(now - 30 * 1000)).toBe('just now') // 30 seconds ago
    })

    it('should return minutes ago', () => {
      const now = Date.now()
      expect(formatRelativeTime(now - 1 * 60 * 1000)).toBe('1 minute ago')
      expect(formatRelativeTime(now - 5 * 60 * 1000)).toBe('5 minutes ago')
      expect(formatRelativeTime(now - 59 * 60 * 1000)).toBe('59 minutes ago')
    })

    it('should return hours ago', () => {
      const now = Date.now()
      expect(formatRelativeTime(now - 1 * 60 * 60 * 1000)).toBe('1 hour ago')
      expect(formatRelativeTime(now - 5 * 60 * 60 * 1000)).toBe('5 hours ago')
      expect(formatRelativeTime(now - 23 * 60 * 60 * 1000)).toBe('23 hours ago')
    })

    it('should return days ago', () => {
      const now = Date.now()
      expect(formatRelativeTime(now - 1 * 24 * 60 * 60 * 1000)).toBe('1 day ago')
      expect(formatRelativeTime(now - 7 * 24 * 60 * 60 * 1000)).toBe('7 days ago')
      expect(formatRelativeTime(now - 29 * 24 * 60 * 60 * 1000)).toBe('29 days ago')
    })

    it('should return months ago', () => {
      const now = Date.now()
      expect(formatRelativeTime(now - 30 * 24 * 60 * 60 * 1000)).toBe('1 month ago')
      expect(formatRelativeTime(now - 60 * 24 * 60 * 60 * 1000)).toBe('2 months ago')
      expect(formatRelativeTime(now - 300 * 24 * 60 * 60 * 1000)).toBe('10 months ago')
    })

    it('should return years ago', () => {
      const now = Date.now()
      expect(formatRelativeTime(now - 365 * 24 * 60 * 60 * 1000)).toBe('1 year ago')
      expect(formatRelativeTime(now - 730 * 24 * 60 * 60 * 1000)).toBe('2 years ago')
    })

    it('should handle singular vs plural correctly', () => {
      const now = Date.now()
      expect(formatRelativeTime(now - 1 * 60 * 1000)).toBe('1 minute ago')
      expect(formatRelativeTime(now - 2 * 60 * 1000)).toBe('2 minutes ago')
      expect(formatRelativeTime(now - 1 * 60 * 60 * 1000)).toBe('1 hour ago')
      expect(formatRelativeTime(now - 2 * 60 * 60 * 1000)).toBe('2 hours ago')
      expect(formatRelativeTime(now - 1 * 24 * 60 * 60 * 1000)).toBe('1 day ago')
      expect(formatRelativeTime(now - 2 * 24 * 60 * 60 * 1000)).toBe('2 days ago')
    })
  })

  describe('formatDateTime', () => {
    it('should format timestamp as readable date with time', () => {
      const timestamp = new Date('2024-01-15T15:45:00.000Z').getTime()
      const result = formatDateTime(timestamp)

      // The exact format depends on locale, but should contain key parts
      expect(result).toContain('Jan')
      expect(result).toContain('15')
      expect(result).toContain('2024')
    })

    it('should handle different timestamps', () => {
      const timestamp1 = new Date('2024-12-25T08:30:00.000Z').getTime()
      const result1 = formatDateTime(timestamp1)
      expect(result1).toContain('Dec')
      expect(result1).toContain('25')

      const timestamp2 = new Date('2023-07-04T20:00:00.000Z').getTime()
      const result2 = formatDateTime(timestamp2)
      expect(result2).toContain('Jul')
      expect(result2).toContain('4')
      expect(result2).toContain('2023')
    })
  })

  describe('formatDate', () => {
    it('should format timestamp as short date', () => {
      const timestamp = new Date('2024-03-20T10:00:00.000Z').getTime()
      const result = formatDate(timestamp)

      expect(result).toContain('Mar')
      expect(result).toContain('20')
      expect(result).toContain('2024')
    })

    it('should handle edge cases', () => {
      // Use noon to avoid timezone edge cases
      const jan1 = new Date('2024-01-01T12:00:00.000Z').getTime()
      const result1 = formatDate(jan1)
      expect(result1).toContain('2024')
      // Should contain either Jan or Dec depending on timezone
      expect(result1).toMatch(/Jan|Dec/)

      const dec31 = new Date('2024-12-31T12:00:00.000Z').getTime()
      const result2 = formatDate(dec31)
      expect(result2).toContain('2024')
      expect(result2).toMatch(/Dec|Jan/)
    })
  })
})
