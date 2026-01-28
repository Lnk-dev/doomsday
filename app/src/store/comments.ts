/**
 * Comments Store
 * Issue #37: Implement comment persistence
 *
 * Zustand store for managing post comments with persistence.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ID = string
type Timestamp = number

const generateId = (): ID => Math.random().toString(36).substring(2, 15)
const now = (): Timestamp => Date.now()

export interface Comment {
  id: ID
  postId: ID
  authorUsername: string
  authorAvatar?: string
  content: string
  createdAt: Timestamp
  likes: number
  likedBy: ID[]
  isPending?: boolean
  error?: string
}

interface CommentsState {
  comments: Record<ID, Comment>
  commentsByPost: Record<ID, ID[]>

  addComment: (postId: ID, authorUsername: string, content: string) => Comment
  removeComment: (commentId: ID) => void
  likeComment: (commentId: ID, userId: ID) => void
  unlikeComment: (commentId: ID, userId: ID) => void
  getCommentsForPost: (postId: ID) => Comment[]
  getCommentCount: (postId: ID) => number
  confirmComment: (commentId: ID) => void
  failComment: (commentId: ID, error: string) => void
}

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
}

const initialCommentsByPost: Record<ID, ID[]> = {
  'post-1': ['comment-1', 'comment-2'],
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
          content: content.trim(),
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

          const { [commentId]: _, ...remainingComments } = state.comments

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
