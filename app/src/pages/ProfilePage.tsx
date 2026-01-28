/**
 * ProfilePage
 *
 * User profile displaying stats, balances, and post history.
 * Features:
 * - Token balances ($DOOM, $LIFE)
 * - Days living counter
 * - User's posts
 * - Wallet connection CTA
 */

import { PageHeader } from '@/components/layout/PageHeader'
import { ThreadPost } from '@/components/ui/ThreadPost'
import { Settings, Globe } from 'lucide-react'
import { useUserStore, usePostsStore } from '@/store'
import { formatRelativeTime } from '@/lib/utils'
import { useState } from 'react'

type ProfileTab = 'threads' | 'replies' | 'reposts'

export function ProfilePage() {
  const [activeTab, setActiveTab] = useState<ProfileTab>('threads')

  // User store
  const author = useUserStore((state) => state.author)
  const doomBalance = useUserStore((state) => state.doomBalance)
  const lifeBalance = useUserStore((state) => state.lifeBalance)
  const daysLiving = useUserStore((state) => state.daysLiving)
  const lifePosts = useUserStore((state) => state.lifePosts)
  const isConnected = useUserStore((state) => state.isConnected)
  const userId = useUserStore((state) => state.userId)

  // Get user's posts
  const allPosts = usePostsStore((state) => state.posts)
  const userPosts = Object.values(allPosts).filter(
    (post) => post.author.username === author.username
  ).sort((a, b) => b.createdAt - a.createdAt)

  const tabs: { id: ProfileTab; label: string }[] = [
    { id: 'threads', label: 'Threads' },
    { id: 'replies', label: 'Replies' },
    { id: 'reposts', label: 'Reposts' },
  ]

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="Profile"
        rightAction={
          <button className="p-1">
            <Settings size={24} className="text-white" />
          </button>
        }
      />

      {/* Profile header */}
      <div className="px-4 py-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-[22px] font-bold text-white capitalize">
              {author.username.replace('_', ' ')}
            </h2>
            <p className="text-[15px] text-[#777]">@{author.username}</p>
          </div>
          <div className="w-16 h-16 rounded-full bg-[#333]" />
        </div>

        <p className="text-[15px] text-white mt-3">
          Watching the world. Waiting.
        </p>

        <div className="flex items-center gap-4 mt-3 text-[15px] text-[#777]">
          <span>0 followers</span>
          <span>·</span>
          <span>{userPosts.length} posts</span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-4">
          <button className="flex-1 py-2 rounded-xl border border-[#333] text-[15px] font-semibold text-white hover:bg-[#111] transition-colors">
            Edit profile
          </button>
          <button className="flex-1 py-2 rounded-xl border border-[#333] text-[15px] font-semibold text-white hover:bg-[#111] transition-colors">
            Share profile
          </button>
        </div>
      </div>

      {/* Wallet connect banner (show only if not connected) */}
      {!isConnected && (
        <div className="mx-4 mb-4 p-4 rounded-2xl bg-[#1a1a1a] border border-[#333]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#333] flex items-center justify-center">
              <Globe size={20} className="text-[#777]" />
            </div>
            <div className="flex-1">
              <p className="text-[15px] font-semibold text-white">Connect wallet</p>
              <p className="text-[13px] text-[#777]">Save progress & earn tokens</p>
            </div>
            <button className="px-4 py-2 rounded-xl bg-white text-black text-[14px] font-semibold">
              Connect
            </button>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-px mx-4 mb-4 rounded-2xl overflow-hidden bg-[#333]">
        <div className="bg-black p-3 text-center">
          <p className="text-[18px] font-bold text-[#ff3040]">{doomBalance}</p>
          <p className="text-[11px] text-[#777]">$DOOM</p>
        </div>
        <div className="bg-black p-3 text-center">
          <p className="text-[18px] font-bold text-[#00ba7c]">{lifeBalance}</p>
          <p className="text-[11px] text-[#777]">$LIFE</p>
        </div>
        <div className="bg-black p-3 text-center">
          <p className="text-[18px] font-bold text-white">{daysLiving}</p>
          <p className="text-[11px] text-[#777]">Days</p>
        </div>
        <div className="bg-black p-3 text-center">
          <p className="text-[18px] font-bold text-white">{lifePosts}</p>
          <p className="text-[11px] text-[#777]">Life Posts</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#333]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 text-[15px] font-semibold transition-colors ${
              activeTab === tab.id
                ? 'text-white border-b-2 border-white'
                : 'text-[#777]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* User posts */}
      {userPosts.length > 0 ? (
        <div className="divide-y divide-[#333]">
          {userPosts.map((post) => (
            <ThreadPost
              key={post.id}
              author={post.author}
              content={post.content}
              timestamp={formatRelativeTime(post.createdAt)}
              likes={post.likes}
              replies={post.replies}
              variant={post.variant}
              isLiked={post.likedBy.includes(userId)}
            />
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center py-16 px-8">
          <p className="text-[15px] text-[#777] text-center">
            You haven't posted anything yet.
          </p>
          <p className="text-[13px] text-[#555] text-center mt-1">
            Your posts will appear here.
          </p>
        </div>
      )}
    </div>
  )
}
