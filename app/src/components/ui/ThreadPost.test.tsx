/**
 * ThreadPost Component Tests
 *
 * Tests for the ThreadPost component which displays posts in the feed.
 * Issue #112: Add component unit tests with React Testing Library
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
      // 5 action buttons (like, comment, repost, share, bookmark) + 1 more options button
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

  describe('bookmark functionality', () => {
    it('should call onBookmark when bookmark button is clicked', () => {
      const onBookmark = vi.fn()
      render(<ThreadPost {...defaultProps} onBookmark={onBookmark} />)

      const actionButtons = document.querySelector('.flex.items-center.gap-1.mt-3')
      const buttons = actionButtons?.querySelectorAll('button')
      const bookmarkButton = buttons?.[4]
      fireEvent.click(bookmarkButton!)

      expect(onBookmark).toHaveBeenCalledTimes(1)
    })

    it('should show filled bookmark icon when isBookmarked is true', () => {
      render(<ThreadPost {...defaultProps} isBookmarked={true} />)

      const bookmarkIcon = document.querySelector('.fill-\\[\\#1d9bf0\\]')
      expect(bookmarkIcon).toBeInTheDocument()
    })

    it('should show outline bookmark icon when isBookmarked is false', () => {
      render(<ThreadPost {...defaultProps} isBookmarked={false} />)

      const bookmarkIcon = document.querySelector('.fill-\\[\\#1d9bf0\\]')
      expect(bookmarkIcon).not.toBeInTheDocument()
    })
  })

  describe('repost functionality', () => {
    it('should display repost count when repostCount > 0', () => {
      render(<ThreadPost {...defaultProps} repostCount={5} />)

      expect(screen.getByText('5 reposts')).toBeInTheDocument()
    })

    it('should display singular repost when repostCount = 1', () => {
      render(<ThreadPost {...defaultProps} repostCount={1} />)

      expect(screen.getByText('1 repost')).toBeInTheDocument()
    })

    it('should show reposted by attribution when repostedBy is provided', () => {
      render(
        <ThreadPost
          {...defaultProps}
          repostedBy={{ username: 'reposter', address: null }}
        />
      )

      expect(screen.getByText('@reposter reposted')).toBeInTheDocument()
    })
  })

  describe('quote repost', () => {
    it('should render original post when isQuoteRepost is true', () => {
      render(
        <ThreadPost
          {...defaultProps}
          isQuoteRepost={true}
          originalPost={{
            author: { username: 'originalauthor', verified: false },
            content: 'Original post content',
          }}
        />
      )

      expect(screen.getByText('@originalauthor')).toBeInTheDocument()
      expect(screen.getByText('Original post content')).toBeInTheDocument()
    })

    it('should show verified badge for original post author when verified', () => {
      render(
        <ThreadPost
          {...defaultProps}
          isQuoteRepost={true}
          originalPost={{
            author: { username: 'verifiedauthor', verified: true },
            content: 'Verified post content',
          }}
        />
      )

      const badges = document.querySelectorAll('.text-blue-500')
      expect(badges.length).toBeGreaterThanOrEqual(1)
    })

    it('should not render original post when isQuoteRepost is false', () => {
      render(
        <ThreadPost
          {...defaultProps}
          isQuoteRepost={false}
          originalPost={{
            author: { username: 'originalauthor' },
            content: 'Original post content',
          }}
        />
      )

      expect(screen.queryByText('@originalauthor')).not.toBeInTheDocument()
    })
  })

  describe('action button aria labels', () => {
    it('should have correct aria-label for like button when not liked', () => {
      render(<ThreadPost {...defaultProps} isLiked={false} />)

      const likeButton = screen.getByLabelText('Like this post')
      expect(likeButton).toBeInTheDocument()
    })

    it('should have correct aria-label for like button when liked', () => {
      render(<ThreadPost {...defaultProps} isLiked={true} />)

      const unlikeButton = screen.getByLabelText('Unlike this post')
      expect(unlikeButton).toBeInTheDocument()
    })

    it('should have aria-pressed attribute on like button', () => {
      render(<ThreadPost {...defaultProps} isLiked={true} />)

      const likeButton = screen.getByLabelText('Unlike this post')
      expect(likeButton).toHaveAttribute('aria-pressed', 'true')
    })

    it('should have aria-label for reply button', () => {
      render(<ThreadPost {...defaultProps} />)

      const replyButton = screen.getByLabelText('Reply to this post')
      expect(replyButton).toBeInTheDocument()
    })

    it('should have aria-label for share button', () => {
      render(<ThreadPost {...defaultProps} />)

      const shareButton = screen.getByLabelText('Share this post')
      expect(shareButton).toBeInTheDocument()
    })

    it('should have actions group with correct aria role', () => {
      render(<ThreadPost {...defaultProps} />)

      const actionsGroup = screen.getByRole('group', { name: 'Post actions' })
      expect(actionsGroup).toBeInTheDocument()
    })
  })
})
