/**
 * SPL Token Utilities Tests
 * Issue #34, #35: Tests for token integration utilities
 */

import { describe, it, expect, vi } from 'vitest'
import {
  formatTokenAmount,
  parseTokenAmount,
  isValidMint,
  getTokenTypeFromMint,
} from './tokens'

// Mock config
vi.mock('./config', () => ({
  getNetworkConfig: () => ({
    tokens: {
      doom: { mint: 'DooMDevMint111111111111111111111111111111111', decimals: 9 },
      life: { mint: 'LiFEDevMint111111111111111111111111111111111', decimals: 9 },
    },
  }),
  getTokenMint: (token: string) =>
    token === 'doom'
      ? 'DooMDevMint111111111111111111111111111111111'
      : 'LiFEDevMint111111111111111111111111111111111',
  getTokenDecimals: () => 9,
}))

// Mock config
vi.mock('./config', () => ({
  getNetworkConfig: () => ({
    tokens: {
      doom: { mint: 'DooMDevMint111111111111111111111111111111111', decimals: 9 },
      life: { mint: 'LiFEDevMint111111111111111111111111111111111', decimals: 9 },
    },
  }),
  getTokenMint: (token: string) =>
    token === 'doom'
      ? 'DooMDevMint111111111111111111111111111111111'
      : 'LiFEDevMint111111111111111111111111111111111',
  getTokenDecimals: () => 9,
}))

describe('Token utilities', () => {

  describe('formatTokenAmount', () => {
    it('should format millions', () => {
      expect(formatTokenAmount(1_500_000_000_000_000n, 9)).toBe('1.50M')
      expect(formatTokenAmount(10_000_000_000_000_000n, 9)).toBe('10.00M')
    })

    it('should format thousands', () => {
      expect(formatTokenAmount(1_500_000_000_000n, 9)).toBe('1.50K')
      expect(formatTokenAmount(5_000_000_000_000n, 9)).toBe('5.00K')
    })

    it('should format regular amounts', () => {
      expect(formatTokenAmount(1_000_000_000n, 9)).toBe('1.00')
      expect(formatTokenAmount(123_456_789_000n, 9)).toBe('123.46')
    })

    it('should format small amounts with full precision', () => {
      expect(formatTokenAmount(100_000_000n, 9)).toBe('0.100000000')
      expect(formatTokenAmount(1_000_000n, 9)).toBe('0.001000000')
    })

    it('should handle number input', () => {
      expect(formatTokenAmount(1_000_000_000, 9)).toBe('1.00')
    })

    it('should handle different decimals', () => {
      expect(formatTokenAmount(1_000_000, 6)).toBe('1.00')
      expect(formatTokenAmount(1_500_000_000, 6)).toBe('1.50K')
    })

    it('should handle zero', () => {
      expect(formatTokenAmount(0, 9)).toBe('0.000000000')
    })
  })

  describe('parseTokenAmount', () => {
    it('should parse string input', () => {
      expect(parseTokenAmount('1.5', 9)).toBe(1_500_000_000n)
      expect(parseTokenAmount('100', 9)).toBe(100_000_000_000n)
    })

    it('should parse number input', () => {
      expect(parseTokenAmount(1.5, 9)).toBe(1_500_000_000n)
      expect(parseTokenAmount(0.001, 9)).toBe(1_000_000n)
    })

    it('should handle whole numbers', () => {
      expect(parseTokenAmount(10, 9)).toBe(10_000_000_000n)
    })

    it('should handle different decimals', () => {
      expect(parseTokenAmount(1.5, 6)).toBe(1_500_000n)
      expect(parseTokenAmount(100, 6)).toBe(100_000_000n)
    })

    it('should throw on invalid input', () => {
      expect(() => parseTokenAmount('abc', 9)).toThrow('Invalid token amount')
    })

    it('should throw on negative input', () => {
      expect(() => parseTokenAmount(-1, 9)).toThrow('Invalid token amount')
    })

    it('should handle zero', () => {
      expect(parseTokenAmount(0, 9)).toBe(0n)
      expect(parseTokenAmount('0', 9)).toBe(0n)
    })

    it('should floor fractional lamports', () => {
      // 0.0000000015 SOL should floor to 1 lamport
      expect(parseTokenAmount(0.0000000015, 9)).toBe(1n)
    })
  })

  describe('isValidMint', () => {
    it('should return true for valid public key', () => {
      expect(isValidMint('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')).toBe(true)
      expect(isValidMint('11111111111111111111111111111111')).toBe(true)
    })

    it('should return false for invalid public key', () => {
      expect(isValidMint('invalid')).toBe(false)
      expect(isValidMint('')).toBe(false)
      expect(isValidMint('abc123')).toBe(false)
    })

    it('should return false for null-like values', () => {
      expect(isValidMint('')).toBe(false)
    })
  })

  describe('getTokenTypeFromMint', () => {
    it('should return doom for doom mint', () => {
      expect(getTokenTypeFromMint('DooMDevMint111111111111111111111111111111111')).toBe('doom')
    })

    it('should return life for life mint', () => {
      expect(getTokenTypeFromMint('LiFEDevMint111111111111111111111111111111111')).toBe('life')
    })

    it('should return null for unknown mint', () => {
      expect(getTokenTypeFromMint('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')).toBe(null)
      expect(getTokenTypeFromMint('random-mint')).toBe(null)
    })
  })

})

describe('Token amount edge cases', () => {
  it('formatTokenAmount should handle very large numbers', () => {
    // 1 billion tokens
    expect(formatTokenAmount(1_000_000_000_000_000_000n, 9)).toBe('1000.00M')
  })

  it('parseTokenAmount should handle very small amounts', () => {
    expect(parseTokenAmount(0.000000001, 9)).toBe(1n)
  })

  it('roundtrip should preserve precision for reasonable amounts', () => {
    const original = 1_234_567_890n
    const formatted = Number(original) / 1e9 // 1.23456789
    const parsed = parseTokenAmount(formatted, 9)
    expect(parsed).toBe(original)
  })
})
