/**
 * ThreadPost Component
 * Issue #51: Add bookmark/save posts feature
 *
 * A Threads-style post card used throughout the app for displaying
 * doom scroll posts, life posts, and user activity.
 *
 * Features:
 * - Avatar column with optional thread line for replies
 * - Verified badge support
 * - Interactive action buttons (like, comment, repost, share, bookmark)
 * - Variant styling for doom (red) and life (green) posts
 * - Repost attribution and quote repost support
 */

import { useState, useRef, useEffect } from 'react'
import { Heart, MessageCircle, Repeat2, Send, Bookmark, MoreHorizontal } from 'lucide-react'

interface ThreadPostProps {
  /** Post ID for navigation */
  postId?: string
  /** Author information */
  author: {
    name?: string
    username: string
    avatar?: string
    verified?: boolean
    address?: string | null
  }
  /** Post content text */
  content: string
  /** Relative timestamp (e.g., "2h", "1d") */
  timestamp: string
  /** Number of likes */
  likes: number
  /** Number of replies */
  replies: number
  /** Number of reposts */
  repostCount?: number
  /** Show thread line connecting to next post */
  hasThread?: boolean
  /** Visual variant: doom (red accent), life (green accent), or default */
  variant?: 'doom' | 'life' | 'default'
  /** Is the post liked by current user */
  isLiked?: boolean
  /** Is the post reposted by current user */
  isReposted?: boolean
  /** User who reposted (for attribution) */
  repostedBy?: {
    username: string
    address?: string | null
  }
  /** Original post data for quote reposts */
  originalPost?: {
    author: {
      username: string
      avatar?: string
      verified?: boolean
    }
    content: string
  }
  /** Is this a quote repost */
  isQuoteRepost?: boolean
  /** Callback when like button is clicked */
  onLike?: () => void
  /** Callback when post content is clicked */
  onClick?: () => void
  /** Callback when share button is clicked */
  onShare?: () => void
  /** Callback when repost button is clicked */
  onRepost?: () => void
  /** Callback when quote repost is selected */
  onQuoteRepost?: () => void
  /** Is the post bookmarked by current user */
  isBookmarked?: boolean
  /** Callback when bookmark button is clicked */
  onBookmark?: () => void
}

