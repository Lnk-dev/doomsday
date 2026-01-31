/**
 * Place Bet Script
 * Tests placing a bet on a prediction event on devnet
 */

import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  sendAndConfirmTransaction,
} from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from '@solana/spl-token'
import * as fs from 'fs'
import * as path from 'path'
import BN from 'bn.js'
import { createHash } from 'crypto'

const PROGRAM_ID = new PublicKey('BMmGykphijTgvB7WMim9UVqi9976iibKf6uYAiGXC7Mc')

// Token mints
const DOOM_MINT = new PublicKey('9Dc8sELJerfzPfk9DMP5vahLFxvr6rzn7PB8E6EK4Ah5')
const LIFE_MINT = new PublicKey('D2DDKv5JXjL1APVBP1ySY3PMUFEjL7R8NRz9r9a4JCvE')

// Try multiple RPC endpoints
const RPC_ENDPOINTS = [
  'https://api.devnet.solana.com',
  'https://devnet.genesysgo.net',
]

async function getWorkingConnection(): Promise<Connection> {
  for (const rpc of RPC_ENDPOINTS) {
    try {
      const conn = new Connection(rpc, 'confirmed')
      await conn.getSlot()
      console.log('Using RPC:', rpc)
      return conn
    } catch {
      console.log('RPC failed:', rpc)
    }
  }
  throw new Error('All RPC endpoints failed')
}

// Bet parameters
const EVENT_ID = 1769864005775n // New quick test event
const OUTCOME = 0 // 0 = Doom, 1 = Life
const AMOUNT = 100_000_000n // 0.1 token (with 9 decimals)

function findPlatformConfigPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('platform_config')],
    PROGRAM_ID
  )
}

function findEventPDA(eventId: bigint): [PublicKey, number] {
  const buffer = Buffer.alloc(8)
  buffer.writeBigUInt64LE(eventId)
  return PublicKey.findProgramAddressSync(
    [Buffer.from('event'), buffer],
    PROGRAM_ID
  )
}

function findUserBetPDA(event: PublicKey, user: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('user_bet'), event.toBuffer(), user.toBuffer()],
    PROGRAM_ID
  )
}

function findVaultPDA(eventId: bigint, vaultType: 'doom' | 'life'): [PublicKey, number] {
  const buffer = Buffer.alloc(8)
  buffer.writeBigUInt64LE(eventId)
  const seed = vaultType === 'doom' ? 'vault_doom' : 'vault_life'
  return PublicKey.findProgramAddressSync(
    [Buffer.from(seed), buffer],
    PROGRAM_ID
  )
}

async function main() {
  console.log('Placing Bet on Prediction Event...')
  console.log(`Event ID: ${EVENT_ID}`)
  console.log(`Outcome: ${OUTCOME === 0 ? 'DOOM' : 'LIFE'}`)
  console.log(`Amount: ${Number(AMOUNT) / 1e9} tokens`)

  // Load wallet keypair
  const walletPath = path.join(process.env.HOME || '', '.config/solana/id.json')
  const walletKeyData = JSON.parse(fs.readFileSync(walletPath, 'utf8'))
  const user = Keypair.fromSecretKey(Uint8Array.from(walletKeyData))
  console.log('\nUser:', user.publicKey.toString())

  // Derive PDAs
  const [platformConfig] = findPlatformConfigPDA()
  const [event] = findEventPDA(EVENT_ID)
  const [userBet] = findUserBetPDA(event, user.publicKey)

  // Determine which token and vault to use based on outcome
  const tokenMint = OUTCOME === 0 ? DOOM_MINT : LIFE_MINT
  const [eventVault] = findVaultPDA(EVENT_ID, OUTCOME === 0 ? 'doom' : 'life')

  // Get user's token account (ATA)
  const userTokenAccount = getAssociatedTokenAddressSync(tokenMint, user.publicKey)

  console.log('Platform Config:', platformConfig.toString())
  console.log('Event PDA:', event.toString())
  console.log('User Bet PDA:', userBet.toString())
  console.log('Token Mint:', tokenMint.toString())
  console.log('User Token Account:', userTokenAccount.toString())
  console.log('Event Vault:', eventVault.toString())

  // Connect to devnet
  const connection = await getWorkingConnection()

  // Check if bet already exists
  const existingBet = await connection.getAccountInfo(userBet)
  if (existingBet) {
    console.log('\nBet already exists for this event!')
    // Parse and display the bet
    const data = existingBet.data.slice(8)
    const betOutcome = data[64] === 0 ? 'DOOM' : 'LIFE'
    const amount = new BN(data.slice(65, 73), 'le').toNumber() / 1e9
    console.log(`  Outcome: ${betOutcome}`)
    console.log(`  Amount: ${amount} tokens`)
    return
  }

  // Check event exists
  const eventAccount = await connection.getAccountInfo(event)
  if (!eventAccount) {
    console.log('\nEvent not found!')
    return
  }

  // Check user has token balance
  const tokenAccountInfo = await connection.getAccountInfo(userTokenAccount)
  if (!tokenAccountInfo) {
    console.log('\nUser token account not found! Please get tokens first.')
    return
  }

  // Build instruction data
  // place_bet discriminator (sha256("global:place_bet")[0..8])
  const discriminator = createHash('sha256')
    .update('global:place_bet')
    .digest()
    .slice(0, 8)

  console.log('\nDiscriminator:', Array.from(discriminator).join(', '))

  // outcome: u8, amount: u64
  const outcomeBuffer = Buffer.from([OUTCOME])
  const amountBuffer = Buffer.alloc(8)
  amountBuffer.writeBigUInt64LE(AMOUNT)

  const data = Buffer.concat([discriminator, outcomeBuffer, amountBuffer])

  // Build instruction with all required accounts
  // Account order from PlaceBet struct:
  // 1. platform_config
  // 2. event
  // 3. user_bet
  // 4. user_token_account
  // 5. event_vault
  // 6. user (signer)
  // 7. token_program
  // 8. system_program
  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: platformConfig, isSigner: false, isWritable: true },
      { pubkey: event, isSigner: false, isWritable: true },
      { pubkey: userBet, isSigner: false, isWritable: true },
      { pubkey: userTokenAccount, isSigner: false, isWritable: true },
      { pubkey: eventVault, isSigner: false, isWritable: true },
      { pubkey: user.publicKey, isSigner: true, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: PROGRAM_ID,
    data,
  })

  // Build and send transaction
  const transaction = new Transaction().add(instruction)

  console.log('\nSending transaction...')

  try {
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [user],
      { commitment: 'confirmed' }
    )

    console.log('Bet placed successfully!')
    console.log('Signature:', signature)
    console.log('Explorer:', `https://explorer.solana.com/tx/${signature}?cluster=devnet`)

    // Fetch updated event to show new pool amounts
    const updatedEvent = await connection.getAccountInfo(event)
    if (updatedEvent) {
      console.log('\nNote: Check fetch-events.ts for updated pool values')
    }
  } catch (error) {
    console.error('Failed to place bet:', error)
    throw error
  }
}

main().catch(console.error)
