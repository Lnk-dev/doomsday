/**
 * Search utilities
 *
 * Fuzzy matching and search scoring algorithms.
 */

import type { Post, PredictionEvent, Author } from '@/types'
import type { SearchResult, SearchResultType } from '@/store/search'

/**
 * Simple fuzzy match score
 * Returns 0-1 score based on character matching
 */
export function fuzzyScore(query: string, target: string): number {
  if (!query || !target) return 0

  const q = query.toLowerCase()
  const t = target.toLowerCase()

  // Exact match
  if (t === q) return 1

  // Contains exact match
  if (t.includes(q)) return 0.9

  // Starts with query
  if (t.startsWith(q)) return 0.85

  // Word starts with query
  const words = t.split(/\s+/)
  if (words.some((w) => w.startsWith(q))) return 0.7

  // Fuzzy character matching
  let score = 0
  let qIndex = 0
  let consecutiveMatches = 0

  for (let i = 0; i < t.length && qIndex < q.length; i++) {
    if (t[i] === q[qIndex]) {
      score += 1 + consecutiveMatches * 0.5
      consecutiveMatches++
      qIndex++
    } else {
      consecutiveMatches = 0
    }
  }

  // Only consider it a match if we matched all query characters
  if (qIndex < q.length) return 0

  // Normalize score
  return Math.min(0.6, score / (q.length * 2))
}

/**
 * Search posts by content and author
 */
export function searchPosts(posts: Post[], query: string): SearchResult[] {
  return posts
    .map((post) => {
      const contentScore = fuzzyScore(query, post.content)
      const authorScore = fuzzyScore(query, post.author.username)
      const maxScore = Math.max(contentScore, authorScore)

      if (maxScore === 0) return null

      return {
        id: post.id,
        type: 'post' as SearchResultType,
        title: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : ''),
        subtitle: `@${post.author.username} · ${post.variant}`,
        score: maxScore,
        matchedField: contentScore >= authorScore ? 'content' : 'author',
        data: post,
      }
    })
    .filter(Boolean) as SearchResult[]
}

/**
 * Search events by title, description, and category
 */
export function searchEvents(
  events: PredictionEvent[],
  query: string
): SearchResult[] {
  return events
    .map((event) => {
      const titleScore = fuzzyScore(query, event.title)
      const descScore = fuzzyScore(query, event.description) * 0.8
      const categoryScore = fuzzyScore(query, event.category) * 0.6
      const maxScore = Math.max(titleScore, descScore, categoryScore)

      if (maxScore === 0) return null

      let matchedField = 'title'
      if (descScore > titleScore && descScore >= categoryScore)
        matchedField = 'description'
      else if (categoryScore > titleScore) matchedField = 'category'

      return {
        id: event.id,
        type: 'event' as SearchResultType,
        title: event.title,
        subtitle: `${event.category} · ${event.status}`,
        score: maxScore,
        matchedField,
        data: event,
      }
    })
    .filter(Boolean) as SearchResult[]
}

/**
 * Search users by username
 */
export function searchUsers(authors: Author[], query: string): SearchResult[] {
  // Dedupe authors by username
  const uniqueAuthors = Array.from(
    new Map(authors.map((a) => [a.username, a])).values()
  )

  return uniqueAuthors
    .map((author) => {
      const score = fuzzyScore(query, author.username)

      if (score === 0) return null

      return {
        id: author.username,
        type: 'user' as SearchResultType,
        title: `@${author.username}`,
        subtitle: author.verified ? 'Verified' : undefined,
        score,
        matchedField: 'username',
        data: author,
      }
    })
    .filter(Boolean) as SearchResult[]
}

/**
 * Combined search across all content types
 */
export function searchAll(
  posts: Post[],
  events: PredictionEvent[],
  authors: Author[],
  query: string
): SearchResult[] {
  if (!query.trim()) return []

  const postResults = searchPosts(posts, query)
  const eventResults = searchEvents(events, query)
  const userResults = searchUsers(authors, query)

  // Combine and sort by score
  return [...postResults, ...eventResults, ...userResults].sort(
    (a, b) => b.score - a.score
  )
}
