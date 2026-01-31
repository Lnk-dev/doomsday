/**
 * Prediction Market Program Client
 * Issues #34, #35, #36, #54: On-chain prediction market integration
 *
 * TypeScript client for interacting with the Prediction Market Anchor program.
 */

import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
} from '@solana/web3.js'
import { BN } from '@coral-xyz/anchor'
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token'
import { getNetworkConfig, getProgramId } from '../config'

// Outcome constants matching the on-chain program
export const Outcome = {
  Doom: 0,
  Life: 1,
} as const
export type Outcome = (typeof Outcome)[keyof typeof Outcome]

// Event status matching the on-chain program
export const EventStatus = {
  Active: 0,
  Resolved: 1,
  Cancelled: 2,
} as const
export type EventStatus = (typeof EventStatus)[keyof typeof EventStatus]

// Account types
export interface PlatformConfig {
  authority: PublicKey
  oracle: PublicKey
  doomMint: PublicKey
  lifeMint: PublicKey
  feeBasisPoints: number
  paused: boolean
  totalDoomFees: BN
  totalLifeFees: BN
  totalEvents: BN
  totalBets: BN
  bump: number
}

export interface PredictionEvent {
  eventId: BN
  creator: PublicKey
  title: string
  description: string
  deadline: BN
  resolutionDeadline: BN
  status: EventStatus
  outcome: Outcome | null
  doomPool: BN
  lifePool: BN
  totalBettors: BN
  createdAt: BN
  resolvedAt: BN | null
  doomVault: PublicKey
  lifeVault: PublicKey
  bump: number
  doomVaultBump: number
  lifeVaultBump: number
}

export interface UserBet {
  event: PublicKey
  user: PublicKey
  outcome: Outcome
  amount: BN
  placedAt: BN
  claimed: boolean
  refunded: boolean
  bump: number
}

export interface UserStats {
  user: PublicKey
  totalBets: BN
  wins: BN
  losses: BN
  totalWagered: BN
  totalWon: BN
  totalLost: BN
  netProfit: BN
  eventsCreated: BN
  firstBetAt: BN | null
  lastBetAt: BN | null
  currentStreak: BN
  bestStreak: BN
  worstStreak: BN
  bump: number
}

// PDA Seeds
const PLATFORM_CONFIG_SEED = 'platform_config'
const EVENT_SEED = 'event'
const USER_BET_SEED = 'user_bet'
const USER_STATS_SEED = 'user_stats'
const DOOM_VAULT_SEED = 'vault_doom'
const LIFE_VAULT_SEED = 'vault_life'

/**
 * Get the program ID from config
 */
export function getPredictionMarketProgramId(): PublicKey {
  return new PublicKey(getProgramId('predictionMarket'))
}

/**
 * Derive the PlatformConfig PDA
 */
export function findPlatformConfigPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(PLATFORM_CONFIG_SEED)],
    getPredictionMarketProgramId()
  )
}

/**
 * Derive the PredictionEvent PDA for a given event ID
 */
export function findEventPDA(eventId: number | BN): [PublicKey, number] {
  const id = typeof eventId === 'number' ? new BN(eventId) : eventId
  return PublicKey.findProgramAddressSync(
    [Buffer.from(EVENT_SEED), id.toArrayLike(Buffer, 'le', 8)],
    getPredictionMarketProgramId()
  )
}

/**
 * Derive the UserBet PDA for a user on an event
 */
export function findUserBetPDA(event: PublicKey, user: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(USER_BET_SEED), event.toBuffer(), user.toBuffer()],
    getPredictionMarketProgramId()
  )
}

/**
 * Derive the UserStats PDA for a user
 */
export function findUserStatsPDA(user: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(USER_STATS_SEED), user.toBuffer()],
    getPredictionMarketProgramId()
  )
}

/**
 * Derive the DOOM vault PDA for an event
 */
