/**
 * Skeleton Components Tests
 *
 * Tests for the Skeleton loading placeholder components.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  Skeleton,
  ThreadPostSkeleton,
  EventCardSkeleton,
  ProfileSkeleton,
  ProfileStatsSkeleton,
  LeaderboardEntrySkeleton,
  LeaderboardSkeleton,
  LeaderboardRankCardSkeleton,
  FeedSkeleton,
  EventListSkeleton,
} from './Skeleton'

describe('Skeleton', () => {
  describe('base component', () => {
    it('should render a div element', () => {
      const { container } = render(<Skeleton />)
      expect(container.querySelector('div')).toBeInTheDocument()
    })

    it('should have aria-hidden attribute for accessibility', () => {
      const { container } = render(<Skeleton />)
      expect(container.querySelector('div')).toHaveAttribute('aria-hidden', 'true')
    })

    it('should apply shimmer animation by default', () => {
      const { container } = render(<Skeleton />)
      expect(container.querySelector('.skeleton-shimmer')).toBeInTheDocument()
    })

    it('should apply pulse animation when specified', () => {
      const { container } = render(<Skeleton animation="pulse" />)
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      const { container } = render(<Skeleton className="custom-class" />)
      expect(container.querySelector('.custom-class')).toBeInTheDocument()
    })
  })

  describe('variants', () => {
    it('should apply rounded-full for circle variant', () => {
      const { container } = render(<Skeleton variant="circle" />)
      expect(container.querySelector('.rounded-full')).toBeInTheDocument()
    })

    it('should apply rounded for text variant', () => {
      const { container } = render(<Skeleton variant="text" />)
      expect(container.querySelector('.rounded')).toBeInTheDocument()
    })

    it('should apply rounded-lg for rectangle variant', () => {
      const { container } = render(<Skeleton variant="rectangle" />)
      expect(container.querySelector('.rounded-lg')).toBeInTheDocument()
    })

    it('should use rectangle variant by default', () => {
      const { container } = render(<Skeleton />)
      expect(container.querySelector('.rounded-lg')).toBeInTheDocument()
    })
  })

  describe('dimensions', () => {
    it('should apply width as pixels when number', () => {
      const { container } = render(<Skeleton width={100} />)
      const skeleton = container.querySelector('div')
      expect(skeleton).toHaveStyle({ width: '100px' })
    })

    it('should apply height as pixels when number', () => {
      const { container } = render(<Skeleton height={50} />)
      const skeleton = container.querySelector('div')
      expect(skeleton).toHaveStyle({ height: '50px' })
    })

    it('should apply width as string when provided', () => {
      const { container } = render(<Skeleton width="100%" />)
      const skeleton = container.querySelector('div')
      expect(skeleton).toHaveStyle({ width: '100%' })
    })

    it('should apply height as string when provided', () => {
      const { container } = render(<Skeleton height="50%" />)
      const skeleton = container.querySelector('div')
      expect(skeleton).toHaveStyle({ height: '50%' })
    })
  })
})

describe('ThreadPostSkeleton', () => {
  it('should render an article element', () => {
    render(<ThreadPostSkeleton />)
    expect(screen.getByRole('article')).toBeInTheDocument()
  })

  it('should render avatar skeleton', () => {
    const { container } = render(<ThreadPostSkeleton />)
    const avatarSkeleton = container.querySelector('.rounded-full')
    expect(avatarSkeleton).toBeInTheDocument()
  })

  it('should render multiple text skeletons for content', () => {
    const { container } = render(<ThreadPostSkeleton />)
    const textSkeletons = container.querySelectorAll('.rounded')
    expect(textSkeletons.length).toBeGreaterThan(3)
  })

  it('should render action button skeletons', () => {
    const { container } = render(<ThreadPostSkeleton />)
    const circles = container.querySelectorAll('.rounded-full')
    expect(circles.length).toBeGreaterThanOrEqual(4)
  })
})

describe('EventCardSkeleton', () => {
  it('should render a container div', () => {
    const { container } = render(<EventCardSkeleton />)
    expect(container.firstChild).toBeInstanceOf(HTMLDivElement)
  })

  it('should render countdown badge skeleton', () => {
    const { container } = render(<EventCardSkeleton />)
    const rectangles = container.querySelectorAll('.rounded-lg, .rounded-xl')
    expect(rectangles.length).toBeGreaterThanOrEqual(1)
  })

  it('should render progress bar skeleton', () => {
    const { container } = render(<EventCardSkeleton />)
    const progressBar = container.querySelector('.rounded-full')
    expect(progressBar).toBeInTheDocument()
  })
})

describe('ProfileSkeleton', () => {
  it('should render profile header with avatar', () => {
    const { container } = render(<ProfileSkeleton />)
    const avatarSkeleton = container.querySelector('.rounded-full')
    expect(avatarSkeleton).toBeInTheDocument()
  })

  it('should render name and bio skeletons', () => {
    const { container } = render(<ProfileSkeleton />)
    const textSkeletons = container.querySelectorAll('.rounded')
    expect(textSkeletons.length).toBeGreaterThan(2)
  })

  it('should render action button skeletons', () => {
    const { container } = render(<ProfileSkeleton />)
    const buttonSkeletons = container.querySelectorAll('.rounded-xl')
    expect(buttonSkeletons.length).toBeGreaterThanOrEqual(2)
  })
})

describe('ProfileStatsSkeleton', () => {
  it('should render 4 stat items', () => {
    const { container } = render(<ProfileStatsSkeleton />)
    const statItems = container.querySelectorAll('.bg-black')
    expect(statItems).toHaveLength(4)
  })
})

describe('LeaderboardEntrySkeleton', () => {
  it('should render rank, avatar, username, and score skeletons', () => {
    const { container } = render(<LeaderboardEntrySkeleton />)
    const circles = container.querySelectorAll('.rounded-full')
    expect(circles.length).toBeGreaterThanOrEqual(1)
    const textSkeletons = container.querySelectorAll('.rounded')
    expect(textSkeletons.length).toBeGreaterThanOrEqual(3)
  })
})

describe('LeaderboardSkeleton', () => {
  it('should render default 10 entries', () => {
    const { container } = render(<LeaderboardSkeleton />)
    const entries = container.querySelectorAll('.flex.items-center.gap-3')
    expect(entries).toHaveLength(10)
  })

  it('should render custom number of entries', () => {
    const { container } = render(<LeaderboardSkeleton count={5} />)
    const entries = container.querySelectorAll('.flex.items-center.gap-3')
    expect(entries).toHaveLength(5)
  })
})

describe('LeaderboardRankCardSkeleton', () => {
  it('should render a card container', () => {
    const { container } = render(<LeaderboardRankCardSkeleton />)
    const card = container.querySelector('.rounded-2xl')
    expect(card).toBeInTheDocument()
  })

  it('should render rank and score skeletons', () => {
    const { container } = render(<LeaderboardRankCardSkeleton />)
    const textSkeletons = container.querySelectorAll('.rounded')
    expect(textSkeletons.length).toBeGreaterThan(2)
  })
})

describe('FeedSkeleton', () => {
  it('should render default 5 post skeletons', () => {
    render(<FeedSkeleton />)
    const articles = screen.getAllByRole('article')
    expect(articles).toHaveLength(5)
  })

  it('should render custom number of post skeletons', () => {
    render(<FeedSkeleton count={3} />)
    const articles = screen.getAllByRole('article')
    expect(articles).toHaveLength(3)
  })
})

describe('EventListSkeleton', () => {
  it('should render default 5 event card skeletons', () => {
    const { container } = render(<EventListSkeleton />)
    const entries = container.querySelectorAll('.flex.items-center.gap-3')
    expect(entries).toHaveLength(5)
  })

  it('should render custom number of event card skeletons', () => {
    const { container } = render(<EventListSkeleton count={3} />)
    const entries = container.querySelectorAll('.flex.items-center.gap-3')
    expect(entries).toHaveLength(3)
  })
})

describe('accessibility', () => {
  it('should hide skeleton from screen readers', () => {
    const { container } = render(<Skeleton />)
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
  })

  it('should have proper loading indicator semantics', () => {
    const { container } = render(<ThreadPostSkeleton />)
    expect(container.querySelector('article')).toBeInTheDocument()
  })
})
