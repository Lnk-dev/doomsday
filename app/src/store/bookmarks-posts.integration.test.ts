/**
 * Bookmarks Store + Posts Store Integration Tests
 *
 * Tests interactions between bookmarks and posts.
 * Covers:
 * - Bookmarking posts
 * - Unbookmarking posts
 * - Collection management
 * - Bookmark notes
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useUserStore } from './user'
import { usePostsStore } from './posts'
import { useBookmarksStore } from './bookmarks'

describe('Bookmarks Store + Posts Store Integration', () => {
  beforeEach(() => {
    useUserStore.setState({
      userId: 'test-user-id',
      author: { address: null, username: 'testuser' },
      displayName: '',
      bio: '',
      doomBalance: 100,
      lifeBalance: 0,
      daysLiving: 0,
      lifePosts: 0,
      isConnected: false,
      following: [],
      blocked: [],
      muted: [],
    })

    usePostsStore.setState({
      posts: {},
      doomFeed: [],
      lifeFeed: [],
    })

    useBookmarksStore.setState({
      bookmarks: {},
      bookmarksByPost: {},
      collections: {},
      bookmarkOrder: [],
    })
  })

  describe('Bookmarking Posts', () => {
    it('should bookmark a post successfully', () => {
      const author = { address: null, username: 'otheruser' }
      const post = usePostsStore.getState().createPost('Interesting doom content', 'doom', author)
      const userId = useUserStore.getState().userId

      const bookmark = useBookmarksStore.getState().addBookmark(post.id, userId)

      expect(bookmark).toBeDefined()
      expect(bookmark.postId).toBe(post.id)
      expect(bookmark.userId).toBe(userId)
      expect(useBookmarksStore.getState().isBookmarked(post.id)).toBe(true)
    })

    it('should not create duplicate bookmarks', () => {
      const author = { address: null, username: 'otheruser' }
      const post = usePostsStore.getState().createPost('Content', 'doom', author)
      const userId = useUserStore.getState().userId

      const bookmark1 = useBookmarksStore.getState().addBookmark(post.id, userId)
      const bookmark2 = useBookmarksStore.getState().addBookmark(post.id, userId)

      expect(bookmark1.id).toBe(bookmark2.id)
      expect(useBookmarksStore.getState().getBookmarkCount()).toBe(1)
    })

    it('should remove a bookmark', () => {
      const author = { address: null, username: 'otheruser' }
      const post = usePostsStore.getState().createPost('Content', 'doom', author)
      const userId = useUserStore.getState().userId

      useBookmarksStore.getState().addBookmark(post.id, userId)
      expect(useBookmarksStore.getState().isBookmarked(post.id)).toBe(true)

      useBookmarksStore.getState().removeBookmark(post.id, userId)
      expect(useBookmarksStore.getState().isBookmarked(post.id)).toBe(false)
    })

    it('should maintain bookmark order (most recent first)', () => {
      const author = { address: null, username: 'otheruser' }
      const userId = useUserStore.getState().userId

      const post1 = usePostsStore.getState().createPost('Post 1', 'doom', author)
      const post2 = usePostsStore.getState().createPost('Post 2', 'doom', author)
      const post3 = usePostsStore.getState().createPost('Post 3', 'doom', author)

      const bm1 = useBookmarksStore.getState().addBookmark(post1.id, userId)
      const bm2 = useBookmarksStore.getState().addBookmark(post2.id, userId)
      const bm3 = useBookmarksStore.getState().addBookmark(post3.id, userId)

      const bookmarks = useBookmarksStore.getState().getUserBookmarks(userId)

      expect(bookmarks[0].id).toBe(bm3.id)
      expect(bookmarks[1].id).toBe(bm2.id)
      expect(bookmarks[2].id).toBe(bm1.id)
    })

    it('should add note to bookmark', () => {
      const author = { address: null, username: 'otheruser' }
      const post = usePostsStore.getState().createPost('Important info', 'doom', author)
      const userId = useUserStore.getState().userId

      const bookmark = useBookmarksStore.getState().addBookmark(post.id, userId, 'Remember this!')

      expect(bookmark.note).toBe('Remember this!')
    })

    it('should update bookmark note', () => {
      const author = { address: null, username: 'otheruser' }
      const post = usePostsStore.getState().createPost('Content', 'doom', author)
      const userId = useUserStore.getState().userId

      const bookmark = useBookmarksStore.getState().addBookmark(post.id, userId)
      useBookmarksStore.getState().updateBookmarkNote(bookmark.id, 'Updated note')

      const updated = useBookmarksStore.getState().bookmarks[bookmark.id]
      expect(updated.note).toBe('Updated note')
    })
  })

  describe('Collections', () => {
    it('should create a collection', () => {
      const userId = useUserStore.getState().userId

      const collection = useBookmarksStore.getState().createCollection(
        userId,
        'Doom Predictions',
        'Posts about upcoming doom scenarios'
      )

      expect(collection.name).toBe('Doom Predictions')
      expect(collection.description).toBe('Posts about upcoming doom scenarios')
    })

    it('should add bookmark to collection', () => {
      const author = { address: null, username: 'otheruser' }
      const post = usePostsStore.getState().createPost('Content', 'doom', author)
      const userId = useUserStore.getState().userId

      const collection = useBookmarksStore.getState().createCollection(userId, 'My Collection')
      const bookmark = useBookmarksStore.getState().addBookmark(post.id, userId, undefined, collection.id)

      expect(bookmark.collectionId).toBe(collection.id)

      const collectionBookmarks = useBookmarksStore.getState().getCollectionBookmarks(collection.id)
      expect(collectionBookmarks).toHaveLength(1)
    })

    it('should move bookmark between collections', () => {
      const author = { address: null, username: 'otheruser' }
      const post = usePostsStore.getState().createPost('Content', 'doom', author)
      const userId = useUserStore.getState().userId

      const collection1 = useBookmarksStore.getState().createCollection(userId, 'Collection 1')
      const collection2 = useBookmarksStore.getState().createCollection(userId, 'Collection 2')

      const bookmark = useBookmarksStore.getState().addBookmark(post.id, userId, undefined, collection1.id)

      useBookmarksStore.getState().moveToCollection(bookmark.id, collection2.id)

      const updated = useBookmarksStore.getState().bookmarks[bookmark.id]
      expect(updated.collectionId).toBe(collection2.id)

      expect(useBookmarksStore.getState().getCollectionBookmarks(collection1.id)).toHaveLength(0)
      expect(useBookmarksStore.getState().getCollectionBookmarks(collection2.id)).toHaveLength(1)
    })

    it('should delete collection and move bookmarks to uncategorized', () => {
      const author = { address: null, username: 'otheruser' }
      const post = usePostsStore.getState().createPost('Content', 'doom', author)
      const userId = useUserStore.getState().userId

      const collection = useBookmarksStore.getState().createCollection(userId, 'To Delete')
      const bookmark = useBookmarksStore.getState().addBookmark(post.id, userId, undefined, collection.id)

      useBookmarksStore.getState().deleteCollection(collection.id)

      expect(useBookmarksStore.getState().collections[collection.id]).toBeUndefined()

      const updated = useBookmarksStore.getState().bookmarks[bookmark.id]
      expect(updated).toBeDefined()
      expect(updated.collectionId).toBeUndefined()
    })

    it('should get all user collections', () => {
      const userId = useUserStore.getState().userId

      useBookmarksStore.getState().createCollection(userId, 'Collection 1')
      useBookmarksStore.getState().createCollection(userId, 'Collection 2')
      useBookmarksStore.getState().createCollection(userId, 'Collection 3')

      const collections = useBookmarksStore.getState().getUserCollections(userId)
      expect(collections).toHaveLength(3)
    })
  })

  describe('Bookmark with Post Interactions', () => {
    it('should allow bookmarking and liking the same post', () => {
      const author = { address: null, username: 'otheruser' }
      const post = usePostsStore.getState().createPost('Good content', 'doom', author)
      const userId = useUserStore.getState().userId

      useBookmarksStore.getState().addBookmark(post.id, userId)
      expect(useBookmarksStore.getState().isBookmarked(post.id)).toBe(true)

      usePostsStore.getState().likePost(post.id, userId)
      const updatedPost = usePostsStore.getState().posts[post.id]
      expect(updatedPost.likes).toBe(1)

      expect(useBookmarksStore.getState().isBookmarked(post.id)).toBe(true)
    })

    it('should handle bookmarking life posts', () => {
      const author = useUserStore.getState().author
      const userId = useUserStore.getState().userId

      const cost = useUserStore.getState().getLifePostCost()
      useUserStore.getState().spendDoom(cost)
      const post = usePostsStore.getState().createPost('Life content', 'life', author)

      const bookmark = useBookmarksStore.getState().addBookmark(post.id, userId)

      expect(bookmark.postId).toBe(post.id)
      expect(usePostsStore.getState().posts[post.id].variant).toBe('life')
    })

    it('should handle bookmarking multiple posts of different variants', () => {
      const author = { address: null, username: 'otheruser' }
      const userId = useUserStore.getState().userId

      const doomPost = usePostsStore.getState().createPost('Doom', 'doom', author)
      const lifePost = usePostsStore.getState().createPost('Life', 'life', author)

      useBookmarksStore.getState().addBookmark(doomPost.id, userId)
      useBookmarksStore.getState().addBookmark(lifePost.id, userId)

      expect(useBookmarksStore.getState().getBookmarkCount()).toBe(2)
    })
  })

  describe('Edge Cases', () => {
    it('should handle removing non-existent bookmark', () => {
      const userId = useUserStore.getState().userId
      useBookmarksStore.getState().removeBookmark('non-existent', userId)
      expect(useBookmarksStore.getState().getBookmarkCount()).toBe(0)
    })

    it('should prevent removing another users bookmark', () => {
      const author = { address: null, username: 'otheruser' }
      const post = usePostsStore.getState().createPost('Content', 'doom', author)

      useBookmarksStore.getState().addBookmark(post.id, 'user-1')
      useBookmarksStore.getState().removeBookmark(post.id, 'user-2')

      expect(useBookmarksStore.getState().isBookmarked(post.id)).toBe(true)
    })

    it('should handle updating non-existent bookmark note', () => {
      useBookmarksStore.getState().updateBookmarkNote('non-existent', 'Note')
    })

    it('should handle moving non-existent bookmark to collection', () => {
      useBookmarksStore.getState().moveToCollection('non-existent', 'collection-id')
    })
  })
})
