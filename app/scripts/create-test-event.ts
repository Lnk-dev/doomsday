/**
 * Create Test Event Script
 * Creates a test prediction event on devnet
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
import { createHash } from 'crypto'

const PROGRAM_ID = new PublicKey('BMmGykphijTgvB7WMim9UVqi9976iibKf6uYAiGXC7Mc')
const RPC_URL = 'https://api.devnet.solana.com'

// Event parameters
const EVENT_ID = 1n
const TITLE = 'Will BTC hit $100k by end of Q1 2026?'
const DESCRIPTION = 'Prediction on whether Bitcoin will reach $100,000 USD before April 1, 2026.'

async function main() {
  console.log('Creating Test Prediction Event...')

  // Load wallet keypair
  const walletPath = path.join(process.env.HOME || '', '.config/solana/id.json')
  const walletKeyData = JSON.parse(fs.readFileSync(walletPath, 'utf8'))
  const creator = Keypair.fromSecretKey(Uint8Array.from(walletKeyData))
  console.log('Creator:', creator.publicKey.toString())

  // Derive PDAs
  const [platformConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from('platform_config')],
    PROGRAM_ID
  )

  const eventIdBuffer = Buffer.alloc(8)
  eventIdBuffer.writeBigUInt64LE(EVENT_ID)
  const [eventPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('event'), eventIdBuffer],
    PROGRAM_ID
  )

  console.log('Platform Config:', platformConfig.toString())
  console.log('Event PDA:', eventPda.toString())
  console.log('Event ID:', EVENT_ID.toString())

  // Connect to devnet
  const connection = new Connection(RPC_URL, 'confirmed')

  // Check if event already exists
  const existingEvent = await connection.getAccountInfo(eventPda)
  if (existingEvent) {
    console.log('Event already exists!')
    return
  }

  // Calculate deadlines (betting deadline: 7 days, resolution: 14 days)
  const now = Math.floor(Date.now() / 1000)
  const deadline = now + 7 * 24 * 60 * 60 // 7 days from now
  const resolutionDeadline = now + 14 * 24 * 60 * 60 // 14 days from now

  console.log('Deadline:', new Date(deadline * 1000).toISOString())
  console.log('Resolution Deadline:', new Date(resolutionDeadline * 1000).toISOString())

  // Build instruction data
  const discriminator = createHash('sha256')
    .update('global:create_event')
    .digest()
    .slice(0, 8)

  const titleBuffer = Buffer.from(TITLE, 'utf8')
  const descBuffer = Buffer.from(DESCRIPTION, 'utf8')

  // Build the instruction data
  // Format: discriminator(8) + event_id(8) + title_len(4) + title + desc_len(4) + desc + deadline(8) + resolution_deadline(8)
  const data = Buffer.concat([
    discriminator,
    eventIdBuffer,
    Buffer.from(new Uint32Array([titleBuffer.length]).buffer),
    titleBuffer,
    Buffer.from(new Uint32Array([descBuffer.length]).buffer),
    descBuffer,
    (() => {
      const buf = Buffer.alloc(8)
      buf.writeBigInt64LE(BigInt(deadline))
      return buf
    })(),
    (() => {
      const buf = Buffer.alloc(8)
      buf.writeBigInt64LE(BigInt(resolutionDeadline))
      return buf
    })(),
  ])

  // Build instruction
  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: platformConfig, isSigner: false, isWritable: true },
      { pubkey: eventPda, isSigner: false, isWritable: true },
      { pubkey: creator.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: PROGRAM_ID,
    data,
  })

  // Build and send transaction
  const transaction = new Transaction().add(instruction)

  console.log('Sending transaction...')

  try {
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [creator],
      { commitment: 'confirmed' }
    )

    console.log('Event created successfully!')
    console.log('Signature:', signature)
    console.log('Explorer:', `https://explorer.solana.com/tx/${signature}?cluster=devnet`)
  } catch (error) {
    console.error('Failed to create event:', error)
    throw error
  }
}

main().catch(console.error)
