/**
 * Store exports
 *
 * Central export point for all Zustand stores.
 */

export { usePostsStore } from './posts'
export { useUserStore } from './user'
export { useEventsStore } from './events'
export { useLeaderboardStore } from './leaderboard'
export { useTrendingStore } from './trending'
export { useToastStore, toast } from './toast'
export type { Toast, ToastType, ToastOptions } from './toast'
export {
  useBadgesStore,
  BADGE_DEFINITIONS,
  getBadge,
  getBadgesByCategory,
  getRarityColor,
  getRarityBgColor,
} from './badges'
export type { Badge, BadgeRarity, BadgeCategory, EarnedBadge } from './badges'
export { useWalletStore, shortenAddress, getWalletDisplayName } from './wallet'
export type { WalletInfo, ConnectionHistoryEntry } from './wallet'
export {
  useTransactionStore,
  useRecentTransactions,
  usePendingTransactionCount,
} from './transactions'
export type { TrackedTransaction } from './transactions'
export { useThemeStore } from './theme'
export { useCommentsStore } from './comments'
export type { Comment } from './comments'
export { useBookmarksStore } from './bookmarks'
export type { Bookmark, BookmarkCollection } from './bookmarks'
export { useLoadingStore } from './loading'
export { useSearchStore } from './search'
export { useStreaksStore, STREAK_MILESTONES } from './streaks'