export function ThreadPost({
  postId,
  author,
  content,
  timestamp,
  likes,
  replies,
  repostCount = 0,
  hasThread = false,
  variant = 'default',
  isLiked = false,
  isReposted = false,
  repostedBy,
  originalPost,
  isQuoteRepost = false,
  onLike,
  onClick,
  onShare,
  onRepost,
  onQuoteRepost,
  isBookmarked = false,
  onBookmark,
}: ThreadPostProps) {
  // Determine accent color based on post variant
  const accentColor = variant === 'doom' ? '#ff3040' : variant === 'life' ? '#00ba7c' : '#777'

  // postId is available for future use (e.g., analytics, navigation)
  void postId

  // Repost menu state
  const [showRepostMenu, setShowRepostMenu] = useState(false)
  const repostMenuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (repostMenuRef.current && !repostMenuRef.current.contains(event.target as Node)) {
        setShowRepostMenu(false)
      }
    }

    if (showRepostMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showRepostMenu])

  return (
    <article className="px-4 py-3">
      {/* Repost attribution header */}
      {repostedBy && (
        <div className="flex items-center gap-1.5 ml-12 mb-1 text-[13px] text-[#777]">
          <Repeat2 size={14} />
          <span>@{repostedBy.username} reposted</span>
        </div>
      )}

      <div className="flex gap-3">
      {/* Avatar column with optional thread line */}
      <div className="flex flex-col items-center">
        <div
          className="w-9 h-9 rounded-full bg-[#333] flex-shrink-0 overflow-hidden"
          style={variant !== 'default' ? { border: `2px solid ${accentColor}` } : {}}
        >
          {author.avatar && (
            <img src={author.avatar} alt="" className="w-full h-full object-cover" />
          )}
        </div>
        {/* Thread line for connected replies */}
        {hasThread && (
          <div className="w-0.5 flex-1 bg-[#333] mt-2 min-h-[20px]" />
        )}
      </div>

      {/* Content column */}
      <div className="flex-1 min-w-0">
        {/* Header: username, verified badge, timestamp, menu */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="font-semibold text-[15px] text-white">
              {author.username}
            </span>
            {/* Verified badge (Twitter/Threads style) */}
            {author.verified && (
              <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
              </svg>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#777] text-[15px]">{timestamp}</span>
            <button className="p-1 -mr-1 text-[#777] hover:text-white">
              <MoreHorizontal size={20} />
            </button>
          </div>
        </div>

        {/* Post content */}
        <p
          onClick={onClick}
          className={`text-[15px] text-white mt-0.5 whitespace-pre-wrap break-words ${
            onClick ? 'cursor-pointer' : ''
          }`}
        >
          {content}
        </p>

        {/* Quote repost embedded post */}
        {isQuoteRepost && originalPost && (
          <div
            className="mt-3 border rounded-xl p-3"
            style={{ borderColor: `${accentColor}40` }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-5 h-5 rounded-full bg-[#333] overflow-hidden"
                style={{ border: `1px solid ${accentColor}` }}
              >
                {originalPost.author.avatar && (
                  <img
                    src={originalPost.author.avatar}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <span className="text-[13px] font-semibold text-white">
                @{originalPost.author.username}
              </span>
              {originalPost.author.verified && (
                <svg
                  className="w-3 h-3 text-blue-500"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
                </svg>
              )}
            </div>
            <p className="text-[14px] text-[#aaa] line-clamp-3">
              {originalPost.content}
            </p>
          </div>
        )}

        {/* Action buttons row */}
        <div className="flex items-center gap-1 mt-3 -ml-2">
          {/* Like button */}
          <button
            onClick={onLike}
            className="p-2 hover:bg-[#1a1a1a] rounded-full transition-colors group"
          >
            <Heart
              size={20}
              className={`transition-colors ${
                isLiked
                  ? 'text-[#ff3040] fill-[#ff3040]'
                  : 'text-[#777] group-hover:text-white'
              }`}
            />
          </button>
          {/* Comment button */}
          <button className="p-2 hover:bg-[#1a1a1a] rounded-full transition-colors group">
            <MessageCircle
              size={20}
              className="text-[#777] group-hover:text-white transition-colors"
            />
          </button>
          {/* Repost button with dropdown */}
          <div className="relative" ref={repostMenuRef}>
            <button
              onClick={() => setShowRepostMenu(!showRepostMenu)}
              className="p-2 hover:bg-[#1a1a1a] rounded-full transition-colors group"
            >
              <Repeat2
                size={20}
                className={`transition-colors ${
                  isReposted
                    ? 'text-[#00ba7c]'
                    : 'text-[#777] group-hover:text-white'
                }`}
              />
            </button>
            {/* Repost dropdown menu */}
            {showRepostMenu && (
              <div className="absolute left-0 top-full mt-1 bg-[#262626] rounded-xl shadow-lg border border-[#333] py-1 min-w-[160px] z-10">
                <button
                  onClick={() => {
                    onRepost?.()
                    setShowRepostMenu(false)
                  }}
                  className="w-full px-4 py-2.5 text-left text-[15px] text-white hover:bg-[#333] flex items-center gap-3"
                >
                  <Repeat2 size={18} />
                  {isReposted ? 'Undo repost' : 'Repost'}
                </button>
                {!isReposted && (
                  <button
                    onClick={() => {
                      onQuoteRepost?.()
                      setShowRepostMenu(false)
                    }}
                    className="w-full px-4 py-2.5 text-left text-[15px] text-white hover:bg-[#333] flex items-center gap-3"
                  >
                    <MessageCircle size={18} />
                    Quote
                  </button>
                )}
              </div>
            )}
          </div>
          {/* Share button */}
          <button
            onClick={onShare}
            className="p-2 hover:bg-[#1a1a1a] rounded-full transition-colors group"
          >
            <Send
              size={20}
              className="text-[#777] group-hover:text-white transition-colors"
            />
          </button>
          {/* Bookmark button */}
          <button
            onClick={onBookmark}
            className="p-2 hover:bg-[#1a1a1a] rounded-full transition-colors group"
          >
            <Bookmark
              size={20}
              className={`transition-colors ${
                isBookmarked
                  ? 'text-[#1d9bf0] fill-[#1d9bf0]'
                  : 'text-[#777] group-hover:text-white'
              }`}
            />
          </button>
        </div>

        {/* Engagement stats */}
        {(replies > 0 || likes > 0 || repostCount > 0) && (
          <div className="flex items-center gap-2 mt-1 text-[15px] text-[#777]">
            {replies > 0 && (
              <span>{replies} {replies === 1 ? 'reply' : 'replies'}</span>
            )}
            {replies > 0 && repostCount > 0 && <span>·</span>}
            {repostCount > 0 && (
              <span>{repostCount} {repostCount === 1 ? 'repost' : 'reposts'}</span>
            )}
            {(replies > 0 || repostCount > 0) && likes > 0 && <span>·</span>}
            {likes > 0 && (
              <span>{likes} {likes === 1 ? 'like' : 'likes'}</span>
            )}
          </div>
        )}
      </div>
      </div>
    </article>
  )
}
