/**
 * Solana Network Configuration
 * Issue #105: Mainnet vs devnet environment configuration
 *
 * Environment-based configuration for Solana network, tokens, and programs.
 */

import { clusterApiUrl } from '@solana/web3.js'

export type SolanaNetwork = 'mainnet-beta' | 'devnet' | 'testnet' | 'localnet'

export interface NetworkConfig {
  network: SolanaNetwork
  rpcUrl: string
  wsUrl: string
  explorerUrl: string
  tokens: {
    doom: { mint: string; decimals: number }
    life: { mint: string; decimals: number }
  }
  programs: {
    predictionMarket: string
    tokenVault: string
  }
}

// Devnet configuration (development/testing)
const DEVNET_CONFIG: NetworkConfig = {
  network: 'devnet',
  rpcUrl: import.meta.env.VITE_SOLANA_RPC_URL || clusterApiUrl('devnet'),
  wsUrl: import.meta.env.VITE_SOLANA_WS_URL || 'wss://api.devnet.solana.com',
  explorerUrl: 'https://explorer.solana.com',
  tokens: {
    doom: {
      mint: import.meta.env.VITE_DOOM_TOKEN_MINT || '9Dc8sELJerfzPfk9DMP5vahLFxvr6rzn7PB8E6EK4Ah5',
      decimals: 9,
    },
    life: {
      mint: import.meta.env.VITE_LIFE_TOKEN_MINT || 'D2DDKv5JXjL1APVBP1ySY3PMUFEjL7R8NRz9r9a4JCvE',
      decimals: 9,
    },
  },
  programs: {
    predictionMarket: import.meta.env.VITE_PREDICTION_MARKET_PROGRAM || 'BMmGykphijTgvB7WMim9UVqi9976iibKf6uYAiGXC7Mc',
    tokenVault: import.meta.env.VITE_TOKEN_VAULT_PROGRAM || 'BMmGykphijTgvB7WMim9UVqi9976iibKf6uYAiGXC7Mc',
  },
}

// Mainnet configuration (production)
const MAINNET_CONFIG: NetworkConfig = {
  network: 'mainnet-beta',
  rpcUrl: import.meta.env.VITE_SOLANA_RPC_URL || clusterApiUrl('mainnet-beta'),
  wsUrl: import.meta.env.VITE_SOLANA_WS_URL || 'wss://api.mainnet-beta.solana.com',
  explorerUrl: 'https://explorer.solana.com',
  tokens: {
    doom: {
      mint: import.meta.env.VITE_DOOM_TOKEN_MINT || '',
      decimals: 9,
    },
    life: {
      mint: import.meta.env.VITE_LIFE_TOKEN_MINT || '',
      decimals: 9,
    },
  },
  programs: {
    predictionMarket: import.meta.env.VITE_PREDICTION_MARKET_PROGRAM || '',
    tokenVault: import.meta.env.VITE_TOKEN_VAULT_PROGRAM || '',
  },
}

// Localnet configuration (local development)
const LOCALNET_CONFIG: NetworkConfig = {
  network: 'localnet',
  rpcUrl: 'http://localhost:8899',
  wsUrl: 'ws://localhost:8900',
  explorerUrl: 'https://explorer.solana.com',
  tokens: {
    doom: { mint: '', decimals: 9 },
    life: { mint: '', decimals: 9 },
  },
  programs: {
    predictionMarket: '',
    tokenVault: '',
  },
}

/**
 * Get network configuration based on environment
 */
export function getNetworkConfig(): NetworkConfig {
  const network = (import.meta.env.VITE_SOLANA_NETWORK || 'devnet') as SolanaNetwork

  switch (network) {
    case 'mainnet-beta':
      return MAINNET_CONFIG
    case 'localnet':
      return LOCALNET_CONFIG
    case 'testnet':
      return { ...DEVNET_CONFIG, network: 'testnet', rpcUrl: clusterApiUrl('testnet') }
    default:
      return DEVNET_CONFIG
  }
}

/**
 * Get current network name for display
 */
export function getNetworkDisplayName(): string {
  const config = getNetworkConfig()
  switch (config.network) {
    case 'mainnet-beta':
      return 'Mainnet'
    case 'devnet':
      return 'Devnet'
    case 'testnet':
      return 'Testnet'
    case 'localnet':
      return 'Local'
    default:
      return config.network
  }
}

/**
 * Check if current network is production
 */
export function isMainnet(): boolean {
  return getNetworkConfig().network === 'mainnet-beta'
}

/**
 * Get explorer URL for a transaction or address
 */
export function getExplorerUrl(signature: string, type: 'tx' | 'address' = 'tx'): string {
  const config = getNetworkConfig()
  const cluster = config.network === 'mainnet-beta' ? '' : `?cluster=${config.network}`
  return `${config.explorerUrl}/${type}/${signature}${cluster}`
}

/**
 * Get token mint address
 */
export function getTokenMint(token: 'doom' | 'life'): string {
  return getNetworkConfig().tokens[token].mint
}

/**
 * Get token decimals
 */
export function getTokenDecimals(token: 'doom' | 'life'): number {
  return getNetworkConfig().tokens[token].decimals
}

/**
 * Get program ID
 */
export function getProgramId(program: 'predictionMarket' | 'tokenVault'): string {
  return getNetworkConfig().programs[program]
}

/**
 * Validate that required configuration is present for mainnet
 */
export function validateMainnetConfig(): { valid: boolean; missing: string[] } {
  if (!isMainnet()) {
    return { valid: true, missing: [] }
  }

  const config = getNetworkConfig()
  const missing: string[] = []

  if (!config.tokens.doom.mint) missing.push('DOOM token mint')
  if (!config.tokens.life.mint) missing.push('LIFE token mint')
  if (!config.programs.predictionMarket) missing.push('Prediction market program')
  if (!config.programs.tokenVault) missing.push('Token vault program')

  return { valid: missing.length === 0, missing }
}
