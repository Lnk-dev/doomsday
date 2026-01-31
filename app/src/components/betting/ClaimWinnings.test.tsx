/**
 * ClaimWinnings Component Tests
 * Issues #34, #35, #36: Tests for winnings claim UI
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ClaimWinnings, ClaimableWinningsCard } from './ClaimWinnings'

// Mock the hooks and stores
vi.mock('@solana/wallet-adapter-react', () => ({
  useConnection: () => ({ connection: {} }),
  useWallet: () => ({ publicKey: { toBase58: () => 'test-wallet-address' } }),
}))

vi.mock('@/store/events', () => ({
  useEventsStore: () => ({
    claimWinningsOnChain: vi.fn().mockResolvedValue({ transaction: {} }),
  }),
}))

vi.mock('@/store/predictions', () => ({
  usePredictionsStore: Object.assign(
    () => ({
      markPredictionClaimed: vi.fn(),
    }),
    {
      getState: () => ({
        predictions: [],
      }),
    }
  ),
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

describe('ClaimWinnings', () => {
  const defaultProps = {
    eventId: 'event-1',
    eventTitle: 'Test Event',
    outcome: 'doom' as const,
    amount: 100,
    estimatedPayout: 180,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('preview state', () => {
    it('should render the claim modal', () => {
      render(<ClaimWinnings {...defaultProps} />)

      expect(screen.getByText('Claim Your Winnings!')).toBeInTheDocument()
      expect(screen.getByText('Test Event')).toBeInTheDocument()
    })

    it('should display winning outcome message', () => {
      render(<ClaimWinnings {...defaultProps} outcome="doom" />)

      expect(screen.getByText('You bet on DOOM and WON!')).toBeInTheDocument()
    })

    it('should display LIFE outcome for life bets', () => {
      render(<ClaimWinnings {...defaultProps} outcome="life" />)

      expect(screen.getByText('You bet on LIFE and WON!')).toBeInTheDocument()
    })

    it('should display original bet amount', () => {
      render(<ClaimWinnings {...defaultProps} />)

      expect(screen.getByText('Original Bet')).toBeInTheDocument()
      expect(screen.getByText(/100.*\$DOOM/)).toBeInTheDocument()
    })

    it('should display winnings (profit)', () => {
      render(<ClaimWinnings {...defaultProps} />)

      expect(screen.getByText('Winnings')).toBeInTheDocument()
      // Payout (180) - Amount (100) = 80 profit
      expect(screen.getByText(/\+80.*tokens/)).toBeInTheDocument()
    })

    it('should display total payout', () => {
      render(<ClaimWinnings {...defaultProps} />)

      expect(screen.getByText('Total Payout')).toBeInTheDocument()
      expect(screen.getByText(/180.*tokens/)).toBeInTheDocument()
    })

    it('should display fee explanation', () => {
      render(<ClaimWinnings {...defaultProps} />)

      expect(screen.getByText(/original bet back plus your share of the losing pool/)).toBeInTheDocument()
    })

    it('should have Later and Claim buttons', () => {
      render(<ClaimWinnings {...defaultProps} />)

      expect(screen.getByText('Later')).toBeInTheDocument()
      expect(screen.getByText('Claim Winnings')).toBeInTheDocument()
    })

    it('should call onClose when Later is clicked', () => {
      const onClose = vi.fn()
      render(<ClaimWinnings {...defaultProps} onClose={onClose} />)

      fireEvent.click(screen.getByText('Later'))

      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('with on-chain event', () => {
    it('should display on-chain event correctly', () => {
      render(<ClaimWinnings {...defaultProps} onChainEventId={1} />)

      expect(screen.getByText('Claim Your Winnings!')).toBeInTheDocument()
    })
  })

  describe('profit calculation', () => {
    it('should calculate profit correctly with large amounts', () => {
      render(<ClaimWinnings {...defaultProps} amount={1000} estimatedPayout={2500} />)

      // 2500 - 1000 = 1500 profit
      expect(screen.getByText(/\+1,500.*tokens/)).toBeInTheDocument()
    })

    it('should handle small profits', () => {
      render(<ClaimWinnings {...defaultProps} amount={100} estimatedPayout={101} />)

      expect(screen.getByText(/\+1.*tokens/)).toBeInTheDocument()
    })
  })
})

describe('ClaimableWinningsCard', () => {
  const defaultProps = {
    eventId: 'event-1',
    eventTitle: 'Test Event Title',
    outcome: 'doom' as const,
    amount: 100,
    estimatedPayout: 180,
    onClaim: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the card', () => {
    render(<ClaimableWinningsCard {...defaultProps} />)

    expect(screen.getByText('Winner!')).toBeInTheDocument()
    expect(screen.getByText('Test Event Title')).toBeInTheDocument()
  })

  it('should display bet amount', () => {
    render(<ClaimableWinningsCard {...defaultProps} />)

    expect(screen.getByText('Bet: 100')).toBeInTheDocument()
  })

  it('should display profit', () => {
    render(<ClaimableWinningsCard {...defaultProps} />)

    // 180 - 100 = 80
    expect(screen.getByText('+80 profit')).toBeInTheDocument()
  })

  it('should display claim button with payout amount', () => {
    render(<ClaimableWinningsCard {...defaultProps} />)

    expect(screen.getByText('Claim 180')).toBeInTheDocument()
  })

  it('should call onClaim when button is clicked', () => {
    const onClaim = vi.fn()
    render(<ClaimableWinningsCard {...defaultProps} onClaim={onClaim} />)

    fireEvent.click(screen.getByText('Claim 180'))

    expect(onClaim).toHaveBeenCalled()
  })

  it('should handle large payout amounts', () => {
    render(<ClaimableWinningsCard {...defaultProps} estimatedPayout={12500} />)

    expect(screen.getByText('Claim 12,500')).toBeInTheDocument()
  })

  it('should truncate long event titles', () => {
    render(
      <ClaimableWinningsCard
        {...defaultProps}
        eventTitle="This is a very long event title that should be truncated"
      />
    )

    expect(screen.getByText('This is a very long event title that should be truncated')).toBeInTheDocument()
  })
})