export function findDoomVaultPDA(eventId: number | BN): [PublicKey, number] {
  const id = typeof eventId === 'number' ? new BN(eventId) : eventId
  return PublicKey.findProgramAddressSync(
    [Buffer.from(DOOM_VAULT_SEED), id.toArrayLike(Buffer, 'le', 8)],
    getPredictionMarketProgramId()
  )
}

/**
 * Derive the LIFE vault PDA for an event
 */
export function findLifeVaultPDA(eventId: number | BN): [PublicKey, number] {
  const id = typeof eventId === 'number' ? new BN(eventId) : eventId
  return PublicKey.findProgramAddressSync(
    [Buffer.from(LIFE_VAULT_SEED), id.toArrayLike(Buffer, 'le', 8)],
    getPredictionMarketProgramId()
  )
}

/**
 * Build a place bet transaction
 */
export async function buildPlaceBetTransaction(
  connection: Connection,
  user: PublicKey,
  eventId: number | BN,
  outcome: Outcome,
  amount: BN
): Promise<Transaction> {
  const [platformConfig] = findPlatformConfigPDA()
  const [event] = findEventPDA(eventId)
  const [userBet] = findUserBetPDA(event, user)
  const [doomVault] = findDoomVaultPDA(eventId)
  const [lifeVault] = findLifeVaultPDA(eventId)

  const config = getNetworkConfig()
  const doomMint = new PublicKey(config.tokens.doom.mint)
  const lifeMint = new PublicKey(config.tokens.life.mint)

  // Determine which token and vault based on outcome
  const userTokenAccount = outcome === Outcome.Doom
    ? getAssociatedTokenAddressSync(doomMint, user)
    : getAssociatedTokenAddressSync(lifeMint, user)
  const eventVault = outcome === Outcome.Doom ? doomVault : lifeVault

  // Build instruction data
  // place_bet discriminator + outcome (1 byte) + amount (8 bytes)
  const discriminator = Buffer.from([226, 19, 18, 237, 130, 0, 29, 76]) // place_bet
  const outcomeBuffer = Buffer.from([outcome])
  const amountBuffer = amount.toArrayLike(Buffer, 'le', 8)
  const data = Buffer.concat([discriminator, outcomeBuffer, amountBuffer])

  const programId = getPredictionMarketProgramId()

  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: platformConfig, isSigner: false, isWritable: true },
      { pubkey: event, isSigner: false, isWritable: true },
      { pubkey: userBet, isSigner: false, isWritable: true },
      { pubkey: userTokenAccount, isSigner: false, isWritable: true },
      { pubkey: eventVault, isSigner: false, isWritable: true },
      { pubkey: user, isSigner: true, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
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
 * Build a claim winnings transaction
 * @param betOutcome - The outcome the user bet on (needed to determine which vault/token)
 */
export async function buildClaimWinningsTransaction(
  connection: Connection,
  user: PublicKey,
  eventId: number | BN,
  betOutcome: Outcome
): Promise<Transaction> {
  const [platformConfig] = findPlatformConfigPDA()
  const [event] = findEventPDA(eventId)
  const [userBet] = findUserBetPDA(event, user)
  const [doomVault] = findDoomVaultPDA(eventId)
  const [lifeVault] = findLifeVaultPDA(eventId)

  const config = getNetworkConfig()
  const doomMint = new PublicKey(config.tokens.doom.mint)
  const lifeMint = new PublicKey(config.tokens.life.mint)

  // Winnings come from the vault matching the user's bet outcome
  const userTokenAccount = betOutcome === Outcome.Doom
    ? getAssociatedTokenAddressSync(doomMint, user)
    : getAssociatedTokenAddressSync(lifeMint, user)
  const eventVault = betOutcome === Outcome.Doom ? doomVault : lifeVault

  // claim_winnings discriminator
  const discriminator = Buffer.from([161, 215, 24, 59, 14, 236, 242, 221])

  const programId = getPredictionMarketProgramId()

  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: platformConfig, isSigner: false, isWritable: false },
      { pubkey: event, isSigner: false, isWritable: false },
      { pubkey: userBet, isSigner: false, isWritable: true },
      { pubkey: eventVault, isSigner: false, isWritable: true },
      { pubkey: userTokenAccount, isSigner: false, isWritable: true },
      { pubkey: user, isSigner: true, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    programId,
    data: discriminator,
  })

  const transaction = new Transaction().add(instruction)
  transaction.feePayer = user
  const latestBlockhash = await connection.getLatestBlockhash()
  transaction.recentBlockhash = latestBlockhash.blockhash

  return transaction
}

