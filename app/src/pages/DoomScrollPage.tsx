/**
 * DoomScrollPage
 *
 * Main feed displaying doom-related posts. This is the home screen
 * of the app where users see pessimistic predictions and commentary.
 *
 * Features:
 * - Feed toggle (For You / Following)
 * - Infinite scroll of doom posts
 * - Real-time like interactions
 */

import { PageHeader } from '@/components/layout/PageHeader'
import { ThreadPost } from '@/components/ui/ThreadPost'
import { usePostsStore, useUserStore } from '@/store'
import { formatRelativeTime } from '@/lib/utils'
import { useState } from 'react'

type FeedTab = 'foryou' | 'following'

export function DoomScrollPage() {
  const [activeTab, setActiveTab] = useState<FeedTab>('foryou')

  // Get doom posts from store
  const posts = usePostsStore((state) => state.getFeed('doom'))
  const likePost = usePostsStore((state) => state.likePost)
  const unlikePost = usePostsStore((state) => state.unlikePost)
  const userId = useUserStore((state) => state.userId)

  /** Handle like button click */
  const handleLike = (postId: string, isLiked: boolean) => {
    if (isLiked) {
      unlikePost(postId, userId)
    } else {
      likePost(postId, userId)
    }
  }

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

      {/* Posts feed */}
      <div className="divide-y divide-[#333]">
        {posts.map((post) => (
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
      {posts.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center py-16 px-8">
          <p className="text-[15px] text-[#777] text-center">
            No doom to scroll yet.
          </p>
        </div>
      )}
    </div>
  )
}
