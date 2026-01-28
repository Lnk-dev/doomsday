# Store API Reference

Zustand stores for state management. All stores persist to localStorage.

## Posts Store

`usePostsStore` - Manages posts and feeds.

### State

```typescript
interface PostsState {
  posts: Record<ID, Post>      // All posts by ID
  doomFeed: ID[]               // Doom post IDs (newest first)
  lifeFeed: ID[]               // Life post IDs (newest first)
}
```

### Actions

```typescript
// Create a new post
createPost(content: string, variant: 'doom' | 'life', author: Author): void

// Like a post
likePost(postId: ID, userId: ID): void

// Unlike a post
unlikePost(postId: ID, userId: ID): void
```

### Usage

```typescript
import { usePostsStore } from '@/store'

// Select data
const posts = usePostsStore(state => state.posts)
const doomFeed = usePostsStore(state => state.doomFeed)

// Get actions
const createPost = usePostsStore(state => state.createPost)
const likePost = usePostsStore(state => state.likePost)

// Create post
createPost('The end is near...', 'doom', author)

// Like post
likePost(postId, userId)
```

---

## User Store

`useUserStore` - Manages current user state.

### State

```typescript
interface UserState {
  userId: ID                   // Unique user identifier
  author: Author               // User's author info
  doomBalance: number          // $DOOM token balance
  lifeBalance: number          // $LIFE token balance
  daysLiving: number           // Consecutive days with life posts
  lifePosts: number            // Total life posts made
  isConnected: boolean         // Wallet connection status
  following: string[]          // List of followed usernames
}
```

### Actions

```typescript
// Update username
setUsername(username: string): void

// Token management
addDoom(amount: number): void
spendDoom(amount: number): boolean  // Returns false if insufficient
addLife(amount: number): void
donateLife(amount: number): boolean // Costs $DOOM, returns false if insufficient

// Life posts
incrementLifePosts(): void
getLifePostCost(): number           // Calculate current cost

// Wallet
setConnected(connected: boolean): void

// Following
followUser(username: string): void
unfollowUser(username: string): void
isFollowing(username: string): boolean
```

### Usage

```typescript
import { useUserStore } from '@/store'

// Select data
const userId = useUserStore(state => state.userId)
const doomBalance = useUserStore(state => state.doomBalance)
const following = useUserStore(state => state.following)

// Get actions
const followUser = useUserStore(state => state.followUser)
const spendDoom = useUserStore(state => state.spendDoom)

// Follow user
followUser('crypto_doomer')

// Spend tokens (returns false if can't afford)
const success = spendDoom(50)
```

---

## Events Store

`useEventsStore` - Manages predictions and bets.

### State

```typescript
interface EventsState {
  events: Record<ID, Event>    // All events by ID
  eventIds: ID[]               // Event IDs (for ordering)
  bets: Bet[]                  // User's bets
}
```

### Actions

```typescript
// Create prediction
createEvent(data: {
  title: string
  description: string
  category: EventCategory
  countdownEnd: Timestamp
}): ID

// Place bet
placeBet(eventId: ID, side: 'doom' | 'life', amount: number, userId: ID): void

// Get event
getEvent(eventId: ID): Event | undefined
```

### Usage

```typescript
import { useEventsStore } from '@/store'

// Select data
const events = useEventsStore(state => state.events)
const bets = useEventsStore(state => state.bets)

// Get actions
const createEvent = useEventsStore(state => state.createEvent)
const placeBet = useEventsStore(state => state.placeBet)

// Create prediction
const eventId = createEvent({
  title: 'AI takes over by 2030',
  description: 'Artificial general intelligence...',
  category: 'technology',
  countdownEnd: Date.now() + 365 * 24 * 60 * 60 * 1000
})

// Place bet
placeBet(eventId, 'doom', 100, userId)
```

---

## Leaderboard Store

`useLeaderboardStore` - Manages rankings.

### State

```typescript
interface LeaderboardState {
  leaderboards: Record<LeaderboardCategory, LeaderboardEntry[]>
}

type LeaderboardCategory = 'doomer' | 'life' | 'prepper' | 'preventer' | 'salvation'

interface LeaderboardEntry {
  rank: number
  user: { username: string; verified: boolean }
  score: number
  change: number  // Rank change from yesterday
}
```

### Usage

```typescript
import { useLeaderboardStore } from '@/store'

// Select leaderboard data
const leaderboards = useLeaderboardStore(state => state.leaderboards)

// Get specific category
const doomerLeaderboard = leaderboards['doomer']
```

---

## Best Practices

### Selecting State

```typescript
// GOOD: Select specific values
const userId = useUserStore(state => state.userId)

// GOOD: Select stable objects
const posts = usePostsStore(state => state.posts)

// BAD: Calling functions in selectors (causes infinite loops)
const feed = usePostsStore(state => state.getFeed('doom'))
```

### Computing Derived Data

```typescript
// Use useMemo for derived data
const sortedPosts = useMemo(() => {
  return feedIds
    .map(id => posts[id])
    .filter(Boolean)
    .sort((a, b) => b.createdAt - a.createdAt)
}, [feedIds, posts])
```

### Multiple Selectors

```typescript
// Select multiple values separately for better performance
const userId = useUserStore(state => state.userId)
const following = useUserStore(state => state.following)
const followUser = useUserStore(state => state.followUser)
```

---

## Type Definitions

See `src/types/index.ts` for complete type definitions:

```typescript
type ID = string
type Timestamp = number

interface Author {
  address: string | null
  username: string
  avatar?: string
  verified?: boolean
}

interface Post {
  id: ID
  author: Author
  content: string
  variant: 'doom' | 'life'
  createdAt: Timestamp
  likes: number
  replies: number
  reposts: number
  likedBy: ID[]
}

interface Event {
  id: ID
  title: string
  description: string
  category: EventCategory
  countdownEnd: Timestamp
  doomStake: number
  lifeStake: number
  createdAt: Timestamp
}

interface Bet {
  id: ID
  eventId: ID
  userId: ID
  side: 'doom' | 'life'
  amount: number
  createdAt: Timestamp
}
```
