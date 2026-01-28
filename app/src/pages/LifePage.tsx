import { PageHeader } from '@/components/layout/PageHeader'
import { ThreadPost } from '@/components/ui/ThreadPost'
import { Heart } from 'lucide-react'

const mockLifePosts = [
  {
    id: 1,
    author: { name: 'Life Liver', username: 'lifeliver', verified: true },
    content: 'Today I planted a garden. Small acts of creation against the void.\n\nEvery seed is a bet on tomorrow.',
    timestamp: '1h',
    likes: 128,
    replies: 23,
    variant: 'life' as const,
  },
  {
    id: 2,
    author: { name: 'Sunrise Watcher', username: 'sunrisewatcher' },
    content: 'Watched the sunrise this morning. Still happening. Still beautiful.\n\nDay 847 of choosing to live.',
    timestamp: '3h',
    likes: 445,
    replies: 34,
    variant: 'life' as const,
  },
  {
    id: 3,
    author: { name: 'Present Moment', username: 'presentmoment', verified: true },
    content: 'The doomers want you to forget that every moment of joy is a rebellion.\n\nLive anyway.',
    timestamp: '5h',
    likes: 1892,
    replies: 156,
    variant: 'life' as const,
  },
  {
    id: 4,
    author: { name: 'Builder', username: 'builder_anon' },
    content: 'Started learning to play piano at 45. Why? Because there might be a tomorrow.\n\nAnd if there isn\'t, at least I tried something new today.',
    timestamp: '8h',
    likes: 2341,
    replies: 189,
    variant: 'life' as const,
  },
]

export function LifePage() {
  return (
    <div className="flex flex-col min-h-full">
      <PageHeader title="Activity" />

      {/* Activity tabs */}
      <div className="flex border-b border-[#333] overflow-x-auto">
        <button className="flex-1 min-w-fit px-4 py-3 text-[15px] font-semibold text-white border-b-2 border-white whitespace-nowrap">
          All
        </button>
        <button className="flex-1 min-w-fit px-4 py-3 text-[15px] font-semibold text-[#777] whitespace-nowrap">
          Follows
        </button>
        <button className="flex-1 min-w-fit px-4 py-3 text-[15px] font-semibold text-[#777] whitespace-nowrap">
          Replies
        </button>
        <button className="flex-1 min-w-fit px-4 py-3 text-[15px] font-semibold text-[#777] whitespace-nowrap">
          Mentions
        </button>
      </div>

      {/* Life cost banner */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#333] bg-[#0a1f0a]">
        <Heart size={18} className="text-[#00ba7c]" fill="#00ba7c" />
        <p className="text-[14px] text-[#00ba7c]">
          Your next life post costs <span className="font-bold">5 $DOOM</span>
        </p>
      </div>

      {/* Posts */}
      <div className="divide-y divide-[#333]">
        {mockLifePosts.map((post) => (
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
    </div>
  )
}
