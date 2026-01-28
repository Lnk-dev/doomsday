/**
 * Solana Wallet Provider
 * Issue #33: Implement Solana wallet connection
 *
 * Provides wallet adapter context to the entire application.
 * Supports Phantom, Solflare, and other Solana wallets.
 */

import { useMemo } from 'react'
import type { FC, ReactNode } from 'react'
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'
import { clusterApiUrl } from '@solana/web3.js'

// Import wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css'

type Network = 'mainnet-beta' | 'devnet' | 'testnet'

interface WalletProviderProps {
  children: ReactNode
}

export const WalletProvider: FC<WalletProviderProps> = ({ children }) => {
  // Get network from environment, default to devnet
  const network = (import.meta.env.VITE_SOLANA_NETWORK || 'devnet') as Network

  // Get RPC endpoint - use custom URL if provided, otherwise use default cluster URL
  const endpoint = useMemo(() => {
    const customRpc = import.meta.env.VITE_SOLANA_RPC_URL
    if (customRpc) return customRpc
    return clusterApiUrl(network)
  }, [network])

  // Initialize supported wallets
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
  ], [])

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  )
}
