/**
 * ProfileShareModal Component
 *
 * Modal for sharing user profiles via various methods:
 * - Copy link
 * - Share to Twitter/X, Reddit, Discord, Telegram, WhatsApp
 * - Generate QR code
 * - Share via native share API
 */

import {
  X,
  Link2,
  Twitter,
  MessageCircle,
  Check,
  Copy,
  Send,
  QrCode,
  Mail,
  Download,
  Hash,
} from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import QRCode from 'qrcode'
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
  const [showQR, setShowQR] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string>('')

  // Generate share URL
  const shareUrl = `${window.location.origin}/profile/${profile.username}`

  // Generate share text
  const shareText = `Check out @${profile.username} on Doomsday - ${stats.daysLiving} days living, ${stats.doomBalance} $DOOM, ${stats.lifeBalance} $LIFE`

  // Generate QR code when modal opens
  useEffect(() => {
    QRCode.toDataURL(shareUrl, {
      width: 256,
      margin: 2,
      color: { dark: '#ffffff', light: '#0a0a0a' },
    }).then(setQrDataUrl)
  }, [shareUrl])

  /** Copy link to clipboard with rich text support */
  const handleCopyLink = useCallback(async () => {
    try {
      const richText = `${shareText}\n\n${shareUrl}`
      const htmlText = `<p>${shareText}</p><a href="${shareUrl}">${shareUrl}</a>`

      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/plain': new Blob([richText], { type: 'text/plain' }),
            'text/html': new Blob([htmlText], { type: 'text/html' }),
          }),
        ])
      } catch {
        await navigator.clipboard.writeText(shareUrl)
      }

      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }, [shareText, shareUrl])

  /** Share to Twitter/X */
  const handleTwitterShare = useCallback(() => {
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      shareText
    )}&url=${encodeURIComponent(shareUrl)}`
    window.open(tweetUrl, '_blank', 'width=550,height=420')
  }, [shareText, shareUrl])

  /** Share to Reddit */
  const handleRedditShare = useCallback(() => {
    const redditUrl = `https://reddit.com/submit?url=${encodeURIComponent(
      shareUrl
    )}&title=${encodeURIComponent(`@${profile.username} on Doomsday`)}`
    window.open(redditUrl, '_blank', 'width=550,height=600')
  }, [shareUrl, profile.username])

  /** Copy formatted text for Discord */
  const handleDiscordShare = useCallback(async () => {
    const discordText = `**${shareText}**\n${shareUrl}`
    try {
      await navigator.clipboard.writeText(discordText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy for Discord:', err)
    }
  }, [shareText, shareUrl])

  /** Share to Telegram */
  const handleTelegramShare = useCallback(() => {
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(
      shareUrl
    )}&text=${encodeURIComponent(shareText)}`
    window.open(telegramUrl, '_blank', 'width=550,height=420')
  }, [shareText, shareUrl])

  /** Share to WhatsApp */
  const handleWhatsAppShare = useCallback(() => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
      shareText + '\n\n' + shareUrl
    )}`
    window.open(whatsappUrl, '_blank')
  }, [shareText, shareUrl])

  /** Share via Email */
  const handleEmailShare = useCallback(() => {
    const subject = encodeURIComponent(`Check out @${profile.username} on Doomsday`)
    const body = encodeURIComponent(`${shareText}\n\n${shareUrl}`)
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }, [profile.username, shareText, shareUrl])

  /** Use native share API if available */
  const handleNativeShare = useCallback(async () => {
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
  }, [profile.username, shareText, shareUrl, onClose])

  /** Download QR code */
  const handleDownloadQR = useCallback(() => {
    const link = document.createElement('a')
    link.download = `doomsday-profile-${profile.username}.png`
    link.href = qrDataUrl
    link.click()
  }, [profile.username, qrDataUrl])

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
      label: 'X / Twitter',
      icon: Twitter,
      onClick: handleTwitterShare,
    },
    {
      id: 'reddit',
      label: 'Reddit',
      icon: Hash,
      onClick: handleRedditShare,
    },
    {
      id: 'discord',
      label: 'Discord',
      icon: MessageCircle,
      onClick: handleDiscordShare,
    },
    {
      id: 'telegram',
      label: 'Telegram',
      icon: Send,
      onClick: handleTelegramShare,
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: MessageCircle,
      onClick: handleWhatsAppShare,
    },
    {
      id: 'email',
      label: 'Email',
      icon: Mail,
      onClick: handleEmailShare,
    },
    {
      id: 'qr',
      label: 'QR Code',
      icon: QrCode,
      onClick: () => setShowQR(true),
    },
    ...('share' in navigator
      ? [
          {
            id: 'native',
            label: 'More',
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
      <div className="relative w-full max-w-lg bg-[var(--color-bg-tertiary)] rounded-t-3xl animate-slide-up">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-[var(--color-border)]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-4">
          <h2 className="text-[17px] font-semibold text-[var(--color-text-primary)]">
            {showQR ? 'QR Code' : 'Share profile'}
          </h2>
          <button
            onClick={showQR ? () => setShowQR(false) : onClose}
            className="p-2 -mr-2 rounded-full hover:bg-[var(--color-bg-hover)] transition-colors"
          >
            <X size={20} className="text-[var(--color-text-muted)]" />
          </button>
        </div>

        {showQR ? (
          /* QR Code View */
          <div className="px-4 pb-6 flex flex-col items-center">
            <div className="p-4 bg-[#0a0a0a] rounded-2xl mb-4">
              <img
                src={qrDataUrl}
                alt="QR code for sharing profile"
                className="w-64 h-64"
              />
            </div>
            <p className="text-[13px] text-[var(--color-text-muted)] text-center mb-4">
              Scan to view @{profile.username} on Doomsday
            </p>
            <button
              onClick={handleDownloadQR}
              className="flex items-center gap-2 px-6 py-3 bg-[var(--color-doom)] text-white rounded-full font-semibold"
            >
              <Download size={18} />
              Download QR Code
            </button>
          </div>
        ) : (
          <>
            {/* Profile preview */}
            <div className="mx-4 mb-4 p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[var(--color-bg-tertiary)]" />
                <div className="flex-1">
                  <p className="text-[15px] font-semibold text-[var(--color-text-primary)]">
                    @{profile.username}
                  </p>
                  <p className="text-[12px] text-[var(--color-text-muted)]">
                    {stats.daysLiving} days living
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[var(--color-border)]">
                <span className="text-[12px] text-[var(--color-doom)]">
                  {stats.doomBalance} $DOOM
                </span>
                <span className="text-[12px] text-[#00ba7c]">
                  {stats.lifeBalance} $LIFE
                </span>
                <span className="text-[12px] text-[var(--color-text-muted)]">
                  {stats.postsCount} posts
                </span>
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
                        ? 'bg-[#00ba7c]/20 text-[#00ba7c]'
                        : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        option.highlight
                          ? 'bg-[#00ba7c]/30'
                          : 'bg-[var(--color-bg-tertiary)]'
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
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] transition-colors"
              >
                <Copy size={16} />
                <span className="text-[14px]">Copy username</span>
              </button>
            </div>
          </>
        )}

        {/* Safe area padding for mobile */}
        <div className="h-6" />
      </div>
    </div>
  )
}
