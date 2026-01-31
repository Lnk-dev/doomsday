/**
 * Migrate Platform Script
 * Migrates the platform config from old format (108 bytes) to new format (172 bytes)
 * with doom_mint and life_mint fields
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

// Token mints (from devnet deployment)
const DOOM_MINT = new PublicKey('9Dc8sELJerfzPfk9DMP5vahLFxvr6rzn7PB8E6EK4Ah5')
const LIFE_MINT = new PublicKey('D2DDKv5JXjL1APVBP1ySY3PMUFEjL7R8NRz9r9a4JCvE')

async function main() {
  console.log('Migrating Platform Config...')
  console.log('Program ID:', PROGRAM_ID.toString())
  console.log('DOOM Mint:', DOOM_MINT.toString())
  console.log('LIFE Mint:', LIFE_MINT.toString())

  // Load wallet keypair
  const walletPath = path.join(process.env.HOME || '', '.config/solana/id.json')
  const walletKeyData = JSON.parse(fs.readFileSync(walletPath, 'utf8'))
  const authority = Keypair.fromSecretKey(Uint8Array.from(walletKeyData))
  console.log('Authority:', authority.publicKey.toString())

  // Derive platform config PDA
  const [platformConfig, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from('platform_config')],
    PROGRAM_ID
  )
  console.log('Platform Config PDA:', platformConfig.toString())
  console.log('Bump:', bump)

  // Connect to devnet
  const connection = new Connection(RPC_URL, 'confirmed')

  // Check current account size
  const accountInfo = await connection.getAccountInfo(platformConfig)
  if (!accountInfo) {
    console.log('Platform config not found! Please initialize first.')
    return
  }

  console.log('Current account size:', accountInfo.data.length, 'bytes')

  // Expected sizes
  const OLD_SIZE = 108  // Without token mints
  const NEW_SIZE = 172  // With token mints

  if (accountInfo.data.length >= NEW_SIZE) {
    console.log('Platform already migrated to new format!')
    return
  }

  if (accountInfo.data.length !== OLD_SIZE) {
    console.log('Unexpected account size:', accountInfo.data.length)
    console.log('Expected:', OLD_SIZE, '(old) or', NEW_SIZE, '(new)')
    return
  }

  console.log('\nMigrating from', OLD_SIZE, 'bytes to', NEW_SIZE, 'bytes...')

  // Build instruction data
  // Discriminator for migrate_platform (first 8 bytes of sha256("global:migrate_platform"))
  const discriminator = createHash('sha256')
    .update('global:migrate_platform')
    .digest()
    .slice(0, 8)

  const data = Buffer.concat([discriminator])

  // Build instruction
  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: platformConfig, isSigner: false, isWritable: true },
      { pubkey: DOOM_MINT, isSigner: false, isWritable: false },
      { pubkey: LIFE_MINT, isSigner: false, isWritable: false },
      { pubkey: authority.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: PROGRAM_ID,
    data,
  })

  // Build and send transaction
  const transaction = new Transaction().add(instruction)

  console.log('Sending migration transaction...')

  try {
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [authority],
      { commitment: 'confirmed' }
    )

    console.log('\nPlatform migrated successfully!')
    console.log('Signature:', signature)
    console.log('Explorer:', `https://explorer.solana.com/tx/${signature}?cluster=devnet`)

    // Verify migration
    const newAccountInfo = await connection.getAccountInfo(platformConfig)
    if (newAccountInfo) {
      console.log('\nNew account size:', newAccountInfo.data.length, 'bytes')
    }
  } catch (error) {
    console.error('Failed to migrate platform:', error)
    throw error
  }
}

main().catch(console.error)
