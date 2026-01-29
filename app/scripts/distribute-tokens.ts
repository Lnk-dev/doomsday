/**
 * Distribute $DOOM and $LIFE Tokens
 * Issue #34, #35: Token distribution for testing
 *
 * This script distributes tokens to test wallets on devnet.
 * Run with: npx ts-node scripts/distribute-tokens.ts
 *
 * Usage:
 *   npx ts-node scripts/distribute-tokens.ts <recipient> [amount]
 *   npx ts-node scripts/distribute-tokens.ts --batch recipients.json
 */

import {
  Connection,
  Keypair,
  PublicKey,
  clusterApiUrl,
} from '@solana/web3.js'
import {
  getOrCreateAssociatedTokenAccount,
  transfer,
  getMint,
} from '@solana/spl-token'
import * as fs from 'fs'
import * as path from 'path'

// Configuration
const NETWORK = process.env.SOLANA_NETWORK || 'devnet'
const KEYPAIR_PATH = process.env.KEYPAIR_PATH || `${process.env.HOME}/.config/solana/id.json`

// Default airdrop amount (100 tokens of each type)
const DEFAULT_AIRDROP_AMOUNT = 100

interface TokenAddresses {
  doom: { mint: string }
  life: { mint: string }
}

interface BatchRecipient {
  address: string
  doomAmount?: number
  lifeAmount?: number
}

async function loadKeypair(): Promise<Keypair> {
  const keypairPath = path.resolve(KEYPAIR_PATH)
  if (!fs.existsSync(keypairPath)) {
    throw new Error(`Keypair not found at ${keypairPath}`)
  }
  const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf-8'))
  return Keypair.fromSecretKey(new Uint8Array(keypairData))
}

function getConnection(): Connection {
  const endpoint = NETWORK === 'mainnet-beta'
    ? clusterApiUrl('mainnet-beta')
    : NETWORK === 'localnet'
      ? 'http://localhost:8899'
      : clusterApiUrl('devnet')
  return new Connection(endpoint, 'confirmed')
}

function loadTokenAddresses(): TokenAddresses {
  const addressPath = path.join(__dirname, 'token-addresses.json')
  if (!fs.existsSync(addressPath)) {
    throw new Error(
      'Token addresses not found. Run create-tokens.ts first, or set DOOM_MINT and LIFE_MINT env vars.'
    )
  }
  return JSON.parse(fs.readFileSync(addressPath, 'utf-8'))
}

async function distributeTokens(
  connection: Connection,
  payer: Keypair,
  mint: PublicKey,
  recipient: PublicKey,
  amount: number,
  decimals: number
): Promise<string> {
  // Get or create source token account
  const sourceAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    payer.publicKey
  )

  // Get or create destination token account
  const destAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    recipient
  )

  // Transfer tokens
  const rawAmount = BigInt(amount) * BigInt(Math.pow(10, decimals))

  const signature = await transfer(
    connection,
    payer,
    sourceAccount.address,
    destAccount.address,
    payer.publicKey,
    rawAmount
  )

  return signature
}

async function airdropToRecipient(
  connection: Connection,
  payer: Keypair,
  doomMint: PublicKey,
  lifeMint: PublicKey,
  recipient: string,
  doomAmount: number,
  lifeAmount: number
): Promise<void> {
  const recipientPubkey = new PublicKey(recipient)

  console.log(`\nAirdropping to ${recipient}:`)

  // Get decimals
  const doomMintInfo = await getMint(connection, doomMint)
  const lifeMintInfo = await getMint(connection, lifeMint)

  if (doomAmount > 0) {
    const sig = await distributeTokens(
      connection,
      payer,
      doomMint,
      recipientPubkey,
      doomAmount,
      doomMintInfo.decimals
    )
    console.log(`  $DOOM: ${doomAmount} tokens (tx: ${sig.slice(0, 8)}...)`)
  }

  if (lifeAmount > 0) {
    const sig = await distributeTokens(
      connection,
      payer,
      lifeMint,
      recipientPubkey,
      lifeAmount,
      lifeMintInfo.decimals
    )
    console.log(`  $LIFE: ${lifeAmount} tokens (tx: ${sig.slice(0, 8)}...)`)
  }
}

async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.log('Usage:')
    console.log('  npx ts-node scripts/distribute-tokens.ts <recipient_address> [amount]')
    console.log('  npx ts-node scripts/distribute-tokens.ts --batch recipients.json')
    console.log('')
    console.log('Examples:')
    console.log('  npx ts-node scripts/distribute-tokens.ts ABC123... 100')
    console.log('  npx ts-node scripts/distribute-tokens.ts --batch recipients.json')
    process.exit(0)
  }

  console.log('='.repeat(60))
  console.log('Doomsday Token Distribution')
  console.log('='.repeat(60))
  console.log(`Network: ${NETWORK}`)

  // Load keypair
  const payer = await loadKeypair()
  console.log(`Payer: ${payer.publicKey.toBase58()}`)

  // Get connection
  const connection = getConnection()

  // Load token addresses
  let doomMint: PublicKey
  let lifeMint: PublicKey

  if (process.env.DOOM_MINT && process.env.LIFE_MINT) {
    doomMint = new PublicKey(process.env.DOOM_MINT)
    lifeMint = new PublicKey(process.env.LIFE_MINT)
  } else {
    const addresses = loadTokenAddresses()
    doomMint = new PublicKey(addresses.doom.mint)
    lifeMint = new PublicKey(addresses.life.mint)
  }

  console.log(`$DOOM mint: ${doomMint.toBase58()}`)
  console.log(`$LIFE mint: ${lifeMint.toBase58()}`)

  // Check payer balance
  const balance = await connection.getBalance(payer.publicKey)
  console.log(`SOL Balance: ${balance / 1e9} SOL`)

  if (args[0] === '--batch') {
    // Batch mode
    const batchFile = args[1]
    if (!batchFile) {
      console.error('Please provide a batch file path')
      process.exit(1)
    }

    const batchPath = path.resolve(batchFile)
    if (!fs.existsSync(batchPath)) {
      console.error(`Batch file not found: ${batchPath}`)
      process.exit(1)
    }

    const recipients: BatchRecipient[] = JSON.parse(fs.readFileSync(batchPath, 'utf-8'))

    console.log(`\nDistributing to ${recipients.length} recipients...`)

    for (const recipient of recipients) {
      try {
        await airdropToRecipient(
          connection,
          payer,
          doomMint,
          lifeMint,
          recipient.address,
          recipient.doomAmount ?? DEFAULT_AIRDROP_AMOUNT,
          recipient.lifeAmount ?? DEFAULT_AIRDROP_AMOUNT
        )
      } catch (error) {
        console.error(`Failed to airdrop to ${recipient.address}:`, error)
      }
    }
  } else {
    // Single recipient mode
    const recipient = args[0]
    const amount = parseInt(args[1] || String(DEFAULT_AIRDROP_AMOUNT), 10)

    try {
      new PublicKey(recipient)
    } catch {
      console.error('Invalid recipient address')
      process.exit(1)
    }

    await airdropToRecipient(
      connection,
      payer,
      doomMint,
      lifeMint,
      recipient,
      amount,
      amount
    )
  }

  console.log('\nDistribution complete!')
}

main().catch((error) => {
  console.error('Error:', error)
  process.exit(1)
})
