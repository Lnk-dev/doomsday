/**
 * Fetch User Bets Script
 * Retrieves all bets placed by a user on devnet
 */

import { Connection, PublicKey, Keypair } from '@solana/web3.js'
import * as fs from 'fs'
import * as path from 'path'
import BN from 'bn.js'

const PROGRAM_ID = new PublicKey('BMmGykphijTgvB7WMim9UVqi9976iibKf6uYAiGXC7Mc')
const RPC_URL = 'https://api.devnet.solana.com'

interface UserBet {
  event: string
  user: string
  outcome: 'DOOM' | 'LIFE'
  amount: number
  placedAt: Date
  claimed: boolean
  refunded: boolean
}

function parseUserBet(data: Buffer): UserBet {
  let offset = 0

  const event = new PublicKey(data.slice(offset, offset + 32)).toBase58()
  offset += 32

  const user = new PublicKey(data.slice(offset, offset + 32)).toBase58()
  offset += 32

  const outcome = data[offset] === 0 ? 'DOOM' : 'LIFE'
  offset += 1

  const amount = new BN(data.slice(offset, offset + 8), 'le').toNumber() / 1e9
  offset += 8

  const placedAt = new Date(new BN(data.slice(offset, offset + 8), 'le').toNumber() * 1000)
  offset += 8

  const claimed = data[offset] === 1
  offset += 1

  const refunded = data[offset] === 1

  return { event, user, outcome, amount, placedAt, claimed, refunded }
}

async function main() {
  // Load wallet to get user pubkey
  const walletPath = path.join(process.env.HOME || '', '.config/solana/id.json')
  const walletKeyData = JSON.parse(fs.readFileSync(walletPath, 'utf8'))
  const userPubkey = Keypair.fromSecretKey(Uint8Array.from(walletKeyData)).publicKey

  console.log('Fetching User Bets from Devnet...')
  console.log('User:', userPubkey.toBase58())
  console.log()

  const connection = new Connection(RPC_URL, 'confirmed')

  // Fetch all UserBet accounts for this user
  // UserBet accounts are 92 bytes (8 discriminator + 84 data)
  const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
    filters: [
      { dataSize: 92 }, // UserBet account size
      { memcmp: { offset: 8 + 32, bytes: userPubkey.toBase58() } }, // user field after event
    ],
  })

  console.log(`Found ${accounts.length} bet(s):\n`)

  for (const { pubkey, account } of accounts) {
    console.log(`Bet Account: ${pubkey.toBase58()}`)
    const data = account.data.slice(8) // Skip discriminator
    const bet = parseUserBet(data)

    console.log(`  Event: ${bet.event}`)
    console.log(`  Outcome: ${bet.outcome}`)
    console.log(`  Amount: ${bet.amount} tokens`)
    console.log(`  Placed: ${bet.placedAt.toISOString()}`)
    console.log(`  Claimed: ${bet.claimed}`)
    console.log(`  Refunded: ${bet.refunded}`)
    console.log()
  }
}

main().catch(console.error)
