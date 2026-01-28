import { describe, it, expect, beforeEach } from 'vitest'
import { usePostsStore } from './posts'

describe('Posts Store', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    usePostsStore.setState({
      posts: {},
      doomFeed: [],
      lifeFeed: [],
    })
  })

  describe('createPost', () => {
    it('should create a doom post and add to doom feed', () => {
      const author = { address: null, username: 'testuser' }
      const post = usePostsStore.getState().createPost('Test doom content', 'doom', author)

      expect(post.content).toBe('Test doom content')
      expect(post.variant).toBe('doom')
      expect(post.author.username).toBe('testuser')
      expect(post.likes).toBe(0)
      expect(post.likedBy).toEqual([])

      const state = usePostsStore.getState()
      expect(state.posts[post.id]).toBeDefined()
      expect(state.doomFeed).toContain(post.id)
      expect(state.lifeFeed).not.toContain(post.id)
    })

    it('should create a life post and add to life feed', () => {
      const author = { address: null, username: 'lifeuser' }
      const post = usePostsStore.getState().createPost('Test life content', 'life', author)

      expect(post.variant).toBe('life')

      const state = usePostsStore.getState()
      expect(state.lifeFeed).toContain(post.id)
      expect(state.doomFeed).not.toContain(post.id)
    })

    it('should add new posts to the beginning of the feed', () => {
      const author = { address: null, username: 'testuser' }

      const post1 = usePostsStore.getState().createPost('First post', 'doom', author)
      const post2 = usePostsStore.getState().createPost('Second post', 'doom', author)

      const state = usePostsStore.getState()
      expect(state.doomFeed[0]).toBe(post2.id)
      expect(state.doomFeed[1]).toBe(post1.id)
    })
  })

  describe('likePost', () => {
    it('should increment likes and add user to likedBy', () => {
      const author = { address: null, username: 'testuser' }
      const post = usePostsStore.getState().createPost('Test content', 'doom', author)

      usePostsStore.getState().likePost(post.id, 'user-123')

      const updatedPost = usePostsStore.getState().posts[post.id]
      expect(updatedPost.likes).toBe(1)
      expect(updatedPost.likedBy).toContain('user-123')
    })

    it('should not allow duplicate likes from same user', () => {
      const author = { address: null, username: 'testuser' }
      const post = usePostsStore.getState().createPost('Test content', 'doom', author)

      usePostsStore.getState().likePost(post.id, 'user-123')
      usePostsStore.getState().likePost(post.id, 'user-123')

      const updatedPost = usePostsStore.getState().posts[post.id]
      expect(updatedPost.likes).toBe(1)
      expect(updatedPost.likedBy.filter(id => id === 'user-123')).toHaveLength(1)
    })

    it('should allow multiple users to like', () => {
      const author = { address: null, username: 'testuser' }
      const post = usePostsStore.getState().createPost('Test content', 'doom', author)

      usePostsStore.getState().likePost(post.id, 'user-1')
      usePostsStore.getState().likePost(post.id, 'user-2')
      usePostsStore.getState().likePost(post.id, 'user-3')

      const updatedPost = usePostsStore.getState().posts[post.id]
      expect(updatedPost.likes).toBe(3)
      expect(updatedPost.likedBy).toHaveLength(3)
    })
  })

  describe('unlikePost', () => {
    it('should decrement likes and remove user from likedBy', () => {
      const author = { address: null, username: 'testuser' }
      const post = usePostsStore.getState().createPost('Test content', 'doom', author)

      usePostsStore.getState().likePost(post.id, 'user-123')
      usePostsStore.getState().unlikePost(post.id, 'user-123')

      const updatedPost = usePostsStore.getState().posts[post.id]
      expect(updatedPost.likes).toBe(0)
      expect(updatedPost.likedBy).not.toContain('user-123')
    })

    it('should not decrement below zero if user has not liked', () => {
      const author = { address: null, username: 'testuser' }
      const post = usePostsStore.getState().createPost('Test content', 'doom', author)

      usePostsStore.getState().unlikePost(post.id, 'user-123')

      const updatedPost = usePostsStore.getState().posts[post.id]
      expect(updatedPost.likes).toBe(0)
    })
  })

  describe('getFeed', () => {
    it('should return posts for doom feed', () => {
      const author = { address: null, username: 'testuser' }

      usePostsStore.getState().createPost('Doom 1', 'doom', author)
      usePostsStore.getState().createPost('Life 1', 'life', author)
      usePostsStore.getState().createPost('Doom 2', 'doom', author)

      const doomFeed = usePostsStore.getState().getFeed('doom')
      expect(doomFeed).toHaveLength(2)
      expect(doomFeed.every(p => p.variant === 'doom')).toBe(true)
    })

    it('should return posts for life feed', () => {
      const author = { address: null, username: 'testuser' }

      usePostsStore.getState().createPost('Life 1', 'life', author)
      usePostsStore.getState().createPost('Doom 1', 'doom', author)
      usePostsStore.getState().createPost('Life 2', 'life', author)

      const lifeFeed = usePostsStore.getState().getFeed('life')
      expect(lifeFeed).toHaveLength(2)
      expect(lifeFeed.every(p => p.variant === 'life')).toBe(true)
    })
  })

  describe('getPost', () => {
    it('should return post by ID', () => {
      const author = { address: null, username: 'testuser' }
      const created = usePostsStore.getState().createPost('Test content', 'doom', author)

      const retrieved = usePostsStore.getState().getPost(created.id)
      expect(retrieved).toBeDefined()
      expect(retrieved?.content).toBe('Test content')
    })

    it('should return undefined for non-existent post', () => {
      const retrieved = usePostsStore.getState().getPost('non-existent-id')
      expect(retrieved).toBeUndefined()
    })
  })

  describe('repostPost', () => {
    it('should create a repost and add to feed', () => {
      const originalAuthor = { address: 'addr1', username: 'original' }
      const reposterAuthor = { address: 'addr2', username: 'reposter' }

      const original = usePostsStore.getState().createPost('Original content', 'doom', originalAuthor)
      const repost = usePostsStore.getState().repostPost(original.id, 'reposter-id', reposterAuthor)

      expect(repost).not.toBeNull()
      expect(repost?.content).toBe('Original content')
      expect(repost?.author.username).toBe('original')
      expect(repost?.repostedBy?.username).toBe('reposter')
      expect(repost?.originalPostId).toBe(original.id)

      const state = usePostsStore.getState()
      expect(state.doomFeed).toContain(repost?.id)
    })

    it('should increment reposts count on original post', () => {
      const originalAuthor = { address: 'addr1', username: 'original' }
      const reposterAuthor = { address: 'addr2', username: 'reposter' }

      const original = usePostsStore.getState().createPost('Original content', 'doom', originalAuthor)
      usePostsStore.getState().repostPost(original.id, 'reposter-id', reposterAuthor)

      const updatedOriginal = usePostsStore.getState().posts[original.id]
      expect(updatedOriginal.reposts).toBe(1)
      expect(updatedOriginal.repostedByUsers).toContain('reposter-id')
    })

    it('should not allow reposting own posts', () => {
      const author = { address: 'addr1', username: 'testuser' }
      const post = usePostsStore.getState().createPost('Test content', 'doom', author)

      const repost = usePostsStore.getState().repostPost(post.id, 'user-id', author)
      expect(repost).toBeNull()
    })

    it('should not allow duplicate reposts', () => {
      const originalAuthor = { address: 'addr1', username: 'original' }
      const reposterAuthor = { address: 'addr2', username: 'reposter' }

      const original = usePostsStore.getState().createPost('Original content', 'doom', originalAuthor)
      usePostsStore.getState().repostPost(original.id, 'reposter-id', reposterAuthor)
      const duplicate = usePostsStore.getState().repostPost(original.id, 'reposter-id', reposterAuthor)

      expect(duplicate).toBeNull()

      const updatedOriginal = usePostsStore.getState().posts[original.id]
      expect(updatedOriginal.reposts).toBe(1)
    })
  })

  describe('quoteRepost', () => {
    it('should create a quote repost with custom content', () => {
      const originalAuthor = { address: 'addr1', username: 'original' }
      const quoterAuthor = { address: 'addr2', username: 'quoter' }

      const original = usePostsStore.getState().createPost('Original content', 'doom', originalAuthor)
      const quote = usePostsStore.getState().quoteRepost(original.id, 'quoter-id', quoterAuthor, 'My thoughts on this')

      expect(quote).not.toBeNull()
      expect(quote?.content).toBe('My thoughts on this')
      expect(quote?.author.username).toBe('quoter')
      expect(quote?.originalPostId).toBe(original.id)
      expect(quote?.quoteContent).toBe('My thoughts on this')
    })

    it('should not create quote repost with empty content', () => {
      const originalAuthor = { address: 'addr1', username: 'original' }
      const quoterAuthor = { address: 'addr2', username: 'quoter' }

      const original = usePostsStore.getState().createPost('Original content', 'doom', originalAuthor)
      const quote = usePostsStore.getState().quoteRepost(original.id, 'quoter-id', quoterAuthor, '   ')

      expect(quote).toBeNull()
    })
  })

  describe('unrepostPost', () => {
    it('should remove repost and decrement count', () => {
      const originalAuthor = { address: 'addr1', username: 'original' }
      const reposterAuthor = { address: 'addr2', username: 'reposter' }

      const original = usePostsStore.getState().createPost('Original content', 'doom', originalAuthor)
      const repost = usePostsStore.getState().repostPost(original.id, 'reposter', reposterAuthor)

      expect(repost).not.toBeNull()

      usePostsStore.getState().unrepostPost(original.id, 'reposter')

      const state = usePostsStore.getState()
      expect(state.posts[repost!.id]).toBeUndefined()
      expect(state.posts[original.id].reposts).toBe(0)
      expect(state.posts[original.id].repostedByUsers).not.toContain('reposter')
    })
  })

  describe('hasReposted', () => {
    it('should return true if user has reposted', () => {
      const originalAuthor = { address: 'addr1', username: 'original' }
      const reposterAuthor = { address: 'addr2', username: 'reposter' }

      const original = usePostsStore.getState().createPost('Original content', 'doom', originalAuthor)
      usePostsStore.getState().repostPost(original.id, 'reposter-id', reposterAuthor)

      expect(usePostsStore.getState().hasReposted(original.id, 'reposter-id')).toBe(true)
    })

    it('should return false if user has not reposted', () => {
      const author = { address: 'addr1', username: 'testuser' }
      const post = usePostsStore.getState().createPost('Test content', 'doom', author)

      expect(usePostsStore.getState().hasReposted(post.id, 'other-user')).toBe(false)
    })
  })
})
