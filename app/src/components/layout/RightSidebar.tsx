/**
 * RightSidebar Component
 *
 * Right sidebar for desktop showing trending topics and suggested users.
 * Visible only on xl screens and above.
 * Features:
 * - Trending topics section
 * - Suggested users to follow
 * - Sticky positioning
 */

import { TrendingUp, UserPlus } from 'lucide-react'
import { usePostsStore, useUserStore } from '@/store'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

interface RightSidebarProps {
  /** Show trending topics section */
  showTrending?: boolean
  /** Show suggested users section */
  showSuggested?: boolean
  className?: string
}

export function RightSidebar({
  showTrending = true,
  showSuggested = true,
  className = '',
}: RightSidebarProps) {
  const navigate = useNavigate()
  const allPosts = usePostsStore((state) => state.posts)
  const following = useUserStore((state) => state.following)
  const followUser = useUserStore((state) => state.followUser)

  // Extract trending hashtags from posts
  const trendingTopics = useMemo(() => {
    const tagCounts: Record<string, { tag: string; count: number; posts: number }> = {}

    Object.values(allPosts).forEach((post) => {
      const tags = post.content.match(/#\w+/g) || []
      tags.forEach((tag) => {
        const normalizedTag = tag.toLowerCase()
        if (!tagCounts[normalizedTag]) {
          tagCounts[normalizedTag] = { tag: normalizedTag, count: 0, posts: 0 }
        }
        tagCounts[normalizedTag].count += post.likes + post.replies
        tagCounts[normalizedTag].posts += 1
      })
    })

    return Object.values(tagCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [allPosts])

  // Get suggested users (users from posts that we're not following)
  const suggestedUsers = useMemo(() => {
    const users = new Map<string, { username: string; verified?: boolean; postCount: number }>()

    Object.values(allPosts).forEach((post) => {
      const { username, verified } = post.author
      if (!following.includes(username)) {
        const existing = users.get(username)
        if (existing) {
          existing.postCount += 1
        } else {
          users.set(username, { username, verified, postCount: 1 })
        }
      }
    })

    return Array.from(users.values())
      .sort((a, b) => b.postCount - a.postCount)
      .slice(0, 5)
  }, [allPosts, following])

  return (
    <aside className={`hidden xl:block w-80 2xl:w-96 flex-shrink-0 ${className}`}>
      <div className="sticky top-0 pt-4 pb-16 space-y-4 px-4">
        {/* Trending Topics */}
        {showTrending && trendingTopics.length > 0 && (
          <div className="rounded-2xl bg-[#111] border border-[#222] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#222]">
              <h3 className="text-[17px] font-bold text-white flex items-center gap-2">
                <TrendingUp size={18} className="text-[#ff3040]" />
                Trending
              </h3>
            </div>
            <div className="divide-y divide-[#222]">
              {trendingTopics.map((topic) => (
                <button
                  key={topic.tag}
                  onClick={() => navigate(`/?search=${encodeURIComponent(topic.tag)}`)}
                  className="w-full px-4 py-3 hover:bg-[#1a1a1a] transition-colors text-left"
                >
                  <p className="text-[12px] text-[#555]">Trending in Doom</p>
                  <p className="text-[15px] font-semibold text-white">{topic.tag}</p>
                  <p className="text-[12px] text-[#777]">{topic.posts} posts</p>
                </button>
              ))}
            </div>
            <button
              onClick={() => navigate('/events')}
              className="w-full px-4 py-3 text-[14px] text-[#1d9bf0] hover:bg-[#1a1a1a] transition-colors text-left"
            >
              Show more
            </button>
          </div>
        )}

        {/* Suggested Users */}
        {showSuggested && suggestedUsers.length > 0 && (
          <div className="rounded-2xl bg-[#111] border border-[#222] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#222]">
              <h3 className="text-[17px] font-bold text-white flex items-center gap-2">
                <UserPlus size={18} className="text-[#00ba7c]" />
                Who to follow
              </h3>
            </div>
            <div className="divide-y divide-[#222]">
              {suggestedUsers.map((user) => (
                <div
                  key={user.username}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[#1a1a1a] transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-[#333] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-white truncate flex items-center gap-1">
                      {user.username}
                      {user.verified && (
                        <span className="text-[#1d9bf0]">&#10003;</span>
                      )}
                    </p>
                    <p className="text-[12px] text-[#777]">@{user.username}</p>
                  </div>
                  <button
                    onClick={() => followUser(user.username)}
                    className="px-4 py-1.5 rounded-full bg-white text-black text-[13px] font-semibold hover:bg-gray-200 transition-colors"
                  >
                    Follow
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate('/profile')}
              className="w-full px-4 py-3 text-[14px] text-[#1d9bf0] hover:bg-[#1a1a1a] transition-colors text-left"
            >
              Show more
            </button>
          </div>
        )}

        {/* Footer links */}
        <div className="px-4 py-2">
          <p className="text-[12px] text-[#555] leading-relaxed">
            Terms of Service &middot; Privacy Policy &middot; Cookie Policy &middot; Accessibility
          </p>
          <p className="text-[12px] text-[#555] mt-2">
            &copy; 2026 Doomsday
          </p>
        </div>
      </div>
    </aside>
  )
}
