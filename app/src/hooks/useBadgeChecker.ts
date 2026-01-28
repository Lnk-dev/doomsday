/**
 * Badge Checker Hook
 * Provides functions to check and award badges
 */

import { useBadgesStore } from '@/store/badges'
import { usePostsStore } from '@/store/posts'
import { useUserStore } from '@/store/user'

export function useBadgeChecker() {
  const checkPostingBadges = useBadgesStore((state) => state.checkPostingBadges)
  const checkEngagementBadges = useBadgesStore((state) => state.checkEngagementBadges)
  const checkStreakBadges = useBadgesStore((state) => state.checkStreakBadges)
  const checkBettingBadges = useBadgesStore((state) => state.checkBettingBadges)
  
  const posts = usePostsStore((state) => state.posts)
  const author = useUserStore((state) => state.author)

  const checkAfterPost = () => {
    const userPosts = Object.values(posts).filter(p => p.author.username === author.username)
    const lifePosts = userPosts.filter(p => p.variant === 'life')
    checkPostingBadges(userPosts.length, lifePosts.length)
  }

  const checkAfterLikeReceived = (totalLikes: number) => {
    checkEngagementBadges(totalLikes)
  }

  const checkAfterBet = (betCount: number, winStreak: number, highestBet: number) => {
    checkBettingBadges(betCount, winStreak, highestBet)
  }

  const checkAfterStreak = (currentStreak: number) => {
    checkStreakBadges(currentStreak)
  }

  return {
    checkAfterPost,
    checkAfterLikeReceived,
    checkAfterBet,
    checkAfterStreak,
  }
}
