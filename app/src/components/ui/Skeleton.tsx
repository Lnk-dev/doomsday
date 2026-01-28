/**
 * Skeleton Component
 *
 * A versatile skeleton loading placeholder component with shimmer animation.
 * Supports multiple variants for different use cases.
 *
 * Features:
 * - Text, circle, and rectangle variants
 * - Shimmer/pulse animation for loading effect
 * - Uses CSS variables for theming support
 * - Customizable dimensions
 */

interface SkeletonProps {
  /** Visual variant: text (rounded), circle (fully rounded), rectangle (default) */
  variant?: 'text' | 'circle' | 'rectangle'
  /** Width of the skeleton (CSS value or number for pixels) */
  width?: string | number
  /** Height of the skeleton (CSS value or number for pixels) */
  height?: string | number
  /** Additional CSS classes */
  className?: string
  /** Animation style: shimmer (gradient sweep) or pulse (opacity fade) */
  animation?: 'shimmer' | 'pulse'
}

export function Skeleton({
  variant = 'rectangle',
  width,
  height,
  className = '',
  animation = 'shimmer',
}: SkeletonProps) {
  // Convert number dimensions to pixel strings
  const widthStyle = typeof width === 'number' ? `${width}px` : width
  const heightStyle = typeof height === 'number' ? `${height}px` : height

  // Determine border radius based on variant
  const radiusClass =
    variant === 'circle'
      ? 'rounded-full'
      : variant === 'text'
        ? 'rounded'
        : 'rounded-lg'

  // Animation class based on animation prop
  const animationClass =
    animation === 'shimmer' ? 'skeleton-shimmer' : 'animate-pulse'

  return (
    <div
      className={`bg-[var(--color-bg-tertiary,#1a1a1a)] ${radiusClass} ${animationClass} ${className}`}
      style={{
        width: widthStyle,
        height: heightStyle,
      }}
      aria-hidden="true"
    />
  )
}

/**
 * ThreadPostSkeleton
 *
 * Skeleton placeholder for ThreadPost component.
 * Matches the layout of the actual ThreadPost for seamless loading transition.
 */
export function ThreadPostSkeleton() {
  return (
    <article className="flex gap-3 px-4 py-3">
      {/* Avatar column */}
      <div className="flex flex-col items-center">
        <Skeleton variant="circle" width={36} height={36} />
      </div>

      {/* Content column */}
      <div className="flex-1 min-w-0">
        {/* Header: username and timestamp */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton variant="text" width={100} height={16} />
          </div>
          <Skeleton variant="text" width={30} height={14} />
        </div>

        {/* Post content - multiple lines */}
        <div className="mt-2 space-y-2">
          <Skeleton variant="text" width="100%" height={14} />
          <Skeleton variant="text" width="85%" height={14} />
          <Skeleton variant="text" width="70%" height={14} />
        </div>

        {/* Action buttons row */}
        <div className="flex items-center gap-4 mt-3">
          <Skeleton variant="circle" width={20} height={20} />
          <Skeleton variant="circle" width={20} height={20} />
          <Skeleton variant="circle" width={20} height={20} />
          <Skeleton variant="circle" width={20} height={20} />
        </div>

        {/* Engagement stats */}
        <div className="flex items-center gap-2 mt-2">
          <Skeleton variant="text" width={60} height={12} />
          <Skeleton variant="text" width={50} height={12} />
        </div>
      </div>
    </article>
  )
}

/**
 * EventCardSkeleton
 *
 * Skeleton placeholder for event cards in the EventsPage.
 * Matches the layout of event list items.
 */
export function EventCardSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {/* Countdown badge */}
      <Skeleton variant="rectangle" width={56} height={56} className="rounded-xl" />

      {/* Event info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Skeleton variant="text" width={70} height={12} />
          <Skeleton variant="circle" width={12} height={12} />
        </div>
        <Skeleton variant="text" width="80%" height={16} className="mb-2" />
        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <Skeleton variant="rectangle" width="100%" height={6} className="rounded-full" />
          <Skeleton variant="text" width={30} height={12} />
        </div>
      </div>

      {/* Stake amount */}
      <div className="text-right">
        <Skeleton variant="text" width={40} height={12} className="mb-1 ml-auto" />
        <Skeleton variant="text" width={50} height={14} className="ml-auto" />
      </div>
    </div>
  )
}

