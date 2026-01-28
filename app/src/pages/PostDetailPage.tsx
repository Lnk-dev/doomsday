/**
 * PostDetailPage
 *
 * Detailed view of a single post with comments.
 * Features:
 * - Full post content
 * - Comment thread
 * - Add comment form
 * - Like interactions
 */

import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Heart, MessageCircle, Repeat2, Share, Send, UserPlus, UserCheck } from 'lucide-react'
import { ShareModal } from '@/components/ui/ShareModal'
import { usePostsStore, useUserStore, useCommentsStore } from '@/store'
import { formatRelativeTime } from '@/lib/utils'
import { useState, useMemo } from 'react'

export function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>()
  const navigate = useNavigate()

  // Store hooks
  const posts = usePostsStore((state) => state.posts)
  const likePost = usePostsStore((state) => state.likePost)
  const unlikePost = usePostsStore((state) => state.unlikePost)
  const userId = useUserStore((state) => state.userId)
  const author = useUserStore((state) => state.author)
  const following = useUserStore((state) => state.following)
  const followUser = useUserStore((state) => state.followUser)
  const unfollowUser = useUserStore((state) => state.unfollowUser)

  // Comments store
  const comments = useCommentsStore((state) => state.getCommentsForPost(postId || ''))
  const addComment = useCommentsStore((state) => state.addComment)
  const likeComment = useCommentsStore((state) => state.likeComment)
  const unlikeComment = useCommentsStore((state) => state.unlikeComment)

  const [newComment, setNewComment] = useState('')
  const [showShareModal, setShowShareModal] = useState(false)

  const post = postId ? posts[postId] : undefined

  const isLiked = useMemo(() => {
    return post?.likedBy.includes(userId) ?? false
  }, [post, userId])

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full p-8">
        <p className="text-[15px] text-[#777]">Post not found</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-[#ff3040]"
        >
          Go back
        </button>
      </div>
    )
  }

  const handleLike = () => {
    if (isLiked) {
      unlikePost(post.id, userId)
    } else {
      likePost(post.id, userId)
    }
  }

  const handleAddComment = () => {
    if (!newComment.trim() || !postId) return
    addComment(postId, author.username, newComment.trim())
    setNewComment('')
  }

  const accentColor = post.variant === 'doom' ? '#ff3040' : '#00ba7c'

  return (
    <div className="flex flex-col min-h-full bg-black">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-[#333]">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft size={24} className="text-white" />
        </button>
        <h1 className="text-[17px] font-semibold text-white">Thread</h1>
      </div>

      {/* Post content */}
      <div className="p-4 border-b border-[#333]">
        {/* Author */}
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-full bg-[#333]"
            style={{ border: `2px solid ${accentColor}` }}
          />
          <div className="flex-1">
            <div className="flex items-center gap-1">
              <span className="text-[15px] font-semibold text-white">
                @{post.author.username}
              </span>
              {post.author.verified && (
                <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
                </svg>
              )}
            </div>
            <span className="text-[13px] text-[#777]">
              {formatRelativeTime(post.createdAt)}
            </span>
          </div>
          {/* Follow button (don't show for own posts) */}
          {post.author.username !== author.username && (
            <button
              onClick={() => {
                if (following.includes(post.author.username)) {
                  unfollowUser(post.author.username)
                } else {
                  followUser(post.author.username)
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                following.includes(post.author.username)
                  ? 'bg-[#333] text-white'
                  : 'bg-white text-black'
              }`}
            >
              {following.includes(post.author.username) ? (
                <>
                  <UserCheck size={14} />
                  Following
                </>
              ) : (
                <>
                  <UserPlus size={14} />
                  Follow
                </>
              )}
            </button>
          )}
        </div>

        {/* Content */}
        <p className="text-[17px] text-white leading-relaxed whitespace-pre-wrap mb-4">
          {post.content}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 py-3 border-t border-[#222] text-[14px] text-[#777]">
          <span><strong className="text-white">{post.likes}</strong> likes</span>
          <span><strong className="text-white">{comments.length}</strong> replies</span>
          <span><strong className="text-white">{post.reposts}</strong> reposts</span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-around py-2 border-t border-[#222]">
          <button
            onClick={handleLike}
            className={`p-2 rounded-full transition-colors ${
              isLiked ? 'text-[#ff3040]' : 'text-[#777] hover:text-[#ff3040]'
            }`}
          >
            <Heart size={22} fill={isLiked ? '#ff3040' : 'none'} />
          </button>
          <button className="p-2 rounded-full text-[#777] hover:text-[#3b82f6] transition-colors">
            <MessageCircle size={22} />
          </button>
          <button className="p-2 rounded-full text-[#777] hover:text-[#00ba7c] transition-colors">
            <Repeat2 size={22} />
          </button>
          <button
            onClick={() => setShowShareModal(true)}
            className="p-2 rounded-full text-[#777] hover:text-white transition-colors"
          >
            <Share size={22} />
          </button>
        </div>
      </div>

      {/* Comments */}
      <div className="flex-1">
        <div className="px-4 py-3 border-b border-[#333]">
          <h2 className="text-[13px] font-semibold text-[#777]">
            {comments.length} REPLIES
          </h2>
        </div>

        <div className="divide-y divide-[#222]">
          {comments.map((comment) => (
            <div key={comment.id} className="px-4 py-3">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#333] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[14px] font-semibold text-white">
                      @{comment.authorUsername}
                    </span>
                    <span className="text-[12px] text-[#555]">
                      {formatRelativeTime(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-[14px] text-[#ccc]">{comment.content}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <button
                      onClick={() => {
                        if (comment.likedBy?.includes(userId)) {
                          unlikeComment(comment.id, userId)
                        } else {
                          likeComment(comment.id, userId)
                        }
                      }}
                      className={`flex items-center gap-1 text-[12px] transition-colors ${
                        comment.likedBy?.includes(userId)
                          ? 'text-[#ff3040]'
                          : 'text-[#777] hover:text-[#ff3040]'
                      }`}
                    >
                      <Heart size={14} fill={comment.likedBy?.includes(userId) ? '#ff3040' : 'none'} />
                      {comment.likes}
                    </button>
                    <button className="flex items-center gap-1 text-[12px] text-[#777] hover:text-[#3b82f6]">
                      <MessageCircle size={14} />
                      Reply
                    </button>
                    {comment.isPending && (
                      <span className="text-[10px] text-[#555]">Sending...</span>
                    )}
                    {comment.error && (
                      <span className="text-[10px] text-[#ff3040]">{comment.error}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comment input */}
      <div className="sticky bottom-0 border-t border-[#333] bg-black px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#333] flex-shrink-0" />
          <div className="flex-1 flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] rounded-full">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 bg-transparent text-[14px] text-white placeholder-[#777] outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
            />
            <button
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              className={`p-1 rounded-full transition-colors ${
                newComment.trim()
                  ? 'text-[#ff3040]'
                  : 'text-[#555]'
              }`}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Share modal */}
      {showShareModal && (
        <ShareModal
          postId={post.id}
          content={post.content}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  )
}
