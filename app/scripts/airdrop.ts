import { Connection, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js'
import * as fs from 'fs'
import * as path from 'path'

// Try multiple RPC endpoints
const RPC_ENDPOINTS = [
  'https://rpc.ankr.com/solana_devnet',
  'https://devnet.genesysgo.net',
  'https://api.devnet.solana.com',
]

async function tryAirdrop(rpcUrl: string, keypair: Keypair): Promise<boolean> {
  const displayUrl = rpcUrl.includes('?') ? rpcUrl.split('?')[0] : rpcUrl
  console.log('\nTrying RPC:', displayUrl + '...')

  try {
    const connection = new Connection(rpcUrl, 'confirmed')

    // Check current balance
    const balance = await connection.getBalance(keypair.publicKey)
    console.log('Current balance:', balance / LAMPORTS_PER_SOL, 'SOL')

    // Request airdrop
    console.log('Requesting 2 SOL airdrop...')
    const signature = await connection.requestAirdrop(keypair.publicKey, 2 * LAMPORTS_PER_SOL)
    console.log('Airdrop signature:', signature)

    // Wait for confirmation
    console.log('Waiting for confirmation...')
    await connection.confirmTransaction(signature, 'confirmed')

    // Check new balance
    const newBalance = await connection.getBalance(keypair.publicKey)
    console.log('New balance:', newBalance / LAMPORTS_PER_SOL, 'SOL')
    console.log('Airdrop successful!')
    return true
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.log('Failed:', errorMessage.slice(0, 100))
    return false
  }
}

async function main() {
  // Load wallet keypair
  const walletPath = path.join(process.env.HOME || '', '.config/solana/id.json')

  if (!fs.existsSync(walletPath)) {
    console.error('Wallet not found at:', walletPath)
    process.exit(1)
  }

  const walletKeyData = JSON.parse(fs.readFileSync(walletPath, 'utf8'))
  const keypair = Keypair.fromSecretKey(Uint8Array.from(walletKeyData))

  console.log('Wallet:', keypair.publicKey.toString())

  for (const rpcUrl of RPC_ENDPOINTS) {
    const success = await tryAirdrop(rpcUrl, keypair)
    if (success) {
      return
    }
  }

  console.log('\nAll RPC endpoints failed or rate limited.')
  console.log('\nManual alternatives:')
  console.log('1. Visit https://faucet.solana.com')
  console.log('2. Enter wallet:', keypair.publicKey.toString())
  console.log('3. Request 2 SOL')
}

main().catch(console.error)
