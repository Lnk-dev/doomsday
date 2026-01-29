/**
 * EmbedPostPage
 * Issue #78: Enhance social sharing and embed system
 *
 * Page for embedding posts via iframe.
 * URL: /embed/post/:postId
 */

import { useParams, useSearchParams } from 'react-router-dom'
import { usePostsStore } from '@/store'
import { EmbedPost } from '@/components/embed'

export function EmbedPostPage() {
  const { postId } = useParams<{ postId: string }>()
  const [searchParams] = useSearchParams()

  const theme = (searchParams.get('theme') as 'dark' | 'light') || 'dark'
  const showStats = searchParams.get('stats') !== 'false'

  // Get post from store
  const post = usePostsStore((state) => (postId ? state.posts[postId] : null))

  if (!post) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
        <div className="text-center text-[#777]">
          <p className="text-[15px]">Post not found</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`min-h-screen p-4 ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-white'}`}
    >
      <EmbedPost
        author={post.author}
        content={post.content}
        variant={post.variant}
        createdAt={post.createdAt}
        likes={post.likes}
        replies={post.replies}
        reposts={post.reposts}
        postId={post.id}
        theme={theme}
        showStats={showStats}
      />
    </div>
  )
}
