/**
 * Create Quick Test Event Script
 * Creates a test event with a very short deadline for testing resolution
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

// Event parameters - short deadline for testing
const EVENT_ID = BigInt(Date.now()) // Use timestamp as unique ID
const TITLE = 'Quick Test Event'
const DESCRIPTION = 'Short deadline event for testing resolution flow.'

async function main() {
  console.log('Creating Quick Test Event...')

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
  const connection = await getWorkingConnection()

  // Check if event already exists
  const existingEvent = await connection.getAccountInfo(eventPda)
  if (existingEvent) {
    console.log('Event already exists!')
    return
  }

  // Calculate deadlines - longer for testing (30 minutes for betting, 60 minutes for resolution)
  const now = Math.floor(Date.now() / 1000)
  const deadline = now + 1800 // 30 minutes from now
  const resolutionDeadline = now + 3600 // 60 minutes from now

  console.log('Deadline:', new Date(deadline * 1000).toISOString(), '(2 minutes)')
  console.log('Resolution Deadline:', new Date(resolutionDeadline * 1000).toISOString(), '(5 minutes)')

  // Build instruction data
  const discriminator = createHash('sha256')
    .update('global:create_event')
    .digest()
    .slice(0, 8)

  const titleBuffer = Buffer.from(TITLE, 'utf8')
  const descBuffer = Buffer.from(DESCRIPTION, 'utf8')

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

  console.log('\nSending transaction...')

  try {
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [creator],
      { commitment: 'confirmed' }
    )

    console.log('Quick event created successfully!')
    console.log('Signature:', signature)
    console.log('Explorer:', `https://explorer.solana.com/tx/${signature}?cluster=devnet`)
    console.log('\n⏰ Wait 2 minutes, then you can resolve this event!')
  } catch (error) {
    console.error('Failed to create event:', error)
    throw error
  }
}

main().catch(console.error)
