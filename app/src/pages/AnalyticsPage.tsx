/**
 * AnalyticsPage
 * Issue #57: Add analytics dashboard for users
 *
 * Comprehensive analytics dashboard showing post performance,
 * betting statistics, and token flow analysis.
 */

import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  useUserStore,
  usePostsStore,
  useEventsStore,
} from '@/store'
import { useAnalyticsStore } from '@/store/analytics'
import {
  calculatePostAnalytics,
  calculateBettingAnalytics,
  calculateTokenAnalytics,
  exportAnalyticsToJSON,
  exportAnalyticsToCSV,
  getSourceDisplayName,
  type TimeRange,
} from '@/lib/analytics'
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Coins,
  Target,
  FileText,
  Download,
  ChevronLeft,
  Heart,
  MessageCircle,
  Repeat2,
  Trophy,
  Skull,
  Leaf,
} from 'lucide-react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

type AnalyticsTab = 'overview' | 'posts' | 'betting' | 'tokens'

export function AnalyticsPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview')
  const [showExportMenu, setShowExportMenu] = useState(false)

  // Store data
  const { timeRange, setTimeRange, transactions } = useAnalyticsStore()
  const { author, userId, doomBalance, lifeBalance } = useUserStore()
  const allPosts = usePostsStore((state) => state.posts)
  const bets = useEventsStore((state) => state.bets)
  const events = useEventsStore((state) => state.events)

  // Filter user's posts
  const userPosts = useMemo(
    () =>
      Object.values(allPosts).filter(
        (p) => p.author.username === author.username
      ),
    [allPosts, author.username]
  )

  // Filter user's bets
  const userBets = useMemo(
    () => bets.filter((b) => b.userId === userId),
    [bets, userId]
  )

  // Calculate analytics
  const postAnalytics = useMemo(
    () => calculatePostAnalytics(userPosts, timeRange),
    [userPosts, timeRange]
  )

  const bettingAnalytics = useMemo(
    () => calculateBettingAnalytics(userBets, events, timeRange),
    [userBets, events, timeRange]
  )

  const tokenAnalytics = useMemo(
    () => calculateTokenAnalytics(transactions, doomBalance, lifeBalance, timeRange),
    [transactions, doomBalance, lifeBalance, timeRange]
  )

  const handleExport = (format: 'json' | 'csv') => {
    if (format === 'json') {
      exportAnalyticsToJSON(postAnalytics, bettingAnalytics, tokenAnalytics, timeRange)
    } else {
      exportAnalyticsToCSV(postAnalytics, bettingAnalytics, tokenAnalytics, timeRange)
    }
    setShowExportMenu(false)
  }

  const tabs: { id: AnalyticsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 size={16} /> },
    { id: 'posts', label: 'Posts', icon: <FileText size={16} /> },
    { id: 'betting', label: 'Betting', icon: <Target size={16} /> },
    { id: 'tokens', label: 'Tokens', icon: <Coins size={16} /> },
  ]

  const timeRanges: { id: TimeRange; label: string }[] = [
    { id: '7d', label: '7 days' },
    { id: '30d', label: '30 days' },
    { id: 'all', label: 'All time' },
  ]

  return (
    <div className="flex flex-col min-h-full bg-black">
      <PageHeader
        title="Analytics"
        leftAction={
          <button
            onClick={() => navigate(-1)}
            className="p-1 text-white hover:text-[#777] transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
        }
        rightAction={
          <div className="relative">
            <button
              className="p-1 text-white hover:text-[#777] transition-colors"
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              <Download size={22} />
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-2 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-lg py-1 min-w-[120px] z-50">
                <button
                  onClick={() => handleExport('json')}
                  className="w-full px-4 py-2 text-left text-[14px] text-white hover:bg-[#333] transition-colors"
                >
                  Export JSON
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full px-4 py-2 text-left text-[14px] text-white hover:bg-[#333] transition-colors"
                >
                  Export CSV
                </button>
              </div>
            )}
          </div>
        }
      />

      {/* Time range selector */}
      <div className="flex gap-2 px-4 py-3 border-b border-[#333]">
        {timeRanges.map((range) => (
          <button
            key={range.id}
            onClick={() => setTimeRange(range.id)}
            className={`px-4 py-2 rounded-full text-[13px] font-medium transition-colors ${
              timeRange === range.id
                ? 'bg-white text-black'
                : 'bg-[#1a1a1a] text-[#777] hover:bg-[#222]'
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#333] overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-[14px] font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'text-white border-b-2 border-white'
                : 'text-[#777]'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'overview' && (
          <OverviewTab
            postAnalytics={postAnalytics}
            bettingAnalytics={bettingAnalytics}
            tokenAnalytics={tokenAnalytics}
          />
        )}
        {activeTab === 'posts' && <PostsTab analytics={postAnalytics} />}
        {activeTab === 'betting' && <BettingTab analytics={bettingAnalytics} />}
        {activeTab === 'tokens' && <TokensTab analytics={tokenAnalytics} />}
      </div>

      {/* Click outside to close export menu */}
      {showExportMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowExportMenu(false)}
        />
      )}
    </div>
  )
}

// ============ Tab Components ============

function OverviewTab({
  postAnalytics,
  bettingAnalytics,
  tokenAnalytics,
}: {
  postAnalytics: ReturnType<typeof calculatePostAnalytics>
  bettingAnalytics: ReturnType<typeof calculateBettingAnalytics>
  tokenAnalytics: ReturnType<typeof calculateTokenAnalytics>
}) {
  return (
    <div className="space-y-6">
      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Total Posts"
          value={postAnalytics.totalPosts}
          icon={<FileText size={16} />}
        />
        <StatCard
          label="Total Likes"
          value={postAnalytics.totalLikes}
          icon={<Heart size={16} />}
          color="red"
        />
        <StatCard
          label="Win Rate"
          value={`${bettingAnalytics.winRate}%`}
          icon={<Trophy size={16} />}
          color={bettingAnalytics.winRate >= 50 ? 'green' : 'red'}
        />
        <StatCard
          label="ROI"
          value={`${bettingAnalytics.roi > 0 ? '+' : ''}${bettingAnalytics.roi}%`}
          icon={
            bettingAnalytics.roi >= 0 ? (
              <TrendingUp size={16} />
            ) : (
              <TrendingDown size={16} />
            )
          }
          color={bettingAnalytics.roi >= 0 ? 'green' : 'red'}
        />
      </div>

      {/* Token balances */}
      <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#333]">
        <h3 className="text-[14px] font-semibold text-white mb-3">
          Token Balances
        </h3>
        <div className="flex gap-4">
          <div className="flex-1 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#ff3040]/20 flex items-center justify-center">
              <Skull size={20} className="text-[#ff3040]" />
            </div>
            <div>
              <p className="text-[12px] text-[#777]">$DOOM</p>
              <p className="text-[18px] font-bold text-[#ff3040]">
                {tokenAnalytics.currentDoom}
              </p>
            </div>
          </div>
          <div className="flex-1 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#00ba7c]/20 flex items-center justify-center">
              <Leaf size={20} className="text-[#00ba7c]" />
            </div>
            <div>
              <p className="text-[12px] text-[#777]">$LIFE</p>
              <p className="text-[18px] font-bold text-[#00ba7c]">
                {tokenAnalytics.currentLife}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Posts over time chart */}
      {postAnalytics.postsOverTime.length > 0 && (
        <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#333]">
          <h3 className="text-[14px] font-semibold text-white mb-3">
            Posting Activity
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={postAnalytics.postsOverTime}>
              <XAxis
                dataKey="date"
                tick={{ fill: '#777', fontSize: 10 }}
                tickFormatter={(value) => value.slice(5)}
              />
              <YAxis tick={{ fill: '#777', fontSize: 10 }} width={30} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: 8,
                }}
                labelStyle={{ color: '#fff' }}
              />
              <Area
                type="monotone"
                dataKey="doom"
                stackId="1"
                fill="#ff304040"
                stroke="#ff3040"
                name="Doom"
              />
              <Area
                type="monotone"
                dataKey="life"
                stackId="1"
                fill="#00ba7c40"
                stroke="#00ba7c"
                name="Life"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

function PostsTab({
  analytics,
}: {
  analytics: ReturnType<typeof calculatePostAnalytics>
}) {
  return (
    <div className="space-y-4">
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Doom Posts"
          value={analytics.doomPosts}
          icon={<Skull size={16} />}
          color="red"
        />
        <StatCard
          label="Life Posts"
          value={analytics.lifePosts}
          icon={<Leaf size={16} />}
          color="green"
        />
        <StatCard
          label="Avg Likes"
          value={analytics.avgLikesPerPost}
          icon={<Heart size={16} />}
        />
        <StatCard
          label="Avg Engagement"
          value={analytics.avgEngagementRate}
          icon={<BarChart3 size={16} />}
        />
      </div>

      {/* Engagement breakdown */}
      <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#333]">
        <h3 className="text-[14px] font-semibold text-white mb-3">
          Engagement Breakdown
        </h3>
        <div className="space-y-3">
          <EngagementRow
            icon={<Heart size={14} />}
            label="Likes"
            value={analytics.totalLikes}
            color="#ff3040"
          />
          <EngagementRow
            icon={<MessageCircle size={14} />}
            label="Replies"
            value={analytics.totalReplies}
            color="#1d9bf0"
          />
          <EngagementRow
            icon={<Repeat2 size={14} />}
            label="Reposts"
            value={analytics.totalReposts}
            color="#00ba7c"
          />
        </div>
      </div>

      {/* Top posts */}
      {analytics.topPosts.length > 0 && (
        <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#333]">
          <h3 className="text-[14px] font-semibold text-white mb-3">
            Top Performing Posts
          </h3>
          <div className="space-y-3">
            {analytics.topPosts.slice(0, 5).map((post, index) => (
              <div
                key={post.id}
                className="flex items-start gap-3 pb-3 border-b border-[#222] last:border-0 last:pb-0"
              >
                <span className="text-[12px] text-[#555] font-medium w-5">
                  #{index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-white truncate">
                    {post.content.slice(0, 60)}
                    {post.content.length > 60 ? '...' : ''}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-[#777]">
                    <span className="flex items-center gap-1">
                      <Heart size={10} /> {post.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle size={10} /> {post.replies}
                    </span>
                    <span className="flex items-center gap-1">
                      <Repeat2 size={10} /> {post.reposts}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Posts over time */}
      {analytics.postsOverTime.length > 0 && (
        <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#333]">
          <h3 className="text-[14px] font-semibold text-white mb-3">
            Posts Over Time
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analytics.postsOverTime}>
              <XAxis
                dataKey="date"
                tick={{ fill: '#777', fontSize: 10 }}
                tickFormatter={(value) => value.slice(5)}
              />
              <YAxis tick={{ fill: '#777', fontSize: 10 }} width={30} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: 8,
                }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="doom" fill="#ff3040" name="Doom" />
              <Bar dataKey="life" fill="#00ba7c" name="Life" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

function BettingTab({
  analytics,
}: {
  analytics: ReturnType<typeof calculateBettingAnalytics>
}) {
  const COLORS = ['#ff3040', '#00ba7c', '#ffd700', '#1e90ff', '#ff69b4', '#32cd32']

  const categoryData = Object.entries(analytics.byCategory).map(
    ([name, data]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: data.bets,
      wins: data.wins,
      staked: data.staked,
    })
  )

  return (
    <div className="space-y-4">
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Total Bets"
          value={analytics.totalBets}
          icon={<Target size={16} />}
        />
        <StatCard
          label="Win Rate"
          value={`${analytics.winRate}%`}
          icon={<Trophy size={16} />}
          color={analytics.winRate >= 50 ? 'green' : 'red'}
        />
        <StatCard
          label="Total Staked"
          value={analytics.totalStaked}
          icon={<Coins size={16} />}
        />
        <StatCard
          label="Net P/L"
          value={`${analytics.netProfitLoss > 0 ? '+' : ''}${analytics.netProfitLoss}`}
          icon={
            analytics.netProfitLoss >= 0 ? (
              <TrendingUp size={16} />
            ) : (
              <TrendingDown size={16} />
            )
          }
          color={analytics.netProfitLoss >= 0 ? 'green' : 'red'}
        />
      </div>

      {/* Win/Loss breakdown */}
      <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#333]">
        <h3 className="text-[14px] font-semibold text-white mb-3">
          Win/Loss Record
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-[12px] mb-1">
              <span className="text-[#00ba7c]">Wins: {analytics.wins}</span>
              <span className="text-[#ff3040]">Losses: {analytics.losses}</span>
            </div>
            <div className="h-3 bg-[#333] rounded-full overflow-hidden flex">
              {analytics.resolvedBets > 0 && (
                <>
                  <div
                    className="h-full bg-[#00ba7c]"
                    style={{
                      width: `${(analytics.wins / analytics.resolvedBets) * 100}%`,
                    }}
                  />
                  <div
                    className="h-full bg-[#ff3040]"
                    style={{
                      width: `${(analytics.losses / analytics.resolvedBets) * 100}%`,
                    }}
                  />
                </>
              )}
            </div>
          </div>
        </div>
        <p className="text-[11px] text-[#555] mt-2">
          {analytics.activeBets} active • {analytics.resolvedBets} resolved
        </p>
      </div>

      {/* Side preference */}
      <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#333]">
        <h3 className="text-[14px] font-semibold text-white mb-3">
          Betting Side
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex-1 text-center">
            <div className="w-12 h-12 rounded-full bg-[#ff3040]/20 flex items-center justify-center mx-auto mb-2">
              <Skull size={24} className="text-[#ff3040]" />
            </div>
            <p className="text-[18px] font-bold text-[#ff3040]">
              {analytics.bySide.doom}
            </p>
            <p className="text-[11px] text-[#777]">Doom Bets</p>
          </div>
          <div className="text-[24px] text-[#333]">vs</div>
          <div className="flex-1 text-center">
            <div className="w-12 h-12 rounded-full bg-[#00ba7c]/20 flex items-center justify-center mx-auto mb-2">
              <Leaf size={24} className="text-[#00ba7c]" />
            </div>
            <p className="text-[18px] font-bold text-[#00ba7c]">
              {analytics.bySide.life}
            </p>
            <p className="text-[11px] text-[#777]">Life Bets</p>
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      {categoryData.length > 0 && (
        <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#333]">
          <h3 className="text-[14px] font-semibold text-white mb-3">
            Bets by Category
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
                labelLine={false}
              >
                {categoryData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: 8,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Betting over time */}
      {analytics.betsOverTime.length > 0 && (
        <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#333]">
          <h3 className="text-[14px] font-semibold text-white mb-3">
            Betting Activity
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={analytics.betsOverTime}>
              <XAxis
                dataKey="date"
                tick={{ fill: '#777', fontSize: 10 }}
                tickFormatter={(value) => value.slice(5)}
              />
              <YAxis tick={{ fill: '#777', fontSize: 10 }} width={30} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: 8,
                }}
                labelStyle={{ color: '#fff' }}
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#ffd700"
                strokeWidth={2}
                dot={false}
                name="Amount"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

function TokensTab({
  analytics,
}: {
  analytics: ReturnType<typeof calculateTokenAnalytics>
}) {
  const sourceData = Object.entries(analytics.bySource).map(([source, data]) => ({
    name: getSourceDisplayName(source as any),
    earned: data.earned,
    spent: data.spent,
  }))

  return (
    <div className="space-y-4">
      {/* Current balances */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="$DOOM Balance"
          value={analytics.currentDoom}
          icon={<Skull size={16} />}
          color="red"
        />
        <StatCard
          label="$LIFE Balance"
          value={analytics.currentLife}
          icon={<Leaf size={16} />}
          color="green"
        />
      </div>

      {/* Net flow */}
      <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#333]">
        <h3 className="text-[14px] font-semibold text-white mb-3">
          Net Token Flow
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[11px] text-[#777] mb-1">$DOOM</p>
            <p
              className={`text-[20px] font-bold ${
                analytics.netFlow.doom >= 0 ? 'text-[#00ba7c]' : 'text-[#ff3040]'
              }`}
            >
              {analytics.netFlow.doom > 0 ? '+' : ''}
              {analytics.netFlow.doom}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-[#777] mb-1">$LIFE</p>
            <p
              className={`text-[20px] font-bold ${
                analytics.netFlow.life >= 0 ? 'text-[#00ba7c]' : 'text-[#ff3040]'
              }`}
            >
              {analytics.netFlow.life > 0 ? '+' : ''}
              {analytics.netFlow.life}
            </p>
          </div>
        </div>
      </div>

      {/* Earned vs Spent */}
      <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#333]">
        <h3 className="text-[14px] font-semibold text-white mb-3">
          Earned vs Spent
        </h3>
        <div className="space-y-4">
          <div>
            <p className="text-[12px] text-[#777] mb-2">$DOOM</p>
            <div className="flex gap-4">
              <div className="flex-1">
                <p className="text-[11px] text-[#00ba7c]">Earned</p>
                <p className="text-[16px] font-semibold text-white">
                  +{analytics.totalEarned.doom}
                </p>
              </div>
              <div className="flex-1">
                <p className="text-[11px] text-[#ff3040]">Spent</p>
                <p className="text-[16px] font-semibold text-white">
                  -{analytics.totalSpent.doom}
                </p>
              </div>
            </div>
          </div>
          <div>
            <p className="text-[12px] text-[#777] mb-2">$LIFE</p>
            <div className="flex gap-4">
              <div className="flex-1">
                <p className="text-[11px] text-[#00ba7c]">Earned</p>
                <p className="text-[16px] font-semibold text-white">
                  +{analytics.totalEarned.life}
                </p>
              </div>
              <div className="flex-1">
                <p className="text-[11px] text-[#ff3040]">Spent</p>
                <p className="text-[16px] font-semibold text-white">
                  -{analytics.totalSpent.life}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* By source breakdown */}
      {sourceData.length > 0 && (
        <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#333]">
          <h3 className="text-[14px] font-semibold text-white mb-3">
            By Source
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={sourceData} layout="vertical">
              <XAxis type="number" tick={{ fill: '#777', fontSize: 10 }} />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fill: '#777', fontSize: 10 }}
                width={100}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: 8,
                }}
              />
              <Legend />
              <Bar dataKey="earned" fill="#00ba7c" name="Earned" />
              <Bar dataKey="spent" fill="#ff3040" name="Spent" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Balance over time */}
      {analytics.balanceOverTime.length > 0 && (
        <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#333]">
          <h3 className="text-[14px] font-semibold text-white mb-3">
            Balance History
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={analytics.balanceOverTime}>
              <XAxis
                dataKey="date"
                tick={{ fill: '#777', fontSize: 10 }}
                tickFormatter={(value) => value.slice(5)}
              />
              <YAxis tick={{ fill: '#777', fontSize: 10 }} width={40} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: 8,
                }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="doom"
                stroke="#ff3040"
                strokeWidth={2}
                dot={false}
                name="$DOOM"
              />
              <Line
                type="monotone"
                dataKey="life"
                stroke="#00ba7c"
                strokeWidth={2}
                dot={false}
                name="$LIFE"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

// ============ Helper Components ============

function StatCard({
  label,
  value,
  icon,
  color = 'white',
}: {
  label: string
  value: string | number
  icon?: React.ReactNode
  color?: 'white' | 'red' | 'green'
}) {
  const colorClasses = {
    white: 'text-white',
    red: 'text-[#ff3040]',
    green: 'text-[#00ba7c]',
  }

  return (
    <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#333]">
      <div className="flex items-center gap-2 mb-1">
        {icon && <span className="text-[#555]">{icon}</span>}
        <p className="text-[12px] text-[#777]">{label}</p>
      </div>
      <p className={`text-[24px] font-bold ${colorClasses[color]}`}>{value}</p>
    </div>
  )
}

function EngagementRow({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: string
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="flex-1">
        <p className="text-[13px] text-white">{label}</p>
      </div>
      <p className="text-[16px] font-semibold text-white">{value}</p>
    </div>
  )
}
