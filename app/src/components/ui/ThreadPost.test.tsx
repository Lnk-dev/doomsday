/**
 * ThreadPost Component Tests
 *
 * Tests for the ThreadPost component which displays posts in the feed.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThreadPost } from './ThreadPost'

describe('ThreadPost', () => {
  const defaultProps = {
    author: {
      username: 'testuser',
      address: null,
    },
    content: 'This is a test post content',
    timestamp: '2h',
    likes: 5,
    replies: 3,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render the post content', () => {
      render(<ThreadPost {...defaultProps} />)

      expect(screen.getByText('This is a test post content')).toBeInTheDocument()
    })

    it('should render the author username', () => {
      render(<ThreadPost {...defaultProps} />)

      expect(screen.getByText('testuser')).toBeInTheDocument()
    })

    it('should render the timestamp', () => {
      render(<ThreadPost {...defaultProps} />)

      expect(screen.getByText('2h')).toBeInTheDocument()
    })

    it('should render engagement stats when likes > 0', () => {
      render(<ThreadPost {...defaultProps} />)

      expect(screen.getByText('5 likes')).toBeInTheDocument()
    })

    it('should render singular "like" when likes = 1', () => {
      render(<ThreadPost {...defaultProps} likes={1} />)

      expect(screen.getByText('1 like')).toBeInTheDocument()
    })

    it('should render engagement stats when replies > 0', () => {
      render(<ThreadPost {...defaultProps} />)

      expect(screen.getByText('3 replies')).toBeInTheDocument()
    })

    it('should render singular "reply" when replies = 1', () => {
      render(<ThreadPost {...defaultProps} replies={1} />)

      expect(screen.getByText('1 reply')).toBeInTheDocument()
    })

    it('should not render engagement stats when likes and replies are 0', () => {
      render(<ThreadPost {...defaultProps} likes={0} replies={0} />)

      expect(screen.queryByText(/like/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/repl/i)).not.toBeInTheDocument()
    })

    it('should render verified badge when author is verified', () => {
      render(
        <ThreadPost
          {...defaultProps}
          author={{ ...defaultProps.author, verified: true }}
        />
      )

      const badge = document.querySelector('.text-blue-500')
      expect(badge).toBeInTheDocument()
    })

    it('should not render verified badge when author is not verified', () => {
      render(<ThreadPost {...defaultProps} />)

      const badge = document.querySelector('.text-blue-500')
      expect(badge).not.toBeInTheDocument()
    })

    it('should render avatar when provided', () => {
      render(
        <ThreadPost
          {...defaultProps}
          author={{ ...defaultProps.author, avatar: 'https://example.com/avatar.jpg' }}
        />
      )

      const avatar = document.querySelector('img')
      expect(avatar).toBeInTheDocument()
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg')
    })

    it('should render thread line when hasThread is true', () => {
      render(<ThreadPost {...defaultProps} hasThread={true} />)

      const threadLine = document.querySelector('.flex-1.bg-\\[\\#333\\]')
      expect(threadLine).toBeInTheDocument()
    })
  })

  describe('variants', () => {
    it('should apply doom variant styling', () => {
      render(<ThreadPost {...defaultProps} variant="doom" />)

      const avatarContainer = document.querySelector('.w-9.h-9.rounded-full')
      expect(avatarContainer).toBeInTheDocument()
      expect(avatarContainer?.getAttribute('style')).toContain('#ff3040')
    })

    it('should apply life variant styling', () => {
      render(<ThreadPost {...defaultProps} variant="life" />)

      const avatarContainer = document.querySelector('.w-9.h-9.rounded-full')
      expect(avatarContainer).toBeInTheDocument()
      expect(avatarContainer?.getAttribute('style')).toContain('#00ba7c')
    })

    it('should not apply border styling for default variant', () => {
      render(<ThreadPost {...defaultProps} variant="default" />)

      const avatarContainer = document.querySelector('.w-9.h-9.rounded-full')
      expect(avatarContainer).toBeInTheDocument()
      expect(avatarContainer?.getAttribute('style')).toBeFalsy()
    })
  })

  describe('interactions', () => {
    it('should call onLike when like button is clicked', () => {
      const onLike = vi.fn()
      render(<ThreadPost {...defaultProps} onLike={onLike} />)

      const actionButtons = document.querySelector('.flex.items-center.gap-1.mt-3')
      const likeButton = actionButtons?.querySelector('button')
      fireEvent.click(likeButton!)

      expect(onLike).toHaveBeenCalledTimes(1)
    })

    it('should call onClick when content is clicked', () => {
      const onClick = vi.fn()
      render(<ThreadPost {...defaultProps} onClick={onClick} />)

      const content = screen.getByText('This is a test post content')
      fireEvent.click(content)

      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('should call onShare when share button is clicked', () => {
      const onShare = vi.fn()
      render(<ThreadPost {...defaultProps} onShare={onShare} />)

      const actionButtons = document.querySelector('.flex.items-center.gap-1.mt-3')
      const buttons = actionButtons?.querySelectorAll('button')
      const shareButton = buttons?.[3]
      fireEvent.click(shareButton!)

      expect(onShare).toHaveBeenCalledTimes(1)
    })

    it('should show filled heart when isLiked is true', () => {
      render(<ThreadPost {...defaultProps} isLiked={true} />)

      const heartIcon = document.querySelector('.fill-\\[\\#ff3040\\]')
      expect(heartIcon).toBeInTheDocument()
    })

    it('should show outline heart when isLiked is false', () => {
      render(<ThreadPost {...defaultProps} isLiked={false} />)

      const heartIcon = document.querySelector('.fill-\\[\\#ff3040\\]')
      expect(heartIcon).not.toBeInTheDocument()
    })

    it('should add cursor-pointer to content when onClick is provided', () => {
      const onClick = vi.fn()
      render(<ThreadPost {...defaultProps} onClick={onClick} />)

      const content = screen.getByText('This is a test post content')
      expect(content).toHaveClass('cursor-pointer')
    })

    it('should not add cursor-pointer to content when onClick is not provided', () => {
      render(<ThreadPost {...defaultProps} />)

      const content = screen.getByText('This is a test post content')
      expect(content).not.toHaveClass('cursor-pointer')
    })
  })

  describe('accessibility', () => {
    it('should render as an article element', () => {
      render(<ThreadPost {...defaultProps} />)

      expect(screen.getByRole('article')).toBeInTheDocument()
    })

    it('should have accessible buttons', () => {
      render(<ThreadPost {...defaultProps} />)

      const buttons = screen.getAllByRole('button')
      // 6 buttons: like, comment, repost, share, bookmark, more options
      expect(buttons.length).toBe(6)
    })
  })

  describe('content handling', () => {
    it('should preserve whitespace in content', () => {
      const content = 'Line 1\nLine 2\nLine 3'
      render(<ThreadPost {...defaultProps} content={content} />)

      const contentEl = screen.getByText(/Line 1/i)
      expect(contentEl).toHaveClass('whitespace-pre-wrap')
    })

    it('should handle long content with word breaks', () => {
      const longContent = 'This is a very long content that should break properly when rendered in the component'
      render(<ThreadPost {...defaultProps} content={longContent} />)

      const contentEl = screen.getByText(longContent)
      expect(contentEl).toHaveClass('break-words')
    })
  })
})
