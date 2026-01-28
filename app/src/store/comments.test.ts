import { describe, it, expect, beforeEach } from 'vitest'
import { useCommentsStore } from './comments'

describe('Comments Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useCommentsStore.setState({
      comments: {},
      commentsByPost: {},
    })
  })

  describe('addComment', () => {
    it('should add a comment to a post', () => {
      const comment = useCommentsStore.getState().addComment(
        'post-1',
        'testuser',
        'Test comment content'
      )

      expect(comment.postId).toBe('post-1')
      expect(comment.authorUsername).toBe('testuser')
      expect(comment.content).toBe('Test comment content')
      expect(comment.likes).toBe(0)
      expect(comment.isPending).toBe(true)
    })

    it('should update commentsByPost index', () => {
      useCommentsStore.getState().addComment('post-1', 'user1', 'Comment 1')
      useCommentsStore.getState().addComment('post-1', 'user2', 'Comment 2')

      const state = useCommentsStore.getState()
      expect(state.commentsByPost['post-1'].length).toBe(2)
    })

    it('should handle comments on different posts', () => {
      useCommentsStore.getState().addComment('post-1', 'user1', 'Comment on post 1')
      useCommentsStore.getState().addComment('post-2', 'user2', 'Comment on post 2')

      const state = useCommentsStore.getState()
      expect(state.commentsByPost['post-1'].length).toBe(1)
      expect(state.commentsByPost['post-2'].length).toBe(1)
    })
  })

  describe('likeComment', () => {
    it('should increment likes and add user to likedBy', () => {
      const comment = useCommentsStore.getState().addComment(
        'post-1',
        'testuser',
        'Test'
      )

      useCommentsStore.getState().likeComment(comment.id, 'user-123')

      const updated = useCommentsStore.getState().comments[comment.id]
      expect(updated.likes).toBe(1)
      expect(updated.likedBy).toContain('user-123')
    })

    it('should not allow duplicate likes', () => {
      const comment = useCommentsStore.getState().addComment(
        'post-1',
        'testuser',
        'Test'
      )

      useCommentsStore.getState().likeComment(comment.id, 'user-123')
      useCommentsStore.getState().likeComment(comment.id, 'user-123')

      const updated = useCommentsStore.getState().comments[comment.id]
      expect(updated.likes).toBe(1)
    })

    it('should allow multiple users to like same comment', () => {
      const comment = useCommentsStore.getState().addComment(
        'post-1',
        'testuser',
        'Test'
      )

      useCommentsStore.getState().likeComment(comment.id, 'user-1')
      useCommentsStore.getState().likeComment(comment.id, 'user-2')

      const updated = useCommentsStore.getState().comments[comment.id]
      expect(updated.likes).toBe(2)
      expect(updated.likedBy).toContain('user-1')
      expect(updated.likedBy).toContain('user-2')
    })
  })

  describe('unlikeComment', () => {
    it('should decrement likes and remove user from likedBy', () => {
      const comment = useCommentsStore.getState().addComment(
        'post-1',
        'testuser',
        'Test'
      )

      useCommentsStore.getState().likeComment(comment.id, 'user-123')
      useCommentsStore.getState().unlikeComment(comment.id, 'user-123')

      const updated = useCommentsStore.getState().comments[comment.id]
      expect(updated.likes).toBe(0)
      expect(updated.likedBy).not.toContain('user-123')
    })

    it('should not allow unliking if not liked', () => {
      const comment = useCommentsStore.getState().addComment(
        'post-1',
        'testuser',
        'Test'
      )

      useCommentsStore.getState().unlikeComment(comment.id, 'user-123')

      const updated = useCommentsStore.getState().comments[comment.id]
      expect(updated.likes).toBe(0)
    })
  })

  describe('getCommentsForPost', () => {
    it('should return comments sorted by createdAt', () => {
      // Add comments manually with specific timestamps
      const state = useCommentsStore.getState()

      state.addComment('post-1', 'user1', 'First comment')
      state.addComment('post-1', 'user2', 'Second comment')

      const comments = useCommentsStore.getState().getCommentsForPost('post-1')
      expect(comments.length).toBe(2)
      expect(comments[0].createdAt).toBeLessThanOrEqual(comments[1].createdAt)
    })

    it('should return empty array for post with no comments', () => {
      const comments = useCommentsStore.getState().getCommentsForPost('nonexistent')
      expect(comments).toEqual([])
    })
  })

  describe('getCommentCount', () => {
    it('should return correct count', () => {
      useCommentsStore.getState().addComment('post-1', 'user1', 'Comment 1')
      useCommentsStore.getState().addComment('post-1', 'user2', 'Comment 2')
      useCommentsStore.getState().addComment('post-1', 'user3', 'Comment 3')

      const count = useCommentsStore.getState().getCommentCount('post-1')
      expect(count).toBe(3)
    })

    it('should return 0 for post with no comments', () => {
      const count = useCommentsStore.getState().getCommentCount('nonexistent')
      expect(count).toBe(0)
    })
  })

  describe('removeComment', () => {
    it('should remove comment and update index', () => {
      const comment = useCommentsStore.getState().addComment(
        'post-1',
        'testuser',
        'To be deleted'
      )

      useCommentsStore.getState().removeComment(comment.id)

      const state = useCommentsStore.getState()
      expect(state.comments[comment.id]).toBeUndefined()
      expect(state.commentsByPost['post-1']).not.toContain(comment.id)
    })

    it('should handle removing nonexistent comment gracefully', () => {
      // Should not throw
      useCommentsStore.getState().removeComment('nonexistent-id')
    })
  })

  describe('confirmComment', () => {
    it('should remove pending state', async () => {
      const comment = useCommentsStore.getState().addComment(
        'post-1',
        'testuser',
        'Test'
      )

      expect(useCommentsStore.getState().comments[comment.id].isPending).toBe(true)

      useCommentsStore.getState().confirmComment(comment.id)

      expect(useCommentsStore.getState().comments[comment.id].isPending).toBe(false)
      expect(useCommentsStore.getState().comments[comment.id].error).toBeUndefined()
    })
  })

  describe('failComment', () => {
    it('should set error state', () => {
      const comment = useCommentsStore.getState().addComment(
        'post-1',
        'testuser',
        'Test'
      )

      useCommentsStore.getState().failComment(comment.id, 'Network error')

      const updated = useCommentsStore.getState().comments[comment.id]
      expect(updated.isPending).toBe(false)
      expect(updated.error).toBe('Network error')
    })
  })
})
