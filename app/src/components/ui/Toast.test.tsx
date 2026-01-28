/**
 * Toast Component Tests
 *
 * Tests for the Toast notification component and ToastContainer.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Toast } from './Toast'
import { ToastContainer } from './ToastContainer'
import type { Toast as ToastData } from '@/store/toast'

vi.mock('@/store/toast', () => ({
  useToastStore: vi.fn(),
}))

import { useToastStore } from '@/store/toast'

describe('Toast', () => {
  const mockOnDismiss = vi.fn()

  const createToast = (overrides: Partial<ToastData> = {}): ToastData => ({
    id: 'toast-1',
    message: 'Test toast message',
    type: 'info',
    duration: 4000,
    createdAt: Date.now(),
    ...overrides,
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render the toast message', () => {
      render(<Toast toast={createToast()} onDismiss={mockOnDismiss} />)
      expect(screen.getByText('Test toast message')).toBeInTheDocument()
    })

    it('should render as an alert role', () => {
      render(<Toast toast={createToast()} onDismiss={mockOnDismiss} />)
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('should have aria-live polite for accessibility', () => {
      render(<Toast toast={createToast()} onDismiss={mockOnDismiss} />)
      expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'polite')
    })

    it('should render dismiss button', () => {
      render(<Toast toast={createToast()} onDismiss={mockOnDismiss} />)
      expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument()
    })
  })

  describe('toast types', () => {
    it('should render success icon for success type', () => {
      const { container } = render(
        <Toast toast={createToast({ type: 'success' })} onDismiss={mockOnDismiss} />
      )
      expect(container.querySelector('.text-\\[\\#00ba7c\\]')).toBeInTheDocument()
    })

    it('should render error icon for error type', () => {
      const { container } = render(
        <Toast toast={createToast({ type: 'error' })} onDismiss={mockOnDismiss} />
      )
      expect(container.querySelector('.text-\\[\\#ff3040\\]')).toBeInTheDocument()
    })

    it('should render warning icon for warning type', () => {
      const { container } = render(
        <Toast toast={createToast({ type: 'warning' })} onDismiss={mockOnDismiss} />
      )
      expect(container.querySelector('.text-\\[\\#ffad1f\\]')).toBeInTheDocument()
    })

    it('should render info icon for info type', () => {
      const { container } = render(
        <Toast toast={createToast({ type: 'info' })} onDismiss={mockOnDismiss} />
      )
      expect(container.querySelector('.text-\\[\\#1d9bf0\\]')).toBeInTheDocument()
    })
  })

  describe('border colors by type', () => {
    it('should have green left border for success', () => {
      const { container } = render(
        <Toast toast={createToast({ type: 'success' })} onDismiss={mockOnDismiss} />
      )
      expect(container.querySelector('.border-l-\\[\\#00ba7c\\]')).toBeInTheDocument()
    })

    it('should have red left border for error', () => {
      const { container } = render(
        <Toast toast={createToast({ type: 'error' })} onDismiss={mockOnDismiss} />
      )
      expect(container.querySelector('.border-l-\\[\\#ff3040\\]')).toBeInTheDocument()
    })

    it('should have yellow left border for warning', () => {
      const { container } = render(
        <Toast toast={createToast({ type: 'warning' })} onDismiss={mockOnDismiss} />
      )
      expect(container.querySelector('.border-l-\\[\\#ffad1f\\]')).toBeInTheDocument()
    })

    it('should have blue left border for info', () => {
      const { container } = render(
        <Toast toast={createToast({ type: 'info' })} onDismiss={mockOnDismiss} />
      )
      expect(container.querySelector('.border-l-\\[\\#1d9bf0\\]')).toBeInTheDocument()
    })
  })

  describe('interactions', () => {
    it('should call onDismiss with toast id when dismiss button is clicked', () => {
      render(<Toast toast={createToast({ id: 'test-id' })} onDismiss={mockOnDismiss} />)

      const dismissButton = screen.getByRole('button', { name: /dismiss/i })
      fireEvent.click(dismissButton)

      expect(mockOnDismiss).toHaveBeenCalledWith('test-id')
      expect(mockOnDismiss).toHaveBeenCalledTimes(1)
    })
  })

  describe('styling', () => {
    it('should have rounded corners', () => {
      const { container } = render(
        <Toast toast={createToast()} onDismiss={mockOnDismiss} />
      )
      expect(container.querySelector('.rounded-lg')).toBeInTheDocument()
    })

    it('should have shadow for elevation', () => {
      const { container } = render(
        <Toast toast={createToast()} onDismiss={mockOnDismiss} />
      )
      expect(container.querySelector('.shadow-lg')).toBeInTheDocument()
    })

    it('should have dark background', () => {
      const { container } = render(
        <Toast toast={createToast()} onDismiss={mockOnDismiss} />
      )
      expect(container.querySelector('.bg-\\[\\#1a1a1a\\]')).toBeInTheDocument()
    })

    it('should have border styling', () => {
      const { container } = render(
        <Toast toast={createToast()} onDismiss={mockOnDismiss} />
      )
      expect(container.querySelector('.border')).toBeInTheDocument()
      expect(container.querySelector('.border-l-4')).toBeInTheDocument()
    })
  })
})

describe('ToastContainer', () => {
  const mockRemoveToast = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return null when no toasts', () => {
    vi.mocked(useToastStore).mockImplementation((selector) => {
      const state = { toasts: [], removeToast: mockRemoveToast }
      return selector(state as never)
    })

    const { container } = render(<ToastContainer />)
    expect(container.firstChild).toBeNull()
  })

  it('should render toasts when present', () => {
    const toasts: ToastData[] = [
      { id: '1', message: 'First toast', type: 'success', duration: 4000, createdAt: Date.now() },
      { id: '2', message: 'Second toast', type: 'error', duration: 4000, createdAt: Date.now() },
    ]

    vi.mocked(useToastStore).mockImplementation((selector) => {
      const state = { toasts, removeToast: mockRemoveToast }
      return selector(state as never)
    })

    render(<ToastContainer />)

    expect(screen.getByText('First toast')).toBeInTheDocument()
    expect(screen.getByText('Second toast')).toBeInTheDocument()
  })

  it('should have fixed positioning at top right', () => {
    const toasts: ToastData[] = [
      { id: '1', message: 'Test toast', type: 'info', duration: 4000, createdAt: Date.now() },
    ]

    vi.mocked(useToastStore).mockImplementation((selector) => {
      const state = { toasts, removeToast: mockRemoveToast }
      return selector(state as never)
    })

    const { container } = render(<ToastContainer />)
    const toastContainer = container.querySelector('.fixed')
    expect(toastContainer).toBeInTheDocument()
    expect(toastContainer).toHaveClass('top-4', 'right-4')
  })

  it('should have high z-index for layering', () => {
    const toasts: ToastData[] = [
      { id: '1', message: 'Test toast', type: 'info', duration: 4000, createdAt: Date.now() },
    ]

    vi.mocked(useToastStore).mockImplementation((selector) => {
      const state = { toasts, removeToast: mockRemoveToast }
      return selector(state as never)
    })

    const { container } = render(<ToastContainer />)
    expect(container.querySelector('.z-50')).toBeInTheDocument()
  })

  it('should have aria-label for accessibility', () => {
    const toasts: ToastData[] = [
      { id: '1', message: 'Test toast', type: 'info', duration: 4000, createdAt: Date.now() },
    ]

    vi.mocked(useToastStore).mockImplementation((selector) => {
      const state = { toasts, removeToast: mockRemoveToast }
      return selector(state as never)
    })

    render(<ToastContainer />)
    expect(screen.getByLabelText('Notifications')).toBeInTheDocument()
  })

  it('should stack toasts vertically', () => {
    const toasts: ToastData[] = [
      { id: '1', message: 'First', type: 'info', duration: 4000, createdAt: Date.now() },
      { id: '2', message: 'Second', type: 'info', duration: 4000, createdAt: Date.now() },
    ]

    vi.mocked(useToastStore).mockImplementation((selector) => {
      const state = { toasts, removeToast: mockRemoveToast }
      return selector(state as never)
    })

    const { container } = render(<ToastContainer />)
    expect(container.querySelector('.flex-col')).toBeInTheDocument()
    expect(container.querySelector('.gap-2')).toBeInTheDocument()
  })

  it('should pass removeToast to Toast onDismiss', () => {
    const toasts: ToastData[] = [
      { id: 'test-id', message: 'Test', type: 'info', duration: 4000, createdAt: Date.now() },
    ]

    vi.mocked(useToastStore).mockImplementation((selector) => {
      const state = { toasts, removeToast: mockRemoveToast }
      return selector(state as never)
    })

    render(<ToastContainer />)

    const dismissButton = screen.getByRole('button', { name: /dismiss/i })
    fireEvent.click(dismissButton)

    expect(mockRemoveToast).toHaveBeenCalledWith('test-id')
  })
})

describe('accessibility', () => {
  const mockOnDismiss = vi.fn()

  it('should use role="alert" for screen reader announcement', () => {
    const toast: ToastData = {
      id: '1',
      message: 'Important notification',
      type: 'error',
      duration: 4000,
      createdAt: Date.now(),
    }

    render(<Toast toast={toast} onDismiss={mockOnDismiss} />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('should have aria-label on dismiss button', () => {
    const toast: ToastData = {
      id: '1',
      message: 'Test',
      type: 'info',
      duration: 4000,
      createdAt: Date.now(),
    }

    render(<Toast toast={toast} onDismiss={mockOnDismiss} />)
    expect(screen.getByRole('button', { name: /dismiss notification/i })).toBeInTheDocument()
  })

  it('should have pointer-events-none on container for passthrough clicks', () => {
    const mockRemoveToast = vi.fn()
    const toasts: ToastData[] = [
      { id: '1', message: 'Test', type: 'info', duration: 4000, createdAt: Date.now() },
    ]

    vi.mocked(useToastStore).mockImplementation((selector) => {
      const state = { toasts, removeToast: mockRemoveToast }
      return selector(state as never)
    })

    const { container } = render(<ToastContainer />)
    expect(container.querySelector('.pointer-events-none')).toBeInTheDocument()
  })

  it('should have pointer-events-auto on individual toasts for interaction', () => {
    const mockRemoveToast = vi.fn()
    const toasts: ToastData[] = [
      { id: '1', message: 'Test', type: 'info', duration: 4000, createdAt: Date.now() },
    ]

    vi.mocked(useToastStore).mockImplementation((selector) => {
      const state = { toasts, removeToast: mockRemoveToast }
      return selector(state as never)
    })

    const { container } = render(<ToastContainer />)
    expect(container.querySelector('.pointer-events-auto')).toBeInTheDocument()
  })
})
