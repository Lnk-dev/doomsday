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
import { ProfileShareModal } from '@/components/ui/ProfileShareModal'
import { Settings, Globe, TrendingUp, Clock, AlertTriangle, Sparkles, Heart, ChevronRight } from 'lucide-react'
import { useUserStore, usePostsStore, useEventsStore } from '@/store'
import { formatRelativeTime, formatCountdown, formatNumber } from '@/lib/utils'
import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

type ProfileTab = 'threads' | 'bets' | 'replies'

export function ProfilePage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<ProfileTab>('threads')
  const [showShareModal, setShowShareModal] = useState(false)

  // User store
  const author = useUserStore((state) => state.author)
  const doomBalance = useUserStore((state) => state.doomBalance)
  const lifeBalance = useUserStore((state) => state.lifeBalance)
  const daysLiving = useUserStore((state) => state.daysLiving)
  const lifePostsCount = useUserStore((state) => state.lifePosts)
  const isConnected = useUserStore((state) => state.isConnected)
  const userId = useUserStore((state) => state.userId)

  // Get raw data (stable references)
  const allPosts = usePostsStore((state) => state.posts)
  const bets = useEventsStore((state) => state.bets)
  const events = useEventsStore((state) => state.events)

  // Compute user's posts
  const userPosts = useMemo(() => {
    return Object.values(allPosts)
      .filter((post) => post.author.username === author.username)
      .sort((a, b) => b.createdAt - a.createdAt)
  }, [allPosts, author.username])

  // Compute user's bets
  const userBets = useMemo(() => {
    return bets.filter((bet) => bet.userId === userId)
  }, [bets, userId])

  // Get event by ID (stable callback)
  const getEvent = useCallback((eventId: string) => {
    return events[eventId]
  }, [events])

  const tabs: { id: ProfileTab; label: string }[] = [
    { id: 'threads', label: 'Threads' },
    { id: 'bets', label: `Bets (${userBets.length})` },
    { id: 'replies', label: 'Replies' },
  ]

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="Profile"
        rightAction={
          <button className="p-1" onClick={() => navigate('/settings')}>
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
          <button
            onClick={() => setShowShareModal(true)}
            className="flex-1 py-2 rounded-xl border border-[#333] text-[15px] font-semibold text-white hover:bg-[#111] transition-colors"
          >
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
          <p className="text-[18px] font-bold text-white">{lifePostsCount}</p>
          <p className="text-[11px] text-[#777]">Life Posts</p>
        </div>
      </div>

      {/* Life Timeline button */}
      <button
        onClick={() => navigate('/timeline')}
        className="mx-4 mb-4 flex items-center gap-3 p-3 rounded-xl bg-[#00ba7c10] border border-[#00ba7c30] hover:bg-[#00ba7c20] transition-colors"
      >
        <div className="w-10 h-10 rounded-full bg-[#00ba7c20] flex items-center justify-center">
          <Heart size={20} className="text-[#00ba7c]" fill="#00ba7c" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-[14px] font-semibold text-white">Life Timeline</p>
          <p className="text-[12px] text-[#00ba7c]">{daysLiving} days living</p>
        </div>
        <ChevronRight size={20} className="text-[#00ba7c]" />
      </button>

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

      {/* Tab content */}
      {activeTab === 'threads' && (
        userPosts.length > 0 ? (
          <div className="divide-y divide-[#333]">
            {userPosts.map((post) => (
              <ThreadPost
                key={post.id}
                postId={post.id}
                author={post.author}
                content={post.content}
                timestamp={formatRelativeTime(post.createdAt)}
                likes={post.likes}
                replies={post.replies}
                variant={post.variant}
                isLiked={post.likedBy.includes(userId)}
                onClick={() => navigate(`/post/${post.id}`)}
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
        )
      )}

      {activeTab === 'bets' && (
        userBets.length > 0 ? (
          <div className="divide-y divide-[#333]">
            {userBets.map((bet) => {
              const event = getEvent(bet.eventId)
              if (!event) return null

              const totalStake = event.doomStake + event.lifeStake
              const myStakePool = bet.side === 'doom' ? event.doomStake : event.lifeStake
              const potentialWin = myStakePool > 0
                ? (bet.amount / myStakePool) * totalStake
                : bet.amount * 2

              return (
                <button
                  key={bet.id}
                  onClick={() => navigate(`/events/${event.id}`)}
                  className="w-full p-4 hover:bg-[#111] transition-colors text-left"
                >
                  <div className="flex items-start gap-3">
                    {/* Side indicator */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        bet.side === 'doom' ? 'bg-[#ff304020]' : 'bg-[#00ba7c20]'
                      }`}
                    >
                      {bet.side === 'doom' ? (
                        <AlertTriangle size={18} className="text-[#ff3040]" />
                      ) : (
                        <Sparkles size={18} className="text-[#00ba7c]" />
                      )}
                    </div>

                    {/* Event info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            bet.side === 'doom'
                              ? 'bg-[#ff304030] text-[#ff3040]'
                              : 'bg-[#00ba7c30] text-[#00ba7c]'
                          }`}
                        >
                          {bet.side.toUpperCase()}
                        </span>
                        <span className="text-[11px] text-[#555]">
                          {formatRelativeTime(bet.createdAt)}
                        </span>
                      </div>
                      <h4 className="text-[14px] font-semibold text-white truncate">
                        {event.title}
                      </h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[12px] text-[#777] flex items-center gap-1">
                          <Clock size={10} />
                          {formatCountdown(event.countdownEnd)}
                        </span>
                      </div>
                    </div>

                    {/* Bet stats */}
                    <div className="text-right">
                      <p className="text-[14px] font-bold text-white">
                        {formatNumber(bet.amount)}
                      </p>
                      <p className="text-[11px] text-[#777]">staked</p>
                      <div className="flex items-center gap-1 mt-1 justify-end text-[#00ba7c]">
                        <TrendingUp size={10} />
                        <span className="text-[11px] font-medium">
                          {formatNumber(Math.floor(potentialWin))}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-16 px-8">
            <AlertTriangle size={48} className="text-[#333] mb-4" />
            <p className="text-[15px] text-[#777] text-center">
              No active bets yet.
            </p>
            <button
              onClick={() => navigate('/events')}
              className="mt-4 px-6 py-2 rounded-xl bg-[#ff3040] text-white text-[14px] font-semibold"
            >
              Browse Events
            </button>
          </div>
        )
      )}

      {activeTab === 'replies' && (
        <div className="flex-1 flex flex-col items-center justify-center py-16 px-8">
          <p className="text-[15px] text-[#777] text-center">
            No replies yet.
          </p>
        </div>
      )}

      {/* Profile share modal */}
      {showShareModal && (
        <ProfileShareModal
          profile={author}
          stats={{
            doomBalance,
            lifeBalance,
            daysLiving,
            postsCount: userPosts.length,
          }}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  )
}
