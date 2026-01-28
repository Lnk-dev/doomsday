/**
 * ShareModal Component Tests
 *
 * Tests for the ShareModal component which handles post sharing.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ShareModal } from './ShareModal'

describe('ShareModal', () => {
  const defaultProps = {
    postId: 'post-123',
    content: 'This is the content to share',
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
      render(<ShareModal {...defaultProps} />)
      expect(screen.getByText('Share post')).toBeInTheDocument()
    })

    it('should render the post content preview', () => {
      render(<ShareModal {...defaultProps} />)
      expect(screen.getByText('This is the content to share')).toBeInTheDocument()
    })

    it('should render copy link button', () => {
      render(<ShareModal {...defaultProps} />)
      expect(screen.getByText('Copy link')).toBeInTheDocument()
    })

    it('should render share to X button', () => {
      render(<ShareModal {...defaultProps} />)
      expect(screen.getByText('Share to X')).toBeInTheDocument()
    })
  })

  describe('interactions', () => {
    it('should call onClose when backdrop is clicked', () => {
      const onClose = vi.fn()
      render(<ShareModal {...defaultProps} onClose={onClose} />)

      const backdrop = document.querySelector('.bg-black\\/60')
      fireEvent.click(backdrop!)
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should copy link to clipboard when copy link button is clicked', async () => {
      render(<ShareModal {...defaultProps} />)

      const copyButton = screen.getByText('Copy link').closest('button')
      fireEvent.click(copyButton!)

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          expect.stringContaining('/post/post-123')
        )
      })
    })

    it('should show "Copied!" after copying link', async () => {
      render(<ShareModal {...defaultProps} />)

      const copyButton = screen.getByText('Copy link').closest('button')
      fireEvent.click(copyButton!)

      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument()
      })
    })

    it('should open Twitter share in new window', () => {
      render(<ShareModal {...defaultProps} />)

      const twitterButton = screen.getByText('Share to X').closest('button')
      fireEvent.click(twitterButton!)

      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('twitter.com/intent/tweet'),
        '_blank',
        'width=550,height=420'
      )
    })
  })

  describe('accessibility', () => {
    it('should have heading for the modal', () => {
      render(<ShareModal {...defaultProps} />)
      expect(screen.getByRole('heading', { name: 'Share post' })).toBeInTheDocument()
    })
  })
})
