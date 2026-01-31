/**
 * AMM Program Client
 * Issue #132: Liquidity provision and AMM for DOOM/LIFE trading
 *
 * TypeScript client for interacting with the AMM Anchor program.
 */

import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js'
import { BN } from '@coral-xyz/anchor'
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token'
import { getNetworkConfig, getProgramId } from '../config'

// Fee constant matching on-chain program (30 = 0.3%)
export const SWAP_FEE_BPS = 30

// Account types
export interface LiquidityPool {
  doomMint: PublicKey
  lifeMint: PublicKey
  doomReserve: BN
  lifeReserve: BN
  lpMint: PublicKey
  lpSupply: BN
  totalFeesDoom: BN
  totalFeesLife: BN
  authority: PublicKey
  bump: number
  initialized: boolean
}

// PDA Seeds
const POOL_SEED = 'pool'
const LP_MINT_SEED = 'lp_mint'
const POOL_DOOM_SEED = 'pool_doom'
const POOL_LIFE_SEED = 'pool_life'

/**
 * Get the AMM program ID from config
 */
export function getAmmProgramId(): PublicKey {
  return new PublicKey(getProgramId('amm'))
}

/**
 * Derive the LiquidityPool PDA
 */
export function findPoolPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(POOL_SEED)],
    getAmmProgramId()
  )
}

/**
 * Derive the LP token mint PDA
 */
export function findLpMintPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(LP_MINT_SEED)],
    getAmmProgramId()
  )
}

/**
 * Derive the pool's DOOM token account PDA
 */
export function findPoolDoomPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(POOL_DOOM_SEED)],
    getAmmProgramId()
  )
}

/**
 * Derive the pool's LIFE token account PDA
 */
export function findPoolLifePDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(POOL_LIFE_SEED)],
    getAmmProgramId()
  )
}

/**
 * Build a swap transaction
 */
export async function buildSwapTransaction(
  connection: Connection,
  user: PublicKey,
  amountIn: BN,
  minAmountOut: BN,
  doomToLife: boolean
): Promise<Transaction> {
  const [pool] = findPoolPDA()
  const [poolDoom] = findPoolDoomPDA()
  const [poolLife] = findPoolLifePDA()

  const config = getNetworkConfig()
  const doomMint = new PublicKey(config.tokens.doom.mint)
  const lifeMint = new PublicKey(config.tokens.life.mint)

  const userDoom = getAssociatedTokenAddressSync(doomMint, user)
  const userLife = getAssociatedTokenAddressSync(lifeMint, user)

  // Build instruction data
  // swap discriminator + amount_in (8 bytes) + min_amount_out (8 bytes) + doom_to_life (1 byte)
  const discriminator = Buffer.from([248, 198, 158, 145, 225, 117, 135, 200]) // swap
  const amountInBuffer = amountIn.toArrayLike(Buffer, 'le', 8)
  const minAmountOutBuffer = minAmountOut.toArrayLike(Buffer, 'le', 8)
  const doomToLifeBuffer = Buffer.from([doomToLife ? 1 : 0])
  const data = Buffer.concat([discriminator, amountInBuffer, minAmountOutBuffer, doomToLifeBuffer])

  const programId = getAmmProgramId()

  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: pool, isSigner: false, isWritable: true },
      { pubkey: poolDoom, isSigner: false, isWritable: true },
      { pubkey: poolLife, isSigner: false, isWritable: true },
      { pubkey: userDoom, isSigner: false, isWritable: true },
      { pubkey: userLife, isSigner: false, isWritable: true },
      { pubkey: user, isSigner: true, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    programId,
    data,
  })

  const transaction = new Transaction().add(instruction)
  transaction.feePayer = user
  const latestBlockhash = await connection.getLatestBlockhash()
  transaction.recentBlockhash = latestBlockhash.blockhash

  return transaction
}

/**
 * Build an add liquidity transaction
 */
