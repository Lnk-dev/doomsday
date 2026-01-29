/**
 * SPL Token Utilities
 * Issue #34, #35: Token integration for $DOOM and $LIFE
 *
 * Utilities for fetching token balances and managing Associated Token Accounts.
 */

import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js'
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  getAccount,
  TokenAccountNotFoundError,
  TokenInvalidAccountOwnerError,
} from '@solana/spl-token'
import { getNetworkConfig, getTokenMint, getTokenDecimals } from './config'

export interface TokenBalance {
  mint: string
  balance: number
  decimals: number
  uiAmount: number
}

export interface TokenAccountInfo {
  address: PublicKey
  mint: PublicKey
  owner: PublicKey
  balance: bigint
  decimals: number
}

/**
 * Find the Associated Token Account address for a given mint and owner
 * Does not check if account exists - only derives the address
 */
export function findATA(mint: PublicKey, owner: PublicKey): PublicKey {
  return getAssociatedTokenAddressSync(mint, owner, true)
}

/**
 * Get the ATA address for $DOOM token
 */
export function findDoomATA(owner: PublicKey): PublicKey {
  const config = getNetworkConfig()
  const mint = new PublicKey(config.tokens.doom.mint)
  return findATA(mint, owner)
}

/**
 * Get the ATA address for $LIFE token
 */
export function findLifeATA(owner: PublicKey): PublicKey {
  const config = getNetworkConfig()
  const mint = new PublicKey(config.tokens.life.mint)
  return findATA(mint, owner)
}

/**
 * Fetch token balance for a specific mint and owner
 * Returns 0 if account doesn't exist
 */
export async function getTokenBalance(
  connection: Connection,
  owner: PublicKey,
  mint: PublicKey
): Promise<TokenBalance> {
  const ata = findATA(mint, owner)
  const decimals = await getTokenDecimals(mint.toString() === getTokenMint('doom') ? 'doom' : 'life')

  try {
    const account = await getAccount(connection, ata)
    const balance = Number(account.amount)
    const uiAmount = balance / Math.pow(10, decimals)

    return {
      mint: mint.toString(),
      balance,
      decimals,
      uiAmount,
    }
  } catch (error) {
    if (
      error instanceof TokenAccountNotFoundError ||
      error instanceof TokenInvalidAccountOwnerError
    ) {
      return {
        mint: mint.toString(),
        balance: 0,
        decimals,
        uiAmount: 0,
      }
    }
    throw error
  }
}

/**
 * Fetch $DOOM token balance for an owner
 */
export async function getDoomBalance(
  connection: Connection,
  owner: PublicKey
): Promise<TokenBalance> {
  const config = getNetworkConfig()
  const mint = new PublicKey(config.tokens.doom.mint)
  return getTokenBalance(connection, owner, mint)
}

/**
 * Fetch $LIFE token balance for an owner
 */
export async function getLifeBalance(
  connection: Connection,
  owner: PublicKey
): Promise<TokenBalance> {
  const config = getNetworkConfig()
  const mint = new PublicKey(config.tokens.life.mint)
  return getTokenBalance(connection, owner, mint)
}

/**
 * Fetch both $DOOM and $LIFE balances
 */
export async function getTokenBalances(
  connection: Connection,
  owner: PublicKey
): Promise<{ doom: TokenBalance; life: TokenBalance }> {
  const [doom, life] = await Promise.all([
    getDoomBalance(connection, owner),
    getLifeBalance(connection, owner),
  ])
  return { doom, life }
}

/**
 * Check if an Associated Token Account exists
 */
export async function checkATAExists(
  connection: Connection,
  ata: PublicKey
): Promise<boolean> {
  try {
    await getAccount(connection, ata)
    return true
  } catch (error) {
    if (
      error instanceof TokenAccountNotFoundError ||
      error instanceof TokenInvalidAccountOwnerError
    ) {
      return false
    }
    throw error
  }
}

/**
 * Get or create Associated Token Account
 * Returns the ATA address and any instructions needed to create it
 */
