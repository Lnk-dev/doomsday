/**
 * ErrorBoundary Component Tests
 *
 * Tests for the ErrorBoundary component which catches errors and displays fallback UI.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorBoundary } from './ErrorBoundary'

const ThrowingComponent = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message')
  }
  return <div data-testid="child-content">Normal content</div>
}

let consoleErrorSpy: ReturnType<typeof vi.spyOn>

describe('ErrorBoundary', () => {
  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  describe('normal rendering', () => {
    it('should render children when there is no error', () => {
      render(
        <ErrorBoundary>
          <div data-testid="child-content">Child content</div>
        </ErrorBoundary>
      )

      expect(screen.getByTestId('child-content')).toBeInTheDocument()
      expect(screen.getByText('Child content')).toBeInTheDocument()
    })

    it('should render multiple children', () => {
      render(
        <ErrorBoundary>
          <div data-testid="child-1">First</div>
          <div data-testid="child-2">Second</div>
        </ErrorBoundary>
      )

      expect(screen.getByTestId('child-1')).toBeInTheDocument()
      expect(screen.getByTestId('child-2')).toBeInTheDocument()
    })
  })

  describe('error handling', () => {
    it('should catch errors from children', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })

    it('should display error message', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      )

      expect(
        screen.getByText(
          'The app encountered an unexpected error. This has been logged for investigation.'
        )
      ).toBeInTheDocument()
    })

    it('should show error details', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      )

      const details = screen.getByText('Error details')
      fireEvent.click(details)

      expect(screen.getByText('Test error message')).toBeInTheDocument()
    })
  })

  describe('fallback UI', () => {
    it('should show default error UI when no fallback provided', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument()
    })

    it('should show custom fallback when provided', () => {
      render(
        <ErrorBoundary fallback={<div data-testid="custom-fallback">Custom error</div>}>
          <ThrowingComponent />
        </ErrorBoundary>
      )

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument()
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
    })
  })

  describe('error recovery', () => {
    it('should render Try Again button', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      )

      expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument()
    })

    it('should render Reload App button', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      )

      expect(screen.getByRole('button', { name: /Reload App/i })).toBeInTheDocument()
    })
  })

  describe('styling', () => {
    it('should have full screen height error container', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      )

      const container = document.querySelector('.min-h-screen')
      expect(container).toBeInTheDocument()
    })

    it('should have black background', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      )

      const container = document.querySelector('.bg-black')
      expect(container).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('should have heading for error message', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      )

      expect(
        screen.getByRole('heading', { name: 'Something went wrong' })
      ).toBeInTheDocument()
    })

    it('should have accessible buttons', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      )

      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(2)
    })
  })
})
