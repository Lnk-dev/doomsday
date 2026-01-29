/**
 * ShareModal Component
 *
 * Modal for sharing posts via various methods:
 * - Copy link
 * - Share to Twitter/X
 * - Share to Reddit, Discord, Telegram, WhatsApp
 * - Generate QR code
 * - Share via native share API
 */

import {
  X,
  Link2,
  Twitter,
  MessageCircle,
  Check,
  Send,
  QrCode,
  Mail,
  Download,
  Hash,
  Code2,
} from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import QRCode from 'qrcode'
import { EmbedCodeModal } from './EmbedCodeModal'

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
  const [showQR, setShowQR] = useState(false)
  const [showEmbed, setShowEmbed] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string>('')

  // Generate share URL (would use actual domain in production)
  const shareUrl = `${window.location.origin}/post/${postId}`

  // Truncate content for share text
  const shareText = content.length > 100 ? content.slice(0, 97) + '...' : content

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
      // Try rich clipboard with HTML
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
        // Fallback to plain text
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
    )}&title=${encodeURIComponent('Check out this post on Doomsday')}`
    window.open(redditUrl, '_blank', 'width=550,height=600')
  }, [shareUrl])

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
    const subject = encodeURIComponent('Check this out on Doomsday')
    const body = encodeURIComponent(`${shareText}\n\n${shareUrl}`)
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }, [shareText, shareUrl])

  /** Use native share API if available */
  const handleNativeShare = useCallback(async () => {
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
  }, [shareText, shareUrl, onClose])

  /** Download QR code */
  const handleDownloadQR = useCallback(() => {
    const link = document.createElement('a')
    link.download = `doomsday-post-${postId}.png`
    link.href = qrDataUrl
    link.click()
  }, [postId, qrDataUrl])

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
    {
      id: 'embed',
      label: 'Embed',
      icon: Code2,
      onClick: () => setShowEmbed(true),
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
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-[var(--color-bg-tertiary)] rounded-t-3xl animate-slide-up">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div
            className="w-10 h-1 rounded-full bg-[var(--color-border)]"
            aria-hidden="true"
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-4">
          <h2
            id="share-modal-title"
            className="text-[17px] font-semibold text-[var(--color-text-primary)]"
          >
            {showQR ? 'QR Code' : 'Share post'}
          </h2>
          <button
            onClick={showQR ? () => setShowQR(false) : onClose}
            className="p-2 -mr-2 rounded-full hover:bg-[var(--color-bg-hover)] transition-colors"
            aria-label={showQR ? 'Back to share options' : 'Close share dialog'}
          >
            <X size={20} className="text-[var(--color-text-muted)]" aria-hidden="true" />
          </button>
        </div>

        {showQR ? (
          /* QR Code View */
          <div className="px-4 pb-6 flex flex-col items-center">
            <div className="p-4 bg-[#0a0a0a] rounded-2xl mb-4">
              <img
                src={qrDataUrl}
                alt="QR code for sharing"
                className="w-64 h-64"
              />
            </div>
            <p className="text-[13px] text-[var(--color-text-muted)] text-center mb-4">
              Scan to view this post on Doomsday
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
            {/* Post preview */}
            <div className="mx-4 mb-4 p-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
              <p className="text-[14px] text-[var(--color-text-secondary)] line-clamp-2">
                {content}
              </p>
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
                      <Icon size={22} aria-hidden="true" />
                    </div>
                    <span className="text-[12px] font-medium">{option.label}</span>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {/* Safe area padding for mobile */}
        <div className="h-6" />
      </div>

      {/* Embed Code Modal */}
      {showEmbed && (
        <EmbedCodeModal postId={postId} onClose={() => setShowEmbed(false)} />
      )}
    </div>
  )
}
