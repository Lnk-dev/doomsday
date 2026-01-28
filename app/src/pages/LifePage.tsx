/**
 * LifePage
 *
 * Feed displaying life posts - content from users choosing to live
 * despite the doom. Posting here costs $DOOM tokens.
 *
 * Features:
 * - Life feed from store
 * - Cost indicator for next post
 * - Interactive like buttons
 * - Activity tabs (All, Follows, Replies, Mentions)
 */

import { PageHeader } from '@/components/layout/PageHeader'
import { ThreadPost } from '@/components/ui/ThreadPost'
import { DonationModal } from '@/components/ui/DonationModal'
import { ShareModal } from '@/components/ui/ShareModal'
import { QuoteRepostModal } from '@/components/ui/QuoteRepostModal'
import { Heart, Gift } from 'lucide-react'
import { usePostsStore, useUserStore } from '@/store'
import { formatRelativeTime } from '@/lib/utils'
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Author, Post } from '@/types'

type ActivityTab = 'all' | 'follows' | 'replies' | 'mentions'

export function LifePage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<ActivityTab>('all')
  const [donationTarget, setDonationTarget] = useState<Author | null>(null)
  const [sharePost, setSharePost] = useState<Post | null>(null)
  const [quotePost, setQuotePost] = useState<Post | null>(null)

  // Store hooks - get raw data (stable references)
  const allPosts = usePostsStore((state) => state.posts)
  const lifeFeed = usePostsStore((state) => state.lifeFeed)
  const likePost = usePostsStore((state) => state.likePost)
  const unlikePost = usePostsStore((state) => state.unlikePost)
  const repostPost = usePostsStore((state) => state.repostPost)
  const unrepostPost = usePostsStore((state) => state.unrepostPost)
  const quoteRepost = usePostsStore((state) => state.quoteRepost)
  const userId = useUserStore((state) => state.userId)
  const author = useUserStore((state) => state.author)
  const doomBalance = useUserStore((state) => state.doomBalance)
  const lifePosts = useUserStore((state) => state.lifePosts)
  const daysLiving = useUserStore((state) => state.daysLiving)

  // Compute feed from raw data
  const posts = useMemo(() => {
    return lifeFeed.map((id) => allPosts[id]).filter(Boolean)
  }, [allPosts, lifeFeed])

  // Compute life post cost
  const lifePostCost = useMemo(() => {
    return Math.max(1, daysLiving + 1) + Math.floor(lifePosts / 10)
  }, [daysLiving, lifePosts])

  const canAfford = doomBalance >= lifePostCost

  /** Handle like button click */
  const handleLike = (postId: string, isLiked: boolean) => {
    if (isLiked) {
      unlikePost(postId, userId)
    } else {
      likePost(postId, userId)
    }
  }

  /** Handle donate button click */
  const handleDonate = (postAuthor: Author) => {
    // Can't donate to yourself
    if (postAuthor.username === author.username) return
    setDonationTarget(postAuthor)
  }

  /** Handle repost button click */
  const handleRepost = (post: Post) => {
    const isReposted = post.repostedByUsers?.includes(userId)
    if (isReposted) {
      unrepostPost(post.id, userId)
    } else {
      repostPost(post.id, userId, author)
    }
  }

  /** Handle quote repost */
  const handleQuoteRepost = (content: string) => {
    if (quotePost) {
      quoteRepost(quotePost.id, userId, author, content)
    }
  }

  const tabs: { id: ActivityTab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'follows', label: 'Follows' },
    { id: 'replies', label: 'Replies' },
    { id: 'mentions', label: 'Mentions' },
  ]

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader title="Activity" />

      {/* Activity tabs */}
      <div className="flex border-b border-[#333] overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-fit px-4 py-3 text-[15px] font-semibold whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'text-white border-b-2 border-white'
                : 'text-[#777]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Life cost banner */}
      <div className={`flex items-center gap-3 px-4 py-3 border-b border-[#333] ${
        canAfford ? 'bg-[#0a1f0a]' : 'bg-[#1f0a0a]'
      }`}>
        <Heart
          size={18}
          className={canAfford ? 'text-[#00ba7c]' : 'text-[#ff3040]'}
          fill={canAfford ? '#00ba7c' : '#ff3040'}
        />
        <p className={`text-[14px] ${canAfford ? 'text-[#00ba7c]' : 'text-[#ff3040]'}`}>
          {canAfford ? (
            <>Your next life post costs <span className="font-bold">{lifePostCost} $DOOM</span></>
          ) : (
            <>Need <span className="font-bold">{lifePostCost} $DOOM</span> to post (you have {doomBalance})</>
          )}
        </p>
      </div>

      {/* Posts feed */}
      <div className="divide-y divide-[#333]">
        {posts.map((post) => {
          const isOwnPost = post.author.username === author.username
          const originalPost = post.originalPostId ? allPosts[post.originalPostId] : null
          const isQuoteRepostPost = Boolean(post.quoteContent && post.originalPostId)

          return (
            <div key={post.id} className="relative">
              <ThreadPost
                postId={post.id}
                author={post.author}
                content={post.content}
                timestamp={formatRelativeTime(post.repostedAt || post.createdAt)}
                likes={post.likes}
                replies={post.replies}
                repostCount={post.reposts}
                variant="life"
                isLiked={post.likedBy.includes(userId)}
                isReposted={post.repostedByUsers?.includes(userId)}
                repostedBy={post.repostedBy}
                originalPost={
                  isQuoteRepostPost && originalPost
                    ? {
                        author: originalPost.author,
                        content: originalPost.content,
                      }
                    : undefined
                }
                isQuoteRepost={isQuoteRepostPost}
                onLike={() => handleLike(post.id, post.likedBy.includes(userId))}
                onClick={() => navigate(`/post/${post.id}`)}
                onShare={() => setSharePost(post)}
                onRepost={() => handleRepost(post)}
                onQuoteRepost={() => setQuotePost(post)}
              />
              {/* Donate button (only for other users' posts) */}
              {!isOwnPost && (
                <button
                  onClick={() => handleDonate(post.author)}
                  className="absolute right-4 top-4 flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#00ba7c20] text-[#00ba7c] text-[12px] font-medium hover:bg-[#00ba7c30] transition-colors"
                >
                  <Gift size={12} />
                  Send Life
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Empty state */}
      {posts.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center py-16 px-8">
          <Heart size={48} className="text-[#333] mb-4" />
          <p className="text-[15px] text-[#777] text-center">
            No life posts yet.
          </p>
          <p className="text-[13px] text-[#555] text-center mt-1">
            Choose to live. Post something.
          </p>
        </div>
      )}

      {/* Donation modal */}
      {donationTarget && (
        <DonationModal
          recipient={donationTarget}
          onClose={() => setDonationTarget(null)}
        />
      )}

      {/* Share modal */}
      {sharePost && (
        <ShareModal
          postId={sharePost.id}
          content={sharePost.content}
          onClose={() => setSharePost(null)}
        />
      )}

      {/* Quote repost modal */}
      {quotePost && (
        <QuoteRepostModal
          isOpen={true}
          onClose={() => setQuotePost(null)}
          onSubmit={handleQuoteRepost}
          originalPost={quotePost}
        />
      )}
    </div>
  )
}
