/**
 * Check Event Status Script
 * Displays details of a specific event on devnet
 */

import { Connection, PublicKey } from '@solana/web3.js'
import BN from 'bn.js'

const PROGRAM_ID = new PublicKey('BMmGykphijTgvB7WMim9UVqi9976iibKf6uYAiGXC7Mc')
const RPC_URL = 'https://api.devnet.solana.com'

const EVENT_ID = parseInt(process.argv[2] || '100')

function findEventPDA(eventId: number): [PublicKey, number] {
  const buffer = Buffer.alloc(8)
  buffer.writeBigUInt64LE(BigInt(eventId))
  return PublicKey.findProgramAddressSync(
    [Buffer.from('event'), buffer],
    PROGRAM_ID
  )
}

async function main() {
  console.log(`Checking Event #${EVENT_ID}...`)

  const [pda] = findEventPDA(EVENT_ID)
  console.log('Event PDA:', pda.toBase58())

  const connection = new Connection(RPC_URL, 'confirmed')
  const accountInfo = await connection.getAccountInfo(pda)

  if (!accountInfo) {
    console.log('\nEvent not found!')
    return
  }

  console.log('Account size:', accountInfo.data.length, 'bytes')

  // Parse event data (skip 8-byte discriminator)
  const data = accountInfo.data.slice(8)
  let offset = 0

  const eventId = new BN(data.slice(offset, offset + 8), 'le').toNumber()
  offset += 8

  const creator = new PublicKey(data.slice(offset, offset + 32)).toBase58()
  offset += 32

  const titleLen = data.readUInt32LE(offset)
  offset += 4
  const title = data.slice(offset, offset + titleLen).toString('utf-8')
  offset += titleLen

  const descLen = data.readUInt32LE(offset)
  offset += 4
  const description = data.slice(offset, offset + descLen).toString('utf-8')
  offset += descLen

  const deadline = new BN(data.slice(offset, offset + 8), 'le').toNumber()
  offset += 8

  const resolutionDeadline = new BN(data.slice(offset, offset + 8), 'le').toNumber()
  offset += 8

  const statusMap = ['Active', 'Resolved', 'Cancelled']
  const status = statusMap[data[offset]] || 'Unknown'
  offset += 1

  const hasOutcome = data[offset] === 1
  offset += 1
  const outcomeMap = ['DOOM', 'LIFE']
  const outcome = hasOutcome ? outcomeMap[data[offset]] : null
  if (hasOutcome) offset += 1

  const doomPool = new BN(data.slice(offset, offset + 8), 'le').toNumber() / 1e9
  offset += 8

  const lifePool = new BN(data.slice(offset, offset + 8), 'le').toNumber() / 1e9
  offset += 8

  const totalBettors = data.readUInt32LE(offset)
  offset += 4

  const createdAt = new BN(data.slice(offset, offset + 8), 'le').toNumber()
  offset += 8

  const hasResolvedAt = data[offset] === 1
  offset += 1
  const resolvedAt = hasResolvedAt ? new BN(data.slice(offset, offset + 8), 'le').toNumber() : null

  console.log('\n--- Event Details ---')
  console.log(`ID: ${eventId}`)
  console.log(`Title: ${title}`)
  console.log(`Description: ${description}`)
  console.log(`Status: ${status}`)
  console.log(`Outcome: ${outcome || 'Not resolved'}`)
  console.log(`DOOM Pool: ${doomPool} tokens`)
  console.log(`LIFE Pool: ${lifePool} tokens`)
  console.log(`Total Bettors: ${totalBettors}`)
  console.log(`Deadline: ${new Date(deadline * 1000).toISOString()}`)
  console.log(`Resolution Deadline: ${new Date(resolutionDeadline * 1000).toISOString()}`)
  console.log(`Created: ${new Date(createdAt * 1000).toISOString()}`)
  if (resolvedAt) {
    console.log(`Resolved: ${new Date(resolvedAt * 1000).toISOString()}`)
  }
  console.log(`Creator: ${creator}`)
}

main().catch(console.error)
