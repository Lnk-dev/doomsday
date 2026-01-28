import { PageHeader } from '@/components/layout/PageHeader'
import { ThreadPost } from '@/components/ui/ThreadPost'
import { Settings, Globe } from 'lucide-react'

const mockUserPosts = [
  {
    id: 1,
    author: { name: 'You', username: 'anonymous_user' },
    content: 'Just joined the doom scroll. Curious to see what everyone is worried about.',
    timestamp: '2d',
    likes: 12,
    replies: 3,
    variant: 'default' as const,
  },
]

export function ProfilePage() {
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
            <h2 className="text-[22px] font-bold text-white">Anonymous</h2>
            <p className="text-[15px] text-[#777]">@anonymous_user</p>
          </div>
          <div className="w-16 h-16 rounded-full bg-[#333]" />
        </div>

        <p className="text-[15px] text-white mt-3">
          Watching the world. Waiting.
        </p>

        <div className="flex items-center gap-4 mt-3 text-[15px] text-[#777]">
          <span>0 followers</span>
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

      {/* Wallet connect banner */}
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

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-px mx-4 mb-4 rounded-2xl overflow-hidden bg-[#333]">
        <div className="bg-black p-3 text-center">
          <p className="text-[18px] font-bold text-[#ff3040]">0</p>
          <p className="text-[11px] text-[#777]">$DOOM</p>
        </div>
        <div className="bg-black p-3 text-center">
          <p className="text-[18px] font-bold text-[#00ba7c]">0</p>
          <p className="text-[11px] text-[#777]">$LIFE</p>
        </div>
        <div className="bg-black p-3 text-center">
          <p className="text-[18px] font-bold text-white">0</p>
          <p className="text-[11px] text-[#777]">Days</p>
        </div>
        <div className="bg-black p-3 text-center">
          <p className="text-[18px] font-bold text-white">0</p>
          <p className="text-[11px] text-[#777]">Bets</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#333]">
        <button className="flex-1 py-3 text-[15px] font-semibold text-white border-b-2 border-white">
          Threads
        </button>
        <button className="flex-1 py-3 text-[15px] font-semibold text-[#777]">
          Replies
        </button>
        <button className="flex-1 py-3 text-[15px] font-semibold text-[#777]">
          Reposts
        </button>
      </div>

      {/* User posts */}
      {mockUserPosts.length > 0 ? (
        <div className="divide-y divide-[#333]">
          {mockUserPosts.map((post) => (
            <ThreadPost
              key={post.id}
              author={post.author}
              content={post.content}
              timestamp={post.timestamp}
              likes={post.likes}
              replies={post.replies}
              variant={post.variant}
            />
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center py-16 px-8">
          <p className="text-[15px] text-[#777] text-center">
            You haven't posted anything yet.
          </p>
        </div>
      )}
    </div>
  )
}
