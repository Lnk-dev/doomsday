/**
 * Initialize AMM Pool Script
 * Sets up the DOOM/LIFE liquidity pool on devnet
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

const AMM_PROGRAM_ID = new PublicKey('9k1WNiR3e7yDkothG5LiAhm1ocJbRYy1Er3coNCYwkHK')
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
  console.log('Initializing AMM Liquidity Pool...')
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

  // Skip check to avoid rate limit - will fail if already exists
  // const existingPool = await connection.getAccountInfo(pool)
  // if (existingPool) {
  //   console.log('\nPool already initialized!')
  //   return
  // }

  // Build instruction data
  // initialize_pool discriminator (sha256("global:initialize_pool")[0..8])
  const discriminator = createHash('sha256')
    .update('global:initialize_pool')
    .digest()
    .slice(0, 8)

  console.log('\nDiscriminator:', Array.from(discriminator).join(', '))

  // Build instruction
  const instruction = new TransactionInstruction({
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
    data: discriminator,
  })

  // Build and send transaction
  const transaction = new Transaction().add(instruction)

  console.log('\nSending transaction...')

  try {
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [authority],
      { commitment: 'confirmed' }
    )

    console.log('Pool initialized successfully!')
    console.log('Signature:', signature)
    console.log('Explorer:', `https://explorer.solana.com/tx/${signature}?cluster=devnet`)
  } catch (error) {
    console.error('Failed to initialize pool:', error)
    throw error
  }
}

main().catch(console.error)
