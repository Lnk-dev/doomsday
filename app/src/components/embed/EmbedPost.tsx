/**
 * EmbedPost Component
 * Issue #78: Enhance social sharing and embed system
 *
 * Embeddable post widget for external sites.
 */

import { formatRelativeTime } from '@/lib/utils'
import { Heart, MessageCircle, Repeat2 } from 'lucide-react'

interface EmbedPostProps {
  author: {
    username: string
    avatar?: string
    verified?: boolean
  }
  content: string
  variant: 'doom' | 'life'
  createdAt: number
  likes: number
  replies: number
  reposts?: number
  postId: string
  theme?: 'dark' | 'light'
  showStats?: boolean
}

export function EmbedPost({
  author,
  content,
  variant,
  createdAt,
  likes,
  replies,
  reposts = 0,
  postId,
  theme = 'dark',
  showStats = true,
}: EmbedPostProps) {
  const bgColor = theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-white'
  const textColor = theme === 'dark' ? 'text-white' : 'text-[#0f1419]'
  const mutedColor = theme === 'dark' ? 'text-[#777]' : 'text-[#536471]'
  const borderColor = theme === 'dark' ? 'border-[#333]' : 'border-[#cfd9de]'
  const variantColor = variant === 'doom' ? 'text-[#ff3040]' : 'text-[#00ba7c]'
  const variantBg = variant === 'doom' ? 'bg-[#ff3040]/10' : 'bg-[#00ba7c]/10'

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://doomsday.app'
  const postUrl = `${appUrl}/post/${postId}`

  return (
    <div
      className={`${bgColor} rounded-xl border ${borderColor} overflow-hidden max-w-[550px] font-sans`}
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex-shrink-0 ${
              theme === 'dark' ? 'bg-gradient-to-br from-[#ff3040] to-[#ff6b6b]' : 'bg-[#cfd9de]'
            } flex items-center justify-center`}
          >
            {author.avatar ? (
              <img src={author.avatar} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-white font-bold text-sm">
                {author.username.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className={`font-bold text-[15px] ${textColor}`}>{author.username}</span>
              {author.verified && (
                <svg className="w-4 h-4 text-[#1d9bf0]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484z" />
                </svg>
              )}
            </div>
            <span className={`text-[13px] ${mutedColor}`}>@{author.username}</span>
          </div>
        </div>
        <div className={`px-2 py-1 rounded-full text-[11px] font-semibold ${variantColor} ${variantBg}`}>
          {variant.toUpperCase()}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className={`text-[15px] ${textColor} whitespace-pre-wrap break-words leading-relaxed`}>
          {content}
        </p>
      </div>

      {/* Timestamp */}
      <div className={`px-4 pb-3 text-[13px] ${mutedColor}`}>
        {formatRelativeTime(createdAt)}
      </div>

      {/* Stats */}
      {showStats && (
        <div className={`flex items-center gap-6 px-4 py-3 border-t ${borderColor}`}>
          <div className={`flex items-center gap-1.5 text-[13px] ${mutedColor}`}>
            <Heart size={16} />
            <span>{likes}</span>
          </div>
          <div className={`flex items-center gap-1.5 text-[13px] ${mutedColor}`}>
            <MessageCircle size={16} />
            <span>{replies}</span>
          </div>
          {reposts > 0 && (
            <div className={`flex items-center gap-1.5 text-[13px] ${mutedColor}`}>
              <Repeat2 size={16} />
              <span>{reposts}</span>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <a
        href={postUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`block px-4 py-3 text-center text-[13px] font-medium border-t ${borderColor} hover:bg-[#f7f9f9]/5 transition-colors`}
      >
        <span className={variantColor}>View on Doomsday</span>
      </a>
    </div>
  )
}
