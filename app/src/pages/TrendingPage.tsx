/**
 * TrendingPage
 *
 * Full view of trending topics and posts.
 * Features:
 * - Tab navigation between Topics and Posts
 * - Trending hashtags with post counts
 * - Trending posts ranked by engagement score
 * - Time-decay algorithm for freshness
 */

import { TrendingPostCard } from '@/components/trending'
import { Hash, TrendingUp, Flame, Clock, ArrowLeft } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { useTrendingStore } from '@/store/trending'
import { usePostsStore } from '@/store'
import { formatNumber } from '@/lib/utils'

type TrendingTab = 'topics' | 'posts'
type TimeFilter = 'today' | 'week' | 'month'

export function TrendingPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const tagFilter = searchParams.get('tag')

  const [activeTab, setActiveTab] = useState<TrendingTab>('topics')
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today')
  // Reference timestamp captured on mount for time-based filtering
  const [pageLoadTime] = useState(() => Date.now())

  const posts = usePostsStore((state) => state.posts)
  const updateTrending = useTrendingStore((state) => state.updateTrending)
  const trendingHashtags = useTrendingStore((state) => state.trendingHashtags)
  const trendingPosts = useTrendingStore((state) => state.trendingPosts)

  // Update trending when posts change
  useEffect(() => {
    updateTrending(posts)
  }, [posts, updateTrending])

  // Calculate time cutoff based on filter
  const timeCutoffDays = timeFilter === 'today' ? 1 : timeFilter === 'week' ? 7 : 30

  // Filter posts by time range using page load timestamp as reference
  const filteredPosts = useMemo(() => {
    const dayMs = 24 * 60 * 60 * 1000
    const cutoff = pageLoadTime - timeCutoffDays * dayMs

    return trendingPosts.filter((p) => p.createdAt >= cutoff)
  }, [trendingPosts, timeCutoffDays, pageLoadTime])

  // Filter by tag if specified
  const displayPosts = useMemo(() => {
    if (!tagFilter) return filteredPosts
    return filteredPosts.filter((p) =>
      p.content.toLowerCase().includes(tagFilter.toLowerCase())
    )
  }, [filteredPosts, tagFilter])

  const timeFilters: { id: TimeFilter; label: string; icon: typeof Flame }[] = [
    { id: 'today', label: 'Today', icon: Flame },
    { id: 'week', label: 'This week', icon: Clock },
    { id: 'month', label: 'This month', icon: Clock },
  ]

  return (
    <div className="flex flex-col min-h-full">
      {/* Custom header with back button */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="w-10">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 hover:bg-[#1a1a1a] rounded-full transition-colors"
            >
              <ArrowLeft size={20} className="text-white" />
            </button>
          </div>
          <div className="flex-1 flex justify-center">
            <h1 className="text-[17px] font-semibold text-white">
              {tagFilter ? `#${tagFilter}` : 'Trending'}
            </h1>
          </div>
          <div className="w-10" />
        </div>
      </header>

      {/* Tab navigation */}
      <div className="flex border-b border-[#333]">
        <button
          onClick={() => setActiveTab('topics')}
          className={`flex-1 py-3 text-[15px] font-semibold transition-colors ${
            activeTab === 'topics'
              ? 'text-white border-b-2 border-[#ff3040]'
              : 'text-[#777]'
          }`}
        >
          Topics
        </button>
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex-1 py-3 text-[15px] font-semibold transition-colors ${
            activeTab === 'posts'
              ? 'text-white border-b-2 border-[#ff3040]'
              : 'text-[#777]'
          }`}
        >
          Posts
        </button>
      </div>

      {/* Time filter (posts tab only) */}
      {activeTab === 'posts' && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-[#222] bg-[#0a0a0a]">
          {timeFilters.map((filter) => {
            const Icon = filter.icon
            const isActive = timeFilter === filter.id
            return (
              <button
                key={filter.id}
                onClick={() => setTimeFilter(filter.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                  isActive
                    ? 'bg-[#ff3040] text-white'
                    : 'bg-[#1a1a1a] text-[#777] hover:bg-[#333]'
                }`}
              >
                <Icon size={14} />
                {filter.label}
              </button>
            )
          })}
        </div>
      )}

      {/* Topics tab content */}
      {activeTab === 'topics' && (
        <div className="divide-y divide-[#333]">
          {trendingHashtags.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-8">
              <Hash size={48} className="text-[#333] mb-4" />
              <p className="text-[15px] text-[#777] text-center">
                No trending topics yet.
              </p>
              <p className="text-[13px] text-[#555] text-center mt-1">
                Start posting with hashtags to see trends.
              </p>
            </div>
          ) : (
            trendingHashtags.map((hashtag, index) => (
              <Link
                key={hashtag.tag}
                to={`/trending?tag=${encodeURIComponent(hashtag.tag.replace('#', ''))}`}
                className="flex items-center gap-4 px-4 py-4 hover:bg-[#111] transition-colors"
              >
                {/* Rank */}
                <span
                  className={`w-6 text-center text-[15px] font-bold ${
                    index < 3 ? 'text-[#ff3040]' : 'text-[#555]'
                  }`}
                >
                  {index + 1}
                </span>

                {/* Hashtag icon */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: index < 3 ? '#ff304020' : '#1a1a1a',
                  }}
                >
                  <Hash
                    size={20}
                    className={index < 3 ? 'text-[#ff3040]' : 'text-[#777]'}
                  />
                </div>

                {/* Tag info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[16px] font-semibold text-white">
                    {hashtag.tag}
                  </p>
                  <p className="text-[13px] text-[#777]">
                    {formatNumber(hashtag.count)} posts
                  </p>
                </div>

                {/* Trend indicator */}
                <TrendingUp size={18} className="text-[#00ba7c]" />
              </Link>
            ))
          )}
        </div>
      )}

      {/* Posts tab content */}
      {activeTab === 'posts' && (
        <div className="divide-y divide-[#333]">
          {displayPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-8">
              <Flame size={48} className="text-[#333] mb-4" />
              <p className="text-[15px] text-[#777] text-center">
                {tagFilter
                  ? `No trending posts with #${tagFilter}`
                  : 'No trending posts yet.'}
              </p>
              <p className="text-[13px] text-[#555] text-center mt-1">
                Posts with high engagement will appear here.
              </p>
            </div>
          ) : (
            displayPosts.map((post, index) => (
              <TrendingPostCard key={post.postId} post={post} rank={index + 1} />
            ))
          )}
        </div>
      )}
    </div>
  )
}
