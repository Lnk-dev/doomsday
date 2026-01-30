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
import * as fs from 'fs'
import * as path from 'path'
import BN from 'bn.js'
import { createHash } from 'crypto'

const PROGRAM_ID = new PublicKey('BMmGykphijTgvB7WMim9UVqi9976iibKf6uYAiGXC7Mc')
const RPC_URL = 'https://api.devnet.solana.com'

// Bet parameters
const EVENT_ID = 1n
const OUTCOME = 0 // 0 = Doom, 1 = Life
const AMOUNT = 1_000_000_000n // 1 token (with 9 decimals)

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

  console.log('Platform Config:', platformConfig.toString())
  console.log('Event PDA:', event.toString())
  console.log('User Bet PDA:', userBet.toString())

  // Connect to devnet
  const connection = new Connection(RPC_URL, 'confirmed')

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

  // Build instruction
  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: platformConfig, isSigner: false, isWritable: true },
      { pubkey: event, isSigner: false, isWritable: true },
      { pubkey: userBet, isSigner: false, isWritable: true },
      { pubkey: user.publicKey, isSigner: true, isWritable: true },
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
      // Skip to pools (after variable strings - approximate)
      // This is a simplified read, real parsing would be variable-length aware
      console.log('\nNote: Check fetch-events.ts for updated pool values')
    }
  } catch (error) {
    console.error('Failed to place bet:', error)
    throw error
  }
}

main().catch(console.error)
