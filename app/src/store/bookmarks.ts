/**
 * Bookmarks Store
 * Issue #51: Add bookmark/save posts feature
 *
 * Zustand store for managing user bookmarks.
 * Handles:
 * - Bookmark CRUD operations
 * - Collections/folders management
 * - Local storage persistence
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ID } from '@/types'

/** Generate unique ID */
const generateId = (): ID => Math.random().toString(36).substring(2, 15)

/** Get current timestamp */
const now = (): number => Date.now()

export interface Bookmark {
  id: ID
  postId: ID
  userId: ID
  note?: string
  collectionId?: ID
  createdAt: number
}

export interface BookmarkCollection {
  id: ID
  userId: ID
  name: string
  description?: string
  createdAt: number
}

interface BookmarksState {
  /** All bookmarks indexed by ID */
  bookmarks: Record<ID, Bookmark>
  /** Bookmarks indexed by postId for quick lookup */
  bookmarksByPost: Record<ID, ID> // postId -> bookmarkId
  /** Collections indexed by ID */
  collections: Record<ID, BookmarkCollection>
  /** User's bookmarked post IDs in order (most recent first) */
  bookmarkOrder: ID[]

  // Actions
  /** Add a bookmark */
  addBookmark: (postId: ID, userId: ID, note?: string, collectionId?: ID) => Bookmark
  /** Remove a bookmark */
  removeBookmark: (postId: ID, userId: ID) => void
  /** Update bookmark note */
  updateBookmarkNote: (bookmarkId: ID, note: string) => void
  /** Move bookmark to collection */
  moveToCollection: (bookmarkId: ID, collectionId: ID | undefined) => void
  /** Check if post is bookmarked */
  isBookmarked: (postId: ID) => boolean
  /** Get all bookmarks for user */
  getUserBookmarks: (userId: ID) => Bookmark[]
  /** Get bookmarks in collection */
  getCollectionBookmarks: (collectionId: ID) => Bookmark[]
  /** Get bookmark count */
  getBookmarkCount: () => number

  // Collection actions
  /** Create a collection */
  createCollection: (userId: ID, name: string, description?: string) => BookmarkCollection
  /** Delete a collection (bookmarks moved to uncategorized) */
  deleteCollection: (collectionId: ID) => void
  /** Update collection */
  updateCollection: (collectionId: ID, name: string, description?: string) => void
  /** Get user's collections */
  getUserCollections: (userId: ID) => BookmarkCollection[]
}

export const useBookmarksStore = create<BookmarksState>()(
  persist(
    (set, get) => ({
      bookmarks: {},
      bookmarksByPost: {},
      collections: {},
      bookmarkOrder: [],

      addBookmark: (postId, userId, note, collectionId) => {
        // Check if already bookmarked
        if (get().bookmarksByPost[postId]) {
          return get().bookmarks[get().bookmarksByPost[postId]]
        }

        const bookmark: Bookmark = {
          id: generateId(),
          postId,
          userId,
          note,
          collectionId,
          createdAt: now(),
        }

        set((state) => ({
          bookmarks: { ...state.bookmarks, [bookmark.id]: bookmark },
          bookmarksByPost: { ...state.bookmarksByPost, [postId]: bookmark.id },
          bookmarkOrder: [bookmark.id, ...state.bookmarkOrder],
        }))

        return bookmark
      },

      removeBookmark: (postId, userId) => {
        const bookmarkId = get().bookmarksByPost[postId]
        if (!bookmarkId) return

        const bookmark = get().bookmarks[bookmarkId]
        if (!bookmark || bookmark.userId !== userId) return

        set((state) => {
          const { [bookmarkId]: _removed, ...remainingBookmarks } = state.bookmarks
          const { [postId]: _removedPost, ...remainingByPost } = state.bookmarksByPost
          return {
            bookmarks: remainingBookmarks,
            bookmarksByPost: remainingByPost,
            bookmarkOrder: state.bookmarkOrder.filter((id) => id !== bookmarkId),
          }
        })
      },

      updateBookmarkNote: (bookmarkId, note) => {
        set((state) => {
          const bookmark = state.bookmarks[bookmarkId]
          if (!bookmark) return state
          return {
            bookmarks: {
              ...state.bookmarks,
              [bookmarkId]: { ...bookmark, note },
            },
          }
        })
      },

      moveToCollection: (bookmarkId, collectionId) => {
        set((state) => {
          const bookmark = state.bookmarks[bookmarkId]
          if (!bookmark) return state
          return {
            bookmarks: {
              ...state.bookmarks,
              [bookmarkId]: { ...bookmark, collectionId },
            },
          }
        })
      },

      isBookmarked: (postId) => {
        return !!get().bookmarksByPost[postId]
      },

      getUserBookmarks: (userId) => {
        return get()
          .bookmarkOrder.map((id) => get().bookmarks[id])
          .filter((b) => b && b.userId === userId)
      },

      getCollectionBookmarks: (collectionId) => {
        return Object.values(get().bookmarks).filter((b) => b.collectionId === collectionId)
      },

      getBookmarkCount: () => {
        return get().bookmarkOrder.length
      },

      createCollection: (userId, name, description) => {
        const collection: BookmarkCollection = {
          id: generateId(),
          userId,
          name,
          description,
          createdAt: now(),
        }

        set((state) => ({
          collections: { ...state.collections, [collection.id]: collection },
        }))

        return collection
      },

      deleteCollection: (collectionId) => {
        set((state) => {
          const { [collectionId]: _removed, ...remainingCollections } = state.collections
          // Move bookmarks in this collection to uncategorized
          const updatedBookmarks = { ...state.bookmarks }
          Object.values(updatedBookmarks).forEach((bookmark) => {
            if (bookmark.collectionId === collectionId) {
              updatedBookmarks[bookmark.id] = { ...bookmark, collectionId: undefined }
            }
          })
          return {
            collections: remainingCollections,
            bookmarks: updatedBookmarks,
          }
        })
      },

      updateCollection: (collectionId, name, description) => {
        set((state) => {
          const collection = state.collections[collectionId]
          if (!collection) return state
          return {
            collections: {
              ...state.collections,
              [collectionId]: { ...collection, name, description },
            },
          }
        })
      },

      getUserCollections: (userId) => {
        return Object.values(get().collections).filter((c) => c.userId === userId)
      },
    }),
    {
      name: 'doomsday-bookmarks',
    }
  )
)
