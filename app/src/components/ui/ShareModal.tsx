/**
 * ShareModal Component
 *
 * Modal for sharing posts via various methods:
 * - Copy link
 * - Share to Twitter/X
 * - Share via native share API
 */

import { X, Link2, Twitter, MessageCircle, Check } from 'lucide-react'
import { useState } from 'react'

interface ShareModalProps {
  /** Post ID to generate share link */
  postId: string
  /** Post content for share text */
  content: string
  /** Callback when modal is closed */
  onClose: () => void
}

export function ShareModal({ postId, content, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false)

  // Generate share URL (would use actual domain in production)
  const shareUrl = `${window.location.origin}/post/${postId}`

  // Truncate content for share text
  const shareText = content.length > 100 ? content.slice(0, 97) + '...' : content

  /** Copy link to clipboard */
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  /** Share to Twitter/X */
  const handleTwitterShare = () => {
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
    window.open(tweetUrl, '_blank', 'width=550,height=420')
  }

  /** Use native share API if available */
  const handleNativeShare = async () => {
    if ('share' in navigator) {
      try {
        await navigator.share({
          title: 'Doomsday Post',
          text: shareText,
          url: shareUrl,
        })
        onClose()
      } catch (err) {
        // User cancelled or error
        console.error('Share failed:', err)
      }
    }
  }

  const shareOptions = [
    {
      id: 'copy',
      label: copied ? 'Copied!' : 'Copy link',
      icon: copied ? Check : Link2,
      onClick: handleCopyLink,
      highlight: copied,
    },
    {
      id: 'twitter',
      label: 'Share to X',
      icon: Twitter,
      onClick: handleTwitterShare,
    },
...('share' in navigator
      ? [
          {
            id: 'native',
            label: 'More options',
            icon: MessageCircle,
            onClick: handleNativeShare,
          },
        ]
      : []),
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-[#1a1a1a] rounded-t-3xl animate-slide-up">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-[#333]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-4">
          <h2 className="text-[17px] font-semibold text-white">Share post</h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 rounded-full hover:bg-[#333] transition-colors"
          >
            <X size={20} className="text-[#777]" />
          </button>
        </div>

        {/* Post preview */}
        <div className="mx-4 mb-4 p-3 rounded-xl bg-[#0a0a0a] border border-[#333]">
          <p className="text-[14px] text-[#ccc] line-clamp-2">{content}</p>
        </div>

        {/* Share options */}
        <div className="grid grid-cols-3 gap-3 px-4 pb-6">
          {shareOptions.map((option) => {
            const Icon = option.icon
            return (
              <button
                key={option.id}
                onClick={option.onClick}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-colors ${
                  option.highlight
                    ? 'bg-[#00ba7c20] text-[#00ba7c]'
                    : 'bg-[#222] text-white hover:bg-[#333]'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    option.highlight ? 'bg-[#00ba7c30]' : 'bg-[#333]'
                  }`}
                >
                  <Icon size={22} />
                </div>
                <span className="text-[12px] font-medium">{option.label}</span>
              </button>
            )
          })}
        </div>

        {/* Safe area padding for mobile */}
        <div className="h-6" />
      </div>
    </div>
  )
}
