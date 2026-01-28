/**
 * Comments Store
 *
 * Zustand store for managing post comments.
 * Handles:
 * - Comment CRUD operations
 * - Like/unlike functionality
 * - localStorage persistence
 * - Optimistic updates
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ID } from '@/types'
import { sanitizeText } from '@/lib/sanitize'

/** Generate unique ID */
const generateId = (): ID => Math.random().toString(36).substring(2, 15)

/** Get current timestamp */
const now = (): number => Date.now()

export interface Comment {
  id: ID
  postId: ID
  authorUsername: string
  authorAvatar?: string
  content: string
  createdAt: number
  likes: number
  likedBy: ID[]
  isPending?: boolean
  error?: string
}

interface CommentsState {
  /** Comments indexed by comment ID */
  comments: Record<ID, Comment>
  /** Comment IDs indexed by post ID for quick lookup */
  commentsByPost: Record<ID, ID[]>

  // Actions
  /** Add a comment to a post (with optimistic update) */
  addComment: (postId: ID, authorUsername: string, content: string) => Comment
  /** Remove a comment */
  removeComment: (commentId: ID) => void
  /** Like a comment */
  likeComment: (commentId: ID, userId: ID) => void
  /** Unlike a comment */
  unlikeComment: (commentId: ID, userId: ID) => void
  /** Get all comments for a post (sorted by createdAt) */
  getCommentsForPost: (postId: ID) => Comment[]
  /** Get comment count for a post */
  getCommentCount: (postId: ID) => number
  /** Mark comment as confirmed (remove pending state) */
  confirmComment: (commentId: ID) => void
  /** Mark comment as failed */
  failComment: (commentId: ID, error: string) => void
}

/** Initial mock comments for demonstration */
const initialComments: Record<ID, Comment> = {
  'comment-1': {
    id: 'comment-1',
    postId: 'post-1',
    authorUsername: 'skeptic_observer',
    content: "This is exactly what I've been thinking. The signs are everywhere.",
    createdAt: now() - 30 * 60 * 1000,
    likes: 12,
    likedBy: [],
  },
  'comment-2': {
    id: 'comment-2',
    postId: 'post-1',
    authorUsername: 'hopeful_one',
    content: "I disagree. We've been through worse and survived.",
    createdAt: now() - 15 * 60 * 1000,
    likes: 8,
    likedBy: [],
  },
  'comment-3': {
    id: 'comment-3',
    postId: 'post-2',
    authorUsername: 'tech_watcher',
    content: 'AGI timelines are shrinking every week. This is concerning.',
    createdAt: now() - 45 * 60 * 1000,
    likes: 23,
    likedBy: [],
  },
  'comment-4': {
    id: 'comment-4',
    postId: 'life-1',
    authorUsername: 'garden_lover',
    content: 'Beautiful sentiment. What did you plant?',
    createdAt: now() - 20 * 60 * 1000,
    likes: 5,
    likedBy: [],
  },
}

const initialCommentsByPost: Record<ID, ID[]> = {
  'post-1': ['comment-1', 'comment-2'],
  'post-2': ['comment-3'],
  'life-1': ['comment-4'],
}

export const useCommentsStore = create<CommentsState>()(
  persist(
    (set, get) => ({
      comments: initialComments,
      commentsByPost: initialCommentsByPost,

      addComment: (postId, authorUsername, content) => {
        const comment: Comment = {
          id: generateId(),
          postId,
          authorUsername,
          content: sanitizeText(content),
          createdAt: now(),
          likes: 0,
          likedBy: [],
          isPending: true,
        }

        set((state) => ({
          comments: { ...state.comments, [comment.id]: comment },
          commentsByPost: {
            ...state.commentsByPost,
            [postId]: [...(state.commentsByPost[postId] || []), comment.id],
          },
        }))

        // Auto-confirm after brief delay (simulating API)
        setTimeout(() => {
          get().confirmComment(comment.id)
        }, 100)

        return comment
      },

      removeComment: (commentId) => {
        set((state) => {
          const comment = state.comments[commentId]
          if (!comment) return state

          const remainingComments = Object.fromEntries(
            Object.entries(state.comments).filter(([id]) => id !== commentId)
          )

          return {
            comments: remainingComments,
            commentsByPost: {
              ...state.commentsByPost,
              [comment.postId]: (state.commentsByPost[comment.postId] || []).filter(
                (id) => id !== commentId
              ),
            },
          }
        })
      },

      likeComment: (commentId, userId) => {
        set((state) => {
          const comment = state.comments[commentId]
          if (!comment || comment.likedBy.includes(userId)) return state

          return {
            comments: {
              ...state.comments,
              [commentId]: {
                ...comment,
                likes: comment.likes + 1,
                likedBy: [...comment.likedBy, userId],
              },
            },
          }
        })
      },

      unlikeComment: (commentId, userId) => {
        set((state) => {
          const comment = state.comments[commentId]
          if (!comment || !comment.likedBy.includes(userId)) return state

          return {
            comments: {
              ...state.comments,
              [commentId]: {
                ...comment,
                likes: comment.likes - 1,
                likedBy: comment.likedBy.filter((id) => id !== userId),
              },
            },
          }
        })
      },

      getCommentsForPost: (postId) => {
        const state = get()
        const commentIds = state.commentsByPost[postId] || []
        return commentIds
          .map((id) => state.comments[id])
          .filter(Boolean)
          .sort((a, b) => a.createdAt - b.createdAt)
      },

      getCommentCount: (postId) => {
        const state = get()
        return (state.commentsByPost[postId] || []).length
      },

      confirmComment: (commentId) => {
        set((state) => {
          const comment = state.comments[commentId]
          if (!comment) return state

          return {
            comments: {
              ...state.comments,
              [commentId]: {
                ...comment,
                isPending: false,
                error: undefined,
              },
            },
          }
        })
      },

      failComment: (commentId, error) => {
        set((state) => {
          const comment = state.comments[commentId]
          if (!comment) return state

          return {
            comments: {
              ...state.comments,
              [commentId]: {
                ...comment,
                isPending: false,
                error,
              },
            },
          }
        })
      },
    }),
    {
      name: 'doomsday-comments',
      partialize: (state) => ({
        comments: state.comments,
        commentsByPost: state.commentsByPost,
      }),
    }
  )
)
