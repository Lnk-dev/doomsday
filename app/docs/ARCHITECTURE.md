# Architecture

## System Overview

Doomsday is a client-side React application with Zustand state management and localStorage persistence. Future versions will integrate with Solana blockchain.

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Pages     │  │ Components  │  │   Store     │     │
│  │  (Routes)   │──│    (UI)     │──│  (Zustand)  │     │
│  └─────────────┘  └─────────────┘  └──────┬──────┘     │
│                                           │             │
│                                    ┌──────▼──────┐     │
│                                    │ localStorage │     │
│                                    └─────────────┘     │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼ (Future)
┌─────────────────────────────────────────────────────────┐
│                   Solana Blockchain                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ $DOOM Token │  │ $LIFE Token │  │  Programs   │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
```

## Directory Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx      # Main app shell with Outlet
│   │   ├── BottomNav.tsx      # Bottom navigation with notifications
│   │   └── PageHeader.tsx     # Reusable page header
│   └── ui/
│       ├── ThreadPost.tsx     # Post card component
│       ├── ShareModal.tsx     # Share functionality
│       ├── ProfileShareModal.tsx
│       └── DonationModal.tsx  # Life donations
├── pages/
│   ├── DoomScrollPage.tsx     # Home feed (/)
│   ├── LifePage.tsx           # Life feed (/life)
│   ├── EventsPage.tsx         # Predictions (/events)
│   ├── EventDetailPage.tsx    # Single event (/events/:id)
│   ├── CreateEventPage.tsx    # New prediction (/events/create)
│   ├── LeaderboardPage.tsx    # Rankings (/leaderboard)
│   ├── ProfilePage.tsx        # User profile (/profile)
│   ├── SettingsPage.tsx       # Settings (/settings)
│   ├── ComposePage.tsx        # Create post (/compose)
│   ├── PostDetailPage.tsx     # Single post (/post/:id)
│   └── LifeTimelinePage.tsx   # Timeline (/timeline)
├── store/
│   ├── index.ts               # Store exports
│   ├── posts.ts               # Posts state
│   ├── user.ts                # User state
│   ├── events.ts              # Events/bets state
│   └── leaderboard.ts         # Leaderboard state
├── lib/
│   └── utils.ts               # Utility functions
├── types/
│   └── index.ts               # TypeScript definitions
├── App.tsx                    # Route definitions
└── index.css                  # Global styles
```

## State Management

### Store Pattern

Each store follows this pattern:

```typescript
interface StoreState {
  // Data
  items: Record<ID, Item>

  // Computed (functions that derive data)
  getItem: (id: ID) => Item | undefined

  // Actions (functions that modify state)
  createItem: (data: CreateItemData) => void
  updateItem: (id: ID, data: Partial<Item>) => void
  deleteItem: (id: ID) => void
}
```

### Zustand Best Practices

**DO:** Select primitive values or use stable references
```typescript
const userId = useUserStore((state) => state.userId)
const posts = usePostsStore((state) => state.posts) // Record is stable
```

**DON'T:** Call functions in selectors (causes infinite loops)
```typescript
// BAD - creates new array each render
const feed = usePostsStore((state) => state.getFeed('doom'))

// GOOD - select raw data, compute in useMemo
const doomFeed = usePostsStore((state) => state.doomFeed)
const allPosts = usePostsStore((state) => state.posts)
const feed = useMemo(() =>
  doomFeed.map(id => allPosts[id]).filter(Boolean),
  [doomFeed, allPosts]
)
```

### Persistence

All stores use Zustand's `persist` middleware:

```typescript
export const useStore = create<State>()(
  persist(
    (set, get) => ({ ... }),
    { name: 'storage-key' }
  )
)
```

Storage keys:
- `doomsday-posts` - Posts and feeds
- `doomsday-user` - User profile and following
- `doomsday-events` - Predictions and bets
- `doomsday-leaderboard` - Rankings
- `doomsday-last-viewed` - Notification timestamps

## Routing

React Router v6 with nested routes:

```typescript
<BrowserRouter>
  <Routes>
    <Route element={<AppLayout />}>
      <Route path="/" element={<DoomScrollPage />} />
      <Route path="/life" element={<LifePage />} />
      <Route path="/events" element={<EventsPage />} />
      <Route path="/events/:eventId" element={<EventDetailPage />} />
      <Route path="/events/create" element={<CreateEventPage />} />
      <Route path="/leaderboard" element={<LeaderboardPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/compose" element={<ComposePage />} />
      <Route path="/post/:postId" element={<PostDetailPage />} />
      <Route path="/timeline" element={<LifeTimelinePage />} />
      <Route path="/timeline/:username" element={<LifeTimelinePage />} />
    </Route>
  </Routes>
</BrowserRouter>
```

## Component Patterns

### Page Components
- Fetch data from stores
- Handle user interactions
- Manage local UI state
- Render layout + child components

### UI Components
- Receive data via props
- Emit events via callbacks
- No direct store access (optional)
- Fully reusable

### Layout Components
- Provide app shell structure
- Handle navigation
- Manage global UI (modals, toasts)

## Styling

Tailwind CSS with custom theme:

```css
:root {
  --color-doom: #ff3040;
  --color-life: #00ba7c;
  --color-bg-primary: #000000;
  --color-border: #333333;
  --color-text-primary: #f5f5f5;
  --color-text-secondary: #777777;
}
```

Mobile-first approach:
- Base styles for mobile
- `md:` prefix for tablet+
- `lg:` prefix for desktop+

## Future: Blockchain Integration

Planned Solana integration:

1. **Wallet Connection**
   - Phantom, Solflare, etc.
   - Anonymous mode fallback

2. **Token Programs**
   - $DOOM: SPL token for doom economy
   - $LIFE: SPL token for life economy

3. **On-chain Data**
   - Prediction outcomes
   - Token transfers
   - User verification

4. **Hybrid Storage**
   - On-chain: Tokens, outcomes, verification
   - Off-chain: Posts, comments, profiles
