/**
 * Resolve Event Script
 * Resolves a prediction event with the final outcome (oracle action)
 */

import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from '@solana/web3.js'
import * as fs from 'fs'
import * as path from 'path'
import { createHash } from 'crypto'

const PROGRAM_ID = new PublicKey('BMmGykphijTgvB7WMim9UVqi9976iibKf6uYAiGXC7Mc')

// Try multiple RPC endpoints
const RPC_ENDPOINTS = [
  'https://rpc.ankr.com/solana_devnet',
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

// Event parameters
const EVENT_ID = 1769864005775n // Current test event
const OUTCOME = 0 // 0 = Doom wins, 1 = Life wins

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

async function main() {
  console.log('Resolving Prediction Event...')
  console.log(`Event ID: ${EVENT_ID}`)
  console.log(`Outcome: ${OUTCOME === 0 ? 'DOOM' : 'LIFE'}`)

  // Load wallet keypair (must be the oracle)
  const walletPath = path.join(process.env.HOME || '', '.config/solana/id.json')
  const walletKeyData = JSON.parse(fs.readFileSync(walletPath, 'utf8'))
  const oracle = Keypair.fromSecretKey(Uint8Array.from(walletKeyData))
  console.log('Oracle:', oracle.publicKey.toString())

  // Derive PDAs
  const [platformConfig] = findPlatformConfigPDA()
  const [event] = findEventPDA(EVENT_ID)

  console.log('Platform Config:', platformConfig.toString())
  console.log('Event PDA:', event.toString())

  // Connect to devnet
  const connection = await getWorkingConnection()

  // Check event exists
  const eventAccount = await connection.getAccountInfo(event)
  if (!eventAccount) {
    console.log('\nEvent not found!')
    return
  }

  // Build instruction data
  const discriminator = createHash('sha256')
    .update('global:resolve_event')
    .digest()
    .slice(0, 8)

  console.log('Discriminator:', Array.from(discriminator).join(', '))

  // outcome: Outcome enum (u8)
  const outcomeBuffer = Buffer.from([OUTCOME])
  const data = Buffer.concat([discriminator, outcomeBuffer])

  // Build instruction
  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: platformConfig, isSigner: false, isWritable: false },
      { pubkey: event, isSigner: false, isWritable: true },
      { pubkey: oracle.publicKey, isSigner: true, isWritable: false },
    ],
    programId: PROGRAM_ID,
    data,
  })

  const transaction = new Transaction().add(instruction)

  console.log('\nSending transaction...')

  try {
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [oracle],
      { commitment: 'confirmed' }
    )

    console.log('Event resolved successfully!')
    console.log('Outcome:', OUTCOME === 0 ? 'DOOM' : 'LIFE')
    console.log('Signature:', signature)
    console.log('Explorer:', `https://explorer.solana.com/tx/${signature}?cluster=devnet`)
  } catch (error: unknown) {
    const err = error as { transactionLogs?: string[]; message?: string }
    if (err.transactionLogs) {
      console.log('\nTransaction logs:', err.transactionLogs)
    }
    console.error('Failed to resolve event:', err.message || error)
    throw error
  }
}

main().catch(console.error)
