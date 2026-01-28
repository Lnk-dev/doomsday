/**
 * Wallet Store
 * Issue #33: Implement Solana wallet connection
 *
 * Zustand store for managing wallet connection state and balances.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WalletState {
  // Connection state
  isConnecting: boolean
  connectionError: string | null

  // Balances (in lamports/smallest unit)
  solBalance: number | null
  doomBalance: number | null
  lifeBalance: number | null

  // Last sync timestamp
  lastBalanceSync: number | null

  // Actions
  setConnecting: (connecting: boolean) => void
  setConnectionError: (error: string | null) => void
  setBalances: (balances: { sol?: number; doom?: number; life?: number }) => void
  clearBalances: () => void
  reset: () => void
}

const initialState = {
  isConnecting: false,
  connectionError: null,
  solBalance: null,
  doomBalance: null,
  lifeBalance: null,
  lastBalanceSync: null,
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      ...initialState,

      setConnecting: (connecting) => set({ isConnecting: connecting, connectionError: null }),

      setConnectionError: (error) => set({ connectionError: error, isConnecting: false }),

      setBalances: (balances) => set((state) => ({
        solBalance: balances.sol ?? state.solBalance,
        doomBalance: balances.doom ?? state.doomBalance,
        lifeBalance: balances.life ?? state.lifeBalance,
        lastBalanceSync: Date.now(),
      })),

      clearBalances: () => set({
        solBalance: null,
        doomBalance: null,
        lifeBalance: null,
        lastBalanceSync: null,
      }),

      reset: () => set(initialState),
    }),
    {
      name: 'doomsday-wallet',
      partialize: (state) => ({
        // Only persist balances, not connection state
        solBalance: state.solBalance,
        doomBalance: state.doomBalance,
        lifeBalance: state.lifeBalance,
        lastBalanceSync: state.lastBalanceSync,
      }),
    }
  )
)
