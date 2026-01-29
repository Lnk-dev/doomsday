/**
 * Token Balance Hook
 * Issue #34, #35: SPL Token balance tracking
 *
 * Fetches and auto-refreshes $DOOM and $LIFE token balances.
 */

import { useCallback, useEffect, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import {
  getTokenBalances,
  getDoomBalance,
  getLifeBalance,
  formatTokenAmount,
  type TokenBalance,
} from '@/lib/solana/tokens'
import { getNetworkConfig } from '@/lib/solana/config'
import { useWalletStore } from '@/store/wallet'

interface UseTokenBalanceResult {
  doomBalance: TokenBalance | null
  lifeBalance: TokenBalance | null
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
  formattedDoomBalance: string
  formattedLifeBalance: string
}

const REFRESH_INTERVAL = 30000 // 30 seconds

export function useTokenBalance(): UseTokenBalanceResult {
  const { connection } = useConnection()
  const { publicKey, connected } = useWallet()
  const { setBalances } = useWalletStore()

  const [doomBalance, setDoomBalance] = useState<TokenBalance | null>(null)
  const [lifeBalance, setLifeBalance] = useState<TokenBalance | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBalances = useCallback(async () => {
    if (!publicKey || !connected) {
      setDoomBalance(null)
      setLifeBalance(null)
      setBalances({ doom: 0, life: 0 })
      return
    }

    const config = getNetworkConfig()

    // Validate token mints are configured
    if (!config.tokens.doom.mint || !config.tokens.life.mint) {
      setError('Token mints not configured')
      return
    }

    // Check if mints are placeholder values
    if (
      config.tokens.doom.mint.includes('Placeholder') ||
      config.tokens.life.mint.includes('Placeholder')
    ) {
      // In development with placeholders, set zero balances
      setDoomBalance({
        mint: config.tokens.doom.mint,
        balance: 0,
        decimals: 9,
        uiAmount: 0,
      })
      setLifeBalance({
        mint: config.tokens.life.mint,
        balance: 0,
        decimals: 9,
        uiAmount: 0,
      })
      setBalances({ doom: 0, life: 0 })
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const balances = await getTokenBalances(connection, publicKey)

      setDoomBalance(balances.doom)
      setLifeBalance(balances.life)

      // Update store with UI amounts (whole numbers for store)
      setBalances({
        doom: Math.floor(balances.doom.uiAmount),
        life: Math.floor(balances.life.uiAmount),
      })
    } catch (err) {
      console.error('Failed to fetch token balances:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch balances')
    } finally {
      setIsLoading(false)
    }
  }, [publicKey, connected, connection, setBalances])

  // Fetch on mount and when wallet changes
  useEffect(() => {
    fetchBalances()
  }, [fetchBalances])

  // Auto-refresh interval
  useEffect(() => {
    if (!connected || !publicKey) return

    const interval = setInterval(fetchBalances, REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [connected, publicKey, fetchBalances])

  // Format balances for display
  const formattedDoomBalance = doomBalance
    ? formatTokenAmount(doomBalance.balance, doomBalance.decimals)
    : '0'

  const formattedLifeBalance = lifeBalance
    ? formatTokenAmount(lifeBalance.balance, lifeBalance.decimals)
    : '0'

  return {
    doomBalance,
    lifeBalance,
    isLoading,
    error,
    refresh: fetchBalances,
    formattedDoomBalance,
    formattedLifeBalance,
  }
}

/**
 * Hook for fetching a single token balance
 */
export function useSingleTokenBalance(
  tokenType: 'doom' | 'life'
): {
  balance: TokenBalance | null
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
  formatted: string
} {
  const { connection } = useConnection()
  const { publicKey, connected } = useWallet()

  const [balance, setBalance] = useState<TokenBalance | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBalance = useCallback(async () => {
    if (!publicKey || !connected) {
      setBalance(null)
      return
    }

    const config = getNetworkConfig()
    const mint = config.tokens[tokenType].mint

    if (!mint || mint.includes('Placeholder')) {
      setBalance({
        mint,
        balance: 0,
        decimals: 9,
        uiAmount: 0,
      })
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result =
        tokenType === 'doom'
          ? await getDoomBalance(connection, publicKey)
          : await getLifeBalance(connection, publicKey)

      setBalance(result)
    } catch (err) {
      console.error(`Failed to fetch ${tokenType} balance:`, err)
      setError(err instanceof Error ? err.message : 'Failed to fetch balance')
    } finally {
      setIsLoading(false)
    }
  }, [publicKey, connected, connection, tokenType])

  useEffect(() => {
    fetchBalance()
  }, [fetchBalance])

  useEffect(() => {
    if (!connected || !publicKey) return

    const interval = setInterval(fetchBalance, REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [connected, publicKey, fetchBalance])

  const formatted = balance
    ? formatTokenAmount(balance.balance, balance.decimals)
    : '0'

  return {
    balance,
    isLoading,
    error,
    refresh: fetchBalance,
    formatted,
  }
}

/**
 * Hook for checking if user has sufficient balance for a transaction
 */
export function useHasSufficientBalance(
  tokenType: 'doom' | 'life',
  requiredAmount: number
): {
  hasSufficient: boolean
  currentBalance: number
  shortfall: number
  isLoading: boolean
} {
  const { balance, isLoading } = useSingleTokenBalance(tokenType)

  const currentBalance = balance?.uiAmount ?? 0
  const hasSufficient = currentBalance >= requiredAmount
  const shortfall = hasSufficient ? 0 : requiredAmount - currentBalance

  return {
    hasSufficient,
    currentBalance,
    shortfall,
    isLoading,
  }
}
