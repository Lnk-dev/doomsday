/**
 * HashtagPage
 *
 * Displays all posts containing a specific hashtag.
 * Supports sorting by recent or top (most liked).
 */

import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Hash, TrendingUp, Flame } from 'lucide-react'
import { usePostsStore, useUserStore, useBookmarksStore } from '@/store'
import { useHashtagsStore } from '@/store/hashtags'
import { ThreadPost } from '@/components/ui/ThreadPost'
import { formatRelativeTime } from '@/lib/utils'
import { useMemo, useState } from 'react'
import type { Post } from '@/types'

type SortOption = 'recent' | 'top'

export function HashtagPage() {
  const { tag } = useParams<{ tag: string }>()
  const navigate = useNavigate()
  const [sortBy, setSortBy] = useState<SortOption>('recent')

  const posts = usePostsStore((state) => state.posts)
  const postIds = useHashtagsStore((state) => state.getPostsByHashtag(tag || ''))
  const hashtagData = useHashtagsStore((state) => state.getHashtagData(tag || ''))

  const likePost = usePostsStore((state) => state.likePost)
  const unlikePost = usePostsStore((state) => state.unlikePost)
  const userId = useUserStore((state) => state.userId)

  const isBookmarked = useBookmarksStore((state) => state.isBookmarked)
  const addBookmark = useBookmarksStore((state) => state.addBookmark)
  const removeBookmark = useBookmarksStore((state) => state.removeBookmark)

  // Get and sort posts
  const hashtagPosts = useMemo(() => {
    const result: Post[] = postIds.map((id) => posts[id]).filter(Boolean)

    if (sortBy === 'recent') {
      return result.sort((a, b) => b.createdAt - a.createdAt)
    } else {
      return result.sort((a, b) => b.likes - a.likes)
    }
  }, [postIds, posts, sortBy])

  const handleLike = (postId: string, isLiked: boolean) => {
    if (isLiked) {
      unlikePost(postId, userId)
    } else {
      likePost(postId, userId)
    }
  }

  const handleBookmark = (postId: string) => {
    if (isBookmarked(postId)) {
      removeBookmark(postId, userId)
    } else {
      addBookmark(postId, userId)
    }
  }

  return (
    <div className="flex flex-col min-h-full bg-[var(--color-bg-primary)]">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-[var(--color-border)] sticky top-0 bg-[var(--color-bg-primary)] z-10">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft size={24} className="text-[var(--color-text-primary)]" />
        </button>
        <div>
          <h1 className="text-[17px] font-semibold text-[var(--color-text-primary)]">
            #{tag}
          </h1>
          <p className="text-[13px] text-[var(--color-text-muted)]">
            {hashtagPosts.length} posts
          </p>
        </div>
      </div>

      {/* Stats bar */}
      {hashtagData && (
        <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Flame size={16} className="text-[#ff3040]" />
              <span className="text-[#ff3040] font-semibold">
                {hashtagData.variantCounts.doom}
              </span>
              <span className="text-[var(--color-text-muted)] text-[13px]">doom</span>
            </div>
            <div className="flex items-center gap-2">
              <Hash size={16} className="text-[#00ba7c]" />
              <span className="text-[#00ba7c] font-semibold">
                {hashtagData.variantCounts.life}
              </span>
              <span className="text-[var(--color-text-muted)] text-[13px]">life</span>
            </div>
          </div>
        </div>
      )}

      {/* Sort options */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border)]">
        <button
          onClick={() => setSortBy('recent')}
          className={`px-4 py-2 rounded-full text-[13px] font-medium transition-colors ${
            sortBy === 'recent'
              ? 'bg-[var(--color-text-primary)] text-[var(--color-bg-primary)]'
              : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]'
          }`}
        >
          Recent
        </button>
        <button
          onClick={() => setSortBy('top')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium transition-colors ${
            sortBy === 'top'
              ? 'bg-[var(--color-text-primary)] text-[var(--color-bg-primary)]'
              : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]'
          }`}
        >
          <TrendingUp size={14} />
          Top
        </button>
      </div>

      {/* Posts feed */}
      {hashtagPosts.length > 0 ? (
        <div className="divide-y divide-[var(--color-border)]">
          {hashtagPosts.map((post) => (
            <ThreadPost
              key={post.id}
              postId={post.id}
              author={post.author}
              content={post.content}
              timestamp={formatRelativeTime(post.createdAt)}
              likes={post.likes}
              replies={post.replies}
              variant={post.variant}
              isLiked={post.likedBy.includes(userId)}
              isBookmarked={isBookmarked(post.id)}
              onLike={() => handleLike(post.id, post.likedBy.includes(userId))}
              onBookmark={() => handleBookmark(post.id)}
              onClick={() => navigate(`/post/${post.id}`)}
            />
          ))}
        </div>
      ) : (
        /* Empty state */
        <div className="flex-1 flex flex-col items-center justify-center py-16 px-8">
          <Hash size={48} className="text-[var(--color-border)] mb-4" />
          <p className="text-[15px] text-[var(--color-text-muted)] text-center">
            No posts with #{tag} yet.
          </p>
          <p className="text-[13px] text-[var(--color-text-muted)] text-center mt-1 opacity-60">
            Be the first to post with this hashtag!
          </p>
        </div>
      )}
    </div>
  )
}
