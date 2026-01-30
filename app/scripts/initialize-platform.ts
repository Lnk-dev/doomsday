/**
 * Initialize Platform Script
 * Initializes the prediction market platform on devnet
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

const PROGRAM_ID = new PublicKey('BMmGykphijTgvB7WMim9UVqi9976iibKf6uYAiGXC7Mc')
const RPC_URL = 'https://api.devnet.solana.com'

// Fee in basis points (200 = 2%)
const FEE_BASIS_POINTS = 200

async function main() {
  console.log('Initializing Prediction Market Platform...')
  console.log('Program ID:', PROGRAM_ID.toString())
  console.log('Fee:', FEE_BASIS_POINTS / 100, '%')

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

  // Check if already initialized
  const existingAccount = await connection.getAccountInfo(platformConfig)
  if (existingAccount) {
    console.log('Platform already initialized!')
    console.log('Account size:', existingAccount.data.length, 'bytes')
    return
  }

  // Build instruction data
  // Discriminator for initialize_platform (first 8 bytes of sha256("global:initialize_platform"))
  const discriminator = Buffer.from([
    119, 201, 101, 45, 75, 122, 89, 3
  ])

  // fee_basis_points as u16 (little-endian)
  const feeBuffer = Buffer.alloc(2)
  feeBuffer.writeUInt16LE(FEE_BASIS_POINTS)

  const data = Buffer.concat([discriminator, feeBuffer])

  // Build instruction
  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: platformConfig, isSigner: false, isWritable: true },
      { pubkey: authority.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: PROGRAM_ID,
    data,
  })

  // Build and send transaction
  const transaction = new Transaction().add(instruction)

  console.log('Sending transaction...')

  try {
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [authority],
      { commitment: 'confirmed' }
    )

    console.log('Platform initialized successfully!')
    console.log('Signature:', signature)
    console.log('Explorer:', `https://explorer.solana.com/tx/${signature}?cluster=devnet`)
  } catch (error) {
    console.error('Failed to initialize platform:', error)
    throw error
  }
}

main().catch(console.error)
