/**
 * ThreadPost Component
 *
 * A Threads-style post card used throughout the app for displaying
 * doom scroll posts, life posts, and user activity.
 *
 * Features:
 * - Avatar column with optional thread line for replies
 * - Verified badge support
 * - Interactive action buttons (like, comment, repost, share)
 * - Variant styling for doom (red) and life (green) posts
 */

import { Heart, MessageCircle, Repeat2, Send, MoreHorizontal } from 'lucide-react'

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
  /** Show thread line connecting to next post */
  hasThread?: boolean
  /** Visual variant: doom (red accent), life (green accent), or default */
  variant?: 'doom' | 'life' | 'default'
  /** Is the post liked by current user */
  isLiked?: boolean
  /** Callback when like button is clicked */
  onLike?: () => void
  /** Callback when post content is clicked */
  onClick?: () => void
}

export function ThreadPost({
  postId: _postId,
  author,
  content,
  timestamp,
  likes,
  replies,
  hasThread = false,
  variant = 'default',
  isLiked = false,
  onLike,
  onClick,
}: ThreadPostProps) {
  // Determine accent color based on post variant
  const accentColor = variant === 'doom' ? '#ff3040' : variant === 'life' ? '#00ba7c' : '#777'

  return (
    <article className="flex gap-3 px-4 py-3">
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
          {/* Repost button */}
          <button className="p-2 hover:bg-[#1a1a1a] rounded-full transition-colors group">
            <Repeat2
              size={20}
              className="text-[#777] group-hover:text-white transition-colors"
            />
          </button>
          {/* Share button */}
          <button className="p-2 hover:bg-[#1a1a1a] rounded-full transition-colors group">
            <Send
              size={20}
              className="text-[#777] group-hover:text-white transition-colors"
            />
          </button>
        </div>

        {/* Engagement stats */}
        {(replies > 0 || likes > 0) && (
          <div className="flex items-center gap-2 mt-1 text-[15px] text-[#777]">
            {replies > 0 && (
              <span>{replies} {replies === 1 ? 'reply' : 'replies'}</span>
            )}
            {replies > 0 && likes > 0 && <span>·</span>}
            {likes > 0 && (
              <span>{likes} {likes === 1 ? 'like' : 'likes'}</span>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
