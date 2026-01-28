/**
 * ComposePage
 *
 * Post creation screen with doom/life toggle.
 * Features:
 * - Toggle between doom-scroll and life posts
 * - Cost indicator for life posts (costs $DOOM)
 * - Character limit with visual feedback
 * - Posts to store and navigates back on success
 */

import { PageHeader } from '@/components/layout/PageHeader'
import { X, Image, Globe, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useState, useMemo } from 'react'
import { usePostsStore, useUserStore } from '@/store'
import type { PostVariant } from '@/types'

export function ComposePage() {
  const navigate = useNavigate()
  const [content, setContent] = useState('')
  const [postType, setPostType] = useState<PostVariant>('doom')
  const [error, setError] = useState<string | null>(null)

  // Store hooks
  const createPost = usePostsStore((state) => state.createPost)
  const author = useUserStore((state) => state.author)
  const doomBalance = useUserStore((state) => state.doomBalance)
  const lifePosts = useUserStore((state) => state.lifePosts)
  const daysLiving = useUserStore((state) => state.daysLiving)
  const spendDoom = useUserStore((state) => state.spendDoom)
  const incrementLifePosts = useUserStore((state) => state.incrementLifePosts)

  const maxLength = 500

  // Compute life post cost
  const lifePostCost = useMemo(() => {
    return Math.max(1, daysLiving + 1) + Math.floor(lifePosts / 10)
  }, [daysLiving, lifePosts])

  const canAffordLifePost = doomBalance >= lifePostCost

  /** Handle post submission */
  const handlePost = () => {
    if (!content.trim()) return

    // Check if user can afford life post
    if (postType === 'life') {
      if (!canAffordLifePost) {
        setError(`Not enough $DOOM. You need ${lifePostCost} but have ${doomBalance}.`)
        return
      }
      // Deduct cost
      spendDoom(lifePostCost)
      incrementLifePosts()
    }

    // Create post
    createPost(content.trim(), postType, author)

    // Navigate back to appropriate feed
    if (postType === 'doom') {
      navigate('/')
    } else {
      navigate('/life')
    }
  }

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
            onClick={handlePost}
            disabled={!content.trim() || (postType === 'life' && !canAffordLifePost)}
            className={`px-4 py-1.5 rounded-full text-[14px] font-semibold transition-colors ${
              content.trim() && (postType === 'doom' || canAffordLifePost)
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
          onClick={() => {
            setPostType('doom')
            setError(null)
          }}
          className={`flex-1 py-2 rounded-lg text-[14px] font-semibold transition-colors ${
            postType === 'doom'
              ? 'bg-[#ff3040] text-white'
              : 'text-[#777]'
          }`}
        >
          Doom Scroll
        </button>
        <button
          onClick={() => {
            setPostType('life')
            setError(null)
          }}
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
        <div className={`mx-4 mt-2 px-3 py-2 rounded-lg text-[13px] ${
          canAffordLifePost
            ? 'bg-[#0a1f0a] text-[#00ba7c]'
            : 'bg-[#1f0a0a] text-[#ff3040]'
        }`}>
          {canAffordLifePost ? (
            <>This post will cost <span className="font-bold">{lifePostCost} $DOOM</span> (you have {doomBalance})</>
          ) : (
            <>
              <AlertCircle size={14} className="inline mr-1" />
              Need <span className="font-bold">{lifePostCost} $DOOM</span> (you have {doomBalance})
            </>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mx-4 mt-2 px-3 py-2 rounded-lg bg-[#1f0a0a] text-[13px] text-[#ff3040]">
          <AlertCircle size={14} className="inline mr-1" />
          {error}
        </div>
      )}

      {/* Balance indicator */}
      <div className="mx-4 mt-2 flex items-center gap-4 text-[13px]">
        <span className="text-[#777]">
          Balance: <span className="text-[#ff3040] font-semibold">{doomBalance} $DOOM</span>
        </span>
      </div>

      {/* Compose area */}
      <div className="flex gap-3 p-4 flex-1">
        <div className="w-9 h-9 rounded-full bg-[#333] flex-shrink-0" />
        <div className="flex-1">
          <p className="text-[15px] font-semibold text-white mb-1">{author.username}</p>
          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value.slice(0, maxLength))
              setError(null)
            }}
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
