/**
 * Claim Winnings Script
 * Claims winnings from a resolved prediction event on devnet
 *
 * Note: This script demonstrates the claim flow. In the current minimal
 * program, betting is tracked on-chain but tokens aren't transferred
 * (no vault integration yet). Full token transfers will require:
 * - SPL token vaults for DOOM/LIFE
 * - Associated token accounts for users
 * - Token transfer instructions in place_bet and claim_winnings
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

// Claim parameters
const EVENT_ID = 100n // The resolved quick test event

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
  console.log('Claiming Winnings from Prediction Event...')
  console.log(`Event ID: ${EVENT_ID}`)

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

  // Check if user has a bet on this event
  const userBetAccount = await connection.getAccountInfo(userBet)
  if (!userBetAccount) {
    console.log('\nNo bet found for this event!')
    console.log('You need to place a bet before the deadline to claim winnings.')
    return
  }

  // Parse user bet
  const betData = userBetAccount.data.slice(8)
  const betOutcome = betData[64] === 0 ? 'DOOM' : 'LIFE'
  const betAmount = new BN(betData.slice(65, 73), 'le').toNumber() / 1e9
  const claimed = betData[81] === 1
  const refunded = betData[82] === 1

  console.log('\n--- Your Bet ---')
  console.log(`Outcome: ${betOutcome}`)
  console.log(`Amount: ${betAmount} tokens`)
  console.log(`Claimed: ${claimed}`)
  console.log(`Refunded: ${refunded}`)

  if (claimed) {
    console.log('\nWinnings already claimed!')
    return
  }

  if (refunded) {
    console.log('\nBet was refunded (event cancelled)!')
    return
  }

  // Check event status
  const eventAccount = await connection.getAccountInfo(event)
  if (!eventAccount) {
    console.log('\nEvent not found!')
    return
  }

  // Parse event to check if resolved and winning
  const eventData = eventAccount.data.slice(8)
  const titleLen = eventData.readUInt32LE(40)
  const descOffset = 44 + titleLen
  const descLen = eventData.readUInt32LE(descOffset)
  const statusOffset = descOffset + 4 + descLen + 16
  const eventStatus = eventData[statusOffset]
  const hasOutcome = eventData[statusOffset + 1] === 1
  const eventOutcome = hasOutcome ? (eventData[statusOffset + 2] === 0 ? 'DOOM' : 'LIFE') : null

  console.log('\n--- Event Status ---')
  console.log(`Status: ${['Active', 'Resolved', 'Cancelled'][eventStatus]}`)
  console.log(`Outcome: ${eventOutcome || 'Not resolved'}`)

  if (eventStatus !== 1) {
    console.log('\nEvent not yet resolved!')
    return
  }

  const isWinner = eventOutcome === betOutcome
  console.log(`\nYou ${isWinner ? 'WON!' : 'lost.'}`)

  if (!isWinner) {
    console.log('Sorry, your bet did not win.')
    return
  }

  // Note: Current program doesn't have claim_winnings implemented
  // This demonstrates what the flow would look like
  console.log('\n⚠️  Note: The current minimal program version does not include')
  console.log('   the claim_winnings instruction with token transfers.')
  console.log('   This script demonstrates the claim flow structure.')
  console.log('')
  console.log('   To fully implement claims, the program needs:')
  console.log('   - SPL token vault accounts for DOOM/LIFE')
  console.log('   - claim_winnings instruction with token transfers')
  console.log('   - Payout calculation based on pool shares')

  // Commented out actual claim transaction since instruction doesn't exist yet
  /*
  // Build instruction data
  const discriminator = createHash('sha256')
    .update('global:claim_winnings')
    .digest()
    .slice(0, 8)

  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: platformConfig, isSigner: false, isWritable: true },
      { pubkey: event, isSigner: false, isWritable: false },
      { pubkey: userBet, isSigner: false, isWritable: true },
      { pubkey: user.publicKey, isSigner: true, isWritable: true },
    ],
    programId: PROGRAM_ID,
    data: discriminator,
  })

  const transaction = new Transaction().add(instruction)

  const signature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [user],
    { commitment: 'confirmed' }
  )

  console.log('Winnings claimed successfully!')
  console.log('Signature:', signature)
  */
}

main().catch(console.error)
