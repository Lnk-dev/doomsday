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
export { useBadgesStore, BADGE_DEFINITIONS, getBadge, getBadgesByCategory, getRarityColor, getRarityBgColor } from './badges'
export type { Badge, BadgeRarity, BadgeCategory, EarnedBadge } from './badges'
export { useWalletStore } from './wallet'