export async function getOrCreateATA(
  connection: Connection,
  payer: PublicKey,
  mint: PublicKey,
  owner: PublicKey
): Promise<{ address: PublicKey; instruction: TransactionInstruction | null }> {
  const ata = findATA(mint, owner)
  const exists = await checkATAExists(connection, ata)

  if (exists) {
    return { address: ata, instruction: null }
  }

  const instruction = createAssociatedTokenAccountInstruction(
    payer,
    ata,
    owner,
    mint,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  )

  return { address: ata, instruction }
}

/**
 * Get or create $DOOM Associated Token Account
 */
export async function getOrCreateDoomATA(
  connection: Connection,
  payer: PublicKey,
  owner: PublicKey
): Promise<{ address: PublicKey; instruction: TransactionInstruction | null }> {
  const config = getNetworkConfig()
  const mint = new PublicKey(config.tokens.doom.mint)
  return getOrCreateATA(connection, payer, mint, owner)
}

/**
 * Get or create $LIFE Associated Token Account
 */
export async function getOrCreateLifeATA(
  connection: Connection,
  payer: PublicKey,
  owner: PublicKey
): Promise<{ address: PublicKey; instruction: TransactionInstruction | null }> {
  const config = getNetworkConfig()
  const mint = new PublicKey(config.tokens.life.mint)
  return getOrCreateATA(connection, payer, mint, owner)
}

/**
 * Build a transaction with ATA creation instructions if needed
 * Useful for ensuring ATAs exist before token operations
 */
export async function buildATACreationTransaction(
  connection: Connection,
  payer: PublicKey,
  owner: PublicKey,
  mints: PublicKey[]
): Promise<{ transaction: Transaction; atasCreated: PublicKey[] }> {
  const transaction = new Transaction()
  const atasCreated: PublicKey[] = []

  for (const mint of mints) {
    const { address, instruction } = await getOrCreateATA(connection, payer, mint, owner)
    if (instruction) {
      transaction.add(instruction)
      atasCreated.push(address)
    }
  }

  return { transaction, atasCreated }
}

/**
 * Get token account info including balance and owner
 */
export async function getTokenAccountInfo(
  connection: Connection,
  ata: PublicKey
): Promise<TokenAccountInfo | null> {
  try {
    const account = await getAccount(connection, ata)

    // Get decimals from mint info
    const mintInfo = await connection.getParsedAccountInfo(account.mint)
    let decimals = 9 // Default
    if (mintInfo.value?.data && 'parsed' in mintInfo.value.data) {
      decimals = mintInfo.value.data.parsed.info.decimals
    }

    return {
      address: ata,
      mint: account.mint,
      owner: account.owner,
      balance: account.amount,
      decimals,
    }
  } catch (error) {
    if (
      error instanceof TokenAccountNotFoundError ||
      error instanceof TokenInvalidAccountOwnerError
    ) {
      return null
    }
    throw error
  }
}

/**
 * Format token amount for display
 */
export function formatTokenAmount(amount: number | bigint, decimals: number): string {
  const value = typeof amount === 'bigint' ? Number(amount) : amount
  const uiAmount = value / Math.pow(10, decimals)

  if (uiAmount >= 1_000_000) {
    return `${(uiAmount / 1_000_000).toFixed(2)}M`
  }
  if (uiAmount >= 1_000) {
    return `${(uiAmount / 1_000).toFixed(2)}K`
  }
  if (uiAmount >= 1) {
    return uiAmount.toFixed(2)
  }
  return uiAmount.toFixed(decimals)
}

/**
 * Parse token amount from UI input to raw amount
 */
export function parseTokenAmount(uiAmount: string | number, decimals: number): bigint {
  const value = typeof uiAmount === 'string' ? parseFloat(uiAmount) : uiAmount
  if (isNaN(value) || value < 0) {
    throw new Error('Invalid token amount')
  }
  return BigInt(Math.floor(value * Math.pow(10, decimals)))
}

/**
 * Validate token mint address
 */
export function isValidMint(mint: string): boolean {
  try {
    new PublicKey(mint)
    return true
  } catch {
    return false
  }
}

/**
 * Get the token type ('doom' or 'life') from a mint address
 */
export function getTokenTypeFromMint(mint: string): 'doom' | 'life' | null {
  const config = getNetworkConfig()
  if (mint === config.tokens.doom.mint) return 'doom'
  if (mint === config.tokens.life.mint) return 'life'
  return null
}
