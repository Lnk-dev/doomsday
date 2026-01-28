/**
 * DonationModal Component Tests
 *
 * Tests for the DonationModal component which handles $LIFE donations.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DonationModal } from './DonationModal'
import { useUserStore } from '@/store'

vi.mock('@/store', () => ({
  useUserStore: vi.fn(),
}))

describe('DonationModal', () => {
  const mockDonateLife = vi.fn()
  const defaultProps = {
    recipient: {
      username: 'recipient_user',
      address: '0x1234567890abcdef',
    },
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(useUserStore).mockImplementation((selector) => {
      const state = { doomBalance: 100, donateLife: mockDonateLife }
      return selector(state as never)
    })

    mockDonateLife.mockReturnValue(true)
  })

  describe('rendering', () => {
    it('should render the modal with title', () => {
      render(<DonationModal {...defaultProps} />)
      expect(screen.getByText('Send Life')).toBeInTheDocument()
    })

    it('should render recipient username', () => {
      render(<DonationModal {...defaultProps} />)
      expect(screen.getByText('@recipient_user')).toBeInTheDocument()
    })

    it('should render balance display', () => {
      render(<DonationModal {...defaultProps} />)
      expect(screen.getByText('Balance: 100 $DOOM')).toBeInTheDocument()
    })

    it('should render amount input', () => {
      render(<DonationModal {...defaultProps} />)

      const input = screen.getByPlaceholderText('0')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('type', 'number')
    })

    it('should render quick amount buttons', () => {
      render(<DonationModal {...defaultProps} />)

      expect(screen.getByText('10')).toBeInTheDocument()
      expect(screen.getByText('50')).toBeInTheDocument()
      expect(screen.getByText('100')).toBeInTheDocument()
      expect(screen.getByText('500')).toBeInTheDocument()
    })
  })

  describe('amount input', () => {
    it('should update amount when typing', () => {
      render(<DonationModal {...defaultProps} />)

      const input = screen.getByPlaceholderText('0')
      fireEvent.change(input, { target: { value: '50' } })

      expect(input).toHaveValue(50)
    })

    it('should show cost breakdown when amount > 0', () => {
      render(<DonationModal {...defaultProps} />)

      const input = screen.getByPlaceholderText('0')
      fireEvent.change(input, { target: { value: '25' } })

      expect(screen.getByText('Cost')).toBeInTheDocument()
      expect(screen.getByText('25 $DOOM')).toBeInTheDocument()
    })
  })

  describe('donate button', () => {
    it('should be disabled when amount is 0', () => {
      render(<DonationModal {...defaultProps} />)

      const donateButton = screen.getByRole('button', { name: /Send 0 \$LIFE/i })
      expect(donateButton).toBeDisabled()
    })

    it('should be enabled when amount is valid', () => {
      render(<DonationModal {...defaultProps} />)

      const input = screen.getByPlaceholderText('0')
      fireEvent.change(input, { target: { value: '25' } })

      const donateButton = screen.getByRole('button', { name: /Send 25 \$LIFE/i })
      expect(donateButton).not.toBeDisabled()
    })

    it('should call donateLife when clicked with valid amount', () => {
      render(<DonationModal {...defaultProps} />)

      const input = screen.getByPlaceholderText('0')
      fireEvent.change(input, { target: { value: '25' } })

      const donateButton = screen.getByRole('button', { name: /Send 25 \$LIFE/i })
      fireEvent.click(donateButton)

      expect(mockDonateLife).toHaveBeenCalledWith(25)
    })
  })

  describe('success state', () => {
    it('should show success message after successful donation', () => {
      vi.useFakeTimers()

      render(<DonationModal {...defaultProps} />)

      const input = screen.getByPlaceholderText('0')
      fireEvent.change(input, { target: { value: '25' } })

      const donateButton = screen.getByRole('button', { name: /Send 25 \$LIFE/i })
      fireEvent.click(donateButton)

      expect(screen.getByText('Life Sent!')).toBeInTheDocument()

      vi.useRealTimers()
    })
  })
})
