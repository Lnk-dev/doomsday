import { PageHeader } from '@/components/layout/PageHeader'
import { ThreadPost } from '@/components/ui/ThreadPost'

const mockPosts = [
  {
    id: 1,
    author: { name: 'Doom Prophet', username: 'doomprophet', verified: true },
    content: 'The signs are everywhere. Economic indicators suggest collapse within 6 months. Have you noticed the pattern?',
    timestamp: '2h',
    likes: 243,
    replies: 42,
    variant: 'doom' as const,
  },
  {
    id: 2,
    author: { name: 'Cassandra', username: 'cassandrav2' },
    content: 'AI development is accelerating faster than anyone predicted. The singularity timeline keeps moving closer.\n\nWe are not prepared.',
    timestamp: '4h',
    likes: 892,
    replies: 156,
    variant: 'doom' as const,
  },
  {
    id: 3,
    author: { name: 'Climate Watch', username: 'climatewatch', verified: true },
    content: 'New data from Arctic monitoring stations is concerning. Permafrost thaw is releasing methane at unprecedented rates.',
    timestamp: '6h',
    likes: 1.2,
    replies: 89,
    variant: 'doom' as const,
  },
  {
    id: 4,
    author: { name: 'Anonymous', username: 'anon_4821' },
    content: 'Markets are showing classic signs of systemic stress. The derivatives exposure alone should terrify anyone paying attention.',
    timestamp: '8h',
    likes: 445,
    replies: 67,
    variant: 'doom' as const,
  },
  {
    id: 5,
    author: { name: 'End Times Scholar', username: 'endtimes' },
    content: 'Every civilization thinks it will last forever. None of them did.\n\nWhy do we think we are different?',
    timestamp: '12h',
    likes: 2100,
    replies: 234,
    variant: 'doom' as const,
  },
]

export function DoomScrollPage() {
  return (
    <div className="flex flex-col min-h-full">
      <PageHeader showLogo />

      {/* Feed toggle */}
      <div className="flex border-b border-[#333]">
        <button className="flex-1 py-3 text-[15px] font-semibold text-white border-b-2 border-white">
          For you
        </button>
        <button className="flex-1 py-3 text-[15px] font-semibold text-[#777]">
          Following
        </button>
      </div>

      {/* Posts */}
      <div className="divide-y divide-[#333]">
        {mockPosts.map((post) => (
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
