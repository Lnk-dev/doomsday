/**
 * DoomScrollPage
 *
 * Main feed displaying doom-related posts. This is the home screen
 * of the app where users see pessimistic predictions and commentary.
 *
 * Features:
 * - Feed toggle (For You / Following)
 * - Sort options (Personalized / Hot / New / Top)
 * - Personalized ranking algorithm
 * - Infinite scroll of doom posts
 * - Real-time like interactions
 * - Loading skeleton states
 */

import { PageHeader } from '@/components/layout/PageHeader'
import { ThreadPost } from '@/components/ui/ThreadPost'
import { ShareModal } from '@/components/ui/ShareModal'
import { FeedSkeleton } from '@/components/ui/Skeleton'
import { QuoteRepostModal } from '@/components/ui/QuoteRepostModal'
import { WhyAmISeeingThisCompact } from '@/components/ui/WhyAmISeeingThis'
import { Flame, Clock, TrendingUp, UserPlus, Search, Trophy, Sparkles } from 'lucide-react'
import { usePostsStore, useUserStore, useBookmarksStore, useLoadingStore, useUserProfileStore } from '@/store'
import { formatRelativeTime } from '@/lib/utils'
import { rankPosts, type ScoredPost } from '@/lib/ranking'
import { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Post } from '@/types'

type FeedTab = 'foryou' | 'following'
type SortOption = 'personalized' | 'hot' | 'new' | 'top'

/** Calculate "hot" score (engagement / time decay) */
const getHotScore = (post: Post): number => {
  const ageHours = (Date.now() - post.createdAt) / (1000 * 60 * 60)
  const engagement = post.likes + post.replies * 2
  // Decay factor: older posts rank lower
  return engagement / Math.pow(ageHours + 2, 1.5)
}

