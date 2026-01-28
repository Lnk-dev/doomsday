import { NavLink } from 'react-router-dom'
import { Flame, Heart, Clock, Trophy, User } from 'lucide-react'

const navItems = [
  { to: '/', icon: Flame, label: 'Doom' },
  { to: '/life', icon: Heart, label: 'Life' },
  { to: '/events', icon: Clock, label: 'Events' },
  { to: '/leaderboard', icon: Trophy, label: 'Ranks' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-neutral-900 border-t border-neutral-800 pb-safe">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'text-red-500'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`
            }
          >
            <Icon size={22} />
            <span className="text-xs font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
