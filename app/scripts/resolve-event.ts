/**
 * Resolve Event Script
 * Resolves a prediction event on devnet (oracle function)
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
import BN from 'bn.js'
import { createHash } from 'crypto'

const PROGRAM_ID = new PublicKey('BMmGykphijTgvB7WMim9UVqi9976iibKf6uYAiGXC7Mc')
const RPC_URL = 'https://api.devnet.solana.com'

// Resolution parameters
const EVENT_ID = 1n
const OUTCOME = 0 // 0 = Doom (event happened), 1 = Life (event didn't happen)

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
  console.log(`Outcome: ${OUTCOME === 0 ? 'DOOM (event happened)' : 'LIFE (event did not happen)'}`)

  // Load wallet keypair (must be the oracle)
  const walletPath = path.join(process.env.HOME || '', '.config/solana/id.json')
  const walletKeyData = JSON.parse(fs.readFileSync(walletPath, 'utf8'))
  const oracle = Keypair.fromSecretKey(Uint8Array.from(walletKeyData))
  console.log('\nOracle:', oracle.publicKey.toString())

  // Derive PDAs
  const [platformConfig] = findPlatformConfigPDA()
  const [event] = findEventPDA(EVENT_ID)

  console.log('Platform Config:', platformConfig.toString())
  console.log('Event PDA:', event.toString())

  // Connect to devnet
  const connection = new Connection(RPC_URL, 'confirmed')

  // Check event exists and is active
  const eventAccount = await connection.getAccountInfo(event)
  if (!eventAccount) {
    console.log('\nEvent not found!')
    return
  }

  // Parse event status (skip discriminator + eventId + creator + title + desc, then get status)
  const eventData = eventAccount.data.slice(8)
  const titleLen = eventData.readUInt32LE(40) // After eventId(8) + creator(32)
  const descOffset = 44 + titleLen
  const descLen = eventData.readUInt32LE(descOffset)
  const statusOffset = descOffset + 4 + descLen + 16 // desc + deadline(8) + resolution_deadline(8)
  const currentStatus = eventData[statusOffset]

  if (currentStatus !== 0) {
    console.log('\nEvent already resolved or cancelled!')
    console.log(`Current status: ${['Active', 'Resolved', 'Cancelled'][currentStatus]}`)
    return
  }

  // Check if deadline has passed
  const deadlineOffset = descOffset + 4 + descLen
  const deadline = new BN(eventData.slice(deadlineOffset, deadlineOffset + 8), 'le').toNumber()
  const now = Math.floor(Date.now() / 1000)

  if (now < deadline) {
    console.log('\nEvent deadline has not passed yet!')
    console.log(`Deadline: ${new Date(deadline * 1000).toISOString()}`)
    console.log(`Current time: ${new Date(now * 1000).toISOString()}`)
    console.log(`Time remaining: ${Math.round((deadline - now) / 3600)} hours`)
    return
  }

  // Build instruction data
  // resolve_event discriminator (sha256("global:resolve_event")[0..8])
  const discriminator = createHash('sha256')
    .update('global:resolve_event')
    .digest()
    .slice(0, 8)

  console.log('\nDiscriminator:', Array.from(discriminator).join(', '))

  // outcome: u8
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

  // Build and send transaction
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
    console.log('Signature:', signature)
    console.log('Explorer:', `https://explorer.solana.com/tx/${signature}?cluster=devnet`)
  } catch (error) {
    console.error('Failed to resolve event:', error)
    throw error
  }
}

main().catch(console.error)
