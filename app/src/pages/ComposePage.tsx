/**
 * ComposePage
 *
 * Post creation screen with doom/life toggle.
 * Features:
 * - Toggle between doom-scroll and life posts
 * - Cost indicator for life posts (costs $DOOM)
 * - Character limit with visual feedback
 * - Form validation with error messaging
 * - Posts to store and navigates back on success
 */

import { PageHeader } from '@/components/layout/PageHeader'
import { FormField } from '@/components/ui/FormField'
import { X, Image, Globe, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useState, useMemo, useCallback } from 'react'
import { usePostsStore, useUserStore } from '@/store'
import { useBadgeChecker } from '@/hooks/useBadgeChecker'
import { required, minLength, maxLength, validateField } from '@/lib/validation'
import type { PostVariant } from '@/types'

const MAX_LENGTH = 500
const MIN_LENGTH = 1

/** Content validation rules */
const contentRules = [
  required('Please write something to post'),
  minLength(MIN_LENGTH, 'Post cannot be empty'),
  maxLength(MAX_LENGTH, `Post cannot exceed ${MAX_LENGTH} characters`),
]

export function ComposePage() {
  const navigate = useNavigate()
  const [content, setContent] = useState('')
  const [postType, setPostType] = useState<PostVariant>('doom')
  const [error, setError] = useState<string | null>(null)
  const [touched, setTouched] = useState(false)

  // Store hooks
  const createPost = usePostsStore((state) => state.createPost)
  const author = useUserStore((state) => state.author)
  const doomBalance = useUserStore((state) => state.doomBalance)
  const lifePosts = useUserStore((state) => state.lifePosts)
  const daysLiving = useUserStore((state) => state.daysLiving)
  const spendDoom = useUserStore((state) => state.spendDoom)
  const incrementLifePosts = useUserStore((state) => state.incrementLifePosts)

  // Compute life post cost
  const lifePostCost = useMemo(() => {
    return Math.max(1, daysLiving + 1) + Math.floor(lifePosts / 10)
  }, [daysLiving, lifePosts])

  const canAffordLifePost = doomBalance >= lifePostCost

  // Badge checker hook
  const { checkAfterPost } = useBadgeChecker()

  // Validate content
  const validationResult = useMemo(() => {
    return validateField(content, contentRules)
  }, [content])

  const contentError = touched ? validationResult.error : undefined
  const isContentValid = validationResult.isValid

  /** Handle content change with validation */
  const handleContentChange = useCallback((value: string) => {
    // Enforce max length during input
    const trimmedValue = value.slice(0, MAX_LENGTH)
    setContent(trimmedValue)
    setError(null)
  }, [])

  /** Handle content blur for validation */
  const handleContentBlur = useCallback(() => {
    setTouched(true)
  }, [])

  /** Handle post submission */
  const handlePost = () => {
    // Mark as touched to show validation errors
    setTouched(true)

    // Validate content
    if (!isContentValid) {
      setError(validationResult.error || 'Invalid post content')
      return
    }

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

    // Check for badge unlocks after posting
    // Use setTimeout to ensure the post is created before checking
    setTimeout(() => {
      checkAfterPost()
    }, 100)

    // Navigate back to appropriate feed
    if (postType === 'doom') {
      navigate('/')
    } else {
      navigate('/life')
    }
  }

  const isSubmitDisabled =
    !content.trim() || !isContentValid || (postType === 'life' && !canAffordLifePost)

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
            disabled={isSubmitDisabled}
            className={`px-4 py-1.5 rounded-full text-[14px] font-semibold transition-colors ${
              !isSubmitDisabled
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
          <FormField
            error={contentError}
            touched={touched}
            helperText={
              content.length > MAX_LENGTH - 50
                ? `${MAX_LENGTH - content.length} characters remaining`
                : undefined
            }
          >
            <textarea
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              onBlur={handleContentBlur}
              placeholder={postType === 'doom' ? "What's the doom?" : "What's your life today?"}
              className={`w-full min-h-[120px] bg-transparent text-[15px] text-white placeholder-[#777] outline-none resize-none ${
                contentError ? 'border-l-2 border-[#ff3040] pl-2' : ''
              }`}
              autoFocus
            />
          </FormField>
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
          content.length > MAX_LENGTH - 50 ? 'text-[#ff3040]' : 'text-[#777]'
        }`}>
          {content.length}/{MAX_LENGTH}
        </span>
      </div>
    </div>
  )
}
