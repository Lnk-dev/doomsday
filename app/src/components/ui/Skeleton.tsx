/**
 * Skeleton Component
 * Issue #106: Implement loading states and skeleton screens
 *
 * Base skeleton component with shimmer animation.
 * Used as building block for content-specific skeleton screens.
 */

interface SkeletonProps {
  className?: string
  /** Rounded variant: full for circles, md for cards, sm for text */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full'
}

/** Base skeleton element with shimmer animation */
export function Skeleton({ className = '', rounded = 'md' }: SkeletonProps) {
  const roundedClass = {
    none: '',
    sm: 'rounded',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    full: 'rounded-full',
  }[rounded]

  return (
    <div
      className={`animate-pulse bg-[#222] ${roundedClass} ${className}`}
    />
  )
}

/** Skeleton for a single post in the feed */
export function PostSkeleton() {
  return (
    <div className="px-4 py-3">
      <div className="flex gap-3">
        {/* Avatar skeleton */}
        <Skeleton className="w-9 h-9 flex-shrink-0" rounded="full" />

        {/* Content skeleton */}
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-4 w-24" rounded="sm" />
            <Skeleton className="h-3 w-12" rounded="sm" />
          </div>

          {/* Content lines */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" rounded="sm" />
            <Skeleton className="h-4 w-4/5" rounded="sm" />
            <Skeleton className="h-4 w-3/5" rounded="sm" />
          </div>

          {/* Action buttons row */}
          <div className="flex items-center gap-6 mt-3">
            <Skeleton className="h-5 w-5" rounded="full" />
            <Skeleton className="h-5 w-5" rounded="full" />
            <Skeleton className="h-5 w-5" rounded="full" />
            <Skeleton className="h-5 w-5" rounded="full" />
          </div>
        </div>
      </div>
    </div>
  )
}

/** Skeleton for multiple posts in a feed */
export function FeedSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="divide-y divide-[#333]">
      {Array.from({ length: count }).map((_, i) => (
        <PostSkeleton key={i} />
      ))}
    </div>
  )
}

/** Skeleton for profile header */
export function ProfileSkeleton() {
  return (
    <div className="px-4 py-4">
      {/* Profile header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Skeleton className="h-6 w-32 mb-2" rounded="sm" />
          <Skeleton className="h-4 w-24" rounded="sm" />
        </div>
        <Skeleton className="w-16 h-16" rounded="full" />
      </div>

      {/* Bio */}
      <Skeleton className="h-4 w-full mb-2" rounded="sm" />
      <Skeleton className="h-4 w-3/4 mb-4" rounded="sm" />

      {/* Stats row */}
      <div className="flex items-center gap-4 mb-4">
        <Skeleton className="h-3 w-20" rounded="sm" />
        <Skeleton className="h-3 w-20" rounded="sm" />
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mb-4">
        <Skeleton className="flex-1 h-10" rounded="lg" />
        <Skeleton className="flex-1 h-10" rounded="lg" />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-px rounded-2xl overflow-hidden mb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-black p-3">
            <Skeleton className="h-5 w-12 mx-auto mb-1" rounded="sm" />
            <Skeleton className="h-3 w-8 mx-auto" rounded="sm" />
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#333]">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex-1 py-3 flex justify-center">
            <Skeleton className="h-4 w-16" rounded="sm" />
          </div>
        ))}
      </div>
    </div>
  )
}

/** Skeleton for an event card */
export function EventCardSkeleton() {
  return (
    <div className="p-4 border-b border-[#333]">
      <div className="flex items-start gap-3">
        {/* Category icon */}
        <Skeleton className="w-10 h-10" rounded="lg" />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Tags row */}
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-5 w-16" rounded="full" />
            <Skeleton className="h-5 w-20" rounded="full" />
          </div>

          {/* Title */}
          <Skeleton className="h-5 w-full mb-2" rounded="sm" />
          <Skeleton className="h-4 w-3/4 mb-3" rounded="sm" />

          {/* Stats row */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-3 w-16" rounded="sm" />
            <Skeleton className="h-3 w-20" rounded="sm" />
          </div>
        </div>

        {/* Odds */}
        <div className="text-right">
          <Skeleton className="h-6 w-12 mb-1" rounded="sm" />
          <Skeleton className="h-3 w-8" rounded="sm" />
        </div>
      </div>
    </div>
  )
}

/** Skeleton for events list */
export function EventsListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  )
}

/** Skeleton for event detail page */
export function EventDetailSkeleton() {
  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-6 w-20" rounded="full" />
          <Skeleton className="h-6 w-24" rounded="full" />
        </div>
        <Skeleton className="h-7 w-full mb-2" rounded="sm" />
        <Skeleton className="h-5 w-3/4" rounded="sm" />
      </div>

      {/* Countdown */}
      <Skeleton className="h-16 w-full mb-4" rounded="lg" />

      {/* Odds section */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Skeleton className="h-24" rounded="lg" />
        <Skeleton className="h-24" rounded="lg" />
      </div>

      {/* Betting section */}
      <Skeleton className="h-40 w-full mb-4" rounded="lg" />

      {/* Activity */}
      <Skeleton className="h-4 w-24 mb-3" rounded="sm" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 mb-3">
          <Skeleton className="w-8 h-8" rounded="full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-32 mb-1" rounded="sm" />
            <Skeleton className="h-3 w-20" rounded="sm" />
          </div>
          <Skeleton className="h-4 w-16" rounded="sm" />
        </div>
      ))}
    </div>
  )
}

/** Skeleton for leaderboard entries */
export function LeaderboardSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="divide-y divide-[#333]">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          {/* Rank */}
          <Skeleton className="w-8 h-8" rounded="full" />

          {/* Avatar */}
          <Skeleton className="w-10 h-10" rounded="full" />

          {/* User info */}
          <div className="flex-1">
            <Skeleton className="h-4 w-24 mb-1" rounded="sm" />
            <Skeleton className="h-3 w-16" rounded="sm" />
          </div>

          {/* Score */}
          <Skeleton className="h-5 w-16" rounded="sm" />
        </div>
      ))}
    </div>
  )
}

/** Full page loading spinner */
export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-8 h-8 border-2 border-[#ff3040] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
