import { NavLink } from 'react-router-dom'
import { Home, Search, PenSquare, Heart, User } from 'lucide-react'

const navItems = [
  { to: '/', icon: Home },
  { to: '/events', icon: Search },
  { to: '/compose', icon: PenSquare },
  { to: '/life', icon: Heart },
  { to: '/profile', icon: User },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-[#333] pb-safe z-50">
      <div className="flex justify-around items-center h-12 max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center justify-center w-12 h-12 transition-colors ${
                isActive ? 'text-white' : 'text-[#777]'
              }`
            }
          >
            {({ isActive }) => (
              <Icon size={26} strokeWidth={isActive ? 2.5 : 1.5} />
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
