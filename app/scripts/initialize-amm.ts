/**
 * Initialize AMM Pool Script
 * Sets up the DOOM/LIFE liquidity pool on devnet
 *
 * Five-step initialization to avoid stack overflow:
 * Step 1: initialize_pool - Creates pool account
 * Step 2: initialize_lp_mint - Creates LP mint
 * Step 3: initialize_doom_vault - Creates DOOM token vault
 * Step 4: initialize_life_vault - Creates LIFE token vault
 * Step 5: finalize_pool - Marks pool as initialized
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
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import * as fs from 'fs'
import * as path from 'path'
import { createHash } from 'crypto'

const AMM_PROGRAM_ID = new PublicKey('HfkzCbxzH18DZaBE1gCBL6BVWfjWfz7nuBR2DP1X1RqJ')

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

function getDiscriminator(name: string): Buffer {
  return createHash('sha256')
    .update(`global:${name}`)
    .digest()
    .slice(0, 8)
}

async function main() {
  console.log('Initializing AMM Liquidity Pool (Five-Step Process)...')
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
  const connection = await getWorkingConnection()

  // Check current balance
  const balance = await connection.getBalance(authority.publicKey)
  console.log('\nWallet balance:', balance / 1e9, 'SOL')

  // Check if pool already exists
  const existingPool = await connection.getAccountInfo(pool)

  let poolCreated = false
  let lpMintCreated = false
  let doomVaultCreated = false
  let lifeVaultCreated = false
  let poolFinalized = false

  if (existingPool) {
    console.log('\nPool account already exists!')

    // Check if it's initialized by reading the data
    // Layout: 8 (discriminator) + 32 + 32 + 8 + 8 + 32 + 8 + 8 + 8 + 32 + 1 + 1 = 178 bytes
    const data = existingPool.data
    poolCreated = true
    poolFinalized = data[177] === 1

    if (poolFinalized) {
      console.log('Pool is fully initialized!')
      return
    }

    // Check if lp_mint is set (offset: 8 + 32 + 32 + 8 + 8 = 88, 32 bytes)
    const lpMintBytes = data.slice(88, 120)
    const lpMintFromData = new PublicKey(lpMintBytes)
    lpMintCreated = !lpMintFromData.equals(PublicKey.default)
  }

  // Check if LP mint account exists
  const existingLpMint = await connection.getAccountInfo(lpMint)
  lpMintCreated = lpMintCreated || existingLpMint !== null

  // Check if DOOM vault exists
  const existingDoomVault = await connection.getAccountInfo(poolDoom)
  doomVaultCreated = existingDoomVault !== null

  // Check if LIFE vault exists
  const existingLifeVault = await connection.getAccountInfo(poolLife)
  lifeVaultCreated = existingLifeVault !== null

  console.log('\nCurrent state:')
  console.log('  Pool created:', poolCreated)
  console.log('  LP Mint created:', lpMintCreated)
  console.log('  DOOM vault created:', doomVaultCreated)
  console.log('  LIFE vault created:', lifeVaultCreated)
  console.log('  Pool finalized:', poolFinalized)

  // ===== STEP 1: Initialize Pool Account =====
  if (!poolCreated) {
    console.log('\n--- Step 1: Initialize Pool Account ---')

    const discriminator = getDiscriminator('initialize_pool')
    console.log('Discriminator:', Array.from(discriminator).join(', '))

    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: pool, isSigner: false, isWritable: true },
        { pubkey: DOOM_MINT, isSigner: false, isWritable: false },
        { pubkey: LIFE_MINT, isSigner: false, isWritable: false },
        { pubkey: authority.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: AMM_PROGRAM_ID,
      data: discriminator,
    })

    const tx = new Transaction().add(instruction)

    console.log('Sending step 1 transaction...')

    try {
      const signature = await sendAndConfirmTransaction(
        connection,
        tx,
        [authority],
        { commitment: 'confirmed' }
      )

      console.log('Step 1 complete!')
      console.log('Signature:', signature)
      console.log('Explorer:', `https://explorer.solana.com/tx/${signature}?cluster=devnet`)
      poolCreated = true
    } catch (error) {
      console.error('Step 1 failed:', error)
      throw error
    }

    // Wait for confirmation
    await new Promise(resolve => setTimeout(resolve, 2000))
  } else {
    console.log('\n--- Step 1: Skipped (pool already exists) ---')
  }

  // ===== STEP 2: Initialize LP Mint =====
  if (!lpMintCreated) {
    console.log('\n--- Step 2: Initialize LP Mint ---')

    const discriminator = getDiscriminator('initialize_lp_mint')
    console.log('Discriminator:', Array.from(discriminator).join(', '))

    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: pool, isSigner: false, isWritable: true },
        { pubkey: lpMint, isSigner: false, isWritable: true },
        { pubkey: authority.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      ],
      programId: AMM_PROGRAM_ID,
      data: discriminator,
    })

    const tx = new Transaction().add(instruction)

    console.log('Sending step 2 transaction...')

    try {
      const signature = await sendAndConfirmTransaction(
        connection,
        tx,
        [authority],
        { commitment: 'confirmed' }
      )

      console.log('Step 2 complete!')
      console.log('Signature:', signature)
      console.log('Explorer:', `https://explorer.solana.com/tx/${signature}?cluster=devnet`)
      lpMintCreated = true
    } catch (error) {
      console.error('Step 2 failed:', error)
      throw error
    }

    await new Promise(resolve => setTimeout(resolve, 2000))
  } else {
    console.log('\n--- Step 2: Skipped (LP mint already exists) ---')
  }

  // ===== STEP 3: Initialize DOOM Vault =====
  if (!doomVaultCreated) {
    console.log('\n--- Step 3: Initialize DOOM Vault ---')

    const discriminator = getDiscriminator('initialize_doom_vault')
    console.log('Discriminator:', Array.from(discriminator).join(', '))

    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: pool, isSigner: false, isWritable: false },
        { pubkey: DOOM_MINT, isSigner: false, isWritable: false },
        { pubkey: poolDoom, isSigner: false, isWritable: true },
        { pubkey: authority.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      ],
      programId: AMM_PROGRAM_ID,
      data: discriminator,
    })

    const tx = new Transaction().add(instruction)

    console.log('Sending step 3 transaction...')

    try {
      const signature = await sendAndConfirmTransaction(
        connection,
        tx,
        [authority],
        { commitment: 'confirmed' }
      )

      console.log('Step 3 complete!')
      console.log('Signature:', signature)
      console.log('Explorer:', `https://explorer.solana.com/tx/${signature}?cluster=devnet`)
      doomVaultCreated = true
    } catch (error) {
      console.error('Step 3 failed:', error)
      throw error
    }

    await new Promise(resolve => setTimeout(resolve, 2000))
  } else {
    console.log('\n--- Step 3: Skipped (DOOM vault already exists) ---')
  }

  // ===== STEP 4: Initialize LIFE Vault =====
  if (!lifeVaultCreated) {
    console.log('\n--- Step 4: Initialize LIFE Vault ---')

    const discriminator = getDiscriminator('initialize_life_vault')
    console.log('Discriminator:', Array.from(discriminator).join(', '))

    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: pool, isSigner: false, isWritable: false },
        { pubkey: LIFE_MINT, isSigner: false, isWritable: false },
        { pubkey: poolLife, isSigner: false, isWritable: true },
        { pubkey: authority.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      ],
      programId: AMM_PROGRAM_ID,
      data: discriminator,
    })

    const tx = new Transaction().add(instruction)

    console.log('Sending step 4 transaction...')

    try {
      const signature = await sendAndConfirmTransaction(
        connection,
        tx,
        [authority],
        { commitment: 'confirmed' }
      )

      console.log('Step 4 complete!')
      console.log('Signature:', signature)
      console.log('Explorer:', `https://explorer.solana.com/tx/${signature}?cluster=devnet`)
      lifeVaultCreated = true
    } catch (error) {
      console.error('Step 4 failed:', error)
      throw error
    }

    await new Promise(resolve => setTimeout(resolve, 2000))
  } else {
    console.log('\n--- Step 4: Skipped (LIFE vault already exists) ---')
  }

  // ===== STEP 5: Finalize Pool =====
  if (!poolFinalized) {
    console.log('\n--- Step 5: Finalize Pool ---')

    const discriminator = getDiscriminator('finalize_pool')
    console.log('Discriminator:', Array.from(discriminator).join(', '))

    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: pool, isSigner: false, isWritable: true },
        { pubkey: authority.publicKey, isSigner: true, isWritable: true },
      ],
      programId: AMM_PROGRAM_ID,
      data: discriminator,
    })

    const tx = new Transaction().add(instruction)

    console.log('Sending step 5 transaction...')

    try {
      const signature = await sendAndConfirmTransaction(
        connection,
        tx,
        [authority],
        { commitment: 'confirmed' }
      )

      console.log('Step 5 complete!')
      console.log('Signature:', signature)
      console.log('Explorer:', `https://explorer.solana.com/tx/${signature}?cluster=devnet`)
    } catch (error) {
      console.error('Step 5 failed:', error)
      throw error
    }
  } else {
    console.log('\n--- Step 5: Skipped (pool already finalized) ---')
  }

  console.log('\n=== AMM Pool Fully Initialized ===')
  console.log('Pool:', pool.toString())
  console.log('LP Mint:', lpMint.toString())
  console.log('DOOM Vault:', poolDoom.toString())
  console.log('LIFE Vault:', poolLife.toString())
}

main().catch(console.error)
