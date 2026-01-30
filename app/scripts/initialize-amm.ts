/**
 * Initialize AMM Pool Script
 * Sets up the DOOM/LIFE liquidity pool on devnet
 *
 * Two-step initialization to avoid stack overflow:
 * Step 1: initialize_pool - Creates pool account
 * Step 2: initialize_pool_vaults - Creates LP mint and token vaults
 */

import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  sendAndConfirmTransaction,
} from '@solana/web3.js'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import * as fs from 'fs'
import * as path from 'path'
import { createHash } from 'crypto'

const AMM_PROGRAM_ID = new PublicKey('7w8ZdJZYBGtv8bZYo2sua6qjphwLVSqij2ebcBcsdtuF')
const RPC_URL = 'https://api.devnet.solana.com'

// Token mints from config
const DOOM_MINT = new PublicKey('9Dc8sELJerfzPfk9DMP5vahLFxvr6rzn7PB8E6EK4Ah5')
const LIFE_MINT = new PublicKey('D2DDKv5JXjL1APVBP1ySY3PMUFEjL7R8NRz9r9a4JCvE')

function findPoolPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('pool')],
    AMM_PROGRAM_ID
  )
}

function findLpMintPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('lp_mint')],
    AMM_PROGRAM_ID
  )
}

function findPoolDoomPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('pool_doom')],
    AMM_PROGRAM_ID
  )
}

function findPoolLifePDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('pool_life')],
    AMM_PROGRAM_ID
  )
}

async function main() {
  console.log('Initializing AMM Liquidity Pool (Two-Step Process)...')
  console.log('Program ID:', AMM_PROGRAM_ID.toString())
  console.log('DOOM Mint:', DOOM_MINT.toString())
  console.log('LIFE Mint:', LIFE_MINT.toString())

  // Load wallet keypair
  const walletPath = path.join(process.env.HOME || '', '.config/solana/id.json')
  const walletKeyData = JSON.parse(fs.readFileSync(walletPath, 'utf8'))
  const authority = Keypair.fromSecretKey(Uint8Array.from(walletKeyData))
  console.log('Authority:', authority.publicKey.toString())

  // Derive PDAs
  const [pool, poolBump] = findPoolPDA()
  const [lpMint, lpMintBump] = findLpMintPDA()
  const [poolDoom, poolDoomBump] = findPoolDoomPDA()
  const [poolLife, poolLifeBump] = findPoolLifePDA()

  console.log('\nPDAs:')
  console.log('  Pool:', pool.toString(), '(bump:', poolBump, ')')
  console.log('  LP Mint:', lpMint.toString(), '(bump:', lpMintBump, ')')
  console.log('  Pool DOOM:', poolDoom.toString(), '(bump:', poolDoomBump, ')')
  console.log('  Pool LIFE:', poolLife.toString(), '(bump:', poolLifeBump, ')')

  // Connect to devnet
  const connection = new Connection(RPC_URL, 'confirmed')

  // Check current balance
  const balance = await connection.getBalance(authority.publicKey)
  console.log('\nWallet balance:', balance / 1e9, 'SOL')

  // Check if pool already exists
  const existingPool = await connection.getAccountInfo(pool)

  if (existingPool) {
    console.log('\nPool account already exists!')

    // Check if it's initialized by reading the data
    // Skip 8 bytes discriminator, then pubkeys and u64s, check initialized flag
    // Layout: 8 + 32 + 32 + 8 + 8 + 32 + 8 + 8 + 8 + 32 + 1 + 1 = 178 bytes
    const data = existingPool.data
    const initialized = data[177] === 1

    if (initialized) {
      console.log('Pool is fully initialized!')
      return
    }

    console.log('Pool exists but vaults not initialized. Running step 2...')
  } else {
    // ===== STEP 1: Initialize Pool Account =====
    console.log('\n--- Step 1: Initialize Pool Account ---')

    const step1Discriminator = createHash('sha256')
      .update('global:initialize_pool')
      .digest()
      .slice(0, 8)

    console.log('Discriminator:', Array.from(step1Discriminator).join(', '))

    const step1Instruction = new TransactionInstruction({
      keys: [
        { pubkey: pool, isSigner: false, isWritable: true },
        { pubkey: DOOM_MINT, isSigner: false, isWritable: false },
        { pubkey: LIFE_MINT, isSigner: false, isWritable: false },
        { pubkey: authority.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: AMM_PROGRAM_ID,
      data: step1Discriminator,
    })

    const step1Tx = new Transaction().add(step1Instruction)

    console.log('Sending step 1 transaction...')

    try {
      const signature = await sendAndConfirmTransaction(
        connection,
        step1Tx,
        [authority],
        { commitment: 'confirmed' }
      )

      console.log('Step 1 complete!')
      console.log('Signature:', signature)
      console.log('Explorer:', `https://explorer.solana.com/tx/${signature}?cluster=devnet`)
    } catch (error) {
      console.error('Step 1 failed:', error)
      throw error
    }

    // Wait a moment for confirmation
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  // ===== STEP 2: Initialize Pool Vaults =====
  console.log('\n--- Step 2: Initialize Pool Vaults ---')

  const step2Discriminator = createHash('sha256')
    .update('global:initialize_pool_vaults')
    .digest()
    .slice(0, 8)

  console.log('Discriminator:', Array.from(step2Discriminator).join(', '))

  const step2Instruction = new TransactionInstruction({
    keys: [
      { pubkey: pool, isSigner: false, isWritable: true },
      { pubkey: DOOM_MINT, isSigner: false, isWritable: false },
      { pubkey: LIFE_MINT, isSigner: false, isWritable: false },
      { pubkey: lpMint, isSigner: false, isWritable: true },
      { pubkey: poolDoom, isSigner: false, isWritable: true },
      { pubkey: poolLife, isSigner: false, isWritable: true },
      { pubkey: authority.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ],
    programId: AMM_PROGRAM_ID,
    data: step2Discriminator,
  })

  const step2Tx = new Transaction().add(step2Instruction)

  console.log('Sending step 2 transaction...')

  try {
    const signature = await sendAndConfirmTransaction(
      connection,
      step2Tx,
      [authority],
      { commitment: 'confirmed' }
    )

    console.log('Step 2 complete!')
    console.log('Signature:', signature)
    console.log('Explorer:', `https://explorer.solana.com/tx/${signature}?cluster=devnet`)
  } catch (error) {
    console.error('Step 2 failed:', error)
    throw error
  }

  console.log('\n=== AMM Pool Fully Initialized ===')
  console.log('Pool:', pool.toString())
  console.log('LP Mint:', lpMint.toString())
  console.log('DOOM Vault:', poolDoom.toString())
  console.log('LIFE Vault:', poolLife.toString())
}

main().catch(console.error)
