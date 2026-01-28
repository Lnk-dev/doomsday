/**
 * BottomNav Component
 *
 * Fixed bottom navigation bar styled like Instagram Threads.
 * Features:
 * - Icon-only navigation (no labels)
 * - Active state with bolder stroke weight
 * - Safe area padding for notched devices
 * - Notification dots for new content
 *
 * Navigation structure:
 * - Home (/) - Doom scroll feed
 * - Search (/events) - Event/prediction search
 * - Compose (/compose) - Create new post
 * - Activity (/life) - Life feed & notifications
 * - Profile (/profile) - User profile
 */

import { NavLink, useLocation } from 'react-router-dom'
import { Home, Search, PenSquare, Heart, User } from 'lucide-react'
import { usePostsStore, useEventsStore } from '@/store'
import { useMemo, useEffect, useState } from 'react'

/** Navigation items configuration */
const navItems = [
  { to: '/', icon: Home, notifyKey: 'doom' as const },
  { to: '/events', icon: Search, notifyKey: 'events' as const },
  { to: '/compose', icon: PenSquare, notifyKey: null },
  { to: '/life', icon: Heart, notifyKey: 'life' as const },
  { to: '/profile', icon: User, notifyKey: null },
]

export function BottomNav() {
  const location = useLocation()

  // Track last viewed timestamps
  const [lastViewed, setLastViewed] = useState<Record<string, number>>(() => {
    const stored = localStorage.getItem('doomsday-last-viewed')
    return stored ? JSON.parse(stored) : {}
  })

  // Store data for notification dots
  const doomFeed = usePostsStore((state) => state.doomFeed)
  const lifeFeed = usePostsStore((state) => state.lifeFeed)
  const allPosts = usePostsStore((state) => state.posts)
  const events = useEventsStore((state) => state.events)

  // Calculate if there are new items
  const hasNewContent = useMemo(() => {
    const result: Record<string, boolean> = { doom: false, life: false, events: false }

    // Check doom feed
    const newestDoom = doomFeed.length > 0 ? allPosts[doomFeed[0]]?.createdAt : 0
    result.doom = newestDoom > (lastViewed.doom || 0)

    // Check life feed
    const newestLife = lifeFeed.length > 0 ? allPosts[lifeFeed[0]]?.createdAt : 0
    result.life = newestLife > (lastViewed.life || 0)

    // Check events
    const eventTimes = Object.values(events).map((e) => e.createdAt)
    const newestEvent = eventTimes.length > 0 ? Math.max(...eventTimes) : 0
    result.events = newestEvent > (lastViewed.events || 0)

    return result
  }, [doomFeed, lifeFeed, allPosts, events, lastViewed])

  // Update last viewed when navigating
  useEffect(() => {
    const path = location.pathname
    let key: string | null = null

    if (path === '/') key = 'doom'
    else if (path === '/life') key = 'life'
    else if (path === '/events' || path.startsWith('/events/')) key = 'events'

    if (key) {
      setLastViewed((prev) => {
        const updated = { ...prev, [key]: Date.now() }
        localStorage.setItem('doomsday-last-viewed', JSON.stringify(updated))
        return updated
      })
    }
  }, [location.pathname])

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-[#333] pb-safe z-50">
      <div className="flex justify-around items-center h-12 max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, notifyKey }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `relative flex items-center justify-center w-12 h-12 transition-colors ${
                isActive ? 'text-white' : 'text-[#777]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={26} strokeWidth={isActive ? 2.5 : 1.5} />
                {/* Notification dot */}
                {notifyKey && hasNewContent[notifyKey] && !isActive && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#ff3040]" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
