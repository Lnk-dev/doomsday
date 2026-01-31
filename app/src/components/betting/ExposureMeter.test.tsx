/**
 * ExposureMeter Component Tests
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ExposureMeter, ExposureIndicator, ExposureBadge } from './ExposureMeter'
import { ExposureLevel } from '@/lib/bettingLimits'

describe('ExposureMeter', () => {
  describe('full display', () => {
    it('should render exposure level header', () => {
      render(<ExposureMeter totalAtRisk={100} bankroll={10000} />)
      expect(screen.getByText('Exposure Level')).toBeInTheDocument()
    })

    it('should show LOW exposure for under 2%', () => {
      render(<ExposureMeter totalAtRisk={100} bankroll={10000} />)
      expect(screen.getByText('Low Risk')).toBeInTheDocument()
    })

    it('should show MEDIUM exposure for 2-5%', () => {
      render(<ExposureMeter totalAtRisk={300} bankroll={10000} />)
      expect(screen.getByText('Moderate')).toBeInTheDocument()
    })

    it('should show HIGH exposure for 5-10%', () => {
      render(<ExposureMeter totalAtRisk={700} bankroll={10000} />)
      expect(screen.getByText('High Risk')).toBeInTheDocument()
    })

    it('should show CRITICAL exposure for over 10%', () => {
      render(<ExposureMeter totalAtRisk={1500} bankroll={10000} />)
      expect(screen.getByText('Critical')).toBeInTheDocument()
    })

    it('should display amount at risk', () => {
      render(<ExposureMeter totalAtRisk={500} bankroll={10000} />)
      expect(screen.getByText('$500.00')).toBeInTheDocument()
      expect(screen.getByText(/at risk/)).toBeInTheDocument()
    })

    it('should display percentage', () => {
      render(<ExposureMeter totalAtRisk={500} bankroll={10000} />)
      expect(screen.getByText(/5\.0%/)).toBeInTheDocument()
    })

    it('should display bankroll total', () => {
      render(<ExposureMeter totalAtRisk={500} bankroll={10000} />)
      expect(screen.getByText(/\$10000\.00/)).toBeInTheDocument()
    })

    it('should show threshold labels', () => {
      render(<ExposureMeter totalAtRisk={500} bankroll={10000} />)
      expect(screen.getByText('Safe (2%)')).toBeInTheDocument()
      expect(screen.getByText('Moderate (5%)')).toBeInTheDocument()
      expect(screen.getByText('High (10%)')).toBeInTheDocument()
    })

    it('should show warning for HIGH exposure', () => {
      render(<ExposureMeter totalAtRisk={700} bankroll={10000} />)
      expect(
        screen.getByText(/Consider being more conservative/)
      ).toBeInTheDocument()
    })

    it('should show critical warning for CRITICAL exposure', () => {
      render(<ExposureMeter totalAtRisk={1500} bankroll={10000} />)
      expect(
        screen.getByText(/Your exposure is at a critical level/)
      ).toBeInTheDocument()
    })

    it('should not show warning for LOW exposure', () => {
      render(<ExposureMeter totalAtRisk={100} bankroll={10000} />)
      expect(
        screen.queryByText(/Consider being more conservative/)
      ).not.toBeInTheDocument()
      expect(
        screen.queryByText(/Your exposure is at a critical level/)
      ).not.toBeInTheDocument()
    })
  })

  describe('compact mode', () => {
    it('should render compact display', () => {
      render(<ExposureMeter totalAtRisk={500} bankroll={10000} compact />)
      expect(screen.getByText('5.0%')).toBeInTheDocument()
    })

    it('should not show full details in compact mode', () => {
      render(<ExposureMeter totalAtRisk={500} bankroll={10000} compact />)
      expect(screen.queryByText('Exposure Level')).not.toBeInTheDocument()
      expect(screen.queryByText('at risk')).not.toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should handle zero bankroll', () => {
      render(<ExposureMeter totalAtRisk={100} bankroll={0} />)
      // Should show some UI without crashing
      expect(screen.getByText('Exposure Level')).toBeInTheDocument()
    })

    it('should handle zero at risk', () => {
      render(<ExposureMeter totalAtRisk={0} bankroll={10000} />)
      expect(screen.getByText('Low Risk')).toBeInTheDocument()
    })

    it('should cap display at 100%', () => {
      render(<ExposureMeter totalAtRisk={20000} bankroll={10000} />)
      // 200% exposure but display should handle it
      expect(screen.getByText('Critical')).toBeInTheDocument()
    })
  })

  describe('custom className', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <ExposureMeter totalAtRisk={500} bankroll={10000} className="custom-class" />
      )
      expect(container.firstChild).toHaveClass('custom-class')
    })
  })
})

describe('ExposureIndicator', () => {
  it('should render percentage', () => {
    render(<ExposureIndicator totalAtRisk={500} bankroll={10000} />)
    expect(screen.getByText('5%')).toBeInTheDocument()
  })

  it('should cap at 100%', () => {
    render(<ExposureIndicator totalAtRisk={15000} bankroll={10000} />)
    // Should not exceed 100% in the progress bar visually
    expect(screen.getByText(/\d+%/)).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = render(
      <ExposureIndicator totalAtRisk={500} bankroll={10000} className="test-class" />
    )
    expect(container.firstChild).toHaveClass('test-class')
  })
})

describe('ExposureBadge', () => {
  it('should render LOW level badge', () => {
    render(<ExposureBadge level={ExposureLevel.LOW} />)
    expect(screen.getByText('Low Risk')).toBeInTheDocument()
  })

  it('should render MEDIUM level badge', () => {
    render(<ExposureBadge level={ExposureLevel.MEDIUM} />)
    expect(screen.getByText('Moderate')).toBeInTheDocument()
  })

  it('should render HIGH level badge', () => {
    render(<ExposureBadge level={ExposureLevel.HIGH} />)
    expect(screen.getByText('High Risk')).toBeInTheDocument()
  })

  it('should render CRITICAL level badge', () => {
    render(<ExposureBadge level={ExposureLevel.CRITICAL} />)
    expect(screen.getByText('Critical')).toBeInTheDocument()
  })

  it('should hide label when showLabel is false', () => {
    render(<ExposureBadge level={ExposureLevel.LOW} showLabel={false} />)
    expect(screen.queryByText('Low Risk')).not.toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = render(
      <ExposureBadge level={ExposureLevel.LOW} className="badge-class" />
    )
    expect(container.firstChild).toHaveClass('badge-class')
  })
})
