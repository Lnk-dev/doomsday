/**
 * Create $DOOM and $LIFE SPL Tokens
 * Issue #34, #35: Token creation for prediction market
 *
 * This script creates the SPL token mints for $DOOM and $LIFE on Solana devnet.
 * Run with: npx ts-node scripts/create-tokens.ts
 *
 * Prerequisites:
 * - Solana CLI installed
 * - A keypair at ~/.config/solana/id.json with SOL for fees
 * - @metaplex-foundation/mpl-token-metadata (for token metadata)
 */

import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
  clusterApiUrl,
} from '@solana/web3.js'
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token'
import {
  createCreateMetadataAccountV3Instruction,
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
} from '@metaplex-foundation/mpl-token-metadata'
import * as fs from 'fs'
import * as path from 'path'

// Configuration
const NETWORK = process.env.SOLANA_NETWORK || 'devnet'
const KEYPAIR_PATH = process.env.KEYPAIR_PATH || `${process.env.HOME}/.config/solana/id.json`

// Token configuration
const TOKEN_DECIMALS = 9
const INITIAL_SUPPLY = 1_000_000_000 // 1 billion tokens

interface TokenConfig {
  name: string
  symbol: string
  uri: string
  description: string
}

const DOOM_TOKEN_CONFIG: TokenConfig = {
  name: 'DOOM Token',
  symbol: 'DOOM',
  uri: 'https://doomsday.app/tokens/doom.json',
  description: 'The currency of despair in the Doomsday prediction market',
}

const LIFE_TOKEN_CONFIG: TokenConfig = {
  name: 'LIFE Token',
  symbol: 'LIFE',
  uri: 'https://doomsday.app/tokens/life.json',
  description: 'The currency of hope in the Doomsday prediction market',
}

async function loadKeypair(): Promise<Keypair> {
  const keypairPath = path.resolve(KEYPAIR_PATH)
  if (!fs.existsSync(keypairPath)) {
    throw new Error(`Keypair not found at ${keypairPath}. Run 'solana-keygen new' first.`)
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

function findMetadataPDA(mint: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  )
  return pda
}

async function createTokenWithMetadata(
  connection: Connection,
  payer: Keypair,
  config: TokenConfig
): Promise<{ mint: PublicKey; metadataPDA: PublicKey }> {
  console.log(`\nCreating ${config.symbol} token...`)

  // Create the mint
  const mint = await createMint(
    connection,
    payer,
    payer.publicKey, // Mint authority
    payer.publicKey, // Freeze authority (can be set to null)
    TOKEN_DECIMALS,
    undefined,
    undefined,
    TOKEN_PROGRAM_ID
  )

  console.log(`  Mint address: ${mint.toBase58()}`)

  // Create metadata account
  const metadataPDA = findMetadataPDA(mint)

  const createMetadataIx = createCreateMetadataAccountV3Instruction(
    {
      metadata: metadataPDA,
      mint: mint,
      mintAuthority: payer.publicKey,
      payer: payer.publicKey,
      updateAuthority: payer.publicKey,
    },
    {
      createMetadataAccountArgsV3: {
        data: {
          name: config.name,
          symbol: config.symbol,
          uri: config.uri,
          sellerFeeBasisPoints: 0,
          creators: null,
          collection: null,
          uses: null,
        },
        isMutable: true,
        collectionDetails: null,
      },
    }
  )

  const transaction = new Transaction().add(createMetadataIx)
  await sendAndConfirmTransaction(connection, transaction, [payer])

  console.log(`  Metadata PDA: ${metadataPDA.toBase58()}`)

  return { mint, metadataPDA }
}

async function mintInitialSupply(
  connection: Connection,
  payer: Keypair,
  mint: PublicKey,
  amount: number
): Promise<void> {
  console.log(`  Minting initial supply: ${(amount / Math.pow(10, TOKEN_DECIMALS)).toLocaleString()} tokens`)

  // Get or create the associated token account for the payer
  const tokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    payer.publicKey
  )

  // Mint tokens
  await mintTo(
    connection,
    payer,
    mint,
    tokenAccount.address,
    payer.publicKey,
    BigInt(amount) * BigInt(Math.pow(10, TOKEN_DECIMALS))
  )

  console.log(`  Tokens minted to: ${tokenAccount.address.toBase58()}`)
}

async function main() {
  console.log('='.repeat(60))
  console.log('Doomsday Token Creation Script')
  console.log('='.repeat(60))
  console.log(`Network: ${NETWORK}`)

  // Load keypair
  const payer = await loadKeypair()
  console.log(`Payer: ${payer.publicKey.toBase58()}`)

  // Get connection
  const connection = getConnection()

  // Check balance
  const balance = await connection.getBalance(payer.publicKey)
  console.log(`Balance: ${balance / 1e9} SOL`)

  if (balance < 0.1 * 1e9) {
    console.error('\nInsufficient balance. Need at least 0.1 SOL for token creation.')
    if (NETWORK === 'devnet') {
      console.log('Run: solana airdrop 2')
    }
    process.exit(1)
  }

  // Create $DOOM token
  const doom = await createTokenWithMetadata(connection, payer, DOOM_TOKEN_CONFIG)
  await mintInitialSupply(connection, payer, doom.mint, INITIAL_SUPPLY)

  // Create $LIFE token
  const life = await createTokenWithMetadata(connection, payer, LIFE_TOKEN_CONFIG)
  await mintInitialSupply(connection, payer, life.mint, INITIAL_SUPPLY)

  // Output configuration
  console.log('\n' + '='.repeat(60))
  console.log('TOKEN CREATION COMPLETE')
  console.log('='.repeat(60))
  console.log('\nAdd these to your .env file:\n')
  console.log(`VITE_DOOM_TOKEN_MINT=${doom.mint.toBase58()}`)
  console.log(`VITE_LIFE_TOKEN_MINT=${life.mint.toBase58()}`)

  console.log('\n\nToken details saved to: scripts/token-addresses.json')

  // Save to file
  const addresses = {
    network: NETWORK,
    createdAt: new Date().toISOString(),
    doom: {
      mint: doom.mint.toBase58(),
      metadataPDA: doom.metadataPDA.toBase58(),
      decimals: TOKEN_DECIMALS,
      initialSupply: INITIAL_SUPPLY,
    },
    life: {
      mint: life.mint.toBase58(),
      metadataPDA: life.metadataPDA.toBase58(),
      decimals: TOKEN_DECIMALS,
      initialSupply: INITIAL_SUPPLY,
    },
    authority: payer.publicKey.toBase58(),
  }

  fs.writeFileSync(
    path.join(__dirname, 'token-addresses.json'),
    JSON.stringify(addresses, null, 2)
  )

  console.log('\nExplorer links:')
  const explorerBase = NETWORK === 'mainnet-beta'
    ? 'https://explorer.solana.com'
    : `https://explorer.solana.com?cluster=${NETWORK}`
  console.log(`  $DOOM: ${explorerBase}/address/${doom.mint.toBase58()}`)
  console.log(`  $LIFE: ${explorerBase}/address/${life.mint.toBase58()}`)
}

main().catch((error) => {
  console.error('Error:', error)
  process.exit(1)
})
