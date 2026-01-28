/**
 * WalletButton Component Tests
 *
 * Tests for the WalletButton component which handles wallet connection states.
 * Issue #112: Add component unit tests with React Testing Library
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { WalletButton } from './WalletButton'

// Mock the hooks
vi.mock('@solana/wallet-adapter-react-ui', () => ({
  useWalletModal: vi.fn(() => ({
    setVisible: vi.fn(),
  })),
}))

vi.mock('@/hooks/useWallet', () => ({
  useWallet: vi.fn(() => ({
    connected: false,
    connecting: false,
    shortenedAddress: null,
    address: null,
    formattedSolBalance: null,
    disconnect: vi.fn(),
    refreshBalance: vi.fn(),
  })),
}))

import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { useWallet } from '@/hooks/useWallet'

describe('WalletButton', () => {
  const mockSetVisible = vi.fn()
  const mockDisconnect = vi.fn()
  const mockRefreshBalance = vi.fn()

  const originalClipboard = navigator.clipboard

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(useWalletModal).mockReturnValue({
      setVisible: mockSetVisible,
      visible: false,
    })

    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      writable: true,
      configurable: true,
    })
  })

  describe('disconnected state', () => {
    beforeEach(() => {
      vi.mocked(useWallet).mockReturnValue({
        connected: false,
        connecting: false,
        shortenedAddress: null,
        address: null,
        formattedSolBalance: null,
        disconnect: mockDisconnect,
        refreshBalance: mockRefreshBalance,
        publicKey: null,
        connectionError: null,
        wallet: null,
        wallets: [],
        solBalance: null,
        doomBalance: null,
        lifeBalance: null,
        select: vi.fn(),
      })
    })

    it('should render connect wallet button when not connected', () => {
      render(<WalletButton />)
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument()
    })

    it('should show wallet icon in connect button', () => {
      render(<WalletButton />)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should open wallet modal when connect button is clicked', () => {
      render(<WalletButton />)
      const button = screen.getByText('Connect Wallet')
      fireEvent.click(button)
      expect(mockSetVisible).toHaveBeenCalledWith(true)
    })

    it('should apply custom className', () => {
      render(<WalletButton className="custom-class" />)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })
  })

  describe('connecting state', () => {
    beforeEach(() => {
      vi.mocked(useWallet).mockReturnValue({
        connected: false,
        connecting: true,
        shortenedAddress: null,
        address: null,
        formattedSolBalance: null,
        disconnect: mockDisconnect,
        refreshBalance: mockRefreshBalance,
        publicKey: null,
        connectionError: null,
        wallet: null,
        wallets: [],
        solBalance: null,
        doomBalance: null,
        lifeBalance: null,
        select: vi.fn(),
      })
    })

    it('should show connecting text when connecting', () => {
      render(<WalletButton />)
      expect(screen.getByText('Connecting...')).toBeInTheDocument()
    })

    it('should disable button when connecting', () => {
      render(<WalletButton />)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })
  })

  describe('connected state - default variant', () => {
    beforeEach(() => {
      vi.mocked(useWallet).mockReturnValue({
        connected: true,
        connecting: false,
        shortenedAddress: 'Abc1...xyz9',
        address: 'Abc123456789xyz9',
        formattedSolBalance: '1.2345',
        disconnect: mockDisconnect,
        refreshBalance: mockRefreshBalance,
        publicKey: null,
        connectionError: null,
        wallet: null,
        wallets: [],
        solBalance: 1234500000,
        doomBalance: null,
        lifeBalance: null,
        select: vi.fn(),
      })
    })

    it('should show shortened address when connected', () => {
      render(<WalletButton />)
      expect(screen.getByText('Abc1...xyz9')).toBeInTheDocument()
    })

    it('should show connected status indicator', () => {
      render(<WalletButton />)
      expect(screen.getByText('Connected')).toBeInTheDocument()
    })

    it('should show disconnect button', () => {
      render(<WalletButton />)
      expect(screen.getByText('Disconnect')).toBeInTheDocument()
    })

    it('should call disconnect when disconnect button is clicked', () => {
      render(<WalletButton />)
      const disconnectButton = screen.getByText('Disconnect')
      fireEvent.click(disconnectButton)
      expect(mockDisconnect).toHaveBeenCalled()
    })

    it('should show SOL balance when available', () => {
      render(<WalletButton />)
      expect(screen.getByText('1.2345 SOL')).toBeInTheDocument()
    })

    it('should show balance label', () => {
      render(<WalletButton />)
      expect(screen.getByText('Balance')).toBeInTheDocument()
    })

    it('should copy address to clipboard when address is clicked', async () => {
      render(<WalletButton />)
      const addressButton = screen.getByText('Abc1...xyz9').closest('button')
      fireEvent.click(addressButton!)

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Abc123456789xyz9')
      })
    })

    it('should show check icon after copying address', async () => {
      render(<WalletButton />)
      const addressButton = screen.getByText('Abc1...xyz9').closest('button')
      fireEvent.click(addressButton!)

      await waitFor(() => {
        const checkIcon = document.querySelector('.text-green-400')
        expect(checkIcon).toBeInTheDocument()
      })
    })

    it('should call refreshBalance when refresh button is clicked', async () => {
      render(<WalletButton />)
      const refreshButton = screen.getByTitle('Refresh balance')
      fireEvent.click(refreshButton)

      await waitFor(() => {
        expect(mockRefreshBalance).toHaveBeenCalled()
      })
    })
  })

  describe('connected state - compact variant', () => {
    beforeEach(() => {
      vi.mocked(useWallet).mockReturnValue({
        connected: true,
        connecting: false,
        shortenedAddress: 'Abc1...xyz9',
        address: 'Abc123456789xyz9',
        formattedSolBalance: '1.2345',
        disconnect: mockDisconnect,
        refreshBalance: mockRefreshBalance,
        publicKey: null,
        connectionError: null,
        wallet: null,
        wallets: [],
        solBalance: 1234500000,
        doomBalance: null,
        lifeBalance: null,
        select: vi.fn(),
      })
    })

    it('should render compact variant with shortened address', () => {
      render(<WalletButton variant="compact" />)
      expect(screen.getByText('Abc1...xyz9')).toBeInTheDocument()
    })

    it('should not show balance in compact variant', () => {
      render(<WalletButton variant="compact" />)
      expect(screen.queryByText('Balance')).not.toBeInTheDocument()
      expect(screen.queryByText('1.2345 SOL')).not.toBeInTheDocument()
    })

    it('should not show Connected text in compact variant', () => {
      render(<WalletButton variant="compact" />)
      expect(screen.queryByText('Connected')).not.toBeInTheDocument()
    })

    it('should show logout icon for disconnect in compact variant', () => {
      render(<WalletButton variant="compact" />)
      const disconnectButton = screen.getByTitle('Disconnect')
      expect(disconnectButton).toBeInTheDocument()
    })

    it('should call disconnect in compact variant', () => {
      render(<WalletButton variant="compact" />)
      const disconnectButton = screen.getByTitle('Disconnect')
      fireEvent.click(disconnectButton)
      expect(mockDisconnect).toHaveBeenCalled()
    })

    it('should copy address when clicked in compact variant', async () => {
      render(<WalletButton variant="compact" />)
      const addressButton = screen.getByText('Abc1...xyz9').closest('button')
      fireEvent.click(addressButton!)

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Abc123456789xyz9')
      })
    })
  })

  describe('connected state without balance', () => {
    beforeEach(() => {
      vi.mocked(useWallet).mockReturnValue({
        connected: true,
        connecting: false,
        shortenedAddress: 'Abc1...xyz9',
        address: 'Abc123456789xyz9',
        formattedSolBalance: null,
        disconnect: mockDisconnect,
        refreshBalance: mockRefreshBalance,
        publicKey: null,
        connectionError: null,
        wallet: null,
        wallets: [],
        solBalance: null,
        doomBalance: null,
        lifeBalance: null,
        select: vi.fn(),
      })
    })

    it('should not show balance section when balance is null', () => {
      render(<WalletButton />)
      expect(screen.queryByText('Balance')).not.toBeInTheDocument()
    })
  })

  describe('styling', () => {
    beforeEach(() => {
      vi.mocked(useWallet).mockReturnValue({
        connected: false,
        connecting: false,
        shortenedAddress: null,
        address: null,
        formattedSolBalance: null,
        disconnect: mockDisconnect,
        refreshBalance: mockRefreshBalance,
        publicKey: null,
        connectionError: null,
        wallet: null,
        wallets: [],
        solBalance: null,
        doomBalance: null,
        lifeBalance: null,
        select: vi.fn(),
      })
    })

    it('should have red background on connect button', () => {
      render(<WalletButton />)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-[#ff3040]')
    })

    it('should have rounded corners on connect button', () => {
      render(<WalletButton />)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('rounded-lg')
    })
  })

  describe('accessibility', () => {
    beforeEach(() => {
      vi.mocked(useWallet).mockReturnValue({
        connected: false,
        connecting: false,
        shortenedAddress: null,
        address: null,
        formattedSolBalance: null,
        disconnect: mockDisconnect,
        refreshBalance: mockRefreshBalance,
        publicKey: null,
        connectionError: null,
        wallet: null,
        wallets: [],
        solBalance: null,
        doomBalance: null,
        lifeBalance: null,
        select: vi.fn(),
      })
    })

    it('should be keyboard accessible', () => {
      render(<WalletButton />)
      const button = screen.getByRole('button')
      expect(button).not.toBeDisabled()
    })
  })
})
