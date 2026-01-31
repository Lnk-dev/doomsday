/**
 * BetLimitCard Component Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { BetLimitCard, LimitStatusBadge } from './BetLimitCard'
import { useResponsibleGamblingStore } from '@/store/responsibleGambling'

// Mock navigation
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('BetLimitCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset store state
    useResponsibleGamblingStore.setState({
      limits: {
        daily: { type: 'daily', amount: null, currentUsage: 0, periodStart: Date.now() },
        weekly: { type: 'weekly', amount: null, currentUsage: 0, periodStart: Date.now() },
        monthly: { type: 'monthly', amount: null, currentUsage: 0, periodStart: Date.now() },
      },
    })
  })

  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<MemoryRouter>{ui}</MemoryRouter>)
  }

  describe('when no limits are set', () => {
    it('should show "No limits configured" message', () => {
      renderWithRouter(<BetLimitCard />)
      expect(screen.getByText('No limits configured')).toBeInTheDocument()
    })

    it('should show "Set Limits" button', () => {
      renderWithRouter(<BetLimitCard />)
      expect(screen.getByRole('button', { name: 'Set Limits' })).toBeInTheDocument()
    })

    it('should navigate to settings when Set Limits is clicked', () => {
      renderWithRouter(<BetLimitCard />)
      fireEvent.click(screen.getByRole('button', { name: 'Set Limits' }))
      expect(mockNavigate).toHaveBeenCalledWith('/settings/betting-limits')
    })
  })

  describe('when limits are set', () => {
    beforeEach(() => {
      useResponsibleGamblingStore.setState({
        limits: {
          daily: { type: 'daily', amount: 100, currentUsage: 50, periodStart: Date.now() },
          weekly: { type: 'weekly', amount: 500, currentUsage: 200, periodStart: Date.now() },
          monthly: { type: 'monthly', amount: 1000, currentUsage: 400, periodStart: Date.now() },
        },
      })
    })

    it('should show all limit labels', () => {
      renderWithRouter(<BetLimitCard />)
      expect(screen.getByText('Daily Limit')).toBeInTheDocument()
      expect(screen.getByText('Weekly Limit')).toBeInTheDocument()
      expect(screen.getByText('Monthly Limit')).toBeInTheDocument()
    })

    it('should show usage amounts', () => {
      renderWithRouter(<BetLimitCard />)
      expect(screen.getByText('$50.00 / $100.00')).toBeInTheDocument()
      expect(screen.getByText('$200.00 / $500.00')).toBeInTheDocument()
      expect(screen.getByText('$400.00 / $1000.00')).toBeInTheDocument()
    })

    it('should show percentage used', () => {
      renderWithRouter(<BetLimitCard />)
      expect(screen.getByText('50% used this day')).toBeInTheDocument()
      expect(screen.getByText('40% used this week')).toBeInTheDocument()
      expect(screen.getByText('40% used this month')).toBeInTheDocument()
    })

    it('should show remaining amounts', () => {
      renderWithRouter(<BetLimitCard />)
      expect(screen.getByText('$50.00 remaining')).toBeInTheDocument()
      expect(screen.getByText('$300.00 remaining')).toBeInTheDocument()
      expect(screen.getByText('$600.00 remaining')).toBeInTheDocument()
    })

    it('should show Edit button', () => {
      renderWithRouter(<BetLimitCard />)
      expect(screen.getByRole('button', { name: /Edit/i })).toBeInTheDocument()
    })

    it('should hide Edit button when hideEditButton is true', () => {
      renderWithRouter(<BetLimitCard hideEditButton />)
      expect(screen.queryByRole('button', { name: /Edit/i })).not.toBeInTheDocument()
    })
  })

  describe('when near limits', () => {
    beforeEach(() => {
      useResponsibleGamblingStore.setState({
        limits: {
          daily: { type: 'daily', amount: 100, currentUsage: 85, periodStart: Date.now() },
          weekly: { type: 'weekly', amount: 500, currentUsage: 200, periodStart: Date.now() },
          monthly: { type: 'monthly', amount: 1000, currentUsage: 400, periodStart: Date.now() },
        },
      })
    })

    it('should show warning message when near limit', () => {
      renderWithRouter(<BetLimitCard />)
      expect(
        screen.getByText(/You are approaching one or more of your betting limits/)
      ).toBeInTheDocument()
    })
  })

  describe('compact mode', () => {
    it('should show compact card', () => {
      renderWithRouter(<BetLimitCard compact />)
      expect(screen.getByText('Betting Limits')).toBeInTheDocument()
    })

    it('should show "No limits set" when no limits configured', () => {
      renderWithRouter(<BetLimitCard compact />)
      expect(screen.getByText('No limits set')).toBeInTheDocument()
    })

    it('should show "Limits configured" when limits are set', () => {
      useResponsibleGamblingStore.setState({
        limits: {
          daily: { type: 'daily', amount: 100, currentUsage: 0, periodStart: Date.now() },
          weekly: { type: 'weekly', amount: null, currentUsage: 0, periodStart: Date.now() },
          monthly: { type: 'monthly', amount: null, currentUsage: 0, periodStart: Date.now() },
        },
      })
      renderWithRouter(<BetLimitCard compact />)
      expect(screen.getByText('Limits configured')).toBeInTheDocument()
    })

    it('should navigate on click in compact mode', () => {
      renderWithRouter(<BetLimitCard compact />)
      fireEvent.click(screen.getByText('Betting Limits'))
      expect(mockNavigate).toHaveBeenCalledWith('/settings/betting-limits')
    })
  })

  describe('no limit set for a specific period', () => {
    beforeEach(() => {
      useResponsibleGamblingStore.setState({
        limits: {
          daily: { type: 'daily', amount: 100, currentUsage: 50, periodStart: Date.now() },
          weekly: { type: 'weekly', amount: null, currentUsage: 0, periodStart: Date.now() },
          monthly: { type: 'monthly', amount: 1000, currentUsage: 400, periodStart: Date.now() },
        },
      })
    })

    it('should show "No limit set" for period without limit', () => {
      renderWithRouter(<BetLimitCard />)
      expect(screen.getByText('No limit set')).toBeInTheDocument()
    })
  })
})

describe('LimitStatusBadge', () => {
  beforeEach(() => {
    useResponsibleGamblingStore.setState({
      limits: {
        daily: { type: 'daily', amount: null, currentUsage: 0, periodStart: Date.now() },
        weekly: { type: 'weekly', amount: null, currentUsage: 0, periodStart: Date.now() },
        monthly: { type: 'monthly', amount: null, currentUsage: 0, periodStart: Date.now() },
      },
    })
  })

  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<MemoryRouter>{ui}</MemoryRouter>)
  }

  it('should return null when no limits set', () => {
    const { container } = renderWithRouter(<LimitStatusBadge />)
    expect(container.firstChild).toBeNull()
  })

  it('should show percentage when limits are set', () => {
    useResponsibleGamblingStore.setState({
      limits: {
        daily: { type: 'daily', amount: 100, currentUsage: 50, periodStart: Date.now() },
        weekly: { type: 'weekly', amount: null, currentUsage: 0, periodStart: Date.now() },
        monthly: { type: 'monthly', amount: null, currentUsage: 0, periodStart: Date.now() },
      },
    })
    renderWithRouter(<LimitStatusBadge />)
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('should show highest percentage across all limits', () => {
    useResponsibleGamblingStore.setState({
      limits: {
        daily: { type: 'daily', amount: 100, currentUsage: 50, periodStart: Date.now() },
        weekly: { type: 'weekly', amount: 500, currentUsage: 400, periodStart: Date.now() },
        monthly: { type: 'monthly', amount: 1000, currentUsage: 100, periodStart: Date.now() },
      },
    })
    renderWithRouter(<LimitStatusBadge />)
    expect(screen.getByText('80%')).toBeInTheDocument()
  })
})
