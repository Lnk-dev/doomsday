/**
 * AMM Program Client Tests
 * Issue #132: Unit tests for AMM calculation functions
 */

import { describe, it, expect } from 'vitest'
import {
  calculateSwapOutput,
  calculateLpTokens,
  calculateRemoveLiquidity,
  getExchangeRate,
  SWAP_FEE_BPS,
} from './amm'

describe('AMM calculations', () => {
  // Use realistic pool reserves for tests
  const DEFAULT_DOOM_RESERVE = 10000
  const DEFAULT_LIFE_RESERVE = 10000

  describe('calculateSwapOutput', () => {
    it('should return zero output for zero input', () => {
      const result = calculateSwapOutput(0, DEFAULT_DOOM_RESERVE, DEFAULT_LIFE_RESERVE, true)
      expect(result.amountOut).toBe(0)
      expect(result.priceImpact).toBe(0)
      expect(result.fee).toBe(0)
    })

    it('should return zero output for negative input', () => {
      const result = calculateSwapOutput(-100, DEFAULT_DOOM_RESERVE, DEFAULT_LIFE_RESERVE, true)
      expect(result.amountOut).toBe(0)
    })

    it('should return zero output for zero reserves', () => {
      const result = calculateSwapOutput(100, 0, 1000, true)
      expect(result.amountOut).toBe(0)
    })

    it('should calculate DOOM to LIFE swap correctly', () => {
      const amountIn = 100
      const result = calculateSwapOutput(amountIn, DEFAULT_DOOM_RESERVE, DEFAULT_LIFE_RESERVE, true)

      // With equal reserves, output should be slightly less than input due to fees and price impact
      expect(result.amountOut).toBeGreaterThan(0)
      expect(result.amountOut).toBeLessThan(amountIn)
      expect(result.fee).toBeCloseTo(amountIn * SWAP_FEE_BPS / 10000)
    })

    it('should calculate LIFE to DOOM swap correctly', () => {
      const amountIn = 100
      const result = calculateSwapOutput(amountIn, DEFAULT_DOOM_RESERVE, DEFAULT_LIFE_RESERVE, false)

      expect(result.amountOut).toBeGreaterThan(0)
      expect(result.amountOut).toBeLessThan(amountIn)
    })

    it('should have symmetric output for equal reserves', () => {
      const amountIn = 100
      const doomToLife = calculateSwapOutput(amountIn, DEFAULT_DOOM_RESERVE, DEFAULT_LIFE_RESERVE, true)
      const lifeToDoom = calculateSwapOutput(amountIn, DEFAULT_DOOM_RESERVE, DEFAULT_LIFE_RESERVE, false)

      // Should be equal for balanced pool
      expect(doomToLife.amountOut).toBeCloseTo(lifeToDoom.amountOut, 4)
    })

    it('should have higher output when swapping into token with larger reserve', () => {
      const amountIn = 100
      const doomReserve = 5000
      const lifeReserve = 15000 // More LIFE in pool

      // DOOM to LIFE should get more output (LIFE is abundant)
      const doomToLife = calculateSwapOutput(amountIn, doomReserve, lifeReserve, true)
      // LIFE to DOOM should get less output (DOOM is scarce)
      const lifeToDoom = calculateSwapOutput(amountIn, doomReserve, lifeReserve, false)

      expect(doomToLife.amountOut).toBeGreaterThan(lifeToDoom.amountOut)
    })

    it('should have higher price impact for larger swaps', () => {
      const smallSwap = calculateSwapOutput(10, DEFAULT_DOOM_RESERVE, DEFAULT_LIFE_RESERVE, true)
      const largeSwap = calculateSwapOutput(1000, DEFAULT_DOOM_RESERVE, DEFAULT_LIFE_RESERVE, true)

      expect(largeSwap.priceImpact).toBeGreaterThan(smallSwap.priceImpact)
    })

    it('should calculate fee correctly', () => {
      const amountIn = 1000
      const result = calculateSwapOutput(amountIn, DEFAULT_DOOM_RESERVE, DEFAULT_LIFE_RESERVE, true)

      const expectedFee = (amountIn * SWAP_FEE_BPS) / 10000
      expect(result.fee).toBeCloseTo(expectedFee)
    })

    it('should never output more than reserve', () => {
      // Try swapping a huge amount
      const amountIn = 100000
      const result = calculateSwapOutput(amountIn, 1000, 1000, true)

      expect(result.amountOut).toBeLessThan(1000)
    })

    it('should satisfy constant product invariant approximately', () => {
      const amountIn = 100
      const doomReserve = 10000
      const lifeReserve = 10000

      const result = calculateSwapOutput(amountIn, doomReserve, lifeReserve, true)
      const amountInAfterFee = amountIn * (10000 - SWAP_FEE_BPS) / 10000

      // Original k = doom * life
      const originalK = doomReserve * lifeReserve

      // New reserves after swap
      const newDoomReserve = doomReserve + amountInAfterFee
      const newLifeReserve = lifeReserve - result.amountOut

      // New k should be >= original k (fees add value to pool)
      const newK = newDoomReserve * newLifeReserve
      expect(newK).toBeGreaterThanOrEqual(originalK * 0.999) // Allow for floating point
    })
  })

  describe('calculateLpTokens', () => {
    it('should use geometric mean for first deposit', () => {
      const doomAmount = 1000
      const lifeAmount = 1000

      const lpTokens = calculateLpTokens(doomAmount, lifeAmount, 0, 0, 0)

      // sqrt(1000 * 1000) = 1000
      expect(lpTokens).toBe(1000)
    })

    it('should handle unequal first deposit', () => {
      const doomAmount = 400
      const lifeAmount = 900

      const lpTokens = calculateLpTokens(doomAmount, lifeAmount, 0, 0, 0)

      // sqrt(400 * 900) = sqrt(360000) = 600
      expect(lpTokens).toBe(600)
    })

    it('should calculate proportional LP tokens for subsequent deposits', () => {
      const doomReserve = 1000
      const lifeReserve = 1000
      const lpSupply = 1000

      // Deposit 10% more of each
      const doomAmount = 100
      const lifeAmount = 100

      const lpTokens = calculateLpTokens(doomAmount, lifeAmount, doomReserve, lifeReserve, lpSupply)

      // Should get 10% of current supply
      expect(lpTokens).toBeCloseTo(100)
    })

    it('should use minimum ratio for unbalanced deposit', () => {
      const doomReserve = 1000
      const lifeReserve = 2000
      const lpSupply = 1000

      // Deposit with different ratios
      const doomAmount = 100 // 10% of DOOM reserve
      const lifeAmount = 100 // 5% of LIFE reserve

      const lpTokens = calculateLpTokens(doomAmount, lifeAmount, doomReserve, lifeReserve, lpSupply)

      // Should use the smaller ratio (LIFE: 5%)
      expect(lpTokens).toBeCloseTo(50)
    })

    it('should return proportional tokens for balanced deposit', () => {
      const doomReserve = 5000
      const lifeReserve = 10000
      const lpSupply = 7071 // sqrt(5000 * 10000)

      // Proportional deposit (maintaining 1:2 ratio)
      const doomAmount = 500
      const lifeAmount = 1000

      const lpTokens = calculateLpTokens(doomAmount, lifeAmount, doomReserve, lifeReserve, lpSupply)

      // 10% increase in reserves should give 10% more LP tokens
      expect(lpTokens).toBeCloseTo(lpSupply * 0.1)
    })
  })

  describe('calculateRemoveLiquidity', () => {
    it('should return zero for empty pool', () => {
      const result = calculateRemoveLiquidity(100, 1000, 1000, 0)

      expect(result.doomAmount).toBe(0)
      expect(result.lifeAmount).toBe(0)
    })

    it('should return proportional amounts', () => {
      const doomReserve = 1000
      const lifeReserve = 2000
      const lpSupply = 1000
      const lpAmount = 100 // 10% of supply

      const result = calculateRemoveLiquidity(lpAmount, doomReserve, lifeReserve, lpSupply)

      expect(result.doomAmount).toBeCloseTo(100) // 10% of 1000
      expect(result.lifeAmount).toBeCloseTo(200) // 10% of 2000
    })

    it('should return all reserves for full LP removal', () => {
      const doomReserve = 5000
      const lifeReserve = 7500
      const lpSupply = 6124 // sqrt(5000 * 7500)

      const result = calculateRemoveLiquidity(lpSupply, doomReserve, lifeReserve, lpSupply)

      expect(result.doomAmount).toBeCloseTo(doomReserve)
      expect(result.lifeAmount).toBeCloseTo(lifeReserve)
    })

    it('should handle small LP amounts', () => {
      const doomReserve = 10000
      const lifeReserve = 10000
      const lpSupply = 10000
      const lpAmount = 1 // Tiny amount

      const result = calculateRemoveLiquidity(lpAmount, doomReserve, lifeReserve, lpSupply)

      expect(result.doomAmount).toBeCloseTo(1)
      expect(result.lifeAmount).toBeCloseTo(1)
    })
  })

  describe('getExchangeRate', () => {
    it('should return 1 for equal reserves', () => {
      const rate = getExchangeRate(1000, 1000, true)
      expect(rate).toBe(1)
    })

    it('should return 1 for zero reserves', () => {
      const rate = getExchangeRate(0, 1000, true)
      expect(rate).toBe(1)
    })

    it('should calculate DOOM to LIFE rate correctly', () => {
      const doomReserve = 1000
      const lifeReserve = 2000

      const rate = getExchangeRate(doomReserve, lifeReserve, true)

      // 1 DOOM = 2 LIFE
      expect(rate).toBe(2)
    })

    it('should calculate LIFE to DOOM rate correctly', () => {
      const doomReserve = 1000
      const lifeReserve = 2000

      const rate = getExchangeRate(doomReserve, lifeReserve, false)

      // 1 LIFE = 0.5 DOOM
      expect(rate).toBe(0.5)
    })

    it('should be inverse for opposite directions', () => {
      const doomReserve = 3000
      const lifeReserve = 9000

      const doomToLife = getExchangeRate(doomReserve, lifeReserve, true)
      const lifeToDoom = getExchangeRate(doomReserve, lifeReserve, false)

      expect(doomToLife * lifeToDoom).toBeCloseTo(1)
    })
  })

  describe('SWAP_FEE_BPS constant', () => {
    it('should be 30 basis points (0.3%)', () => {
      expect(SWAP_FEE_BPS).toBe(30)
    })
  })
})
