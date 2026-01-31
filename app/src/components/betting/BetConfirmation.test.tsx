/**
 * BetConfirmation Component Tests
 * Issues #34, #35, #36: Tests for bet confirmation UI
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BetConfirmation } from './BetConfirmation'

// Mock the hooks and stores
vi.mock('@solana/wallet-adapter-react', () => ({
  useConnection: () => ({ connection: {} }),
  useWallet: () => ({ publicKey: { toBase58: () => 'test-wallet-address' } }),
}))

vi.mock('@/store/events', () => ({
  useEventsStore: () => ({
    placeBet: vi.fn(),
    placeBetOnChain: vi.fn().mockResolvedValue({ transaction: {} }),
  }),
}))

vi.mock('@/store/predictions', () => ({
  usePredictionsStore: () => ({
    recordPrediction: vi.fn(),
  }),
}))

vi.mock('@/hooks/useTransaction', () => ({
  useTransaction: () => ({
    sendTransaction: vi.fn().mockResolvedValue({ success: true, signature: 'test-sig' }),
    isLoading: false,
  }),
}))

vi.mock('@/lib/solana/config', () => ({
  getExplorerUrl: (sig: string) => `https://explorer.solana.com/tx/${sig}`,
}))

vi.mock('@/lib/solana/programs/predictionMarket', () => ({
  calculateEstimatedPayout: () => ({
    payout: 150,
    fee: 3,
    odds: 60,
  }),
  Outcome: { Doom: 0, Life: 1 },
}))

describe('BetConfirmation', () => {
  const defaultProps = {
    eventId: 'event-1',
    eventTitle: 'Test Event',
    outcome: 'doom' as const,
    amount: 100,
    currentDoomPool: 1000,
    currentLifePool: 1500,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('preview state', () => {
    it('should render the confirmation modal', () => {
      render(<BetConfirmation {...defaultProps} />)

      expect(screen.getByText('Confirm Your Bet')).toBeInTheDocument()
      expect(screen.getByText('Test Event')).toBeInTheDocument()
    })

    it('should display the bet amount', () => {
      render(<BetConfirmation {...defaultProps} />)

      expect(screen.getByText('Bet Amount')).toBeInTheDocument()
      expect(screen.getByText(/100.*\$DOOM/)).toBeInTheDocument()
    })

    it('should display DOOM outcome styling for doom bets', () => {
      render(<BetConfirmation {...defaultProps} outcome="doom" />)

      expect(screen.getByText('Betting on DOOM')).toBeInTheDocument()
    })

    it('should display LIFE outcome styling for life bets', () => {
      render(<BetConfirmation {...defaultProps} outcome="life" />)

      expect(screen.getByText('Betting on LIFE')).toBeInTheDocument()
    })

    it('should display estimated payout', () => {
      render(<BetConfirmation {...defaultProps} />)

      expect(screen.getByText('Estimated Payout')).toBeInTheDocument()
      expect(screen.getByText(/150.*tokens/)).toBeInTheDocument()
    })

    it('should display platform fee', () => {
      render(<BetConfirmation {...defaultProps} />)

      expect(screen.getByText('Platform Fee (2%)')).toBeInTheDocument()
    })

    it('should display warning message', () => {
      render(<BetConfirmation {...defaultProps} />)

      expect(screen.getByText(/Bets are final and cannot be reversed/)).toBeInTheDocument()
    })

    it('should have Cancel and Confirm buttons', () => {
      render(<BetConfirmation {...defaultProps} />)

      expect(screen.getByText('Cancel')).toBeInTheDocument()
      expect(screen.getByText('Confirm Bet')).toBeInTheDocument()
    })

    it('should call onClose when Cancel is clicked', () => {
      const onClose = vi.fn()
      render(<BetConfirmation {...defaultProps} onClose={onClose} />)

      fireEvent.click(screen.getByText('Cancel'))

      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('with on-chain event', () => {
    it('should display on-chain event correctly', () => {
      render(<BetConfirmation {...defaultProps} onChainEventId={1} />)

      expect(screen.getByText('Confirm Your Bet')).toBeInTheDocument()
    })
  })

  describe('potential profit calculation', () => {
    it('should calculate and display potential profit', () => {
      render(<BetConfirmation {...defaultProps} />)

      expect(screen.getByText('Potential Profit')).toBeInTheDocument()
      // Payout (150) - Amount (100) = 50
      expect(screen.getByText(/\+50.*tokens/)).toBeInTheDocument()
    })
  })

  describe('implied probability', () => {
    it('should display implied probability for doom outcome', () => {
      render(<BetConfirmation {...defaultProps} outcome="doom" />)

      // odds is 60, so for doom it should show 60%
      expect(screen.getByText(/60.*% implied odds/)).toBeInTheDocument()
    })

    it('should display implied probability for life outcome', () => {
      render(<BetConfirmation {...defaultProps} outcome="life" />)

      // odds is 60, so for life it should show 100-60 = 40%
      expect(screen.getByText(/40.*% implied odds/)).toBeInTheDocument()
    })
  })
})
