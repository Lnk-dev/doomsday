/**
 * Wallet Store
 * Issue #33: Implement Solana wallet connection
 * Issue #102: Wallet lifecycle and multi-wallet support
 * Issue #34, #35: SPL Token balance tracking
 *
 * Zustand store for managing wallet connection state and balances.
 * Supports multiple wallets with primary wallet selection.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Connection, PublicKey } from '@solana/web3.js'
import { getTokenBalances } from '@/lib/solana/tokens'
import { getNetworkConfig } from '@/lib/solana/config'

/** Information about a connected wallet */
export interface WalletInfo {
  address: string
  nickname?: string
  solBalance: number | null
  doomBalance: number | null
  lifeBalance: number | null
  lastBalanceSync: number | null
  connectedAt: number
  walletType: string
}

/** Entry in connection history */
export interface ConnectionHistoryEntry {
  address: string
  nickname?: string
  walletType: string
  connectedAt: number
  disconnectedAt?: number
}

interface WalletState {
  isConnecting: boolean
  connectionError: string | null
  wallets: Record<string, WalletInfo>
  primaryWalletAddress: string | null
  connectionHistory: ConnectionHistoryEntry[]
  autoReconnect: boolean
  solBalance: number | null
  doomBalance: number | null
  lifeBalance: number | null
  lastBalanceSync: number | null
  isFetchingBalances: boolean

  setConnecting: (connecting: boolean) => void
  setConnectionError: (error: string | null) => void
  setBalances: (balances: { sol?: number; doom?: number; life?: number }) => void
  clearBalances: () => void
  reset: () => void
  addWallet: (address: string, walletType: string, nickname?: string) => void
  removeWallet: (address: string) => void
  setPrimaryWallet: (address: string) => void
  setWalletNickname: (address: string, nickname: string) => void
  updateWalletBalances: (address: string, balances: { sol?: number; doom?: number; life?: number }) => void
  getWallet: (address: string) => WalletInfo | undefined
  getPrimaryWallet: () => WalletInfo | undefined
  getConnectedWallets: () => WalletInfo[]
  clearHistory: () => void
  setAutoReconnect: (enabled: boolean) => void
  fetchTokenBalances: (connection: Connection, publicKey: PublicKey) => Promise<void>
}

const initialState = {
  isConnecting: false,
  connectionError: null,
  wallets: {} as Record<string, WalletInfo>,
  primaryWalletAddress: null as string | null,
  connectionHistory: [] as ConnectionHistoryEntry[],
  autoReconnect: true,
  solBalance: null as number | null,
  doomBalance: null as number | null,
  lifeBalance: null as number | null,
  lastBalanceSync: null as number | null,
  isFetchingBalances: false,
}

export const shortenAddress = (address: string, chars = 4): string => {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}

