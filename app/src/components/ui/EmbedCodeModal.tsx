/**
 * EmbedCodeModal Component
 * Issue #78: Enhance social sharing and embed system
 *
 * Modal for generating and copying embed codes.
 */

import { useState } from 'react'
import { X, Copy, Check, Code2, ExternalLink } from 'lucide-react'

interface EmbedCodeModalProps {
  postId: string
  onClose: () => void
}

type EmbedType = 'iframe' | 'js'

export function EmbedCodeModal({ postId, onClose }: EmbedCodeModalProps) {
  const [embedType, setEmbedType] = useState<EmbedType>('iframe')
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [showStats, setShowStats] = useState(true)
  const [copied, setCopied] = useState(false)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://doomsday.app'
  const embedUrl = `${baseUrl}/embed/post/${postId}?theme=${theme}&stats=${showStats}`
  const postUrl = `${baseUrl}/post/${postId}`

  const iframeCode = `<iframe
  src="${embedUrl}"
  width="550"
  height="400"
  frameborder="0"
  style="border-radius: 12px; overflow: hidden;"
  title="Doomsday post embed"
></iframe>`

  const jsCode = `<blockquote class="doomsday-post" data-post-id="${postId}" data-theme="${theme}" data-stats="${showStats}">
  <a href="${postUrl}">View post on Doomsday</a>
</blockquote>
<script async src="${baseUrl}/embed.js" charset="utf-8"></script>`

  const embedCode = embedType === 'iframe' ? iframeCode : jsCode

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(embedCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-lg bg-[#111] rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#333]">
          <div className="flex items-center gap-2">
            <Code2 size={20} className="text-[#777]" />
            <h3 className="text-[15px] font-semibold text-white">Embed Post</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#777] hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Options */}
        <div className="p-4 space-y-4">
          {/* Embed Type */}
          <div>
            <label className="block text-[13px] text-[#777] mb-2">Embed Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => setEmbedType('iframe')}
                className={`flex-1 py-2 px-3 rounded-lg text-[13px] font-medium transition-colors ${
                  embedType === 'iframe'
                    ? 'bg-[#ff3040] text-white'
                    : 'bg-[#1a1a1a] text-[#777] hover:bg-[#252525]'
                }`}
              >
                iFrame
              </button>
              <button
                onClick={() => setEmbedType('js')}
                className={`flex-1 py-2 px-3 rounded-lg text-[13px] font-medium transition-colors ${
                  embedType === 'js'
                    ? 'bg-[#ff3040] text-white'
                    : 'bg-[#1a1a1a] text-[#777] hover:bg-[#252525]'
                }`}
              >
                JavaScript
              </button>
            </div>
          </div>

          {/* Theme */}
          <div>
            <label className="block text-[13px] text-[#777] mb-2">Theme</label>
            <div className="flex gap-2">
              <button
                onClick={() => setTheme('dark')}
                className={`flex-1 py-2 px-3 rounded-lg text-[13px] font-medium transition-colors ${
                  theme === 'dark'
                    ? 'bg-[#333] text-white'
                    : 'bg-[#1a1a1a] text-[#777] hover:bg-[#252525]'
                }`}
              >
                Dark
              </button>
              <button
                onClick={() => setTheme('light')}
                className={`flex-1 py-2 px-3 rounded-lg text-[13px] font-medium transition-colors ${
                  theme === 'light'
                    ? 'bg-white text-black'
                    : 'bg-[#1a1a1a] text-[#777] hover:bg-[#252525]'
                }`}
              >
                Light
              </button>
            </div>
          </div>

          {/* Show Stats Toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showStats}
              onChange={(e) => setShowStats(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-10 h-6 bg-[#333] rounded-full peer peer-checked:bg-[#ff3040] transition-colors relative">
              <div
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  showStats ? 'translate-x-4' : ''
                }`}
              />
            </div>
            <span className="text-[14px] text-white">Show engagement stats</span>
          </label>
        </div>

        {/* Code Preview */}
        <div className="mx-4 mb-4">
          <label className="block text-[13px] text-[#777] mb-2">Embed Code</label>
          <div className="relative">
            <pre className="p-3 bg-[#0a0a0a] rounded-lg text-[12px] text-[#aaa] font-mono overflow-x-auto max-h-[150px] whitespace-pre-wrap break-all">
              {embedCode}
            </pre>
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 pb-4 flex gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#ff3040] hover:bg-[#ff4050] text-white text-[14px] font-medium rounded-xl transition-colors"
          >
            {copied ? (
              <>
                <Check size={18} />
                Copied!
              </>
            ) : (
              <>
                <Copy size={18} />
                Copy Code
              </>
            )}
          </button>
          <a
            href={embedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1a1a1a] hover:bg-[#252525] text-white text-[14px] font-medium rounded-xl transition-colors"
          >
            <ExternalLink size={18} />
            Preview
          </a>
        </div>
      </div>
    </div>
  )
}
