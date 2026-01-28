/**
 * DiscoverPage
 *
 * Discover new content, users, and events.
 * Features:
 * - Trending topics section
 * - Popular events
 * - Suggested users to follow
 * - Trending posts preview
 */

import { PageHeader } from '@/components/layout/PageHeader'
import { TrendingCard, SuggestedUserCard, TrendingPostCard } from '@/components/trending'
import { useTrendingStore } from '@/store/trending'
import { useEventsStore, usePostsStore } from '@/store'
import { formatCountdown, formatNumber } from '@/lib/utils'
import {
  Calendar,
  Users,
  Flame,
  ChevronRight,
  Zap,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useMemo } from 'react'

export function DiscoverPage() {
  const posts = usePostsStore((state) => state.posts)
  const updateTrending = useTrendingStore((state) => state.updateTrending)
  const trendingPosts = useTrendingStore((state) => state.trendingPosts)
  const suggestedUsers = useTrendingStore((state) => state.suggestedUsers)
  const events = useEventsStore((state) => state.events)

  // Update trending when posts change
  useEffect(() => {
    updateTrending(posts)
  }, [posts, updateTrending])

  // Get top events by stake
  const topEvents = useMemo(() => {
    return Object.values(events)
      .filter((e) => e.status === 'active')
      .sort((a, b) => b.doomStake + b.lifeStake - (a.doomStake + a.lifeStake))
      .slice(0, 3)
  }, [events])

  // Get top trending posts
  const topPosts = useMemo(() => {
    return trendingPosts.slice(0, 3)
  }, [trendingPosts])

  return (
    <div className="flex flex-col min-h-full pb-20">
      <PageHeader title="Discover" />

      {/* Hero section */}
      <div className="px-4 py-6 bg-gradient-to-b from-[#ff304015] to-transparent">
        <div className="flex items-center gap-2 mb-2">
          <Zap size={20} className="text-[#ff3040]" />
          <h2 className="text-[20px] font-bold text-white">What's happening</h2>
        </div>
        <p className="text-[14px] text-[#777]">
          Explore trending topics, popular events, and find new people to follow.
        </p>
      </div>

      {/* Trending Topics */}
      <section className="px-4 mb-6">
        <TrendingCard limit={5} showViewAll title="Trending Topics" />
      </section>

      {/* Popular Events */}
      <section className="mb-6">
        <div className="flex items-center justify-between px-4 mb-3">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-[#ff3040]" />
            <h3 className="text-[15px] font-bold text-white">Popular Events</h3>
          </div>
          <Link
            to="/events"
            className="text-[13px] text-[#ff3040] hover:underline"
          >
            View all
          </Link>
        </div>

        <div className="px-4 space-y-3">
          {topEvents.length === 0 ? (
            <div className="bg-[#111] rounded-2xl p-4 text-center">
              <p className="text-[14px] text-[#777]">No active events</p>
            </div>
          ) : (
            topEvents.map((event) => {
              const totalStake = event.doomStake + event.lifeStake
              const doomPercent = totalStake > 0
                ? Math.round((event.doomStake / totalStake) * 100)
                : 50

              return (
                <Link
                  key={event.id}
                  to={`/events/${event.id}`}
                  className="block bg-[#111] rounded-2xl p-4 hover:bg-[#1a1a1a] transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-[15px] font-semibold text-white flex-1 pr-2">
                      {event.title}
                    </h4>
                    <span className="text-[12px] px-2 py-0.5 rounded-full bg-[#ff304020] text-[#ff3040]">
                      {formatCountdown(event.countdownEnd)}
                    </span>
                  </div>

                  <p className="text-[13px] text-[#777] line-clamp-2 mb-3">
                    {event.description}
                  </p>

                  {/* Stake bar */}
                  <div className="h-1.5 rounded-full bg-[#00ba7c] overflow-hidden">
                    <div
                      className="h-full bg-[#ff3040]"
                      style={{ width: `${doomPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-[12px]">
                    <span className="text-[#ff3040]">
                      Doom {formatNumber(event.doomStake)}
                    </span>
                    <span className="text-[#00ba7c]">
                      Life {formatNumber(event.lifeStake)}
                    </span>
                  </div>
                </Link>
              )
            })
          )}
        </div>
      </section>

      {/* Suggested Users */}
      <section className="mb-6">
        <div className="flex items-center justify-between px-4 mb-3">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-[#ff3040]" />
            <h3 className="text-[15px] font-bold text-white">Who to follow</h3>
          </div>
        </div>

        <div className="bg-[#111] mx-4 rounded-2xl overflow-hidden divide-y divide-[#222]">
          {suggestedUsers.slice(0, 4).map((user) => (
            <SuggestedUserCard key={user.author.username} user={user} />
          ))}
          <Link
            to="/discover?tab=users"
            className="flex items-center justify-between px-4 py-3 hover:bg-[#1a1a1a] transition-colors"
          >
            <span className="text-[14px] text-[#ff3040]">Show more</span>
            <ChevronRight size={16} className="text-[#ff3040]" />
          </Link>
        </div>
      </section>

      {/* Trending Posts */}
      <section className="mb-6">
        <div className="flex items-center justify-between px-4 mb-3">
          <div className="flex items-center gap-2">
            <Flame size={18} className="text-[#ff3040]" />
            <h3 className="text-[15px] font-bold text-white">Trending Posts</h3>
          </div>
          <Link
            to="/trending?tab=posts"
            className="text-[13px] text-[#ff3040] hover:underline"
          >
            View all
          </Link>
        </div>

        <div className="bg-[#111] mx-4 rounded-2xl overflow-hidden divide-y divide-[#222]">
          {topPosts.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-[14px] text-[#777]">No trending posts yet</p>
            </div>
          ) : (
            topPosts.map((post, index) => (
              <TrendingPostCard key={post.postId} post={post} rank={index + 1} />
            ))
          )}
          <Link
            to="/trending?tab=posts"
            className="flex items-center justify-between px-4 py-3 hover:bg-[#1a1a1a] transition-colors"
          >
            <span className="text-[14px] text-[#ff3040]">Show more</span>
            <ChevronRight size={16} className="text-[#ff3040]" />
          </Link>
        </div>
      </section>
    </div>
  )
}