/**
 * ProfileSkeleton
 *
 * Skeleton placeholder for the profile page header section.
 * Matches the layout of the profile header.
 */
export function ProfileSkeleton() {
  return (
    <div className="px-4 py-4">
      {/* Profile header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Skeleton variant="text" width={180} height={24} className="mb-2" />
          <Skeleton variant="text" width={100} height={16} />
        </div>
        <Skeleton variant="circle" width={64} height={64} />
      </div>

      {/* Bio */}
      <Skeleton variant="text" width="70%" height={16} className="mt-4" />

      {/* Stats */}
      <div className="flex items-center gap-4 mt-3">
        <Skeleton variant="text" width={80} height={14} />
        <Skeleton variant="text" width={60} height={14} />
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mt-4">
        <Skeleton variant="rectangle" width="50%" height={40} className="rounded-xl" />
        <Skeleton variant="rectangle" width="50%" height={40} className="rounded-xl" />
      </div>
    </div>
  )
}

/**
 * ProfileStatsSkeleton
 *
 * Skeleton for the stats grid on profile page.
 */
export function ProfileStatsSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-px mx-4 mb-4 rounded-2xl overflow-hidden bg-[var(--color-border,#333)]">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-black p-3 flex flex-col items-center">
          <Skeleton variant="text" width={40} height={20} className="mb-1" />
          <Skeleton variant="text" width={35} height={10} />
        </div>
      ))}
    </div>
  )
}

/**
 * LeaderboardEntrySkeleton
 *
 * Skeleton placeholder for individual leaderboard entries.
 */
export function LeaderboardEntrySkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {/* Rank */}
      <Skeleton variant="text" width={24} height={16} />

      {/* Avatar */}
      <Skeleton variant="circle" width={40} height={40} />

      {/* Username */}
      <div className="flex-1">
        <Skeleton variant="text" width={120} height={16} />
      </div>

      {/* Score & change */}
      <div className="text-right">
        <Skeleton variant="text" width={60} height={16} className="mb-1 ml-auto" />
        <Skeleton variant="text" width={30} height={12} className="ml-auto" />
      </div>
    </div>
  )
}

/**
 * LeaderboardSkeleton
 *
 * Skeleton placeholder for the full leaderboard section.
 * Shows multiple LeaderboardEntrySkeleton items.
 */
export function LeaderboardSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="divide-y divide-[var(--color-border,#333)]">
      {Array.from({ length: count }).map((_, i) => (
        <LeaderboardEntrySkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * LeaderboardRankCardSkeleton
 *
 * Skeleton for the user's rank card at the top of leaderboard.
 */
export function LeaderboardRankCardSkeleton() {
  return (
    <div className="m-4 p-4 rounded-2xl bg-[var(--color-bg-tertiary,#1a1a1a)]">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton variant="text" width={60} height={12} className="mb-2" />
          <Skeleton variant="text" width={80} height={28} />
        </div>
        <div className="text-right">
          <Skeleton variant="text" width={40} height={12} className="mb-2 ml-auto" />
          <Skeleton variant="text" width={70} height={20} className="ml-auto" />
        </div>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--color-border,#333)]">
        <Skeleton variant="text" width={160} height={14} />
        <Skeleton variant="circle" width={16} height={16} />
      </div>
    </div>
  )
}

/**
 * FeedSkeleton
 *
 * Skeleton for a feed of posts.
 * Shows multiple ThreadPostSkeleton items.
 */
export function FeedSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="divide-y divide-[var(--color-border,#333)]">
      {Array.from({ length: count }).map((_, i) => (
        <ThreadPostSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * EventListSkeleton
 *
 * Skeleton for a list of events.
 * Shows multiple EventCardSkeleton items.
 */
export function EventListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="divide-y divide-[var(--color-border,#333)]">
      {Array.from({ length: count }).map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  )
}