export async function buildAddLiquidityTransaction(
  connection: Connection,
  user: PublicKey,
  doomAmount: BN,
  lifeAmount: BN,
  minLpTokens: BN
): Promise<Transaction> {
  const [pool] = findPoolPDA()
  const [lpMint] = findLpMintPDA()
  const [poolDoom] = findPoolDoomPDA()
  const [poolLife] = findPoolLifePDA()

  const config = getNetworkConfig()
  const doomMint = new PublicKey(config.tokens.doom.mint)
  const lifeMint = new PublicKey(config.tokens.life.mint)

  const userDoom = getAssociatedTokenAddressSync(doomMint, user)
  const userLife = getAssociatedTokenAddressSync(lifeMint, user)
  const userLp = getAssociatedTokenAddressSync(lpMint, user)

  // add_liquidity discriminator + doom_amount + life_amount + min_lp_tokens
  const discriminator = Buffer.from([181, 157, 89, 67, 143, 182, 52, 72]) // add_liquidity
  const doomAmountBuffer = doomAmount.toArrayLike(Buffer, 'le', 8)
  const lifeAmountBuffer = lifeAmount.toArrayLike(Buffer, 'le', 8)
  const minLpBuffer = minLpTokens.toArrayLike(Buffer, 'le', 8)
  const data = Buffer.concat([discriminator, doomAmountBuffer, lifeAmountBuffer, minLpBuffer])

  const programId = getAmmProgramId()

  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: pool, isSigner: false, isWritable: true },
      { pubkey: lpMint, isSigner: false, isWritable: true },
      { pubkey: poolDoom, isSigner: false, isWritable: true },
      { pubkey: poolLife, isSigner: false, isWritable: true },
      { pubkey: userDoom, isSigner: false, isWritable: true },
      { pubkey: userLife, isSigner: false, isWritable: true },
      { pubkey: userLp, isSigner: false, isWritable: true },
      { pubkey: user, isSigner: true, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    programId,
    data,
  })

  const transaction = new Transaction().add(instruction)
  transaction.feePayer = user
  const latestBlockhash = await connection.getLatestBlockhash()
  transaction.recentBlockhash = latestBlockhash.blockhash

  return transaction
}

/**
 * Build a remove liquidity transaction
 */
export async function buildRemoveLiquidityTransaction(
  connection: Connection,
  user: PublicKey,
  lpAmount: BN,
  minDoom: BN,
  minLife: BN
): Promise<Transaction> {
  const [pool] = findPoolPDA()
  const [lpMint] = findLpMintPDA()
  const [poolDoom] = findPoolDoomPDA()
  const [poolLife] = findPoolLifePDA()

  const config = getNetworkConfig()
  const doomMint = new PublicKey(config.tokens.doom.mint)
  const lifeMint = new PublicKey(config.tokens.life.mint)

  const userDoom = getAssociatedTokenAddressSync(doomMint, user)
  const userLife = getAssociatedTokenAddressSync(lifeMint, user)
  const userLp = getAssociatedTokenAddressSync(lpMint, user)

  // remove_liquidity discriminator + lp_amount + min_doom + min_life
  const discriminator = Buffer.from([80, 85, 209, 72, 24, 206, 177, 108]) // remove_liquidity
  const lpAmountBuffer = lpAmount.toArrayLike(Buffer, 'le', 8)
  const minDoomBuffer = minDoom.toArrayLike(Buffer, 'le', 8)
  const minLifeBuffer = minLife.toArrayLike(Buffer, 'le', 8)
  const data = Buffer.concat([discriminator, lpAmountBuffer, minDoomBuffer, minLifeBuffer])

  const programId = getAmmProgramId()

  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: pool, isSigner: false, isWritable: true },
      { pubkey: lpMint, isSigner: false, isWritable: true },
      { pubkey: poolDoom, isSigner: false, isWritable: true },
      { pubkey: poolLife, isSigner: false, isWritable: true },
      { pubkey: userDoom, isSigner: false, isWritable: true },
      { pubkey: userLife, isSigner: false, isWritable: true },
      { pubkey: userLp, isSigner: false, isWritable: true },
      { pubkey: user, isSigner: true, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    programId,
    data,
  })

  const transaction = new Transaction().add(instruction)
  transaction.feePayer = user
  const latestBlockhash = await connection.getLatestBlockhash()
  transaction.recentBlockhash = latestBlockhash.blockhash

  return transaction
}

/**
 * Fetch the liquidity pool account
 */
