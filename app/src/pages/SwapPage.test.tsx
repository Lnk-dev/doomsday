/**
 * SwapPage Tests
 * Issue #132: Tests for AMM swap interface
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SwapPage } from './SwapPage'
import { useWalletStore } from '@/store/wallet'

// Mock the wallet adapter hooks
vi.mock('@solana/wallet-adapter-react', () => ({
  useConnection: () => ({
    connection: {
      getBalance: vi.fn().mockResolvedValue(1000000000),
    },
  }),
  useWallet: () => ({
    publicKey: { toBase58: () => 'test-public-key' },
    connected: true,
    signTransaction: vi.fn(),
  }),
}))

// Mock the AMM module to return immediately
vi.mock('@/lib/solana/programs/amm', () => ({
  fetchPool: vi.fn().mockResolvedValue({
    authority: { toBase58: () => 'authority' },
    doomMint: { toBase58: () => 'doom-mint' },
    lifeMint: { toBase58: () => 'life-mint' },
    doomVault: { toBase58: () => 'doom-vault' },
    lifeVault: { toBase58: () => 'life-vault' },
    lpMint: { toBase58: () => 'lp-mint' },
    doomReserve: BigInt(10000e9),
    lifeReserve: BigInt(10000e9),
    lpSupply: BigInt(10000e9),
    feeBps: 30,
    totalFeesDoom: BigInt(100e9),
    totalFeesLife: BigInt(100e9),
    paused: false,
    bump: 255,
  }),
  buildSwapTransaction: vi.fn(),
  calculateSwapOutput: (amount: number, doomReserve: number, lifeReserve: number, doomToLife: boolean) => {
    const inputReserve = doomToLife ? doomReserve : lifeReserve
    const outputReserve = doomToLife ? lifeReserve : doomReserve
    const amountWithFee = amount * 0.997
    const amountOut = (outputReserve * amountWithFee) / (inputReserve + amountWithFee)
    const priceImpact = (amount / inputReserve) * 100
    return { amountOut, priceImpact }
  },
  SWAP_FEE_BPS: 30,
}))

// Mock Solana config
vi.mock('@/lib/solana/config', () => ({
  getNetworkConfig: () => ({
    network: 'devnet',
    rpcEndpoint: 'https://api.devnet.solana.com',
    tokens: {
      doom: { mint: 'doom-mint', decimals: 9 },
      life: { mint: 'life-mint', decimals: 9 },
    },
  }),
  getExplorerUrl: (signature: string, type: string) =>
    `https://explorer.solana.com/${type}/${signature}?cluster=devnet`,
}))

describe('SwapPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset wallet store
    useWalletStore.setState({
      doomBalance: 1000,
      lifeBalance: 500,
      solBalance: 1,
    })
  })

  const renderSwapPage = () => {
    return render(
      <MemoryRouter>
        <SwapPage />
      </MemoryRouter>
    )
  }

  describe('initial render', () => {
    it('should render swap title', async () => {
      renderSwapPage()
      expect(screen.getByText('Swap')).toBeInTheDocument()
    })

    it('should render token labels', async () => {
      renderSwapPage()
      expect(screen.getByText('$DOOM')).toBeInTheDocument()
      expect(screen.getByText('$LIFE')).toBeInTheDocument()
    })

    it('should render From and To sections', async () => {
      renderSwapPage()
      expect(screen.getByText('From')).toBeInTheDocument()
      expect(screen.getByText('To')).toBeInTheDocument()
    })

    it('should render MAX button', async () => {
      renderSwapPage()
      expect(screen.getByText('MAX')).toBeInTheDocument()
    })

    it('should render Enter Amount button initially', async () => {
      renderSwapPage()
      expect(screen.getByRole('button', { name: 'Enter Amount' })).toBeInTheDocument()
    })
  })

  describe('balances display', () => {
    it('should show DOOM balance', async () => {
      renderSwapPage()
      await waitFor(() => {
        expect(screen.getByText('Balance: 1000.00')).toBeInTheDocument()
      })
    })

    it('should show LIFE balance', async () => {
      renderSwapPage()
      await waitFor(() => {
        expect(screen.getByText('Balance: 500.00')).toBeInTheDocument()
      })
    })
  })

  describe('network info', () => {
    it('should show devnet indicator', async () => {
      renderSwapPage()
      expect(screen.getByText(/Trading on Devnet/)).toBeInTheDocument()
    })
  })

  describe('pool info section', () => {
    it('should render pool info header', async () => {
      renderSwapPage()
      expect(screen.getByText('Pool Info')).toBeInTheDocument()
    })

    it('should show pool reserves labels', async () => {
      renderSwapPage()
      await waitFor(() => {
        expect(screen.getByText('$DOOM Reserve')).toBeInTheDocument()
        expect(screen.getByText('$LIFE Reserve')).toBeInTheDocument()
      })
    })

    it('should show pool fee label', async () => {
      renderSwapPage()
      await waitFor(() => {
        expect(screen.getByText('Pool Fee')).toBeInTheDocument()
      })
    })
  })
})
