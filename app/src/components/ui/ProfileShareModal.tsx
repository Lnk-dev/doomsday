/**
 * ProfileShareModal Component
 *
 * Modal for sharing user profiles via various methods.
 */

import { X, Link2, Twitter, MessageCircle, Check, Copy } from 'lucide-react'
import { useState } from 'react'
import type { Author } from '@/types'

interface ProfileShareModalProps {
  /** Profile to share */
  profile: Author
  /** User stats */
  stats: {
    doomBalance: number
    lifeBalance: number
    daysLiving: number
    postsCount: number
  }
  /** Callback when modal is closed */
  onClose: () => void
}

export function ProfileShareModal({ profile, stats, onClose }: ProfileShareModalProps) {
  const [copied, setCopied] = useState(false)

  // Generate share URL
  const shareUrl = `${window.location.origin}/profile/${profile.username}`

  // Generate share text
  const shareText = `Check out @${profile.username} on Doomsday - ${stats.daysLiving} days living, ${stats.doomBalance} $DOOM, ${stats.lifeBalance} $LIFE`

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
          title: `@${profile.username} on Doomsday`,
          text: shareText,
          url: shareUrl,
        })
        onClose()
      } catch (err) {
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
          <h2 className="text-[17px] font-semibold text-white">Share profile</h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 rounded-full hover:bg-[#333] transition-colors"
          >
            <X size={20} className="text-[#777]" />
          </button>
        </div>

        {/* Profile preview */}
        <div className="mx-4 mb-4 p-4 rounded-xl bg-[#0a0a0a] border border-[#333]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#333]" />
            <div className="flex-1">
              <p className="text-[15px] font-semibold text-white">@{profile.username}</p>
              <p className="text-[12px] text-[#777]">{stats.daysLiving} days living</p>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#222]">
            <span className="text-[12px] text-[#ff3040]">{stats.doomBalance} $DOOM</span>
            <span className="text-[12px] text-[#00ba7c]">{stats.lifeBalance} $LIFE</span>
            <span className="text-[12px] text-[#777]">{stats.postsCount} posts</span>
          </div>
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

        {/* Copy username */}
        <div className="mx-4 mb-6">
          <button
            onClick={() => {
              navigator.clipboard.writeText(`@${profile.username}`)
            }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#222] text-[#777] hover:bg-[#333] transition-colors"
          >
            <Copy size={16} />
            <span className="text-[14px]">Copy username</span>
          </button>
        </div>

        {/* Safe area padding for mobile */}
        <div className="h-6" />
      </div>
    </div>
  )
}
