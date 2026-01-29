/**
 * EmailVerificationPage Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { EmailVerificationPage } from './EmailVerificationPage'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('EmailVerificationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderWithRouter = (initialEntries: string[]) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/verify-email" element={<EmailVerificationPage />} />
        </Routes>
      </MemoryRouter>
    )
  }

  describe('no token state', () => {
    it('should show no token message when token is missing', () => {
      renderWithRouter(['/verify-email'])

      expect(screen.getByText('No Token Provided')).toBeInTheDocument()
      expect(screen.getByText(/This page is used to verify your email/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Go Home' })).toBeInTheDocument()
    })
  })

  describe('loading state', () => {
    it('should show loading state while verifying', () => {
      mockFetch.mockImplementation(() => new Promise(() => {})) // Never resolves

      renderWithRouter(['/verify-email?token=test-token'])

      expect(screen.getByText('Verifying your email...')).toBeInTheDocument()
      expect(screen.getByText(/Please wait while we verify/)).toBeInTheDocument()
    })
  })

  describe('success state', () => {
    it('should show success message on successful verification', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Email verified successfully!' }),
      })

      renderWithRouter(['/verify-email?token=valid-token'])

      await waitFor(() => {
        expect(screen.getByText('Email Verified!')).toBeInTheDocument()
      })

      expect(screen.getByText('Email verified successfully!')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Go to Profile' })).toBeInTheDocument()
    })

    it('should use default message if none provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      renderWithRouter(['/verify-email?token=valid-token'])

      await waitFor(() => {
        expect(screen.getByText('Email Verified!')).toBeInTheDocument()
      })

      expect(screen.getByText('Email verified successfully!')).toBeInTheDocument()
    })
  })

  describe('error state', () => {
    it('should show error message on failed verification', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid token' }),
      })

      renderWithRouter(['/verify-email?token=invalid-token'])

      await waitFor(() => {
        expect(screen.getByText('Verification Failed')).toBeInTheDocument()
      })

      expect(screen.getByText('Invalid token')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Go to Settings' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument()
    })

    it('should use default error message if none provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      })

      renderWithRouter(['/verify-email?token=invalid-token'])

      await waitFor(() => {
        expect(screen.getByText('Failed to verify email')).toBeInTheDocument()
      })
    })

    it('should show network error on fetch failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      renderWithRouter(['/verify-email?token=test-token'])

      await waitFor(() => {
        expect(screen.getByText('Verification Failed')).toBeInTheDocument()
      })

      expect(screen.getByText('Network error. Please try again.')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('should have main landmark', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Success' }),
      })

      renderWithRouter(['/verify-email?token=test'])

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('should have aria-live for status updates', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Success' }),
      })

      renderWithRouter(['/verify-email?token=test'])

      await waitFor(() => {
        expect(screen.getByRole('main')).toHaveAttribute('aria-live', 'polite')
      })
    })

    it('should mark error message with role alert', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Error message' }),
      })

      renderWithRouter(['/verify-email?token=test'])

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Error message')
      })
    })
  })
})