/**
 * Build a refund bet transaction (for cancelled events)
 * @param betOutcome - The outcome the user bet on (needed to determine which vault/token)
 */
export async function buildRefundBetTransaction(
  connection: Connection,
  user: PublicKey,
  eventId: number | BN,
  betOutcome: Outcome
): Promise<Transaction> {
  const [event] = findEventPDA(eventId)
  const [userBet] = findUserBetPDA(event, user)
  const [doomVault] = findDoomVaultPDA(eventId)
  const [lifeVault] = findLifeVaultPDA(eventId)

  const config = getNetworkConfig()
  const doomMint = new PublicKey(config.tokens.doom.mint)
  const lifeMint = new PublicKey(config.tokens.life.mint)

  // Refund comes from the vault matching the user's original bet
  const userTokenAccount = betOutcome === Outcome.Doom
    ? getAssociatedTokenAddressSync(doomMint, user)
    : getAssociatedTokenAddressSync(lifeMint, user)
  const eventVault = betOutcome === Outcome.Doom ? doomVault : lifeVault

  // refund_bet discriminator
  const discriminator = Buffer.from([106, 224, 216, 211, 148, 133, 54, 138])

  const programId = getPredictionMarketProgramId()

  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: event, isSigner: false, isWritable: false },
      { pubkey: userBet, isSigner: false, isWritable: true },
      { pubkey: eventVault, isSigner: false, isWritable: true },
      { pubkey: userTokenAccount, isSigner: false, isWritable: true },
      { pubkey: user, isSigner: true, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    programId,
    data: discriminator,
  })

  const transaction = new Transaction().add(instruction)
  transaction.feePayer = user
  const latestBlockhash = await connection.getLatestBlockhash()
  transaction.recentBlockhash = latestBlockhash.blockhash

  return transaction
}

/**
 * Build a create event transaction
 */
export async function buildCreateEventTransaction(
  connection: Connection,
  creator: PublicKey,
  eventId: number | BN,
  title: string,
  description: string,
  deadline: number,
  resolutionDeadline: number
): Promise<Transaction> {
  const [platformConfig] = findPlatformConfigPDA()
  const [event] = findEventPDA(eventId)
  const [doomVault] = findDoomVaultPDA(eventId)
  const [lifeVault] = findLifeVaultPDA(eventId)

  const config = getNetworkConfig()
  const doomMint = new PublicKey(config.tokens.doom.mint)
  const lifeMint = new PublicKey(config.tokens.life.mint)

  const id = typeof eventId === 'number' ? new BN(eventId) : eventId

  // create_event discriminator + event_id + title + description + deadline + resolution_deadline
  const discriminator = Buffer.from([49, 43, 48, 5, 83, 65, 158, 226])
  const eventIdBuffer = id.toArrayLike(Buffer, 'le', 8)
  const titleBuffer = Buffer.from(title)
  const titleLenBuffer = Buffer.alloc(4)
  titleLenBuffer.writeUInt32LE(titleBuffer.length)
  const descBuffer = Buffer.from(description)
  const descLenBuffer = Buffer.alloc(4)
  descLenBuffer.writeUInt32LE(descBuffer.length)
  const deadlineBuffer = new BN(deadline).toArrayLike(Buffer, 'le', 8)
  const resDeadlineBuffer = new BN(resolutionDeadline).toArrayLike(Buffer, 'le', 8)

  const data = Buffer.concat([
    discriminator,
    eventIdBuffer,
    titleLenBuffer,
    titleBuffer,
    descLenBuffer,
    descBuffer,
    deadlineBuffer,
    resDeadlineBuffer,
  ])

  const programId = getPredictionMarketProgramId()

  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: platformConfig, isSigner: false, isWritable: true },
      { pubkey: event, isSigner: false, isWritable: true },
      { pubkey: doomVault, isSigner: false, isWritable: true },
      { pubkey: lifeVault, isSigner: false, isWritable: true },
      { pubkey: doomMint, isSigner: false, isWritable: false },
      { pubkey: lifeMint, isSigner: false, isWritable: false },
      { pubkey: creator, isSigner: true, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId,
    data,
  })

  const transaction = new Transaction().add(instruction)
  transaction.feePayer = creator
  const latestBlockhash = await connection.getLatestBlockhash()
  transaction.recentBlockhash = latestBlockhash.blockhash

  return transaction
}

