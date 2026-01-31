/**
 * Claim Winnings Script
 * Claims winnings from a resolved prediction event
 */

import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from '@solana/spl-token'
import * as fs from 'fs'
import * as path from 'path'
import { createHash } from 'crypto'

const PROGRAM_ID = new PublicKey('BMmGykphijTgvB7WMim9UVqi9976iibKf6uYAiGXC7Mc')

// Token mints
const DOOM_MINT = new PublicKey('9Dc8sELJerfzPfk9DMP5vahLFxvr6rzn7PB8E6EK4Ah5')
const LIFE_MINT = new PublicKey('D2DDKv5JXjL1APVBP1ySY3PMUFEjL7R8NRz9r9a4JCvE')

// Try multiple RPC endpoints
const RPC_ENDPOINTS = [
  'https://devnet.helius-rpc.com/?api-key=15cd3b92-ef77-4e07-a32c-9ddc91ced216',
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
  console.log('Claiming Winnings...')
  console.log(`Event ID: ${EVENT_ID}`)

  // Load wallet keypair
  const walletPath = path.join(process.env.HOME || '', '.config/solana/id.json')
  const walletKeyData = JSON.parse(fs.readFileSync(walletPath, 'utf8'))
  const user = Keypair.fromSecretKey(Uint8Array.from(walletKeyData))
  console.log('User:', user.publicKey.toString())

  // Derive PDAs
  const [platformConfig] = findPlatformConfigPDA()
  const [event] = findEventPDA(EVENT_ID)
  const [userBet] = findUserBetPDA(event, user.publicKey)
  
  console.log('Platform Config:', platformConfig.toString())
  console.log('Event PDA:', event.toString())
  console.log('User Bet PDA:', userBet.toString())

  // Connect to devnet
  const connection = await getWorkingConnection()

  // Check user bet exists and get outcome
  const userBetAccount = await connection.getAccountInfo(userBet)
  if (!userBetAccount) {
    console.log('\nUser bet not found! You have no bet on this event.')
    return
  }

  // Parse user bet to determine outcome
  // Layout: discriminator(8) + event(32) + user(32) + outcome(1) + amount(8) + placed_at(8) + claimed(1) + refunded(1) + bump(1)
  const betData = userBetAccount.data
  const betOutcome = betData[8 + 32 + 32] // 0 = Doom, 1 = Life
  const betAmount = Number(Buffer.from(betData.slice(73, 81)).readBigUInt64LE()) / 1e9
  const claimed = betData[89] === 1

  console.log(`\nYour bet: ${betAmount} tokens on ${betOutcome === 0 ? 'DOOM' : 'LIFE'}`)

  if (claimed) {
    console.log('Winnings already claimed!')
    return
  }

  // Determine token and vault based on bet outcome
  const tokenMint = betOutcome === 0 ? DOOM_MINT : LIFE_MINT
  const [eventVault] = findVaultPDA(EVENT_ID, betOutcome === 0 ? 'doom' : 'life')
  const userTokenAccount = getAssociatedTokenAddressSync(tokenMint, user.publicKey)

  console.log('Token Mint:', tokenMint.toString())
  console.log('Event Vault:', eventVault.toString())
  console.log('User Token Account:', userTokenAccount.toString())

  // Build instruction data
  const discriminator = createHash('sha256')
    .update('global:claim_winnings')
    .digest()
    .slice(0, 8)

  console.log('\nDiscriminator:', Array.from(discriminator).join(', '))

  // Build instruction
  // Account order from ClaimWinnings struct:
  // 1. platform_config
  // 2. event
  // 3. user_bet
  // 4. event_vault
  // 5. user_token_account
  // 6. user (signer)
  // 7. token_program
  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: platformConfig, isSigner: false, isWritable: false },
      { pubkey: event, isSigner: false, isWritable: false },
      { pubkey: userBet, isSigner: false, isWritable: true },
      { pubkey: eventVault, isSigner: false, isWritable: true },
      { pubkey: userTokenAccount, isSigner: false, isWritable: true },
      { pubkey: user.publicKey, isSigner: true, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    programId: PROGRAM_ID,
    data: discriminator,
  })

  const transaction = new Transaction().add(instruction)

  console.log('\nSending transaction...')

  try {
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [user],
      { commitment: 'confirmed' }
    )

    console.log('Winnings claimed successfully!')
    console.log('Signature:', signature)
    console.log('Explorer:', `https://explorer.solana.com/tx/${signature}?cluster=devnet`)
  } catch (error: unknown) {
    const err = error as { transactionLogs?: string[]; message?: string }
    if (err.transactionLogs) {
      console.log('\nTransaction logs:', err.transactionLogs)
    }
    console.error('Failed to claim winnings:', err.message || error)
    throw error
  }
}

main().catch(console.error)
