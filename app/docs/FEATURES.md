# Features

Comprehensive documentation of all Doomsday features.

## Feeds

### Doom Scroll Feed (`/`)

The main feed displaying doom-related posts.

**Features:**
- **For You / Following tabs**: Toggle between all posts and followed users
- **Sorting**: Hot (engagement decay), New (chronological), Top (most likes)
- **Like interactions**: Real-time like/unlike with visual feedback
- **Share**: Copy link, Twitter, native share
- **Navigate**: Click post to view detail

**Hot Score Algorithm:**
```
hotScore = (likes + replies * 2) / (hoursOld + 2)^1.5
```

### Life Feed (`/life`)

Feed for life-affirming content that costs $DOOM to post.

**Features:**
- **Cost indicator**: Shows current cost to post
- **Donation**: Send $LIFE to other users
- **Activity tabs**: All, Follows, Replies, Mentions

**Post Cost Formula:**
```
cost = max(1, daysLiving + 1) + floor(lifePosts / 10)
```

## Prediction Market

### Events List (`/events`)

Browse active predictions with live countdowns.

**Features:**
- **Category filter**: Technology, Economic, Climate, Social, Political, Other
- **Live countdown**: Updates every second
- **Stake visualization**: Doom vs Life stake percentages

### Event Detail (`/events/:id`)

Full prediction view with betting interface.

**Features:**
- **Countdown timer**: Live countdown to resolution
- **Stake distribution**: Visual bar showing doom/life split
- **Bet placement**: Choose side, enter amount, see potential payout
- **Quick amounts**: 100, 500, 1000, MAX buttons

**Payout Calculation:**
```
potentialWin = (yourStake / yourSideTotal) * totalPool
```

### Create Prediction (`/events/create`)

Create new doom predictions.

**Fields:**
- Title (5+ characters)
- Description (20+ characters)
- Category (6 options)
- Countdown duration (7d to 5y presets)

## Social Features

### Post Detail (`/post/:id`)

Full post view with comments.

**Features:**
- **Full content**: No truncation
- **Comment thread**: View and add comments
- **Actions**: Like, comment, repost, share
- **Follow button**: Follow/unfollow author

### Following System

Track and view content from followed users.

**Features:**
- **Follow/Unfollow**: From post detail page
- **Following tab**: Filter feed by followed users
- **Persistence**: Following list saved to localStorage

### Share

Share posts and profiles via multiple methods.

**Options:**
- Copy link to clipboard
- Share to Twitter/X
- Native share API (mobile)

### Life Timeline (`/timeline`)

Visual journey of user's life posts.

**Features:**
- **Chronological posts**: Oldest to newest
- **Milestones**: First post, days living, post counts
- **Stats banner**: Days, posts, $LIFE balance
- **"Now" marker**: Current point in timeline

## User Features

### Profile (`/profile`)

User profile with stats and history.

**Sections:**
- **Header**: Username, bio, follower count
- **Stats grid**: $DOOM, $LIFE, Days, Life Posts
- **Life Timeline button**: Quick access to timeline
- **Tabs**: Threads, Bets, Replies

### Betting History

View active bets in profile.

**Shows:**
- Event title
- Side (Doom/Life)
- Stake amount
- Potential winnings
- Countdown to resolution

### Settings (`/settings`)

User preferences and account management.

**Sections:**
- Account (profile link, privacy)
- Notifications (push, sounds)
- Display (dark mode, balance visibility)
- Support (help link)
- Danger Zone (reset data, delete account)

## Leaderboards (`/leaderboard`)

Rankings across 5 categories.

**Categories:**
- **Doomer**: Most $DOOM burned
- **Life**: Longest/fullest lives
- **Prepper**: Top strategy contributors
- **Preventer**: Top mission contributors
- **Salvation**: Top belief contributors

**Features:**
- Your rank card with percentile
- Top 10 display
- Rank change indicators (+/-)
- Verified badges

## Compose (`/compose`)

Create new posts.

**Features:**
- **Type toggle**: Doom Scroll vs Life
- **Cost preview**: Shows $DOOM cost for life posts
- **Character limit**: 500 max with counter
- **Balance display**: Current $DOOM balance

## Navigation

### Bottom Nav

Fixed bottom navigation with 5 tabs.

**Tabs:**
- Home (Doom scroll)
- Search (Events)
- Compose (Create post)
- Activity (Life feed)
- Profile

**Notification Dots:**
- Red dots indicate new content
- Clears when tab is visited
- Persists across sessions

## Notifications

Visual indicators for new content.

**Tracked:**
- New doom posts
- New life posts
- New events

**Behavior:**
- Dot appears on nav icon
- Clears on page visit
- Timestamps stored in localStorage