/**
 * Fetch platform config account
 */
export async function fetchPlatformConfig(
  connection: Connection
): Promise<PlatformConfig | null> {
  const [pda] = findPlatformConfigPDA()
  const accountInfo = await connection.getAccountInfo(pda)

  if (!accountInfo) {
    return null
  }

  // Parse account data (skip 8-byte discriminator)
  const data = accountInfo.data.slice(8)
  return parsePlatformConfig(data)
}

/**
 * Fetch a prediction event account
 */
export async function fetchEvent(
  connection: Connection,
  eventId: number | BN
): Promise<PredictionEvent | null> {
  const [pda] = findEventPDA(eventId)
  const accountInfo = await connection.getAccountInfo(pda)

  if (!accountInfo) {
    return null
  }

  const data = accountInfo.data.slice(8)
  return parseEvent(data)
}

/**
 * Fetch user bet for an event
 */
export async function fetchUserBet(
  connection: Connection,
  event: PublicKey,
  user: PublicKey
): Promise<UserBet | null> {
  const [pda] = findUserBetPDA(event, user)
  const accountInfo = await connection.getAccountInfo(pda)

  if (!accountInfo) {
    return null
  }

  const data = accountInfo.data.slice(8)
  return parseUserBet(data)
}

/**
 * Fetch user stats
 */
export async function fetchUserStats(
  connection: Connection,
  user: PublicKey
): Promise<UserStats | null> {
  const [pda] = findUserStatsPDA(user)
  const accountInfo = await connection.getAccountInfo(pda)

  if (!accountInfo) {
    return null
  }

  const data = accountInfo.data.slice(8)
  return parseUserStats(data)
}

/**
 * Fetch all events (with pagination)
 */
export async function fetchAllEvents(
  connection: Connection,
  limit = 100
): Promise<PredictionEvent[]> {
  const programId = getPredictionMarketProgramId()

  // Get all program accounts with event account size
  // PredictionEvent accounts are 753 bytes based on actual on-chain data
  const accounts = await connection.getProgramAccounts(programId, {
    filters: [
      { dataSize: 753 }, // Actual event account size
    ],
  })

  const events: PredictionEvent[] = []

  for (const { account } of accounts.slice(0, limit)) {
    try {
      const data = account.data.slice(8)
      const event = parseEvent(data)
      if (event) {
        events.push(event)
      }
    } catch {
      // Skip invalid accounts
    }
  }

  return events
}

/**
 * Fetch all bets for a user
 */
