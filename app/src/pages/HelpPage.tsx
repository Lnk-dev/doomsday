/**
 * HelpPage
 *
 * Help center with searchable FAQ, categories, and contact options.
 */

import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Search,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  MessageCircle,
  Mail,
  BookOpen,
  Wallet,
  Shield,
  Bell,
  Users,
  TrendingUp,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'

// FAQ Categories
const FAQ_CATEGORIES = [
  { id: 'getting-started', label: 'Getting Started', icon: BookOpen },
  { id: 'wallet', label: 'Wallet & Tokens', icon: Wallet },
  { id: 'predictions', label: 'Predictions', icon: TrendingUp },
  { id: 'social', label: 'Social Features', icon: Users },
  { id: 'privacy', label: 'Privacy & Security', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
] as const

type FAQCategory = (typeof FAQ_CATEGORIES)[number]['id']

interface FAQItem {
  id: string
  question: string
  answer: string
  category: FAQCategory
  popular?: boolean
}

const FAQ_ITEMS: FAQItem[] = [
  // Getting Started
  {
    id: 'what-is-doomsday',
    question: 'What is Doomsday?',
    answer: 'Doomsday is a social prediction market platform where you can stake tokens on world events, share your thoughts, and compete on leaderboards. Use $DOOM tokens for pessimistic predictions and $LIFE tokens for optimistic ones.',
    category: 'getting-started',
    popular: true,
  },
  {
    id: 'how-to-start',
    question: 'How do I get started?',
    answer: 'Simply browse the app to explore predictions and posts. To participate in predictions, connect your wallet from the Profile page. You can also post and engage with content anonymously.',
    category: 'getting-started',
    popular: true,
  },
  {
    id: 'do-i-need-wallet',
    question: 'Do I need a wallet to use Doomsday?',
    answer: 'No! You can browse posts, events, and leaderboards without connecting a wallet. However, to stake tokens on predictions or track your portfolio, you\'ll need to connect a compatible wallet.',
    category: 'getting-started',
  },
  // Wallet & Tokens
  {
    id: 'what-is-doom',
    question: 'What are $DOOM tokens?',
    answer: '$DOOM tokens are used to stake on pessimistic predictions - outcomes where things go wrong or fail. When you stake $DOOM and the pessimistic outcome occurs, you win rewards.',
    category: 'wallet',
    popular: true,
  },
  {
    id: 'what-is-life',
    question: 'What are $LIFE tokens?',
    answer: '$LIFE tokens are used to stake on optimistic predictions - positive outcomes. Stake $LIFE when you believe things will go well, and earn rewards if the optimistic outcome happens.',
    category: 'wallet',
  },
  {
    id: 'how-to-connect-wallet',
    question: 'How do I connect my wallet?',
    answer: 'Go to the Profile page and tap "Connect Wallet". We support Phantom, Solflare, and other Solana-compatible wallets. Follow the prompts to approve the connection.',
    category: 'wallet',
  },
  {
    id: 'token-value',
    question: 'Do $DOOM and $LIFE have real monetary value?',
    answer: '$DOOM and $LIFE tokens are for entertainment purposes within the Doomsday platform. Their value is determined by platform activity. Please read our Terms of Service for full details.',
    category: 'wallet',
  },
  // Predictions
  {
    id: 'how-predictions-work',
    question: 'How do predictions work?',
    answer: 'Browse events on the Events page, choose an outcome (DOOM or LIFE), and stake your tokens. When the event resolves, correct predictions earn rewards from the losing pool.',
    category: 'predictions',
    popular: true,
  },
  {
    id: 'how-events-resolve',
    question: 'How are events resolved?',
    answer: 'Events are resolved based on verifiable real-world outcomes. Our oracle system tracks events and determines winners. Resolution typically happens within 24-48 hours of the event conclusion.',
    category: 'predictions',
  },
  {
    id: 'can-i-cancel-prediction',
    question: 'Can I cancel a prediction?',
    answer: 'Once a prediction is placed and confirmed on the blockchain, it cannot be cancelled. Make sure you\'re confident in your stake before confirming.',
    category: 'predictions',
  },
  // Social Features
  {
    id: 'how-to-post',
    question: 'How do I create a post?',
    answer: 'Tap the + button in the navigation bar to open the compose screen. Write your thoughts, add hashtags, and post! Your post will appear in the main feed.',
    category: 'social',
  },
  {
    id: 'what-is-doom-scroll',
    question: 'What is Doom Scroll?',
    answer: 'Doom Scroll is the main feed showing posts from users across the platform. You can switch between "Hot" (trending), "New" (recent), and "Following" (people you follow) tabs.',
    category: 'social',
  },
  {
    id: 'how-to-follow',
    question: 'How do I follow other users?',
    answer: 'Visit a user\'s profile by tapping their username or avatar, then tap the "Follow" button. Their posts will appear in your Following feed.',
    category: 'social',
  },
  // Privacy & Security
  {
    id: 'is-data-private',
    question: 'Is my data private?',
    answer: 'We take privacy seriously. Your wallet activity is public on the blockchain, but personal browsing data is not shared. Read our Privacy Policy for full details on data handling.',
    category: 'privacy',
  },
  {
    id: 'how-to-block',
    question: 'How do I block or mute users?',
    answer: 'On a user\'s profile, tap the menu icon (...) and select "Block" or "Mute". Blocked users can\'t see your content. Muted users won\'t appear in your feed.',
    category: 'privacy',
  },
  {
    id: 'report-content',
    question: 'How do I report inappropriate content?',
    answer: 'Tap the menu icon (...) on any post and select "Report". Choose the reason for reporting and submit. Our moderation team reviews all reports.',
    category: 'privacy',
  },
  // Notifications
  {
    id: 'notification-settings',
    question: 'How do I manage notifications?',
    answer: 'Go to Settings > Notifications to customize what notifications you receive. You can toggle push notifications, sound alerts, and more.',
    category: 'notifications',
  },
  {
    id: 'why-no-notifications',
    question: 'Why am I not receiving notifications?',
    answer: 'Check that notifications are enabled in Settings and in your device\'s system settings. Make sure you haven\'t muted the app.',
    category: 'notifications',
  },
]

function FAQItemComponent({ item, isExpanded, onToggle }: {
  item: FAQItem
  isExpanded: boolean
  onToggle: () => void
}) {
  const [feedback, setFeedback] = useState<'helpful' | 'not-helpful' | null>(null)

  return (
    <div className="border-b border-[#222] last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-[#111] transition-colors"
      >
        <span className="text-[15px] text-white pr-4">{item.question}</span>
        {isExpanded ? (
          <ChevronUp size={20} className="text-[#777] flex-shrink-0" />
        ) : (
          <ChevronDown size={20} className="text-[#777] flex-shrink-0" />
        )}
      </button>
      {isExpanded && (
        <div className="px-4 pb-4">
          <p className="text-[14px] text-[#aaa] leading-relaxed mb-4">
            {item.answer}
          </p>
          {feedback === null ? (
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-[#555]">Was this helpful?</span>
              <button
                onClick={() => setFeedback('helpful')}
                className="p-1.5 text-[#555] hover:text-[#00ba7c] hover:bg-[#00ba7c]/10 rounded-lg transition-colors"
              >
                <ThumbsUp size={16} />
              </button>
              <button
                onClick={() => setFeedback('not-helpful')}
                className="p-1.5 text-[#555] hover:text-[#ff3040] hover:bg-[#ff3040]/10 rounded-lg transition-colors"
              >
                <ThumbsDown size={16} />
              </button>
            </div>
          ) : (
            <p className="text-[12px] text-[#00ba7c]">
              Thanks for your feedback!
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export function HelpPage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<FAQCategory | 'all'>('all')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const filteredFAQs = useMemo(() => {
    let items = FAQ_ITEMS

    // Filter by category
    if (selectedCategory !== 'all') {
      items = items.filter((item) => item.category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      items = items.filter(
        (item) =>
          item.question.toLowerCase().includes(query) ||
          item.answer.toLowerCase().includes(query)
      )
    }

    return items
  }, [searchQuery, selectedCategory])

  const popularFAQs = FAQ_ITEMS.filter((item) => item.popular)

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="flex flex-col min-h-full bg-black pb-20">
      <PageHeader
        title="Help Center"
        leftAction={
          <button onClick={() => navigate(-1)} className="p-1">
            <ArrowLeft size={24} className="text-white" />
          </button>
        }
        rightAction={<HelpCircle size={20} className="text-[#777]" />}
      />

      {/* Search */}
      <div className="px-4 py-4 border-b border-[#333]">
        <div className="relative">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for help..."
            className="w-full pl-10 pr-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-xl text-white placeholder-[#777] focus:border-[#ff3040] focus:outline-none"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-4 border-b border-[#222]">
        <div className="grid grid-cols-2 gap-3">
          <a
            href="mailto:support@doomsday.app"
            className="flex items-center gap-3 p-4 bg-[#111] rounded-xl border border-[#222] hover:border-[#333] transition-colors"
          >
            <div className="w-10 h-10 bg-[#ff3040]/10 rounded-full flex items-center justify-center">
              <Mail size={20} className="text-[#ff3040]" />
            </div>
            <div>
              <p className="text-[14px] font-medium text-white">Email Us</p>
              <p className="text-[12px] text-[#777]">Get in touch</p>
            </div>
          </a>
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-3 p-4 bg-[#111] rounded-xl border border-[#222] hover:border-[#333] transition-colors text-left"
          >
            <div className="w-10 h-10 bg-[#00ba7c]/10 rounded-full flex items-center justify-center">
              <MessageCircle size={20} className="text-[#00ba7c]" />
            </div>
            <div>
              <p className="text-[14px] font-medium text-white">Feedback</p>
              <p className="text-[12px] text-[#777]">Share ideas</p>
            </div>
          </button>
        </div>
      </div>

      {/* Popular Questions (when no search) */}
      {!searchQuery && selectedCategory === 'all' && (
        <div className="px-4 py-4 border-b border-[#222]">
          <h2 className="text-[13px] font-semibold text-[#777] mb-3">POPULAR QUESTIONS</h2>
          <div className="space-y-2">
            {popularFAQs.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setExpandedIds(new Set([item.id]))
                  // Scroll to the item
                }}
                className="w-full text-left px-3 py-2 bg-[#111] rounded-lg text-[14px] text-white hover:bg-[#1a1a1a] transition-colors"
              >
                {item.question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="px-4 py-3 border-b border-[#222] overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full text-[13px] font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-[#ff3040] text-white'
                : 'bg-[#1a1a1a] text-[#777] hover:bg-[#222]'
            }`}
          >
            All
          </button>
          {FAQ_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-[#ff3040] text-white'
                  : 'bg-[#1a1a1a] text-[#777] hover:bg-[#222]'
              }`}
            >
              <cat.icon size={14} />
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ List */}
      <div className="flex-1">
        {filteredFAQs.length > 0 ? (
          <div className="divide-y divide-[#222]">
            {filteredFAQs.map((item) => (
              <FAQItemComponent
                key={item.id}
                item={item}
                isExpanded={expandedIds.has(item.id)}
                onToggle={() => toggleExpanded(item.id)}
              />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <HelpCircle size={48} className="mx-auto text-[#333] mb-4" />
            <p className="text-[15px] text-[#777] mb-2">No results found</p>
            <p className="text-[13px] text-[#555]">
              Try different keywords or{' '}
              <a href="mailto:support@doomsday.app" className="text-[#ff3040]">
                contact support
              </a>
            </p>
          </div>
        )}
      </div>

      {/* Footer Links */}
      <div className="px-4 py-6 border-t border-[#222]">
        <div className="flex flex-wrap justify-center gap-4 text-[13px]">
          <button
            onClick={() => navigate('/terms')}
            className="flex items-center gap-1 text-[#777] hover:text-white transition-colors"
          >
            Terms of Service
            <ExternalLink size={12} />
          </button>
          <button
            onClick={() => navigate('/privacy')}
            className="flex items-center gap-1 text-[#777] hover:text-white transition-colors"
          >
            Privacy Policy
            <ExternalLink size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}
