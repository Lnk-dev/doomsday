/**
 * DoomScrollPage
 *
 * Main feed displaying doom-related posts. This is the home screen
 * of the app where users see pessimistic predictions and commentary.
 *
 * Features:
 * - Feed toggle (For You / Following)
 * - Sort options (Hot / New / Top)
 * - Infinite scroll of doom posts
 * - Real-time like interactions
 */

import { PageHeader } from '@/components/layout/PageHeader'
import { ThreadPost } from '@/components/ui/ThreadPost'
import { Flame, Clock, TrendingUp } from 'lucide-react'
import { usePostsStore, useUserStore } from '@/store'
import { formatRelativeTime } from '@/lib/utils'
import { useState, useMemo } from 'react'
import type { Post } from '@/types'

type FeedTab = 'foryou' | 'following'
type SortOption = 'hot' | 'new' | 'top'

/** Calculate "hot" score (engagement / time decay) */
const getHotScore = (post: Post): number => {
  const ageHours = (Date.now() - post.createdAt) / (1000 * 60 * 60)
  const engagement = post.likes + post.replies * 2
  // Decay factor: older posts rank lower
  return engagement / Math.pow(ageHours + 2, 1.5)
}

export function DoomScrollPage() {
  const [activeTab, setActiveTab] = useState<FeedTab>('foryou')
  const [sortBy, setSortBy] = useState<SortOption>('hot')

  // Get raw data from store (stable references)
  const allPosts = usePostsStore((state) => state.posts)
  const doomFeed = usePostsStore((state) => state.doomFeed)
  const likePost = usePostsStore((state) => state.likePost)
  const unlikePost = usePostsStore((state) => state.unlikePost)
  const userId = useUserStore((state) => state.userId)

  // Compute feed from raw data
  const posts = useMemo(() => {
    return doomFeed.map((id) => allPosts[id]).filter(Boolean)
  }, [allPosts, doomFeed])

  // Sort posts based on selected option
  const sortedPosts = useMemo(() => {
    const sorted = [...posts]
    switch (sortBy) {
      case 'hot':
        return sorted.sort((a, b) => getHotScore(b) - getHotScore(a))
      case 'new':
        return sorted.sort((a, b) => b.createdAt - a.createdAt)
      case 'top':
        return sorted.sort((a, b) => b.likes - a.likes)
      default:
        return sorted
    }
  }, [posts, sortBy])

  /** Handle like button click */
  const handleLike = (postId: string, isLiked: boolean) => {
    if (isLiked) {
      unlikePost(postId, userId)
    } else {
      likePost(postId, userId)
    }
  }

  const sortOptions: { id: SortOption; label: string; icon: typeof Flame }[] = [
    { id: 'hot', label: 'Hot', icon: Flame },
    { id: 'new', label: 'New', icon: Clock },
    { id: 'top', label: 'Top', icon: TrendingUp },
  ]

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader showLogo />

      {/* Feed toggle tabs */}
      <div className="flex border-b border-[#333]">
        <button
          onClick={() => setActiveTab('foryou')}
          className={`flex-1 py-3 text-[15px] font-semibold transition-colors ${
            activeTab === 'foryou'
              ? 'text-white border-b-2 border-white'
              : 'text-[#777]'
          }`}
        >
          For you
        </button>
        <button
          onClick={() => setActiveTab('following')}
          className={`flex-1 py-3 text-[15px] font-semibold transition-colors ${
            activeTab === 'following'
              ? 'text-white border-b-2 border-white'
              : 'text-[#777]'
          }`}
        >
          Following
        </button>
      </div>

      {/* Sort options */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-[#222] bg-[#0a0a0a]">
        {sortOptions.map((option) => {
          const Icon = option.icon
          const isActive = sortBy === option.id
          return (
            <button
              key={option.id}
              onClick={() => setSortBy(option.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                isActive
                  ? 'bg-[#ff3040] text-white'
                  : 'bg-[#1a1a1a] text-[#777] hover:bg-[#333]'
              }`}
            >
              <Icon size={14} />
              {option.label}
            </button>
          )
        })}
      </div>

      {/* Posts feed */}
      <div className="divide-y divide-[#333]">
        {sortedPosts.map((post) => (
          <ThreadPost
            key={post.id}
            author={post.author}
            content={post.content}
            timestamp={formatRelativeTime(post.createdAt)}
            likes={post.likes}
            replies={post.replies}
            variant="doom"
            isLiked={post.likedBy.includes(userId)}
            onLike={() => handleLike(post.id, post.likedBy.includes(userId))}
          />
        ))}
      </div>

      {/* Empty state */}
      {sortedPosts.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center py-16 px-8">
          <p className="text-[15px] text-[#777] text-center">
            No doom to scroll yet.
          </p>
        </div>
      )}
    </div>
  )
}
