/**
 * BottomNav Component Tests
 *
 * Tests for the BottomNav component which provides the main navigation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { BottomNav } from './BottomNav'

vi.mock('@/store', () => ({
  usePostsStore: vi.fn((selector) => {
    const state = { doomFeed: [], lifeFeed: [], posts: {} }
    return selector(state)
  }),
  useEventsStore: vi.fn((selector) => {
    const state = { events: {} }
    return selector(state)
  }),
}))

const mockLocalStorage = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
}

describe('BottomNav', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    })
  })

  const renderWithRouter = (initialRoute = '/') => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <BottomNav />
      </MemoryRouter>
    )
  }

  describe('rendering', () => {
    it('should render as a nav element', () => {
      renderWithRouter()
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })

    it('should render 5 navigation links', () => {
      renderWithRouter()
      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(5)
    })

    it('should have link to home (/)', () => {
      renderWithRouter()
      const homeLink = screen.getAllByRole('link').find((link) =>
        link.getAttribute('href') === '/'
      )
      expect(homeLink).toBeInTheDocument()
    })

    it('should have link to discover (/discover)', () => {
      renderWithRouter()
      const discoverLink = screen.getAllByRole('link').find((link) =>
        link.getAttribute('href') === '/discover'
      )
      expect(discoverLink).toBeInTheDocument()
    })

    it('should have link to compose (/compose)', () => {
      renderWithRouter()
      const composeLink = screen.getAllByRole('link').find((link) =>
        link.getAttribute('href') === '/compose'
      )
      expect(composeLink).toBeInTheDocument()
    })

    it('should have link to life (/life)', () => {
      renderWithRouter()
      const lifeLink = screen.getAllByRole('link').find((link) =>
        link.getAttribute('href') === '/life'
      )
      expect(lifeLink).toBeInTheDocument()
    })

    it('should have link to profile (/profile)', () => {
      renderWithRouter()
      const profileLink = screen.getAllByRole('link').find((link) =>
        link.getAttribute('href') === '/profile'
      )
      expect(profileLink).toBeInTheDocument()
    })
  })

  describe('active state', () => {
    it('should highlight home link when on home route', () => {
      renderWithRouter('/')
      const homeLink = screen.getAllByRole('link').find((link) =>
        link.getAttribute('href') === '/'
      )
      expect(homeLink).toHaveClass('text-white')
    })

    it('should highlight discover link when on discover route', () => {
      renderWithRouter('/discover')
      const discoverLink = screen.getAllByRole('link').find((link) =>
        link.getAttribute('href') === '/discover'
      )
      expect(discoverLink).toHaveClass('text-white')
    })

    it('should not highlight inactive links', () => {
      renderWithRouter('/')
      const discoverLink = screen.getAllByRole('link').find((link) =>
        link.getAttribute('href') === '/discover'
      )
      expect(discoverLink).toHaveClass('text-[#777]')
    })
  })

  describe('styling', () => {
    it('should be fixed at the bottom', () => {
      renderWithRouter()
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('fixed', 'bottom-0', 'left-0', 'right-0')
    })

    it('should have z-index for layering', () => {
      renderWithRouter()
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('z-50')
    })

    it('should have border at top', () => {
      renderWithRouter()
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('border-t', 'border-[#333]')
    })

    it('should have black background', () => {
      renderWithRouter()
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('bg-black')
    })
  })

  describe('accessibility', () => {
    it('should use semantic nav element', () => {
      renderWithRouter()
      expect(document.querySelector('nav')).toBeInTheDocument()
    })

    it('should have accessible link elements', () => {
      renderWithRouter()
      const links = screen.getAllByRole('link')
      links.forEach((link) => {
        expect(link).toHaveAttribute('href')
      })
    })
  })

  describe('localStorage interaction', () => {
    it('should read last viewed timestamps from localStorage on mount', () => {
      renderWithRouter()
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('doomsday-last-viewed')
    })
  })
})
