/**
 * AppLayout Component Tests
 *
 * Tests for the AppLayout component which provides the main layout structure.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AppLayout } from './AppLayout'

// Mock the useWallet hook to prevent Solana wallet adapter complexity
vi.mock('@/hooks/useWallet', () => ({
  useWallet: vi.fn(() => ({
    connected: false,
    connecting: false,
    publicKey: null,
    walletAddress: null,
    solBalance: null,
    doomBalance: null,
    lifeBalance: null,
    isConnecting: false,
    connectionError: null,
    wallets: [],
    wallet: null,
    select: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    refreshBalances: vi.fn(),
  })),
}))

vi.mock('@/store', () => ({
  usePostsStore: vi.fn((selector) => {
    const state = { doomFeed: [], lifeFeed: [], posts: {} }
    return selector(state)
  }),
  useEventsStore: vi.fn((selector) => {
    const state = { events: {} }
    return selector(state)
  }),
  useUserStore: vi.fn((selector) => {
    const state = {
      author: { id: '1', username: 'testuser', displayName: 'Test User' },
      isConnected: false,
      walletAddress: null,
    }
    return selector(state)
  }),
}))

const mockLocalStorage = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
}

describe('AppLayout', () => {
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
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<div data-testid="home-page">Home Page</div>} />
            <Route path="/events" element={<div data-testid="discover-page">Discover Page</div>} />
            <Route path="/compose" element={<div data-testid="compose-page">Compose Page</div>} />
            <Route path="/life" element={<div data-testid="life-page">Life Page</div>} />
            <Route path="/profile" element={<div data-testid="profile-page">Profile Page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )
  }

  describe('rendering', () => {
    it('should render the main container', () => {
      renderWithRouter()
      const container = document.querySelector('.flex.min-h-screen')
      expect(container).toBeInTheDocument()
    })

    it('should render the main content area', () => {
      renderWithRouter()
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should render navigation elements', () => {
      renderWithRouter()
      // Both BottomNav and DesktopSidebar have nav elements
      const navElements = screen.getAllByRole('navigation')
      expect(navElements.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('outlet rendering', () => {
    it('should render home page at root route', () => {
      renderWithRouter('/')
      expect(screen.getByTestId('home-page')).toBeInTheDocument()
    })

    it('should render discover page at /events route', () => {
      renderWithRouter('/events')
      expect(screen.getByTestId('discover-page')).toBeInTheDocument()
    })

    it('should render compose page at /compose route', () => {
      renderWithRouter('/compose')
      expect(screen.getByTestId('compose-page')).toBeInTheDocument()
    })

    it('should render life page at /life route', () => {
      renderWithRouter('/life')
      expect(screen.getByTestId('life-page')).toBeInTheDocument()
    })

    it('should render profile page at /profile route', () => {
      renderWithRouter('/profile')
      expect(screen.getByTestId('profile-page')).toBeInTheDocument()
    })
  })

  describe('styling', () => {
    it('should have flex layout', () => {
      renderWithRouter()
      const container = document.querySelector('.flex.min-h-screen')
      expect(container).toBeInTheDocument()
    })

    it('should have minimum full screen height', () => {
      renderWithRouter()
      const container = document.querySelector('.min-h-screen')
      expect(container).toBeInTheDocument()
    })

    it('should have black background', () => {
      renderWithRouter()
      const container = document.querySelector('.bg-black')
      expect(container).toBeInTheDocument()
    })

    it('should have main content as flex-1', () => {
      renderWithRouter()
      const main = screen.getByRole('main')
      expect(main).toHaveClass('flex-1')
    })

    it('should have bottom padding for nav', () => {
      renderWithRouter()
      const main = screen.getByRole('main')
      expect(main).toHaveClass('pb-16')
    })

    it('should have vertical scroll overflow', () => {
      renderWithRouter()
      const main = screen.getByRole('main')
      expect(main).toHaveClass('overflow-y-auto')
    })
  })

  describe('accessibility', () => {
    it('should have semantic main element', () => {
      renderWithRouter()
      expect(document.querySelector('main')).toBeInTheDocument()
    })

    it('should have semantic nav element', () => {
      renderWithRouter()
      expect(document.querySelector('nav')).toBeInTheDocument()
    })
  })
})
