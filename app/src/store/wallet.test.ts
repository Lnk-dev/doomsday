/**
 * Wallet Store Tests
 * Issues #33, #102: Tests for wallet connection and balance management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useWalletStore, shortenAddress, getWalletDisplayName } from './wallet'

describe('wallet store', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useWalletStore.setState({
      isConnecting: false,
      connectionError: null,
      wallets: {},
      primaryWalletAddress: null,
      connectionHistory: [],
      autoReconnect: true,
      solBalance: null,
      doomBalance: null,
      lifeBalance: null,
      lastBalanceSync: null,
      isFetchingBalances: false,
    })
  })

  describe('initial state', () => {
    it('should have no wallets', () => {
      const state = useWalletStore.getState()
      expect(Object.keys(state.wallets)).toHaveLength(0)
    })

    it('should have no primary wallet', () => {
      const state = useWalletStore.getState()
      expect(state.primaryWalletAddress).toBeNull()
    })

    it('should have auto-reconnect enabled', () => {
      const state = useWalletStore.getState()
      expect(state.autoReconnect).toBe(true)
    })

    it('should have null balances', () => {
      const state = useWalletStore.getState()
      expect(state.solBalance).toBeNull()
      expect(state.doomBalance).toBeNull()
      expect(state.lifeBalance).toBeNull()
    })
  })

  describe('setConnecting', () => {
    it('should set connecting state', () => {
      const { setConnecting } = useWalletStore.getState()

      setConnecting(true)

      expect(useWalletStore.getState().isConnecting).toBe(true)
    })

    it('should clear connection error when setting connecting', () => {
      useWalletStore.setState({ connectionError: 'Previous error' })
      const { setConnecting } = useWalletStore.getState()

      setConnecting(true)

      expect(useWalletStore.getState().connectionError).toBeNull()
    })
  })

  describe('setConnectionError', () => {
    it('should set connection error', () => {
      const { setConnectionError } = useWalletStore.getState()

      setConnectionError('Test error')

      expect(useWalletStore.getState().connectionError).toBe('Test error')
    })

    it('should clear connecting state', () => {
      useWalletStore.setState({ isConnecting: true })
      const { setConnectionError } = useWalletStore.getState()

      setConnectionError('Error')

      expect(useWalletStore.getState().isConnecting).toBe(false)
    })
  })

  describe('setBalances', () => {
    it('should set SOL balance', () => {
      const { setBalances } = useWalletStore.getState()

      setBalances({ sol: 1.5 })

      expect(useWalletStore.getState().solBalance).toBe(1.5)
    })

    it('should set DOOM balance', () => {
      const { setBalances } = useWalletStore.getState()

      setBalances({ doom: 1000 })

      expect(useWalletStore.getState().doomBalance).toBe(1000)
    })

    it('should set LIFE balance', () => {
      const { setBalances } = useWalletStore.getState()

      setBalances({ life: 500 })

      expect(useWalletStore.getState().lifeBalance).toBe(500)
    })

    it('should set multiple balances at once', () => {
      const { setBalances } = useWalletStore.getState()

      setBalances({ sol: 2, doom: 1000, life: 500 })

      const state = useWalletStore.getState()
      expect(state.solBalance).toBe(2)
      expect(state.doomBalance).toBe(1000)
      expect(state.lifeBalance).toBe(500)
    })

    it('should preserve existing balances when setting partial', () => {
      useWalletStore.setState({ solBalance: 1, doomBalance: 100, lifeBalance: 50 })
      const { setBalances } = useWalletStore.getState()

      setBalances({ doom: 200 })

      const state = useWalletStore.getState()
      expect(state.solBalance).toBe(1)
      expect(state.doomBalance).toBe(200)
      expect(state.lifeBalance).toBe(50)
    })

    it('should update lastBalanceSync', () => {
      const now = Date.now()
      vi.setSystemTime(now)
      const { setBalances } = useWalletStore.getState()

      setBalances({ sol: 1 })

      expect(useWalletStore.getState().lastBalanceSync).toBe(now)
    })
  })

  describe('clearBalances', () => {
    it('should clear all balances', () => {
      useWalletStore.setState({
        solBalance: 1,
        doomBalance: 100,
        lifeBalance: 50,
        lastBalanceSync: Date.now(),
      })
      const { clearBalances } = useWalletStore.getState()

      clearBalances()

      const state = useWalletStore.getState()
      expect(state.solBalance).toBeNull()
      expect(state.doomBalance).toBeNull()
      expect(state.lifeBalance).toBeNull()
      expect(state.lastBalanceSync).toBeNull()
    })
  })

  describe('addWallet', () => {
    it('should add a wallet', () => {
      const { addWallet, getWallet } = useWalletStore.getState()

      addWallet('wallet-address-1', 'Phantom')

      const wallet = getWallet('wallet-address-1')
      expect(wallet).toBeDefined()
      expect(wallet?.walletType).toBe('Phantom')
    })

    it('should set first wallet as primary', () => {
      const { addWallet } = useWalletStore.getState()

      addWallet('wallet-address-1', 'Phantom')

      expect(useWalletStore.getState().primaryWalletAddress).toBe('wallet-address-1')
    })

    it('should not change primary when adding second wallet', () => {
      const { addWallet } = useWalletStore.getState()

      addWallet('wallet-address-1', 'Phantom')
      addWallet('wallet-address-2', 'Solflare')

      expect(useWalletStore.getState().primaryWalletAddress).toBe('wallet-address-1')
    })

    it('should set nickname if provided', () => {
      const { addWallet, getWallet } = useWalletStore.getState()

      addWallet('wallet-address-1', 'Phantom', 'My Main Wallet')

      const wallet = getWallet('wallet-address-1')
      expect(wallet?.nickname).toBe('My Main Wallet')
    })

    it('should add entry to connection history', () => {
      const { addWallet } = useWalletStore.getState()

      addWallet('wallet-address-1', 'Phantom')

      expect(useWalletStore.getState().connectionHistory).toHaveLength(1)
      expect(useWalletStore.getState().connectionHistory[0].address).toBe('wallet-address-1')
    })

    it('should limit history to 10 entries', () => {
      const { addWallet } = useWalletStore.getState()

      for (let i = 0; i < 15; i++) {
        addWallet(`wallet-${i}`, 'Phantom')
      }

      expect(useWalletStore.getState().connectionHistory).toHaveLength(10)
    })
  })

  describe('removeWallet', () => {
    it('should remove a wallet', () => {
      const { addWallet, removeWallet, getWallet } = useWalletStore.getState()

      addWallet('wallet-address-1', 'Phantom')
      removeWallet('wallet-address-1')

      expect(getWallet('wallet-address-1')).toBeUndefined()
    })

    it('should set new primary when removing primary wallet', () => {
      const { addWallet, removeWallet } = useWalletStore.getState()

      addWallet('wallet-1', 'Phantom')
      addWallet('wallet-2', 'Solflare')
      removeWallet('wallet-1')

      expect(useWalletStore.getState().primaryWalletAddress).toBe('wallet-2')
    })

    it('should set null primary when removing last wallet', () => {
      const { addWallet, removeWallet } = useWalletStore.getState()

      addWallet('wallet-1', 'Phantom')
      removeWallet('wallet-1')

      expect(useWalletStore.getState().primaryWalletAddress).toBeNull()
    })

    it('should mark history entry as disconnected', () => {
      const { addWallet, removeWallet } = useWalletStore.getState()

      addWallet('wallet-1', 'Phantom')
      removeWallet('wallet-1')

      const historyEntry = useWalletStore.getState().connectionHistory[0]
      expect(historyEntry.disconnectedAt).toBeDefined()
    })
  })

  describe('setPrimaryWallet', () => {
    it('should set primary wallet', () => {
      const { addWallet, setPrimaryWallet } = useWalletStore.getState()

      addWallet('wallet-1', 'Phantom')
      addWallet('wallet-2', 'Solflare')
      setPrimaryWallet('wallet-2')

      expect(useWalletStore.getState().primaryWalletAddress).toBe('wallet-2')
    })

    it('should sync balances from new primary wallet', () => {
      const { addWallet, updateWalletBalances, setPrimaryWallet } = useWalletStore.getState()

      addWallet('wallet-1', 'Phantom')
      addWallet('wallet-2', 'Solflare')
      updateWalletBalances('wallet-2', { sol: 5, doom: 1000, life: 500 })
      setPrimaryWallet('wallet-2')

      const state = useWalletStore.getState()
      expect(state.solBalance).toBe(5)
      expect(state.doomBalance).toBe(1000)
      expect(state.lifeBalance).toBe(500)
    })

    it('should not change anything for non-existent wallet', () => {
      const { addWallet, setPrimaryWallet } = useWalletStore.getState()

      addWallet('wallet-1', 'Phantom')
      setPrimaryWallet('non-existent')

      expect(useWalletStore.getState().primaryWalletAddress).toBe('wallet-1')
    })
  })

  describe('setWalletNickname', () => {
    it('should set wallet nickname', () => {
      const { addWallet, setWalletNickname, getWallet } = useWalletStore.getState()

      addWallet('wallet-1', 'Phantom')
      setWalletNickname('wallet-1', 'Trading Wallet')

      expect(getWallet('wallet-1')?.nickname).toBe('Trading Wallet')
    })

    it('should not throw for non-existent wallet', () => {
      const { setWalletNickname } = useWalletStore.getState()

      // Should not throw
      setWalletNickname('non-existent', 'Name')
    })
  })

  describe('updateWalletBalances', () => {
    it('should update wallet balances', () => {
      const { addWallet, updateWalletBalances, getWallet } = useWalletStore.getState()

      addWallet('wallet-1', 'Phantom')
      updateWalletBalances('wallet-1', { sol: 2, doom: 500, life: 250 })

      const wallet = getWallet('wallet-1')
      expect(wallet?.solBalance).toBe(2)
      expect(wallet?.doomBalance).toBe(500)
      expect(wallet?.lifeBalance).toBe(250)
    })

    it('should update lastBalanceSync', () => {
      const now = Date.now()
      vi.setSystemTime(now)
      const { addWallet, updateWalletBalances, getWallet } = useWalletStore.getState()

      addWallet('wallet-1', 'Phantom')
      updateWalletBalances('wallet-1', { sol: 1 })

      expect(getWallet('wallet-1')?.lastBalanceSync).toBe(now)
    })
  })

  describe('getConnectedWallets', () => {
    it('should return empty array when no wallets', () => {
      const { getConnectedWallets } = useWalletStore.getState()

      expect(getConnectedWallets()).toEqual([])
    })

    it('should return all connected wallets', () => {
      const { addWallet, getConnectedWallets } = useWalletStore.getState()

      addWallet('wallet-1', 'Phantom')
      addWallet('wallet-2', 'Solflare')

      expect(getConnectedWallets()).toHaveLength(2)
    })
  })

  describe('getPrimaryWallet', () => {
    it('should return undefined when no wallets', () => {
      const { getPrimaryWallet } = useWalletStore.getState()

      expect(getPrimaryWallet()).toBeUndefined()
    })

    it('should return primary wallet', () => {
      const { addWallet, getPrimaryWallet } = useWalletStore.getState()

      addWallet('wallet-1', 'Phantom', 'My Wallet')

      const primary = getPrimaryWallet()
      expect(primary?.address).toBe('wallet-1')
      expect(primary?.nickname).toBe('My Wallet')
    })
  })

  describe('clearHistory', () => {
    it('should clear connection history', () => {
      const { addWallet, clearHistory } = useWalletStore.getState()

      addWallet('wallet-1', 'Phantom')
      addWallet('wallet-2', 'Solflare')
      clearHistory()

      expect(useWalletStore.getState().connectionHistory).toEqual([])
    })
  })

  describe('setAutoReconnect', () => {
    it('should enable auto-reconnect', () => {
      useWalletStore.setState({ autoReconnect: false })
      const { setAutoReconnect } = useWalletStore.getState()

      setAutoReconnect(true)

      expect(useWalletStore.getState().autoReconnect).toBe(true)
    })

    it('should disable auto-reconnect', () => {
      const { setAutoReconnect } = useWalletStore.getState()

      setAutoReconnect(false)

      expect(useWalletStore.getState().autoReconnect).toBe(false)
    })
  })

  describe('reset', () => {
    it('should reset to initial state', () => {
      useWalletStore.setState({
        isConnecting: true,
        connectionError: 'Error',
        wallets: {
          'wallet-1': {
            address: 'wallet-1',
            walletType: 'Phantom',
            solBalance: 1,
            doomBalance: 100,
            lifeBalance: 50,
            lastBalanceSync: Date.now(),
            connectedAt: Date.now(),
          },
        },
        primaryWalletAddress: 'wallet-1',
        solBalance: 100,
        doomBalance: 1000,
        lifeBalance: 500,
      })
      const { reset } = useWalletStore.getState()

      reset()

      const state = useWalletStore.getState()
      expect(state.isConnecting).toBe(false)
      expect(state.connectionError).toBeNull()
      expect(state.wallets).toEqual({})
      expect(state.primaryWalletAddress).toBeNull()
      expect(state.solBalance).toBeNull()
    })
  })
})

describe('helper functions', () => {
  describe('shortenAddress', () => {
    it('should shorten address with default chars', () => {
      const result = shortenAddress('ABC123456789XYZ')

      expect(result).toBe('ABC1...9XYZ')
    })

    it('should use custom char count', () => {
      const result = shortenAddress('ABC123456789XYZ', 6)

      // 6 chars from start + ... + 6 chars from end
      expect(result).toBe('ABC123...789XYZ')
    })

    it('should work with real Solana addresses', () => {
      const address = 'ET4GnuqB9Pa9rYuAyh83amD3yCD9uq6TGnEKF1BVi5Jx'
      const result = shortenAddress(address)

      expect(result).toBe('ET4G...i5Jx')
    })
  })

  describe('getWalletDisplayName', () => {
    it('should return nickname if set', () => {
      const wallet = {
        address: 'wallet-address',
        nickname: 'My Wallet',
        walletType: 'Phantom',
        solBalance: null,
        doomBalance: null,
        lifeBalance: null,
        lastBalanceSync: null,
        connectedAt: Date.now(),
      }

      expect(getWalletDisplayName(wallet)).toBe('My Wallet')
    })

    it('should return shortened address if no nickname', () => {
      const wallet = {
        address: 'ET4GnuqB9Pa9rYuAyh83amD3yCD9uq6TGnEKF1BVi5Jx',
        walletType: 'Phantom',
        solBalance: null,
        doomBalance: null,
        lifeBalance: null,
        lastBalanceSync: null,
        connectedAt: Date.now(),
      }

      expect(getWalletDisplayName(wallet)).toBe('ET4G...i5Jx')
    })
  })
})
