/**
 * DesktopSidebar Component
 *
 * Left navigation sidebar visible only on desktop (lg+).
 * Features:
 * - Logo and branding
 * - Navigation items with active states
 * - Notification dots for new content
 * - User profile preview at bottom
 * - Settings link
 */

import { NavLink, useLocation } from 'react-router-dom'
import { Home, Search, PenSquare, Heart, User, Settings, Skull } from 'lucide-react'
import { usePostsStore, useEventsStore, useUserStore } from '@/store'
import { useMemo, useEffect, useState, useRef } from 'react'

/** Navigation items configuration */
const navItems = [
  { to: '/', icon: Home, label: 'Home', notifyKey: 'doom' as const },
  { to: '/events', icon: Search, label: 'Search', notifyKey: 'events' as const },
  { to: '/compose', icon: PenSquare, label: 'Compose', notifyKey: null },
  { to: '/life', icon: Heart, label: 'Life', notifyKey: 'life' as const },
  { to: '/profile', icon: User, label: 'Profile', notifyKey: null },
]

export function DesktopSidebar() {
  const location = useLocation()
  const author = useUserStore((state) => state.author)

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

  // Track pending update to avoid setState in effect body
  const pendingUpdate = useRef<string | null>(null)

  // Update last viewed on route change
  useEffect(() => {
    const path = location.pathname
    let key: string | null = null

    if (path === '/') key = 'doom'
    else if (path === '/life') key = 'life'
    else if (path === '/events' || path.startsWith('/events/')) key = 'events'

    if (key) {
      pendingUpdate.current = key
      queueMicrotask(() => {
        if (pendingUpdate.current) {
          const updateKey = pendingUpdate.current
          pendingUpdate.current = null
          setLastViewed((prev) => {
            const updated = { ...prev, [updateKey]: Date.now() }
            localStorage.setItem('doomsday-last-viewed', JSON.stringify(updated))
            return updated
          })
        }
      })
    }
  }, [location.pathname])

  return (
    <aside className="hidden lg:flex flex-col w-64 xl:w-72 h-screen sticky top-0 border-r border-[#333] bg-black">
      {/* Logo */}
      <div className="p-4 xl:p-6">
        <div className="flex items-center gap-2">
          <Skull size={28} className="text-[#ff3040]" />
          <span className="text-xl font-bold text-white">Doomsday</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 xl:px-3 py-2">
        {navItems.map(({ to, icon: Icon, label, notifyKey }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `relative flex items-center gap-3 xl:gap-4 px-3 xl:px-4 py-3 rounded-xl mb-1 transition-colors ${
                isActive
                  ? 'bg-[#1a1a1a] text-white font-semibold'
                  : 'text-[#777] hover:bg-[#111] hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 1.5} />
                  {/* Notification dot */}
                  {notifyKey && hasNewContent[notifyKey] && !isActive && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#ff3040]" />
                  )}
                </div>
                <span className="text-[15px]">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Settings */}
      <div className="px-2 xl:px-3 py-2 border-t border-[#333]">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 xl:gap-4 px-3 xl:px-4 py-3 rounded-xl transition-colors ${
              isActive
                ? 'bg-[#1a1a1a] text-white font-semibold'
                : 'text-[#777] hover:bg-[#111] hover:text-white'
            }`
          }
        >
          <Settings size={24} strokeWidth={1.5} />
          <span className="text-[15px]">Settings</span>
        </NavLink>
      </div>

      {/* User profile */}
      <div className="p-4 xl:p-6 border-t border-[#333]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#333] flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-white truncate capitalize">
              {author.username.replace('_', ' ')}
            </p>
            <p className="text-[12px] text-[#777] truncate">@{author.username}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
