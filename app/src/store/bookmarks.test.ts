/**
 * Bookmarks Store Tests
 * Issue #51: Add bookmark/save posts feature
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useBookmarksStore } from './bookmarks'

describe('bookmarks store', () => {
  beforeEach(() => {
    // Reset store state
    useBookmarksStore.setState({
      bookmarks: {},
      bookmarksByPost: {},
      collections: {},
      bookmarkOrder: [],
    })
  })

  describe('initial state', () => {
    it('should have empty bookmarks', () => {
      const state = useBookmarksStore.getState()
      expect(state.bookmarks).toEqual({})
    })

    it('should have empty collections', () => {
      const state = useBookmarksStore.getState()
      expect(state.collections).toEqual({})
    })

    it('should have empty bookmark order', () => {
      const state = useBookmarksStore.getState()
      expect(state.bookmarkOrder).toEqual([])
    })
  })

  describe('addBookmark', () => {
    it('should add a bookmark', () => {
      const { addBookmark } = useBookmarksStore.getState()

      const bookmark = addBookmark('post-1', 'user-1')

      expect(bookmark.postId).toBe('post-1')
      expect(bookmark.userId).toBe('user-1')
      expect(bookmark.id).toBeDefined()
    })

    it('should store bookmark in state', () => {
      const { addBookmark } = useBookmarksStore.getState()

      const bookmark = addBookmark('post-1', 'user-1')
      const state = useBookmarksStore.getState()

      expect(state.bookmarks[bookmark.id]).toEqual(bookmark)
    })

    it('should create postId lookup', () => {
      const { addBookmark } = useBookmarksStore.getState()

      const bookmark = addBookmark('post-1', 'user-1')
      const state = useBookmarksStore.getState()

      expect(state.bookmarksByPost['post-1']).toBe(bookmark.id)
    })

    it('should add to bookmark order', () => {
      const { addBookmark } = useBookmarksStore.getState()

      const bookmark = addBookmark('post-1', 'user-1')
      const state = useBookmarksStore.getState()

      expect(state.bookmarkOrder).toContain(bookmark.id)
    })

    it('should add new bookmarks at the beginning', () => {
      const { addBookmark } = useBookmarksStore.getState()

      const first = addBookmark('post-1', 'user-1')
      const second = addBookmark('post-2', 'user-1')

      const state = useBookmarksStore.getState()
      expect(state.bookmarkOrder[0]).toBe(second.id)
      expect(state.bookmarkOrder[1]).toBe(first.id)
    })

    it('should store note if provided', () => {
      const { addBookmark } = useBookmarksStore.getState()

      const bookmark = addBookmark('post-1', 'user-1', 'My note')

      expect(bookmark.note).toBe('My note')
    })

    it('should store collectionId if provided', () => {
      const { addBookmark, createCollection } = useBookmarksStore.getState()

      const collection = createCollection('user-1', 'My Collection')
      const bookmark = addBookmark('post-1', 'user-1', undefined, collection.id)

      expect(bookmark.collectionId).toBe(collection.id)
    })

    it('should return existing bookmark if already bookmarked', () => {
      const { addBookmark } = useBookmarksStore.getState()

      const first = addBookmark('post-1', 'user-1')
      const second = addBookmark('post-1', 'user-1')

      expect(first.id).toBe(second.id)
    })

    it('should set createdAt timestamp', () => {
      const before = Date.now()
      const { addBookmark } = useBookmarksStore.getState()

      const bookmark = addBookmark('post-1', 'user-1')

      expect(bookmark.createdAt).toBeGreaterThanOrEqual(before)
      expect(bookmark.createdAt).toBeLessThanOrEqual(Date.now())
    })
  })

  describe('removeBookmark', () => {
    it('should remove a bookmark', () => {
      const { addBookmark, removeBookmark } = useBookmarksStore.getState()

      addBookmark('post-1', 'user-1')
      removeBookmark('post-1', 'user-1')

      const state = useBookmarksStore.getState()
      expect(Object.keys(state.bookmarks)).toHaveLength(0)
    })

    it('should remove from postId lookup', () => {
      const { addBookmark, removeBookmark } = useBookmarksStore.getState()

      addBookmark('post-1', 'user-1')
      removeBookmark('post-1', 'user-1')

      const state = useBookmarksStore.getState()
      expect(state.bookmarksByPost['post-1']).toBeUndefined()
    })

    it('should remove from bookmark order', () => {
      const { addBookmark, removeBookmark } = useBookmarksStore.getState()

      const bookmark = addBookmark('post-1', 'user-1')
      removeBookmark('post-1', 'user-1')

      const state = useBookmarksStore.getState()
      expect(state.bookmarkOrder).not.toContain(bookmark.id)
    })

    it('should not remove other users bookmarks', () => {
      const { addBookmark, removeBookmark } = useBookmarksStore.getState()

      addBookmark('post-1', 'user-1')
      removeBookmark('post-1', 'user-2') // Different user

      const state = useBookmarksStore.getState()
      expect(Object.keys(state.bookmarks)).toHaveLength(1)
    })

    it('should handle non-existent bookmark', () => {
      const { removeBookmark } = useBookmarksStore.getState()

      // Should not throw
      removeBookmark('non-existent', 'user-1')

      expect(useBookmarksStore.getState().bookmarks).toEqual({})
    })
  })

  describe('updateBookmarkNote', () => {
    it('should update bookmark note', () => {
      const { addBookmark, updateBookmarkNote } = useBookmarksStore.getState()

      const bookmark = addBookmark('post-1', 'user-1', 'Original note')
      updateBookmarkNote(bookmark.id, 'Updated note')

      const state = useBookmarksStore.getState()
      expect(state.bookmarks[bookmark.id].note).toBe('Updated note')
    })

    it('should handle non-existent bookmark', () => {
      const { updateBookmarkNote } = useBookmarksStore.getState()

      // Should not throw
      updateBookmarkNote('non-existent', 'Note')

      expect(useBookmarksStore.getState().bookmarks).toEqual({})
    })
  })

  describe('moveToCollection', () => {
    it('should move bookmark to collection', () => {
      const { addBookmark, createCollection, moveToCollection } = useBookmarksStore.getState()

      const bookmark = addBookmark('post-1', 'user-1')
      const collection = createCollection('user-1', 'My Collection')

      moveToCollection(bookmark.id, collection.id)

      const state = useBookmarksStore.getState()
      expect(state.bookmarks[bookmark.id].collectionId).toBe(collection.id)
    })

    it('should move bookmark to uncategorized', () => {
      const { addBookmark, createCollection, moveToCollection } = useBookmarksStore.getState()

      const collection = createCollection('user-1', 'My Collection')
      const bookmark = addBookmark('post-1', 'user-1', undefined, collection.id)

      moveToCollection(bookmark.id, undefined)

      const state = useBookmarksStore.getState()
      expect(state.bookmarks[bookmark.id].collectionId).toBeUndefined()
    })
  })

  describe('isBookmarked', () => {
    it('should return true for bookmarked posts', () => {
      const { addBookmark, isBookmarked } = useBookmarksStore.getState()

      addBookmark('post-1', 'user-1')

      expect(isBookmarked('post-1')).toBe(true)
    })

    it('should return false for non-bookmarked posts', () => {
      const { isBookmarked } = useBookmarksStore.getState()

      expect(isBookmarked('post-1')).toBe(false)
    })
  })

  describe('getUserBookmarks', () => {
    it('should return bookmarks for user', () => {
      const { addBookmark, getUserBookmarks } = useBookmarksStore.getState()

      addBookmark('post-1', 'user-1')
      addBookmark('post-2', 'user-1')
      addBookmark('post-3', 'user-2') // Different user

      const bookmarks = getUserBookmarks('user-1')

      expect(bookmarks).toHaveLength(2)
      expect(bookmarks.every((b) => b.userId === 'user-1')).toBe(true)
    })

    it('should return bookmarks in order (most recent first)', () => {
      const { addBookmark, getUserBookmarks } = useBookmarksStore.getState()

      addBookmark('post-1', 'user-1')
      addBookmark('post-2', 'user-1')

      const bookmarks = getUserBookmarks('user-1')

      expect(bookmarks[0].postId).toBe('post-2')
      expect(bookmarks[1].postId).toBe('post-1')
    })
  })

  describe('getCollectionBookmarks', () => {
    it('should return bookmarks in collection', () => {
      const { addBookmark, createCollection, getCollectionBookmarks } = useBookmarksStore.getState()

      const collection = createCollection('user-1', 'My Collection')
      addBookmark('post-1', 'user-1', undefined, collection.id)
      addBookmark('post-2', 'user-1', undefined, collection.id)
      addBookmark('post-3', 'user-1') // No collection

      const bookmarks = getCollectionBookmarks(collection.id)

      expect(bookmarks).toHaveLength(2)
    })
  })

  describe('getBookmarkCount', () => {
    it('should return total bookmark count', () => {
      const { addBookmark, getBookmarkCount } = useBookmarksStore.getState()

      expect(getBookmarkCount()).toBe(0)

      addBookmark('post-1', 'user-1')
      expect(getBookmarkCount()).toBe(1)

      addBookmark('post-2', 'user-1')
      expect(getBookmarkCount()).toBe(2)
    })
  })

  describe('createCollection', () => {
    it('should create a collection', () => {
      const { createCollection } = useBookmarksStore.getState()

      const collection = createCollection('user-1', 'My Collection', 'Description')

      expect(collection.name).toBe('My Collection')
      expect(collection.description).toBe('Description')
      expect(collection.userId).toBe('user-1')
    })

    it('should store collection in state', () => {
      const { createCollection } = useBookmarksStore.getState()

      const collection = createCollection('user-1', 'My Collection')
      const state = useBookmarksStore.getState()

      expect(state.collections[collection.id]).toEqual(collection)
    })
  })

  describe('deleteCollection', () => {
    it('should delete a collection', () => {
      const { createCollection, deleteCollection } = useBookmarksStore.getState()

      const collection = createCollection('user-1', 'My Collection')
      deleteCollection(collection.id)

      const state = useBookmarksStore.getState()
      expect(state.collections[collection.id]).toBeUndefined()
    })

    it('should move bookmarks to uncategorized', () => {
      const { addBookmark, createCollection, deleteCollection } = useBookmarksStore.getState()

      const collection = createCollection('user-1', 'My Collection')
      const bookmark = addBookmark('post-1', 'user-1', undefined, collection.id)

      deleteCollection(collection.id)

      const state = useBookmarksStore.getState()
      expect(state.bookmarks[bookmark.id].collectionId).toBeUndefined()
    })
  })

  describe('updateCollection', () => {
    it('should update collection name', () => {
      const { createCollection, updateCollection } = useBookmarksStore.getState()

      const collection = createCollection('user-1', 'Original')
      updateCollection(collection.id, 'Updated', 'New description')

      const state = useBookmarksStore.getState()
      expect(state.collections[collection.id].name).toBe('Updated')
      expect(state.collections[collection.id].description).toBe('New description')
    })

    it('should handle non-existent collection', () => {
      const { updateCollection } = useBookmarksStore.getState()

      // Should not throw
      updateCollection('non-existent', 'Name')

      expect(useBookmarksStore.getState().collections).toEqual({})
    })
  })

  describe('getUserCollections', () => {
    it('should return collections for user', () => {
      const { createCollection, getUserCollections } = useBookmarksStore.getState()

      createCollection('user-1', 'Collection 1')
      createCollection('user-1', 'Collection 2')
      createCollection('user-2', 'Other user collection')

      const collections = getUserCollections('user-1')

      expect(collections).toHaveLength(2)
      expect(collections.every((c) => c.userId === 'user-1')).toBe(true)
    })
  })
})