export async function fetchPool(connection: Connection): Promise<LiquidityPool | null> {
  const [pda] = findPoolPDA()
  const accountInfo = await connection.getAccountInfo(pda)

  if (!accountInfo) {
    return null
  }

  // Parse account data (skip 8-byte discriminator)
  const data = accountInfo.data.slice(8)
  return parsePool(data)
}

/**
 * Parse pool account data
 */
function parsePool(data: Buffer): LiquidityPool {
  let offset = 0

  const doomMint = new PublicKey(data.slice(offset, offset + 32))
  offset += 32

  const lifeMint = new PublicKey(data.slice(offset, offset + 32))
  offset += 32

  const doomReserve = new BN(data.slice(offset, offset + 8), 'le')
  offset += 8

  const lifeReserve = new BN(data.slice(offset, offset + 8), 'le')
  offset += 8

  const lpMint = new PublicKey(data.slice(offset, offset + 32))
  offset += 32

  const lpSupply = new BN(data.slice(offset, offset + 8), 'le')
  offset += 8

  const totalFeesDoom = new BN(data.slice(offset, offset + 8), 'le')
  offset += 8

  const totalFeesLife = new BN(data.slice(offset, offset + 8), 'le')
  offset += 8

  const authority = new PublicKey(data.slice(offset, offset + 32))
  offset += 32

  const bump = data[offset]
  offset += 1

  const initialized = data[offset] === 1

  return {
    doomMint,
    lifeMint,
    doomReserve,
    lifeReserve,
    lpMint,
    lpSupply,
    totalFeesDoom,
    totalFeesLife,
    authority,
    bump,
    initialized,
  }
}

/**
 * Calculate swap output using constant product formula
 * Returns the amount out and price impact
 */
export function calculateSwapOutput(
  amountIn: number,
  doomReserve: number,
  lifeReserve: number,
  doomToLife: boolean
): { amountOut: number; priceImpact: number; fee: number } {
  if (amountIn <= 0 || doomReserve <= 0 || lifeReserve <= 0) {
    return { amountOut: 0, priceImpact: 0, fee: 0 }
  }

  const reserveIn = doomToLife ? doomReserve : lifeReserve
  const reserveOut = doomToLife ? lifeReserve : doomReserve

  // Fee calculation
  const fee = (amountIn * SWAP_FEE_BPS) / 10000
  const amountInWithFee = amountIn * (10000 - SWAP_FEE_BPS) / 10000

  // Constant product formula
  const numerator = amountInWithFee * reserveOut
  const denominator = reserveIn + amountInWithFee
  const amountOut = numerator / denominator

  // Calculate price impact
  const spotPrice = reserveOut / reserveIn
  const executionPrice = amountOut / amountIn
  const priceImpact = Math.abs((spotPrice - executionPrice) / spotPrice) * 100

  return { amountOut, priceImpact, fee }
}

/**
 * Calculate LP tokens to receive for adding liquidity
 */
export function calculateLpTokens(
  doomAmount: number,
  lifeAmount: number,
  doomReserve: number,
  lifeReserve: number,
  lpSupply: number
): number {
  if (lpSupply === 0) {
    // First deposit - geometric mean
    return Math.sqrt(doomAmount * lifeAmount)
  }

  // Proportional to existing reserves
  const doomRatio = (doomAmount * lpSupply) / doomReserve
  const lifeRatio = (lifeAmount * lpSupply) / lifeReserve

  return Math.min(doomRatio, lifeRatio)
}

/**
 * Calculate tokens received for removing liquidity
 */
export function calculateRemoveLiquidity(
  lpAmount: number,
  doomReserve: number,
  lifeReserve: number,
  lpSupply: number
): { doomAmount: number; lifeAmount: number } {
  if (lpSupply === 0) {
    return { doomAmount: 0, lifeAmount: 0 }
  }

  const doomAmount = (lpAmount * doomReserve) / lpSupply
  const lifeAmount = (lpAmount * lifeReserve) / lpSupply

  return { doomAmount, lifeAmount }
}

/**
 * Get the current exchange rate
 */
export function getExchangeRate(
  doomReserve: number,
  lifeReserve: number,
  doomToLife: boolean
): number {
  if (doomReserve === 0 || lifeReserve === 0) {
    return 1
  }

  return doomToLife ? lifeReserve / doomReserve : doomReserve / lifeReserve
}
