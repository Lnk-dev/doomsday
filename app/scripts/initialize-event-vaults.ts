/**
 * Initialize Event Vaults Script
 * Creates DOOM and LIFE token vaults for a prediction event
 * Uses split instructions to avoid stack overflow
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

const PROGRAM_ID = new PublicKey('BMmGykphijTgvB7WMim9UVqi9976iibKf6uYAiGXC7Mc')

// Token mints
const DOOM_MINT = new PublicKey('9Dc8sELJerfzPfk9DMP5vahLFxvr6rzn7PB8E6EK4Ah5')
const LIFE_MINT = new PublicKey('D2DDKv5JXjL1APVBP1ySY3PMUFEjL7R8NRz9r9a4JCvE')

// Try multiple RPC endpoints
const RPC_ENDPOINTS = [
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

// Event ID to initialize vaults for
const EVENT_ID = 1769864005775n // New quick test event

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
  console.log('Initializing Event Vaults...')
  console.log(`Event ID: ${EVENT_ID}`)

  // Load wallet keypair
  const walletPath = path.join(process.env.HOME || '', '.config/solana/id.json')
  const walletKeyData = JSON.parse(fs.readFileSync(walletPath, 'utf8'))
  const payer = Keypair.fromSecretKey(Uint8Array.from(walletKeyData))
  console.log('Payer:', payer.publicKey.toString())

  // Derive PDAs
  const [platformConfig] = findPlatformConfigPDA()
  const [event] = findEventPDA(EVENT_ID)
  const [doomVault] = findVaultPDA(EVENT_ID, 'doom')
  const [lifeVault] = findVaultPDA(EVENT_ID, 'life')

  console.log('Platform Config:', platformConfig.toString())
  console.log('Event PDA:', event.toString())
  console.log('DOOM Vault:', doomVault.toString())
  console.log('LIFE Vault:', lifeVault.toString())

  // Connect to devnet
  const connection = await getWorkingConnection()

  // Check if event exists
  const eventAccount = await connection.getAccountInfo(event)
  if (!eventAccount) {
    console.log('\nEvent not found! Create the event first.')
    return
  }

  // Check if vaults already exist
  const existingDoomVault = await connection.getAccountInfo(doomVault)
  const existingLifeVault = await connection.getAccountInfo(lifeVault)

  // ===== Initialize DOOM Vault =====
  if (!existingDoomVault) {
    console.log('\n--- Initializing DOOM Vault ---')

    const discriminator = createHash('sha256')
      .update('global:initialize_doom_vault')
      .digest()
      .slice(0, 8)

    console.log('Discriminator:', Array.from(discriminator).join(', '))

    // Account order from InitializeDoomVault struct:
    // 1. platform_config
    // 2. event
    // 3. doom_vault
    // 4. doom_mint
    // 5. payer (signer)
    // 6. token_program
    // 7. system_program
    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: platformConfig, isSigner: false, isWritable: false },
        { pubkey: event, isSigner: false, isWritable: false },
        { pubkey: doomVault, isSigner: false, isWritable: true },
        { pubkey: DOOM_MINT, isSigner: false, isWritable: false },
        { pubkey: payer.publicKey, isSigner: true, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_ID,
      data: discriminator,
    })

    const transaction = new Transaction().add(instruction)

    console.log('Sending transaction...')

    try {
      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [payer],
        { commitment: 'confirmed' }
      )

      console.log('DOOM vault initialized!')
      console.log('Signature:', signature)
      console.log('Explorer:', `https://explorer.solana.com/tx/${signature}?cluster=devnet`)
    } catch (error) {
      console.error('Failed to initialize DOOM vault:', error)
      throw error
    }

    // Wait a bit before next transaction
    await new Promise(resolve => setTimeout(resolve, 2000))
  } else {
    console.log('\n--- DOOM vault already exists ---')
  }

  // ===== Initialize LIFE Vault =====
  if (!existingLifeVault) {
    console.log('\n--- Initializing LIFE Vault ---')

    const discriminator = createHash('sha256')
      .update('global:initialize_life_vault')
      .digest()
      .slice(0, 8)

    console.log('Discriminator:', Array.from(discriminator).join(', '))

    // Account order from InitializeLifeVault struct:
    // 1. platform_config
    // 2. event
    // 3. life_vault
    // 4. life_mint
    // 5. payer (signer)
    // 6. token_program
    // 7. system_program
    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: platformConfig, isSigner: false, isWritable: false },
        { pubkey: event, isSigner: false, isWritable: false },
        { pubkey: lifeVault, isSigner: false, isWritable: true },
        { pubkey: LIFE_MINT, isSigner: false, isWritable: false },
        { pubkey: payer.publicKey, isSigner: true, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_ID,
      data: discriminator,
    })

    const transaction = new Transaction().add(instruction)

    console.log('Sending transaction...')

    try {
      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [payer],
        { commitment: 'confirmed' }
      )

      console.log('LIFE vault initialized!')
      console.log('Signature:', signature)
      console.log('Explorer:', `https://explorer.solana.com/tx/${signature}?cluster=devnet`)
    } catch (error) {
      console.error('Failed to initialize LIFE vault:', error)
      throw error
    }
  } else {
    console.log('\n--- LIFE vault already exists ---')
  }

  console.log('\n=== Event Vaults Initialized ===')
  console.log('DOOM Vault:', doomVault.toString())
  console.log('LIFE Vault:', lifeVault.toString())
}

main().catch(console.error)