export async function fetchUserBets(
  connection: Connection,
  user: PublicKey
): Promise<UserBet[]> {
  const programId = getPredictionMarketProgramId()

  const accounts = await connection.getProgramAccounts(programId, {
    filters: [
      { memcmp: { offset: 8 + 32, bytes: user.toBase58() } }, // user field after event
    ],
  })

  const bets: UserBet[] = []

  for (const { account } of accounts) {
    try {
      const data = account.data.slice(8)
      const bet = parseUserBet(data)
      if (bet) {
        bets.push(bet)
      }
    } catch {
      // Skip invalid accounts
    }
  }

  return bets
}

// Parsing helpers
function parsePlatformConfig(data: Buffer): PlatformConfig {
  let offset = 0

  const authority = new PublicKey(data.slice(offset, offset + 32))
  offset += 32

  const oracle = new PublicKey(data.slice(offset, offset + 32))
  offset += 32

  const doomMint = new PublicKey(data.slice(offset, offset + 32))
  offset += 32

  const lifeMint = new PublicKey(data.slice(offset, offset + 32))
  offset += 32

  const feeBasisPoints = data.readUInt16LE(offset)
  offset += 2

  const paused = data[offset] === 1
  offset += 1

  const totalDoomFees = new BN(data.slice(offset, offset + 8), 'le')
  offset += 8

  const totalLifeFees = new BN(data.slice(offset, offset + 8), 'le')
  offset += 8

  const totalEvents = new BN(data.slice(offset, offset + 8), 'le')
  offset += 8

  const totalBets = new BN(data.slice(offset, offset + 8), 'le')
  offset += 8

  const bump = data[offset]

  return {
    authority,
    oracle,
    doomMint,
    lifeMint,
    feeBasisPoints,
    paused,
    totalDoomFees,
    totalLifeFees,
    totalEvents,
    totalBets,
    bump,
  }
}

function parseEvent(data: Buffer): PredictionEvent {
  let offset = 0

  const eventId = new BN(data.slice(offset, offset + 8), 'le')
  offset += 8

  const creator = new PublicKey(data.slice(offset, offset + 32))
  offset += 32

  // Anchor strings: 4-byte length prefix + variable content
  const titleLen = data.readUInt32LE(offset)
  offset += 4
  const title = data.slice(offset, offset + titleLen).toString('utf-8')
  offset += titleLen // Variable length

  const descLen = data.readUInt32LE(offset)
  offset += 4
  const description = data.slice(offset, offset + descLen).toString('utf-8')
  offset += descLen // Variable length

  const deadline = new BN(data.slice(offset, offset + 8), 'le')
  offset += 8

  const resolutionDeadline = new BN(data.slice(offset, offset + 8), 'le')
  offset += 8

  const status = data[offset] as EventStatus
  offset += 1

  // Option<Outcome>: 1 byte discriminator + optional 1 byte value
  const hasOutcome = data[offset] === 1
  offset += 1
  const outcome = hasOutcome ? (data[offset] as Outcome) : null
  if (hasOutcome) offset += 1

  const doomPool = new BN(data.slice(offset, offset + 8), 'le')
  offset += 8

  const lifePool = new BN(data.slice(offset, offset + 8), 'le')
  offset += 8

  // total_bettors is u32 (4 bytes), not u64
  const totalBettors = new BN(data.readUInt32LE(offset))
  offset += 4

  const createdAt = new BN(data.slice(offset, offset + 8), 'le')
  offset += 8

  // Option<i64>: 1 byte discriminator + optional 8 bytes
  const hasResolvedAt = data[offset] === 1
  offset += 1
  const resolvedAt = hasResolvedAt ? new BN(data.slice(offset, offset + 8), 'le') : null
  if (hasResolvedAt) offset += 8

  const doomVault = new PublicKey(data.slice(offset, offset + 32))
  offset += 32

  const lifeVault = new PublicKey(data.slice(offset, offset + 32))
  offset += 32

  const bump = data[offset]
  offset += 1

  const doomVaultBump = data[offset]
  offset += 1

  const lifeVaultBump = data[offset]

  return {
    eventId,
    creator,
    title,
    description,
    deadline,
    resolutionDeadline,
    status,
    outcome,
    doomPool,
    lifePool,
    totalBettors,
    createdAt,
    resolvedAt,
    doomVault,
    lifeVault,
    bump,
    doomVaultBump,
    lifeVaultBump,
  }
}

