/**
 * Wallet Hook
 * Issue #33: Implement Solana wallet connection
 *
 * Custom hook that combines Solana wallet adapter with our Zustand store.
 * Provides a unified interface for wallet operations.
 */

import { useCallback, useEffect } from 'react'
import { useConnection, useWallet as useSolanaWallet } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { useWalletStore } from '@/store/wallet'
import { useUserStore } from '@/store/user'

export function useWallet() {
  const { connection } = useConnection()
  const {
    publicKey,
    connected,
    connecting,
    disconnect,
    select,
    wallet,
    wallets,
  } = useSolanaWallet()

  const {
    solBalance,
    doomBalance,
    lifeBalance,
    isConnecting,
    connectionError,
    setConnecting,
    setConnectionError,
    setBalances,
    clearBalances,
  } = useWalletStore()

  // Get user store setConnected
  const setUserConnected = useUserStore((state) => state.setConnected)

  // Sync connecting state
  useEffect(() => {
    setConnecting(connecting)
  }, [connecting, setConnecting])

  // Sync connected state to user store
  useEffect(() => {
    setUserConnected(connected)
  }, [connected, setUserConnected])

  // Fetch SOL balance when connected
  const fetchBalance = useCallback(async () => {
    if (!publicKey || !connected) {
      clearBalances()
      return
    }

    try {
      const balance = await connection.getBalance(publicKey)
      setBalances({ sol: balance })
    } catch (error) {
      console.error('Failed to fetch balance:', error)
    }
  }, [publicKey, connected, connection, setBalances, clearBalances])

  // Fetch balance on connection and periodically
  useEffect(() => {
    if (connected && publicKey) {
      fetchBalance()

      // Refresh balance every 30 seconds
      const interval = setInterval(fetchBalance, 30000)
      return () => clearInterval(interval)
    } else {
      clearBalances()
    }
  }, [connected, publicKey, fetchBalance, clearBalances])

  // Handle disconnect
  const handleDisconnect = useCallback(async () => {
    try {
      await disconnect()
      clearBalances()
      setConnectionError(null)
    } catch (error) {
      console.error('Failed to disconnect:', error)
      setConnectionError('Failed to disconnect wallet')
    }
  }, [disconnect, clearBalances, setConnectionError])

  // Format SOL balance for display
  const formattedSolBalance = solBalance !== null
    ? (solBalance / LAMPORTS_PER_SOL).toFixed(4)
    : null

  // Shortened address for display
  const shortenedAddress = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
    : null

  return {
    // Connection state
    publicKey,
    connected,
    connecting: connecting || isConnecting,
    connectionError,
    wallet,
    wallets,

    // Balances
    solBalance,
    doomBalance,
    lifeBalance,
    formattedSolBalance,

    // Display helpers
    shortenedAddress,
    address: publicKey?.toBase58() ?? null,

    // Actions
    select,
    disconnect: handleDisconnect,
    refreshBalance: fetchBalance,
  }
}
