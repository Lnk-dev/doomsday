/**
 * LifeTimelinePage
 *
 * Visual timeline showing a user's life journey through the app.
 * Features:
 * - Chronological life posts
 * - Milestones and achievements
 * - Stats summary
 * - Days living visualization
 */

import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Heart, Calendar, Award, Flame, Sparkles } from 'lucide-react'
import { usePostsStore, useUserStore } from '@/store'
import { formatRelativeTime } from '@/lib/utils'
import { useMemo } from 'react'

interface Milestone {
  id: string
  type: 'first_post' | 'days' | 'posts' | 'donation' | 'streak'
  title: string
  description: string
  icon: typeof Heart
  color: string
  date: number
}

export function LifeTimelinePage() {
  const navigate = useNavigate()
  const { username } = useParams<{ username?: string }>()

  // Store hooks
  const allPosts = usePostsStore((state) => state.posts)
  const currentAuthor = useUserStore((state) => state.author)
  const daysLiving = useUserStore((state) => state.daysLiving)
  const lifePostsCount = useUserStore((state) => state.lifePosts)
  const lifeBalance = useUserStore((state) => state.lifeBalance)

  // Determine if viewing own timeline or another user's
  const isOwnTimeline = !username || username === currentAuthor.username
  const displayUsername = username || currentAuthor.username

  // Get life posts for this user
  const lifePosts = useMemo(() => {
    return Object.values(allPosts)
      .filter(
        (post) =>
          post.variant === 'life' && post.author.username === displayUsername
      )
      .sort((a, b) => a.createdAt - b.createdAt) // Oldest first for timeline
  }, [allPosts, displayUsername])

  // Generate milestones based on activity
  const milestones = useMemo(() => {
    const result: Milestone[] = []

    // First life post milestone
    if (lifePosts.length > 0) {
      result.push({
        id: 'first_post',
        type: 'first_post',
        title: 'First Life Post',
        description: 'Chose to live and shared it with the world',
        icon: Sparkles,
        color: '#00ba7c',
        date: lifePosts[0].createdAt,
      })
    }

    // Days living milestones
    if (isOwnTimeline) {
      if (daysLiving >= 7) {
        result.push({
          id: 'days_7',
          type: 'days',
          title: '1 Week Living',
          description: 'Survived the first week against all odds',
          icon: Calendar,
          color: '#3b82f6',
          date: Date.now() - (daysLiving - 7) * 24 * 60 * 60 * 1000,
        })
      }
      if (daysLiving >= 30) {
        result.push({
          id: 'days_30',
          type: 'days',
          title: '1 Month Living',
          description: 'A full month of choosing life',
          icon: Calendar,
          color: '#8b5cf6',
          date: Date.now() - (daysLiving - 30) * 24 * 60 * 60 * 1000,
        })
      }
    }

    // Post count milestones
    if (lifePosts.length >= 5) {
      result.push({
        id: 'posts_5',
        type: 'posts',
        title: '5 Life Posts',
        description: 'Consistently sharing your journey',
        icon: Heart,
        color: '#ec4899',
        date: lifePosts[4]?.createdAt || Date.now(),
      })
    }
    if (lifePosts.length >= 10) {
      result.push({
        id: 'posts_10',
        type: 'posts',
        title: '10 Life Posts',
        description: 'A dedicated life chronicler',
        icon: Award,
        color: '#f59e0b',
        date: lifePosts[9]?.createdAt || Date.now(),
      })
    }

    // Sort by date
    return result.sort((a, b) => a.date - b.date)
  }, [lifePosts, daysLiving, isOwnTimeline])

  // Combine posts and milestones into timeline
  const timelineItems = useMemo(() => {
    const items: Array<
      | { type: 'post'; data: (typeof lifePosts)[0] }
      | { type: 'milestone'; data: Milestone }
    > = []

    // Add posts
    lifePosts.forEach((post) => {
      items.push({ type: 'post', data: post })
    })

    // Add milestones
    milestones.forEach((milestone) => {
      items.push({ type: 'milestone', data: milestone })
    })

    // Sort by date
    return items.sort((a, b) => {
      const dateA = a.type === 'post' ? a.data.createdAt : a.data.date
      const dateB = b.type === 'post' ? b.data.createdAt : b.data.date
      return dateA - dateB
    })
  }, [lifePosts, milestones])

  return (
    <div className="flex flex-col min-h-full bg-black">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-[#333]">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft size={24} className="text-white" />
        </button>
        <div>
          <h1 className="text-[17px] font-semibold text-white">Life Timeline</h1>
          <p className="text-[13px] text-[#777]">@{displayUsername}</p>
        </div>
      </div>

      {/* Stats banner */}
      {isOwnTimeline && (
        <div className="mx-4 mt-4 p-4 rounded-2xl bg-gradient-to-r from-[#00ba7c20] to-[#00ba7c10] border border-[#00ba7c30]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#00ba7c20] flex items-center justify-center">
                <Heart size={24} className="text-[#00ba7c]" fill="#00ba7c" />
              </div>
              <div>
                <p className="text-[20px] font-bold text-white">{daysLiving} days</p>
                <p className="text-[13px] text-[#00ba7c]">living</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[16px] font-semibold text-white">{lifePostsCount}</p>
              <p className="text-[12px] text-[#777]">life posts</p>
            </div>
            <div className="text-right">
              <p className="text-[16px] font-semibold text-[#00ba7c]">{lifeBalance}</p>
              <p className="text-[12px] text-[#777]">$LIFE</p>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="flex-1 px-4 py-6">
        {timelineItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Heart size={48} className="text-[#333] mb-4" />
            <p className="text-[15px] text-[#777] text-center">
              No life journey yet.
            </p>
            <p className="text-[13px] text-[#555] text-center mt-1">
              Start posting to Life to build your timeline.
            </p>
            {isOwnTimeline && (
              <button
                onClick={() => navigate('/compose')}
                className="mt-4 px-6 py-2 rounded-xl bg-[#00ba7c] text-white text-[14px] font-semibold"
              >
                Create Life Post
              </button>
            )}
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[18px] top-0 bottom-0 w-0.5 bg-[#333]" />

            {/* Timeline items */}
            <div className="space-y-6">
              {timelineItems.map((item) => {
                if (item.type === 'milestone') {
                  const milestone = item.data
                  const Icon = milestone.icon
                  return (
                    <div key={milestone.id} className="relative flex gap-4">
                      {/* Milestone marker */}
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center z-10"
                        style={{ backgroundColor: `${milestone.color}30` }}
                      >
                        <Icon size={18} style={{ color: milestone.color }} />
                      </div>
                      {/* Content */}
                      <div className="flex-1 pb-2">
                        <div
                          className="p-3 rounded-xl"
                          style={{ backgroundColor: `${milestone.color}10` }}
                        >
                          <p
                            className="text-[14px] font-semibold"
                            style={{ color: milestone.color }}
                          >
                            {milestone.title}
                          </p>
                          <p className="text-[13px] text-[#777] mt-0.5">
                            {milestone.description}
                          </p>
                          <p className="text-[11px] text-[#555] mt-2">
                            {formatRelativeTime(milestone.date)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                } else {
                  const post = item.data
                  return (
                    <div key={post.id} className="relative flex gap-4">
                      {/* Post marker */}
                      <div className="w-9 h-9 rounded-full bg-[#1a1a1a] border-2 border-[#00ba7c] flex items-center justify-center z-10">
                        <Flame size={14} className="text-[#00ba7c]" />
                      </div>
                      {/* Content */}
                      <button
                        onClick={() => navigate(`/post/${post.id}`)}
                        className="flex-1 text-left p-3 rounded-xl bg-[#111] hover:bg-[#1a1a1a] transition-colors"
                      >
                        <p className="text-[14px] text-white whitespace-pre-wrap line-clamp-3">
                          {post.content}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-[12px] text-[#777]">
                          <span>{formatRelativeTime(post.createdAt)}</span>
                          <span>{post.likes} likes</span>
                          <span>{post.replies} replies</span>
                        </div>
                      </button>
                    </div>
                  )
                }
              })}
            </div>

            {/* Today marker */}
            <div className="relative flex gap-4 mt-6">
              <div className="w-9 h-9 rounded-full bg-[#00ba7c] flex items-center justify-center z-10">
                <span className="text-[12px] font-bold text-white">NOW</span>
              </div>
              <div className="flex-1 flex items-center">
                <p className="text-[13px] text-[#00ba7c]">
                  Your journey continues...
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
