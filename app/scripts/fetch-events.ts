/**
 * Fetch Events Script
 * Tests fetching events from devnet to verify on-chain data parsing
 */

import { Connection, PublicKey } from '@solana/web3.js'
import BN from 'bn.js'

const PROGRAM_ID = new PublicKey('BMmGykphijTgvB7WMim9UVqi9976iibKf6uYAiGXC7Mc')
const RPC_URL = 'https://api.devnet.solana.com'

function findEventPDA(eventId: number): [PublicKey, number] {
  const id = new BN(eventId)
  return PublicKey.findProgramAddressSync(
    [Buffer.from('event'), id.toArrayLike(Buffer, 'le', 8)],
    PROGRAM_ID
  )
}

interface ParsedEvent {
  eventId: number
  creator: string
  title: string
  description: string
  deadline: Date
  resolutionDeadline: Date
  doomPool: number
  lifePool: number
  status: string
}

function parseEvent(data: Buffer): ParsedEvent {
  let offset = 0

  const eventId = new BN(data.slice(offset, offset + 8), 'le').toNumber()
  offset += 8

  const creator = new PublicKey(data.slice(offset, offset + 32)).toBase58()
  offset += 32

  // Anchor strings are: 4-byte length prefix + variable content
  const titleLen = data.readUInt32LE(offset)
  offset += 4
  const title = data.slice(offset, offset + titleLen).toString('utf-8')
  offset += titleLen // Variable length, NOT fixed

  const descLen = data.readUInt32LE(offset)
  offset += 4
  const description = data.slice(offset, offset + descLen).toString('utf-8')
  offset += descLen // Variable length, NOT fixed

  const deadline = new BN(data.slice(offset, offset + 8), 'le').toNumber()
  offset += 8

  const resolutionDeadline = new BN(data.slice(offset, offset + 8), 'le').toNumber()
  offset += 8

  const status = ['Active', 'Resolved', 'Cancelled'][data[offset]] || 'Unknown'
  offset += 1

  // outcome: Option<Outcome> - 1 byte discriminator + optional 1 byte value
  const hasOutcome = data[offset] === 1
  offset += 1
  if (hasOutcome) {
    offset += 1 // skip outcome value
  }

  const doomPool = new BN(data.slice(offset, offset + 8), 'le').toNumber() / 1e9
  offset += 8

  const lifePool = new BN(data.slice(offset, offset + 8), 'le').toNumber() / 1e9

  return {
    eventId,
    creator,
    title,
    description,
    deadline: new Date(deadline * 1000),
    resolutionDeadline: new Date(resolutionDeadline * 1000),
    doomPool,
    lifePool,
    status,
  }
}

async function main() {
  console.log('Fetching Events from Devnet...\n')

  const connection = new Connection(RPC_URL, 'confirmed')

  // Fetch events 1, 2, 3
  for (const eventId of [1, 2, 3]) {
    const [pda] = findEventPDA(eventId)
    console.log(`Event #${eventId} PDA: ${pda.toBase58()}`)

    const accountInfo = await connection.getAccountInfo(pda)
    if (accountInfo) {
      console.log(`  Account size: ${accountInfo.data.length} bytes`)

      try {
        const data = accountInfo.data.slice(8) // Skip discriminator
        const event = parseEvent(data)
        console.log(`  Title: ${event.title}`)
        console.log(`  Description: ${event.description.slice(0, 60)}...`)
        console.log(`  Status: ${event.status}`)
        console.log(`  Deadline: ${event.deadline.toISOString()}`)
        console.log(`  Resolution: ${event.resolutionDeadline.toISOString()}`)
        console.log(`  DOOM Pool: ${event.doomPool}`)
        console.log(`  LIFE Pool: ${event.lifePool}`)
        console.log(`  Creator: ${event.creator}`)
      } catch (err) {
        console.log(`  Failed to parse: ${err}`)
      }
    } else {
      console.log('  Not found')
    }
    console.log()
  }

  // Also get all program accounts to see actual sizes
  console.log('\nAll program accounts:')
  const accounts = await connection.getProgramAccounts(PROGRAM_ID)
  console.log(`Total accounts: ${accounts.length}`)
  for (const { pubkey, account } of accounts) {
    console.log(`  ${pubkey.toBase58()}: ${account.data.length} bytes`)
  }
}

main().catch(console.error)
