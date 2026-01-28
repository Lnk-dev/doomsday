/**
 * PageHeader Component Tests
 *
 * Tests for the PageHeader component which displays page titles and actions.
 * Issue #112: Add component unit tests with React Testing Library
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PageHeader } from './PageHeader'

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('PageHeader', () => {
  describe('rendering', () => {
    it('should render as a header element', () => {
      renderWithRouter(<PageHeader title="Test Page" />)
      expect(screen.getByRole('banner')).toBeInTheDocument()
    })

    it('should render the title', () => {
      renderWithRouter(<PageHeader title="Test Page" />)
      expect(screen.getByText('Test Page')).toBeInTheDocument()
    })

    it('should not render title when showLogo is true', () => {
      renderWithRouter(<PageHeader title="Test Page" showLogo={true} />)
      expect(screen.queryByText('Test Page')).not.toBeInTheDocument()
    })

    it('should render logo when showLogo is true', () => {
      renderWithRouter(<PageHeader showLogo={true} />)
      const logo = document.querySelector('svg.w-8.h-8')
      expect(logo).toBeInTheDocument()
    })

    it('should not render logo when showLogo is false', () => {
      renderWithRouter(<PageHeader title="Test" showLogo={false} />)
      const logo = document.querySelector('svg.w-8.h-8')
      expect(logo).not.toBeInTheDocument()
    })
  })

  describe('action slots', () => {
    it('should render left action when provided', () => {
      renderWithRouter(
        <PageHeader
          title="Test"
          leftAction={<button data-testid="left-action">Back</button>}
        />
      )
      expect(screen.getByTestId('left-action')).toBeInTheDocument()
    })

    it('should render right action when provided', () => {
      renderWithRouter(
        <PageHeader
          title="Test"
          rightAction={<button data-testid="right-action">Settings</button>}
        />
      )
      expect(screen.getByTestId('right-action')).toBeInTheDocument()
    })

    it('should render both left and right actions', () => {
      renderWithRouter(
        <PageHeader
          title="Test"
          leftAction={<button data-testid="left-action">Back</button>}
          rightAction={<button data-testid="right-action">Settings</button>}
        />
      )
      expect(screen.getByTestId('left-action')).toBeInTheDocument()
      expect(screen.getByTestId('right-action')).toBeInTheDocument()
    })
  })

  describe('styling', () => {
    it('should have sticky positioning', () => {
      renderWithRouter(<PageHeader title="Test" />)
      const header = screen.getByRole('banner')
      expect(header).toHaveClass('sticky')
      expect(header).toHaveClass('top-0')
    })

    it('should have z-index for layering', () => {
      renderWithRouter(<PageHeader title="Test" />)
      const header = screen.getByRole('banner')
      expect(header).toHaveClass('z-40')
    })

    it('should have backdrop blur', () => {
      renderWithRouter(<PageHeader title="Test" />)
      const header = screen.getByRole('banner')
      expect(header).toHaveClass('backdrop-blur-xl')
    })

    it('should have semi-transparent background', () => {
      renderWithRouter(<PageHeader title="Test" />)
      const header = screen.getByRole('banner')
      expect(header).toHaveClass('bg-black/80')
    })
  })

  describe('accessibility', () => {
    it('should use semantic header element', () => {
      renderWithRouter(<PageHeader title="Test" />)
      expect(document.querySelector('header')).toBeInTheDocument()
    })

    it('should use h1 for title', () => {
      renderWithRouter(<PageHeader title="Test" />)
      const heading = document.querySelector('h1')
      expect(heading).toBeInTheDocument()
      expect(heading).toHaveTextContent('Test')
    })
  })

  describe('layout', () => {
    it('should center the title', () => {
      renderWithRouter(<PageHeader title="Test" />)
      const centerContainer = screen.getByRole('heading').parentElement
      expect(centerContainer).toHaveClass('flex-1')
      expect(centerContainer).toHaveClass('flex')
      expect(centerContainer).toHaveClass('justify-center')
    })

    it('should have correct header height', () => {
      renderWithRouter(<PageHeader title="Test" />)
      const innerContainer = document.querySelector('.h-14')
      expect(innerContainer).toBeInTheDocument()
    })

    it('should have horizontal padding', () => {
      renderWithRouter(<PageHeader title="Test" />)
      const innerContainer = document.querySelector('.px-4')
      expect(innerContainer).toBeInTheDocument()
    })
  })

  describe('navigation actions', () => {
    it('should render back button when provided as left action', () => {
      const handleBack = vi.fn()
      renderWithRouter(
        <PageHeader
          title="Test"
          leftAction={
            <button onClick={handleBack} data-testid="back-button">
              Back
            </button>
          }
        />
      )

      const backButton = screen.getByTestId('back-button')
      fireEvent.click(backButton)
      expect(handleBack).toHaveBeenCalledTimes(1)
    })

    it('should render settings button when provided as right action', () => {
      const handleSettings = vi.fn()
      renderWithRouter(
        <PageHeader
          title="Test"
          rightAction={
            <button onClick={handleSettings} data-testid="settings-button">
              Settings
            </button>
          }
        />
      )

      const settingsButton = screen.getByTestId('settings-button')
      fireEvent.click(settingsButton)
      expect(handleSettings).toHaveBeenCalledTimes(1)
    })
  })

  describe('logo rendering', () => {
    it('should render logo with correct aria-label', () => {
      renderWithRouter(<PageHeader showLogo={true} />)
      const logo = screen.getByLabelText('Doomsday logo')
      expect(logo).toBeInTheDocument()
    })

    it('should render logo with role="img"', () => {
      renderWithRouter(<PageHeader showLogo={true} />)
      const logo = screen.getByRole('img', { name: 'Doomsday logo' })
      expect(logo).toBeInTheDocument()
    })
  })

  describe('title rendering', () => {
    it('should render different titles correctly', () => {
      const { rerender } = renderWithRouter(<PageHeader title="Profile" />)
      expect(screen.getByText('Profile')).toBeInTheDocument()

      rerender(
        <MemoryRouter>
          <PageHeader title="Settings" />
        </MemoryRouter>
      )
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })

    it('should have correct font styling on title', () => {
      renderWithRouter(<PageHeader title="Test" />)
      const title = screen.getByRole('heading')
      expect(title).toHaveClass('font-semibold')
      expect(title).toHaveClass('text-white')
    })
  })
})
