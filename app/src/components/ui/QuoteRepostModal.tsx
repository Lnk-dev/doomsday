/**
 * QuoteRepostModal Component
 * Issue #49: Accessibility improvements (WCAG 2.1)
 *
 * Modal for creating quote reposts with user commentary.
 * Shows the original post embedded and allows adding text.
 * Includes proper ARIA attributes for screen readers.
 */

import { useState } from 'react'
import { X } from 'lucide-react'
import type { Post } from '@/types'

interface QuoteRepostModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (content: string) => void
  originalPost: Post
}

export function QuoteRepostModal({
  isOpen,
  onClose,
  onSubmit,
  originalPost,
}: QuoteRepostModalProps) {
  const [content, setContent] = useState('')

  const handleSubmit = () => {
    if (content.trim()) {
      onSubmit(content)
      setContent('')
      onClose()
    }
  }

  if (!isOpen) return null

  const accentColor = originalPost.variant === 'doom' ? '#ff3040' : '#00ba7c'

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quote-modal-title"
    >
      <div className="bg-[#181818] rounded-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#333]">
          <button
            onClick={onClose}
            aria-label="Close quote dialog"
            className="p-1 rounded-full hover:bg-[#333] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#181818]"
          >
            <X size={20} className="text-white" aria-hidden="true" />
          </button>
          <h2 id="quote-modal-title" className="text-white font-semibold text-[17px]">Quote</h2>
          <button
            onClick={handleSubmit}
            disabled={!content.trim()}
            aria-label={content.trim() ? 'Post quote' : 'Post quote (add text first)'}
            className="px-4 py-1.5 rounded-full text-[15px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#181818]"
            style={{
              backgroundColor: content.trim() ? accentColor : '#333',
              color: content.trim() ? 'white' : '#777',
            }}
          >
            Post
          </button>
        </div>

        {/* Content area */}
        <div className="p-4">
          <label htmlFor="quote-content" className="sr-only">Your quote text</label>
          <textarea
            id="quote-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add your thoughts..."
            className="w-full bg-transparent text-white text-[15px] resize-none outline-none min-h-[100px] placeholder-[#777] focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#181818] rounded-lg"
            autoFocus
            maxLength={280}
            aria-describedby="quote-char-count"
          />

          {/* Character count */}
          <div id="quote-char-count" className="text-right text-[12px] text-[#555] mb-3" aria-live="polite">
            {content.length}/280
          </div>

          {/* Embedded original post preview */}
          <div
            className="border rounded-xl p-3"
            style={{ borderColor: `${accentColor}40` }}
            aria-label={`Original post from ${originalPost.author.username}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-5 h-5 rounded-full bg-[#333] overflow-hidden"
                style={{ border: `1px solid ${accentColor}` }}
              >
                {originalPost.author.avatar && (
                  <img
                    src={originalPost.author.avatar}
                    alt={`${originalPost.author.username}'s avatar`}
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
                  aria-label="Verified account"
                  role="img"
                >
                  <title>Verified</title>
                  <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
                </svg>
              )}
            </div>
            <p className="text-[14px] text-[#aaa] line-clamp-3">
              {originalPost.content}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
