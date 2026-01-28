/**
 * TrendingCard Component
 *
 * Compact card showing top trending topics.
 * Used in sidebars and discovery sections.
 *
 * Features:
 * - Top 5 trending hashtags
 * - Post count and trend indicator
 * - Link to full trending page
 */

import { TrendingUp, Hash, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTrendingStore } from '@/store/trending'
import { usePostsStore } from '@/store'
import { useEffect, useMemo } from 'react'
import { formatNumber } from '@/lib/utils'

interface TrendingCardProps {
  /** Maximum items to show */
  limit?: number
  /** Show header link to trending page */
  showViewAll?: boolean
  /** Optional title override */
  title?: string
}

export function TrendingCard({
  limit = 5,
  showViewAll = true,
  title = 'Trending'
}: TrendingCardProps) {
  const posts = usePostsStore((state) => state.posts)
  const updateTrending = useTrendingStore((state) => state.updateTrending)
  const trendingHashtags = useTrendingStore((state) => state.trendingHashtags)

  // Update trending when posts change
  useEffect(() => {
    updateTrending(posts)
  }, [posts, updateTrending])

  // Get top hashtags
  const topHashtags = useMemo(() => {
    return trendingHashtags.slice(0, limit)
  }, [trendingHashtags, limit])

  if (topHashtags.length === 0) {
    return null
  }

  return (
    <div className="bg-[#111] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#222]">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} className="text-[#ff3040]" />
          <h3 className="text-[15px] font-bold text-white">{title}</h3>
        </div>
        {showViewAll && (
          <Link
            to="/trending"
            className="text-[13px] text-[#ff3040] hover:underline"
          >
            View all
          </Link>
        )}
      </div>

      {/* Trending list */}
      <div className="divide-y divide-[#222]">
        {topHashtags.map((hashtag, index) => (
          <Link
            key={hashtag.tag}
            to={`/trending?tag=${encodeURIComponent(hashtag.tag)}`}
            className="flex items-center gap-3 px-4 py-3 hover:bg-[#1a1a1a] transition-colors"
          >
            {/* Rank */}
            <span className="w-5 text-[13px] text-[#555] font-medium">
              {index + 1}
            </span>

            {/* Hashtag icon */}
            <div className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center">
              <Hash size={16} className="text-[#777]" />
            </div>

            {/* Tag info */}
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-medium text-white truncate">
                {hashtag.tag}
              </p>
              <p className="text-[13px] text-[#777]">
                {formatNumber(hashtag.count)} posts
              </p>
            </div>

            {/* Trend indicator */}
            <TrendingUp size={14} className="text-[#00ba7c]" />
          </Link>
        ))}
      </div>

      {/* Footer link */}
      {showViewAll && (
        <Link
          to="/trending"
          className="flex items-center justify-between px-4 py-3 border-t border-[#222] hover:bg-[#1a1a1a] transition-colors"
        >
          <span className="text-[14px] text-[#ff3040]">Show more</span>
          <ChevronRight size={16} className="text-[#ff3040]" />
        </Link>
      )}
    </div>
  )
}
