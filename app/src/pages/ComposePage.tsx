import { PageHeader } from '@/components/layout/PageHeader'
import { X, Image, Globe } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

export function ComposePage() {
  const navigate = useNavigate()
  const [content, setContent] = useState('')
  const [postType, setPostType] = useState<'doom' | 'life'>('doom')

  const maxLength = 500

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        leftAction={
          <button onClick={() => navigate(-1)} className="p-1">
            <X size={24} className="text-white" />
          </button>
        }
        rightAction={
          <button
            disabled={!content.trim()}
            className={`px-4 py-1.5 rounded-full text-[14px] font-semibold transition-colors ${
              content.trim()
                ? 'bg-white text-black'
                : 'bg-[#333] text-[#777]'
            }`}
          >
            Post
          </button>
        }
      />

      {/* Post type toggle */}
      <div className="flex mx-4 mt-2 p-1 rounded-xl bg-[#1a1a1a]">
        <button
          onClick={() => setPostType('doom')}
          className={`flex-1 py-2 rounded-lg text-[14px] font-semibold transition-colors ${
            postType === 'doom'
              ? 'bg-[#ff3040] text-white'
              : 'text-[#777]'
          }`}
        >
          Doom Scroll
        </button>
        <button
          onClick={() => setPostType('life')}
          className={`flex-1 py-2 rounded-lg text-[14px] font-semibold transition-colors ${
            postType === 'life'
              ? 'bg-[#00ba7c] text-white'
              : 'text-[#777]'
          }`}
        >
          Life
        </button>
      </div>

      {/* Cost indicator for life posts */}
      {postType === 'life' && (
        <div className="mx-4 mt-2 px-3 py-2 rounded-lg bg-[#0a1f0a] text-[13px] text-[#00ba7c]">
          This post will cost <span className="font-bold">5 $DOOM</span>
        </div>
      )}

      {/* Compose area */}
      <div className="flex gap-3 p-4 flex-1">
        <div className="w-9 h-9 rounded-full bg-[#333] flex-shrink-0" />
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, maxLength))}
            placeholder={postType === 'doom' ? "What's the doom?" : "What's your life today?"}
            className="w-full min-h-[120px] bg-transparent text-[15px] text-white placeholder-[#777] outline-none resize-none"
            autoFocus
          />
        </div>
      </div>

      {/* Bottom toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-[#333]">
        <div className="flex items-center gap-4">
          <button className="text-[#777] hover:text-white transition-colors">
            <Image size={22} />
          </button>
          <button className="flex items-center gap-1 text-[#777] hover:text-white transition-colors">
            <Globe size={18} />
            <span className="text-[13px]">Anyone can reply</span>
          </button>
        </div>
        <span className={`text-[13px] ${
          content.length > maxLength - 50 ? 'text-[#ff3040]' : 'text-[#777]'
        }`}>
          {content.length}/{maxLength}
        </span>
      </div>
    </div>
  )
}
