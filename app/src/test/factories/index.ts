/**
 * Test Factories - Central export for all factory functions
 */

export { createMockUser, createMockUsers, createMockAuthor, createMockAuthors, createMockUsername, createMockWalletAddress, type CreateMockUserOptions, type CreateMockAuthorOptions } from './user.factory'
export { createMockPost, createMockPosts, createMockDoomPost, createMockLifePost, createMockRepost, createMockQuoteRepost, createMockFeed, type CreateMockPostOptions } from './post.factory'
export { createMockEvent, createMockEvents, createMockActiveEvent, createMockOccurredEvent, createMockExpiredEvent, createMockEventsByCategory, type CreateMockEventOptions } from './event.factory'
export { createMockBet, createMockBets, createMockDoomBet, createMockLifeBet, createMockBetsForEvent, createMockBetsForUser, createMockBalancedBets, type CreateMockBetOptions } from './bet.factory'
export { createMockComment, createMockComments, createMockPendingComment, createMockFailedComment, createMockCommentsForPost, createMockCommentThread, type CreateMockCommentOptions } from './comment.factory'
export { createMockBadge, createMockBadges, createMockEarnedBadge, createMockEarnedBadges, createMockBadgeWithRarity, createMockBadgeWithCategory, createMockBadgeSet, createMockEarnedBadgesWithDefinitions, type CreateMockBadgeOptions, type CreateMockEarnedBadgeOptions } from './badge.factory'
