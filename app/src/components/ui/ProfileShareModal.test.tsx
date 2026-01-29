/**
 * ProfileShareModal Component Tests
 *
 * Tests for the ProfileShareModal component which handles profile sharing.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProfileShareModal } from './ProfileShareModal'

describe('ProfileShareModal', () => {
  const defaultProps = {
    profile: {
      username: 'testuser',
      address: '0x1234567890abcdef',
    },
    stats: {
      doomBalance: 1000,
      lifeBalance: 500,
      daysLiving: 30,
      postsCount: 42,
    },
    onClose: vi.fn(),
  }

  const originalClipboard = navigator.clipboard
  const originalOpen = window.open

  beforeEach(() => {
    vi.clearAllMocks()

    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true,
    })

    window.open = vi.fn()
  })

  afterEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      writable: true,
      configurable: true,
    })
    window.open = originalOpen
  })

  describe('rendering', () => {
    it('should render the modal with title', () => {
      render(<ProfileShareModal {...defaultProps} />)
      expect(screen.getByText('Share profile')).toBeInTheDocument()
    })

    it('should render profile username', () => {
      render(<ProfileShareModal {...defaultProps} />)
      expect(screen.getByText('@testuser')).toBeInTheDocument()
    })

    it('should render days living stat', () => {
      render(<ProfileShareModal {...defaultProps} />)
      expect(screen.getByText('30 days living')).toBeInTheDocument()
    })

    it('should render doom balance stat', () => {
      render(<ProfileShareModal {...defaultProps} />)
      expect(screen.getByText('1000 $DOOM')).toBeInTheDocument()
    })

    it('should render life balance stat', () => {
      render(<ProfileShareModal {...defaultProps} />)
      expect(screen.getByText('500 $LIFE')).toBeInTheDocument()
    })

    it('should render posts count stat', () => {
      render(<ProfileShareModal {...defaultProps} />)
      expect(screen.getByText('42 posts')).toBeInTheDocument()
    })

    it('should render copy link button', () => {
      render(<ProfileShareModal {...defaultProps} />)
      expect(screen.getByText('Copy link')).toBeInTheDocument()
    })

    it('should render share to X button', () => {
      render(<ProfileShareModal {...defaultProps} />)
      expect(screen.getByText('X / Twitter')).toBeInTheDocument()
    })

    it('should render copy username button', () => {
      render(<ProfileShareModal {...defaultProps} />)
      expect(screen.getByText('Copy username')).toBeInTheDocument()
    })
  })

  describe('interactions', () => {
    it('should call onClose when backdrop is clicked', () => {
      const onClose = vi.fn()
      render(<ProfileShareModal {...defaultProps} onClose={onClose} />)

      const backdrop = document.querySelector('.bg-black\\/60')
      fireEvent.click(backdrop!)
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should copy profile link to clipboard', async () => {
      render(<ProfileShareModal {...defaultProps} />)

      const copyButton = screen.getByText('Copy link').closest('button')
      fireEvent.click(copyButton!)

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          expect.stringContaining('/profile/testuser')
        )
      })
    })

    it('should show "Copied!" after copying link', async () => {
      render(<ProfileShareModal {...defaultProps} />)

      const copyButton = screen.getByText('Copy link').closest('button')
      fireEvent.click(copyButton!)

      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument()
      })
    })

    it('should copy username when copy username button is clicked', async () => {
      render(<ProfileShareModal {...defaultProps} />)

      const copyUsernameButton = screen.getByText('Copy username').closest('button')
      fireEvent.click(copyUsernameButton!)

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('@testuser')
      })
    })
  })

  describe('accessibility', () => {
    it('should have heading for the modal', () => {
      render(<ProfileShareModal {...defaultProps} />)
      expect(screen.getByRole('heading', { name: 'Share profile' })).toBeInTheDocument()
    })
  })
})
