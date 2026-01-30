/**
 * Prediction Market Program Client Tests
 * Issues #34, #35, #36: Tests for prediction market calculations and PDAs
 */

import { describe, it, expect } from 'vitest'
import { PublicKey } from '@solana/web3.js'
import { BN } from '@coral-xyz/anchor'
import {
  calculateEstimatedPayout,
  Outcome,
  findPlatformConfigPDA,
  findEventPDA,
  findUserBetPDA,
  findUserStatsPDA,
} from './predictionMarket'

describe('Prediction Market calculations', () => {
  describe('calculateEstimatedPayout', () => {
    const DEFAULT_FEE_BPS = 200 // 2% fee

    describe('basic payout calculations', () => {
      it('should calculate payout for equal pools', () => {
        const result = calculateEstimatedPayout(
          100, // bet amount
          Outcome.Doom,
          1000, // doom pool (before bet)
          1000, // life pool
          DEFAULT_FEE_BPS
        )

        // Bet 100 on doom. After bet: doom=1100, life=1000
        // Share of losing pool: (100/1100) * 1000 ≈ 90.9
        // Fee: 90.9 * 0.02 ≈ 1.82
        // Net winnings: ~89.08
        // Total payout: 100 + 89.08 ≈ 189.08
        expect(result.payout).toBeGreaterThan(100)
        expect(result.payout).toBeLessThan(200)
        expect(result.fee).toBeGreaterThan(0)
      })

      it('should calculate payout for unequal pools - doom heavy', () => {
        const result = calculateEstimatedPayout(
          100,
          Outcome.Life, // Betting on minority side
          2000, // doom pool (majority)
          500, // life pool (minority)
          DEFAULT_FEE_BPS
        )

        // Betting on minority side (life) should have higher potential payout
        // Share: (100/600) * 2000 = 333.33
        expect(result.payout).toBeGreaterThan(300) // Higher payout for minority
      })

      it('should calculate payout for unequal pools - life heavy', () => {
        const result = calculateEstimatedPayout(
          100,
          Outcome.Doom, // Betting on minority side
          500, // doom pool (minority)
          2000, // life pool (majority)
          DEFAULT_FEE_BPS
        )

        expect(result.payout).toBeGreaterThan(300)
      })

      it('should return original bet when losing pool is 0', () => {
        const result = calculateEstimatedPayout(
          100,
          Outcome.Doom,
          100, // only doom pool has value
          0, // no life pool
          DEFAULT_FEE_BPS
        )

        // No losing pool means no winnings, just get bet back
        expect(result.payout).toBeCloseTo(100)
      })

      it('should calculate fee correctly', () => {
        const result = calculateEstimatedPayout(
          100,
          Outcome.Doom,
          1000,
          1000,
          200 // 2% fee
        )

        // Fee should be approximately 2% of the winnings
        const share = (100 / 1100) * 1000 // ~90.9
        const expectedFee = (share * 200) / 10000 // ~1.82
        expect(result.fee).toBeCloseTo(expectedFee, 1)
      })

      it('should handle zero fee', () => {
        const result = calculateEstimatedPayout(
          100,
          Outcome.Doom,
          1000,
          1000,
          0 // No fee
        )

        expect(result.fee).toBe(0)
        // Payout should be higher without fee
        const resultWithFee = calculateEstimatedPayout(100, Outcome.Doom, 1000, 1000, 200)
        expect(result.payout).toBeGreaterThan(resultWithFee.payout)
      })
    })

    describe('odds calculation', () => {
      it('should calculate 50% odds for equal pools (after bet)', () => {
        const result = calculateEstimatedPayout(
          100,
          Outcome.Doom,
          900, // Before bet: 900 doom
          1000, // 1000 life
          DEFAULT_FEE_BPS
        )

        // After bet: doom=1000, life=1000
        // odds should be close to 50%
        expect(result.odds).toBeCloseTo(50, 0)
      })

      it('should calculate higher odds for majority pool', () => {
        const result = calculateEstimatedPayout(
          100,
          Outcome.Doom,
          2000, // Doom is majority
          500,
          DEFAULT_FEE_BPS
        )

        // Doom pool is 2100 after bet, total is 2600
        // Odds = 2100/2600 * 100 ≈ 80.8%
        expect(result.odds).toBeGreaterThan(70)
      })

      it('should calculate lower odds for minority pool', () => {
        const result = calculateEstimatedPayout(
          100,
          Outcome.Life, // Minority
          2000, // Doom is majority
          500,
          DEFAULT_FEE_BPS
        )

        // Life pool is 600 after bet, total is 2600
        // Odds = 600/2600 * 100 ≈ 23%
        expect(result.odds).toBeLessThan(30)
      })
    })

    describe('edge cases', () => {
      it('should handle very small bets', () => {
        const result = calculateEstimatedPayout(
          0.001,
          Outcome.Doom,
          1000,
          1000,
          DEFAULT_FEE_BPS
        )

        expect(result.payout).toBeGreaterThan(0)
        expect(result.payout).toBeLessThan(0.01)
      })

      it('should handle very large bets', () => {
        const result = calculateEstimatedPayout(
          1000000,
          Outcome.Doom,
          10000,
          10000,
          DEFAULT_FEE_BPS
        )

        expect(result.payout).toBeGreaterThan(1000000)
      })

      it('should handle empty winning pool', () => {
        const result = calculateEstimatedPayout(
          100,
          Outcome.Doom,
          0, // Empty doom pool
          1000,
          DEFAULT_FEE_BPS
        )

        // After bet: doom=100, so not zero
        expect(result.payout).toBeGreaterThan(100)
      })
    })
  })

  describe('Outcome constants', () => {
    it('should have Doom as 0', () => {
      expect(Outcome.Doom).toBe(0)
    })

    it('should have Life as 1', () => {
      expect(Outcome.Life).toBe(1)
    })
  })
})

