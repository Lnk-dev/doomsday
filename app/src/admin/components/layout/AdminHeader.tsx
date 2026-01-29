/**
 * Admin Header Component
 *
 * Top header bar for admin dashboard with title and actions
 */

import { Bell, Menu } from 'lucide-react'
import { useLocation } from 'react-router-dom'

// Route to title mapping
const ROUTE_TITLES: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/users': 'User Management',
  '/admin/moderation': 'Moderation Queue',
  '/admin/analytics': 'Analytics',
  '/admin/events': 'Event Resolution',
}

interface AdminHeaderProps {
  onMenuClick?: () => void
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const location = useLocation()
  const title = ROUTE_TITLES[location.pathname] || 'Admin'

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between h-14 px-4 bg-[#0a0a0a] border-b border-[#222]">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-[#1a1a1a] text-[#777] hover:text-white transition-colors"
          >
            <Menu size={20} />
          </button>
        )}

        {/* Page title */}
        <h1 className="text-[17px] font-semibold text-white">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications (placeholder) */}
        <button className="relative p-2 rounded-lg hover:bg-[#1a1a1a] text-[#777] hover:text-white transition-colors">
          <Bell size={20} />
          {/* Notification dot */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ff3040] rounded-full" />
        </button>
      </div>
    </header>
  )
}
