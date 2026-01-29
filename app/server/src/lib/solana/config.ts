/**
 * Backend Solana Configuration
 * Issues #34, #35: Server-side Solana integration
 *
 * Configuration for backend Solana operations.
 */

import { Connection, Keypair, PublicKey, clusterApiUrl } from '@solana/web3.js'
import * as fs from 'fs'
import * as path from 'path'

export type SolanaNetwork = 'mainnet-beta' | 'devnet' | 'testnet' | 'localnet'

export interface ServerSolanaConfig {
  network: SolanaNetwork
  rpcUrl: string
  wsUrl: string
  tokens: {
    doom: { mint: string; decimals: number }
    life: { mint: string; decimals: number }
  }
  programs: {
    predictionMarket: string
  }
}

/**
 * Get Solana configuration from environment
 */
export function getServerSolanaConfig(): ServerSolanaConfig {
  const network = (process.env.SOLANA_NETWORK || 'devnet') as SolanaNetwork

  const rpcUrl = process.env.SOLANA_RPC_URL ||
    (network === 'mainnet-beta'
      ? clusterApiUrl('mainnet-beta')
      : network === 'localnet'
        ? 'http://localhost:8899'
        : clusterApiUrl('devnet'))

  const wsUrl = process.env.SOLANA_WS_URL ||
    (network === 'mainnet-beta'
      ? 'wss://api.mainnet-beta.solana.com'
      : network === 'localnet'
        ? 'ws://localhost:8900'
        : 'wss://api.devnet.solana.com')

  return {
    network,
    rpcUrl,
    wsUrl,
    tokens: {
      doom: {
        mint: process.env.DOOM_TOKEN_MINT || 'DooMDevMintAddressPlaceholder111111111111111',
        decimals: 9,
      },
      life: {
        mint: process.env.LIFE_TOKEN_MINT || 'LiFEDevMintAddressPlaceholder111111111111111',
        decimals: 9,
      },
    },
    programs: {
      predictionMarket: process.env.PREDICTION_MARKET_PROGRAM || 'Pred111111111111111111111111111111111111111111',
    },
  }
}

/**
 * Get a connection to Solana
 */
export function getConnection(): Connection {
  const config = getServerSolanaConfig()
  return new Connection(config.rpcUrl, {
    commitment: 'confirmed',
    wsEndpoint: config.wsUrl,
  })
}

/**
 * Load the oracle keypair from file or environment
 */
export function loadOracleKeypair(): Keypair {
  // Try environment variable first (base64 encoded secret key)
  const secretKeyBase64 = process.env.ORACLE_SECRET_KEY
  if (secretKeyBase64) {
    const secretKey = Buffer.from(secretKeyBase64, 'base64')
    return Keypair.fromSecretKey(secretKey)
  }

  // Try file path
  const keypairPath = process.env.ORACLE_KEYPAIR_PATH ||
    path.join(process.env.HOME || '', '.config/solana/oracle.json')

  if (fs.existsSync(keypairPath)) {
    const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf-8'))
    return Keypair.fromSecretKey(new Uint8Array(keypairData))
  }

  throw new Error('Oracle keypair not found. Set ORACLE_SECRET_KEY or ORACLE_KEYPAIR_PATH')
}

/**
 * Check if oracle is configured
 */
export function isOracleConfigured(): boolean {
  try {
    loadOracleKeypair()
    return true
  } catch {
    return false
  }
}

/**
 * Get the prediction market program ID
 */
export function getPredictionMarketProgramId(): PublicKey {
  const config = getServerSolanaConfig()
  return new PublicKey(config.programs.predictionMarket)
}

/**
 * Get token mint addresses
 */
export function getTokenMint(token: 'doom' | 'life'): PublicKey {
  const config = getServerSolanaConfig()
  return new PublicKey(config.tokens[token].mint)
}