export function DoomScrollPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<FeedTab>('foryou')
  const [sortBy, setSortBy] = useState<SortOption>('personalized')
  const [sharePost, setSharePost] = useState<Post | null>(null)
  const [quotePost, setQuotePost] = useState<Post | null>(null)
  const [scoredPosts, setScoredPosts] = useState<Map<string, ScoredPost>>(new Map())

  // Loading state
  const isLoading = useLoadingStore((state) => state.isLoading('posts'))
  const simulateLoading = useLoadingStore((state) => state.simulateLoading)

  // Simulate initial loading on mount
  useEffect(() => {
    simulateLoading('posts', 1000)
  }, [simulateLoading])

  // Get raw data from store (stable references)
  const allPosts = usePostsStore((state) => state.posts)
  const doomFeed = usePostsStore((state) => state.doomFeed)
  const likePost = usePostsStore((state) => state.likePost)
  const unlikePost = usePostsStore((state) => state.unlikePost)
  const repostPost = usePostsStore((state) => state.repostPost)
  const unrepostPost = usePostsStore((state) => state.unrepostPost)
  const quoteRepost = usePostsStore((state) => state.quoteRepost)
  const userId = useUserStore((state) => state.userId)
  const author = useUserStore((state) => state.author)
  const following = useUserStore((state) => state.following)
  const isHidden = useUserStore((state) => state.isHidden)

  // User profile store for personalization
  const userProfile = useUserProfileStore((state) => state.profile)
  const recordLike = useUserProfileStore((state) => state.recordLike)
  const recordUnlike = useUserProfileStore((state) => state.recordUnlike)

  // Bookmarks store
  const isBookmarked = useBookmarksStore((state) => state.isBookmarked)
  const addBookmark = useBookmarksStore((state) => state.addBookmark)
  const removeBookmark = useBookmarksStore((state) => state.removeBookmark)

  // Compute feed from raw data
  const posts = useMemo(() => {
    return doomFeed.map((id) => allPosts[id]).filter(Boolean)
  }, [allPosts, doomFeed])

  // Filter posts based on active tab and hidden users (blocked/muted)
  const filteredPosts = useMemo(() => {
    // First filter out blocked/muted users
    const visiblePosts = posts.filter((post) => !isHidden(post.author.username))

    if (activeTab === 'following') {
      return visiblePosts.filter((post) => following.includes(post.author.username))
    }
    return visiblePosts
  }, [posts, activeTab, following, isHidden])

  // Sort posts based on selected option
  const sortedPosts = useMemo(() => {
    const sorted = [...filteredPosts]

    if (sortBy === 'personalized' && activeTab === 'foryou') {
      // Use personalized ranking algorithm
      const ranked = rankPosts(sorted, userProfile)

      // Store scored posts for explanations
      const newScoredPosts = new Map<string, ScoredPost>()
      ranked.forEach((sp) => newScoredPosts.set(sp.post.id, sp))
      setScoredPosts(newScoredPosts)

      return ranked.map((sp) => sp.post)
    }

    switch (sortBy) {
      case 'hot':
      case 'personalized': // Fall back to hot for following tab
        return sorted.sort((a, b) => getHotScore(b) - getHotScore(a))
      case 'new':
        return sorted.sort((a, b) => b.createdAt - a.createdAt)
      case 'top':
        return sorted.sort((a, b) => b.likes - a.likes)
      default:
        return sorted
    }
  }, [filteredPosts, sortBy, activeTab, userProfile])

  /** Handle like button click */
  const handleLike = useCallback((postId: string, isLiked: boolean, post: Post) => {
    if (isLiked) {
      unlikePost(postId, userId)
      recordUnlike(postId, post.author.username)
    } else {
      likePost(postId, userId)
      recordLike(postId, post.author.username, post.content)
    }
  }, [likePost, unlikePost, userId, recordLike, recordUnlike])

  /** Handle repost button click */
  const handleRepost = (post: Post) => {
    const isReposted = post.repostedByUsers?.includes(userId)
    if (isReposted) {
      unrepostPost(post.id, userId)
    } else {
      repostPost(post.id, userId, author)
    }
  }

  /** Handle quote repost */
  const handleQuoteRepost = (content: string) => {
    if (quotePost) {
      quoteRepost(quotePost.id, userId, author, content)
    }
  }

  /** Handle bookmark toggle */
  const handleBookmark = (postId: string) => {
    if (isBookmarked(postId)) {
      removeBookmark(postId, userId)
    } else {
      addBookmark(postId, userId)
    }
  }

  const sortOptions: { id: SortOption; label: string; icon: typeof Flame }[] = [
    { id: 'personalized', label: 'For You', icon: Sparkles },
    { id: 'hot', label: 'Hot', icon: Flame },
    { id: 'new', label: 'New', icon: Clock },
    { id: 'top', label: 'Top', icon: TrendingUp },
  ]

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        showLogo
        leftAction={
          <button
            onClick={() => navigate('/leaderboard')}
            className="p-1 text-[#777] hover:text-white transition-colors"
            aria-label="View leaderboard"
          >
            <Trophy size={22} />
          </button>
        }
        rightAction={
          <button
            onClick={() => navigate('/search')}
            className="p-1 text-[#777] hover:text-white transition-colors"
          >
            <Search size={22} />
          </button>
        }
      />

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

      {/* Posts feed - show skeleton while loading */}
      {isLoading ? (
        <FeedSkeleton count={5} />
      ) : (
        <div className="divide-y divide-[#333]">
          {sortedPosts.map((post) => {
            const scoredPost = scoredPosts.get(post.id)
            return (
              <div key={post.id}>
                <ThreadPost
                  postId={post.id}
                  author={post.author}
                  content={post.content}
                  timestamp={formatRelativeTime(post.createdAt)}
                  likes={post.likes}
                  replies={post.replies}
                  variant="doom"
                  isLiked={post.likedBy.includes(userId)}
                  onLike={() => handleLike(post.id, post.likedBy.includes(userId), post)}
                  onClick={() => navigate(`/post/${post.id}`)}
                  onShare={() => setSharePost(post)}
                  onRepost={() => handleRepost(post)}
                  onQuoteRepost={() => setQuotePost(post)}
                  isBookmarked={isBookmarked(post.id)}
                  onBookmark={() => handleBookmark(post.id)}
                />
                {/* Show personalization explanation for "For You" tab */}
                {sortBy === 'personalized' && activeTab === 'foryou' && scoredPost?.explanation && (
                  <div className="px-4 pb-2 -mt-1">
                    <WhyAmISeeingThisCompact explanation={scoredPost.explanation} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && sortedPosts.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center py-16 px-8">
          {activeTab === 'following' ? (
            <>
              <UserPlus size={48} className="text-[#333] mb-4" />
              <p className="text-[15px] text-[#777] text-center">
                {following.length === 0
                  ? "You're not following anyone yet."
                  : "No posts from people you follow."}
              </p>
              <p className="text-[13px] text-[#555] text-center mt-1">
                Follow doomers to see their posts here.
              </p>
            </>
          ) : (
            <p className="text-[15px] text-[#777] text-center">
              No doom to scroll yet.
            </p>
          )}
        </div>
      )}

      {/* Share modal */}
      {sharePost && (
        <ShareModal
          postId={sharePost.id}
          content={sharePost.content}
          onClose={() => setSharePost(null)}
        />
      )}

      {/* Quote repost modal */}
      {quotePost && (
        <QuoteRepostModal
          isOpen={true}
          onClose={() => setQuotePost(null)}
          onSubmit={handleQuoteRepost}
          originalPost={quotePost}
        />
      )}
    </div>
  )
}