describe('Prediction Market PDAs', () => {
  describe('findPlatformConfigPDA', () => {
    it('should derive a valid public key', () => {
      const [pda, bump] = findPlatformConfigPDA()

      expect(pda).toBeInstanceOf(PublicKey)
      expect(bump).toBeGreaterThanOrEqual(0)
      expect(bump).toBeLessThanOrEqual(255)
    })

    it('should be deterministic', () => {
      const [pda1] = findPlatformConfigPDA()
      const [pda2] = findPlatformConfigPDA()

      expect(pda1.equals(pda2)).toBe(true)
    })
  })

  describe('findEventPDA', () => {
    it('should derive different PDAs for different event IDs', () => {
      const [pda1] = findEventPDA(1)
      const [pda2] = findEventPDA(2)

      expect(pda1.equals(pda2)).toBe(false)
    })

    it('should accept BN as event ID', () => {
      const eventId = new BN(123)
      const [pda1] = findEventPDA(eventId)
      const [pda2] = findEventPDA(123)

      expect(pda1.equals(pda2)).toBe(true)
    })

    it('should be deterministic for same event ID', () => {
      const [pda1] = findEventPDA(42)
      const [pda2] = findEventPDA(42)

      expect(pda1.equals(pda2)).toBe(true)
    })
  })

  describe('findUserBetPDA', () => {
    it('should derive different PDAs for different users', () => {
      // Use valid Solana public key strings (well-known program addresses)
      const event = new PublicKey('11111111111111111111111111111111') // System Program
      const user1 = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') // Token Program
      const user2 = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL') // Associated Token Program

      const [pda1] = findUserBetPDA(event, user1)
      const [pda2] = findUserBetPDA(event, user2)

      expect(pda1.equals(pda2)).toBe(false)
    })

    it('should derive different PDAs for different events', () => {
      // Use valid Solana public key strings
      const event1 = new PublicKey('11111111111111111111111111111111') // System Program
      const event2 = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') // Token Program
      const user = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL') // Associated Token Program

      const [pda1] = findUserBetPDA(event1, user)
      const [pda2] = findUserBetPDA(event2, user)

      expect(pda1.equals(pda2)).toBe(false)
    })
  })

  describe('findUserStatsPDA', () => {
    it('should derive different PDAs for different users', () => {
      // Use valid Solana public key strings
      const user1 = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') // Token Program
      const user2 = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL') // Associated Token Program

      const [pda1] = findUserStatsPDA(user1)
      const [pda2] = findUserStatsPDA(user2)

      expect(pda1.equals(pda2)).toBe(false)
    })

    it('should be deterministic', () => {
      const user = new PublicKey('11111111111111111111111111111111')

      const [pda1] = findUserStatsPDA(user)
      const [pda2] = findUserStatsPDA(user)

      expect(pda1.equals(pda2)).toBe(true)
    })
  })
})
