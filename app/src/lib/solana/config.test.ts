/**
 * Solana Config Tests
 * Issue #105: Tests for network configuration utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getNetworkConfig,
  getNetworkDisplayName,
  isMainnet,
  getExplorerUrl,
  getTokenMint,
  getTokenDecimals,
  getProgramId,
  validateMainnetConfig,
} from './config'

// Mock import.meta.env
const mockEnv = {
  VITE_SOLANA_NETWORK: 'devnet',
  VITE_SOLANA_RPC_URL: '',
  VITE_SOLANA_WS_URL: '',
  VITE_DOOM_TOKEN_MINT: '',
  VITE_LIFE_TOKEN_MINT: '',
  VITE_PREDICTION_MARKET_PROGRAM: '',
  VITE_TOKEN_VAULT_PROGRAM: '',
  VITE_AMM_PROGRAM: '',
}

describe('Solana config', () => {
  beforeEach(() => {
    // Reset env to devnet before each test
    vi.stubGlobal('import', {
      meta: {
        env: { ...mockEnv },
      },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('getNetworkConfig', () => {
    it('should return devnet config by default', () => {
      const config = getNetworkConfig()

      expect(config.network).toBe('devnet')
      expect(config.explorerUrl).toBe('https://explorer.solana.com')
    })

    it('should have token configuration', () => {
      const config = getNetworkConfig()

      expect(config.tokens.doom).toBeDefined()
      expect(config.tokens.life).toBeDefined()
      expect(config.tokens.doom.decimals).toBe(9)
      expect(config.tokens.life.decimals).toBe(9)
    })

    it('should have program configuration', () => {
      const config = getNetworkConfig()

      expect(config.programs.predictionMarket).toBeDefined()
      expect(config.programs.amm).toBeDefined()
    })
  })

  describe('getNetworkDisplayName', () => {
    it('should return "Devnet" for devnet', () => {
      const name = getNetworkDisplayName()

      expect(name).toBe('Devnet')
    })
  })

  describe('isMainnet', () => {
    it('should return false for devnet', () => {
      expect(isMainnet()).toBe(false)
    })
  })

  describe('getExplorerUrl', () => {
    it('should generate transaction URL for devnet', () => {
      const sig = 'test-signature-123'
      const url = getExplorerUrl(sig, 'tx')

      expect(url).toContain('explorer.solana.com')
      expect(url).toContain('/tx/')
      expect(url).toContain('test-signature-123')
      expect(url).toContain('cluster=devnet')
    })

    it('should generate address URL', () => {
      const addr = 'test-address-456'
      const url = getExplorerUrl(addr, 'address')

      expect(url).toContain('/address/')
      expect(url).toContain('test-address-456')
    })

    it('should default to tx type', () => {
      const sig = 'test-sig'
      const url = getExplorerUrl(sig)

      expect(url).toContain('/tx/')
    })
  })

  describe('getTokenMint', () => {
    it('should return DOOM token mint', () => {
      const mint = getTokenMint('doom')

      expect(mint).toBeDefined()
      expect(typeof mint).toBe('string')
    })

    it('should return LIFE token mint', () => {
      const mint = getTokenMint('life')

      expect(mint).toBeDefined()
      expect(typeof mint).toBe('string')
    })
  })

  describe('getTokenDecimals', () => {
    it('should return 9 decimals for DOOM', () => {
      expect(getTokenDecimals('doom')).toBe(9)
    })

    it('should return 9 decimals for LIFE', () => {
      expect(getTokenDecimals('life')).toBe(9)
    })
  })

  describe('getProgramId', () => {
    it('should return prediction market program ID', () => {
      const programId = getProgramId('predictionMarket')

      expect(programId).toBeDefined()
      expect(typeof programId).toBe('string')
    })

    it('should return AMM program ID', () => {
      const programId = getProgramId('amm')

      expect(programId).toBeDefined()
      expect(typeof programId).toBe('string')
    })

    it('should return token vault program ID', () => {
      const programId = getProgramId('tokenVault')

      expect(programId).toBeDefined()
    })
  })

  describe('validateMainnetConfig', () => {
    it('should return valid for non-mainnet', () => {
      const result = validateMainnetConfig()

      expect(result.valid).toBe(true)
      expect(result.missing).toEqual([])
    })
  })
})