function parseUserBet(data: Buffer): UserBet {
  let offset = 0

  const event = new PublicKey(data.slice(offset, offset + 32))
  offset += 32

  const user = new PublicKey(data.slice(offset, offset + 32))
  offset += 32

  const outcome = data[offset] as Outcome
  offset += 1

  const amount = new BN(data.slice(offset, offset + 8), 'le')
  offset += 8

  const placedAt = new BN(data.slice(offset, offset + 8), 'le')
  offset += 8

  const claimed = data[offset] === 1
  offset += 1

  const refunded = data[offset] === 1
  offset += 1

  const bump = data[offset]

  return {
    event,
    user,
    outcome,
    amount,
    placedAt,
    claimed,
    refunded,
    bump,
  }
}

function parseUserStats(data: Buffer): UserStats {
  let offset = 0

  const user = new PublicKey(data.slice(offset, offset + 32))
  offset += 32

  const totalBets = new BN(data.slice(offset, offset + 8), 'le')
  offset += 8

  const wins = new BN(data.slice(offset, offset + 8), 'le')
  offset += 8

  const losses = new BN(data.slice(offset, offset + 8), 'le')
  offset += 8

  const totalWagered = new BN(data.slice(offset, offset + 8), 'le')
  offset += 8

  const totalWon = new BN(data.slice(offset, offset + 8), 'le')
  offset += 8

  const totalLost = new BN(data.slice(offset, offset + 8), 'le')
  offset += 8

  const netProfit = new BN(data.slice(offset, offset + 8), 'le')
  offset += 8

  const eventsCreated = new BN(data.slice(offset, offset + 8), 'le')
  offset += 8

  const hasFirstBet = data[offset] === 1
  offset += 1
  const firstBetAt = hasFirstBet ? new BN(data.slice(offset, offset + 8), 'le') : null
  offset += 8

  const hasLastBet = data[offset] === 1
  offset += 1
  const lastBetAt = hasLastBet ? new BN(data.slice(offset, offset + 8), 'le') : null
  offset += 8

  const currentStreak = new BN(data.slice(offset, offset + 8), 'le')
  offset += 8

  const bestStreak = new BN(data.slice(offset, offset + 8), 'le')
  offset += 8

  const worstStreak = new BN(data.slice(offset, offset + 8), 'le')
  offset += 8

  const bump = data[offset]

  return {
    user,
    totalBets,
    wins,
    losses,
    totalWagered,
    totalWon,
    totalLost,
    netProfit,
    eventsCreated,
    firstBetAt,
    lastBetAt,
    currentStreak,
    bestStreak,
    worstStreak,
    bump,
  }
}

/**
 * Calculate estimated payout for a bet
 */
export function calculateEstimatedPayout(
  betAmount: number,
  betOutcome: Outcome,
  currentDoomPool: number,
  currentLifePool: number,
  feeBasisPoints: number
): { payout: number; fee: number; odds: number } {
  const winningPool = betOutcome === Outcome.Doom ? currentDoomPool + betAmount : currentLifePool + betAmount
  const losingPool = betOutcome === Outcome.Doom ? currentLifePool : currentDoomPool

  if (winningPool === 0) {
    return { payout: betAmount, fee: 0, odds: 100 }
  }

  const share = (betAmount / winningPool) * losingPool
  const fee = (share * feeBasisPoints) / 10000
  const netWinnings = share - fee
  const payout = betAmount + netWinnings

  // Calculate odds as percentage
  const totalPool = winningPool + losingPool
  const odds = totalPool > 0 ? (winningPool / totalPool) * 100 : 50

  return { payout, fee, odds }
}