export const getWalletDisplayName = (wallet: WalletInfo): string => {
  return wallet.nickname || shortenAddress(wallet.address)
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setConnecting: (connecting) => set({ isConnecting: connecting, connectionError: null }),
      setConnectionError: (error) => set({ connectionError: error, isConnecting: false }),

      setBalances: (balances) => {
        const state = get()
        set({
          solBalance: balances.sol ?? state.solBalance,
          doomBalance: balances.doom ?? state.doomBalance,
          lifeBalance: balances.life ?? state.lifeBalance,
          lastBalanceSync: Date.now(),
        })
      },

      clearBalances: () => set({
        solBalance: null,
        doomBalance: null,
        lifeBalance: null,
        lastBalanceSync: null,
      }),

      reset: () => set(initialState),

      addWallet: (address, walletType, nickname) => {
        const state = get()
        const now = Date.now()
        const newWallet: WalletInfo = {
          address,
          nickname,
          walletType,
          solBalance: null,
          doomBalance: null,
          lifeBalance: null,
          lastBalanceSync: null,
          connectedAt: now,
        }
        const isPrimary = !state.primaryWalletAddress
        const historyEntry: ConnectionHistoryEntry = { address, nickname, walletType, connectedAt: now }
        set({
          wallets: { ...state.wallets, [address]: newWallet },
          primaryWalletAddress: isPrimary ? address : state.primaryWalletAddress,
          connectionHistory: [historyEntry, ...state.connectionHistory].slice(0, 10),
        })
      },

      removeWallet: (address) => {
        const state = get()
        const { [address]: _, ...remainingWallets } = state.wallets
        void _
        const remaining = Object.keys(remainingWallets)
        set({
          wallets: remainingWallets,
          primaryWalletAddress: state.primaryWalletAddress === address
            ? (remaining.length > 0 ? remaining[0] : null)
            : state.primaryWalletAddress,
          connectionHistory: state.connectionHistory.map((e) =>
            e.address === address && !e.disconnectedAt ? { ...e, disconnectedAt: Date.now() } : e
          ),
        })
      },

      setPrimaryWallet: (address) => {
        const state = get()
        const wallet = state.wallets[address]
        if (wallet) {
          set({
            primaryWalletAddress: address,
            solBalance: wallet.solBalance,
            doomBalance: wallet.doomBalance,
            lifeBalance: wallet.lifeBalance,
            lastBalanceSync: wallet.lastBalanceSync,
          })
        }
      },

      setWalletNickname: (address, nickname) => {
        const state = get()
        if (state.wallets[address]) {
          set({ wallets: { ...state.wallets, [address]: { ...state.wallets[address], nickname } } })
        }
      },

      updateWalletBalances: (address, balances) => {
        const state = get()
        const wallet = state.wallets[address]
        if (wallet) {
          const updated = {
            ...wallet,
            solBalance: balances.sol ?? wallet.solBalance,
            doomBalance: balances.doom ?? wallet.doomBalance,
            lifeBalance: balances.life ?? wallet.lifeBalance,
            lastBalanceSync: Date.now(),
          }
          set({ wallets: { ...state.wallets, [address]: updated } })
        }
      },

      getWallet: (address) => get().wallets[address],
      getPrimaryWallet: () => {
        const state = get()
        return state.primaryWalletAddress ? state.wallets[state.primaryWalletAddress] : undefined
      },
      getConnectedWallets: () => Object.values(get().wallets),
      clearHistory: () => set({ connectionHistory: [] }),
      setAutoReconnect: (enabled) => set({ autoReconnect: enabled }),

      fetchTokenBalances: async (connection: Connection, publicKey: PublicKey) => {
        const state = get()
        if (state.isFetchingBalances) return

        set({ isFetchingBalances: true })

        try {
          // Fetch SOL balance
          const solBalance = await connection.getBalance(publicKey)

          // Get network config
          const config = getNetworkConfig()

          // Check if token mints are configured (not placeholders)
          const hasValidMints =
            config.tokens.doom.mint &&
            config.tokens.life.mint &&
            !config.tokens.doom.mint.includes('Placeholder') &&
            !config.tokens.life.mint.includes('Placeholder')

          let doomBalance = 0
          let lifeBalance = 0

          if (hasValidMints) {
            // Fetch SPL token balances
            const tokenBalances = await getTokenBalances(connection, publicKey)
            doomBalance = Math.floor(tokenBalances.doom.uiAmount)
            lifeBalance = Math.floor(tokenBalances.life.uiAmount)
          }

          const address = publicKey.toBase58()

          // Update global balances
          set({
            solBalance,
            doomBalance,
            lifeBalance,
            lastBalanceSync: Date.now(),
            isFetchingBalances: false,
          })

          // Also update wallet-specific balances if wallet is tracked
          if (state.wallets[address]) {
            const wallet = state.wallets[address]
            set({
              wallets: {
                ...state.wallets,
                [address]: {
                  ...wallet,
                  solBalance,
                  doomBalance,
                  lifeBalance,
                  lastBalanceSync: Date.now(),
                },
              },
            })
          }
        } catch (error) {
          console.error('Failed to fetch token balances:', error)
          set({ isFetchingBalances: false })
        }
      },
    }),
    {
      name: 'doomsday-wallet',
      partialize: (state) => ({
        wallets: state.wallets,
        primaryWalletAddress: state.primaryWalletAddress,
        connectionHistory: state.connectionHistory,
        autoReconnect: state.autoReconnect,
        solBalance: state.solBalance,
        doomBalance: state.doomBalance,
        lifeBalance: state.lifeBalance,
        lastBalanceSync: state.lastBalanceSync,
        // Note: isFetchingBalances is intentionally not persisted
      }),
    }
  )
)
