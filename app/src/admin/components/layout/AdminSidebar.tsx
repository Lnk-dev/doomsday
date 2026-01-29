/**
 * Admin Sidebar Component
 *
 * Role-based navigation sidebar for admin dashboard
 */

import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Shield,
  BarChart3,
  Calendar,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useState } from 'react'
import { useAdminAuthStore } from '../../store/adminAuth'
import { getNavItemsForRole, getRoleDisplayName, getRoleBadgeColor } from '../../lib/permissions'

// Icon mapping
const ICONS: Record<string, React.ElementType> = {
  LayoutDashboard,
  Users,
  Shield,
  BarChart3,
  Calendar,
}

interface AdminSidebarProps {
  collapsed?: boolean
  onToggle?: () => void
}

export function AdminSidebar({ collapsed = false, onToggle }: AdminSidebarProps) {
  const admin = useAdminAuthStore((state) => state.admin)
  const logout = useAdminAuthStore((state) => state.logout)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  if (!admin) return null

  const navItems = getNavItemsForRole(admin.role)
  const roleDisplayName = getRoleDisplayName(admin.role)
  const roleBadgeColor = getRoleBadgeColor(admin.role)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await logout()
  }

  return (
    <aside
      className={`
        flex flex-col h-screen bg-[#0a0a0a] border-r border-[#222]
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-16' : 'w-64'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#222]">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#ff3040] flex items-center justify-center">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <span className="text-white font-semibold">Admin</span>
          </div>
        )}
        {onToggle && (
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg hover:bg-[#222] text-[#777] hover:text-white transition-colors"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = ICONS[item.icon] || LayoutDashboard
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin'}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                ${isActive
                  ? 'bg-[#ff3040]/10 text-[#ff3040]'
                  : 'text-[#777] hover:bg-[#1a1a1a] hover:text-white'
                }
                ${collapsed ? 'justify-center' : ''}
              `}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={20} />
              {!collapsed && <span className="text-[14px] font-medium">{item.label}</span>}
            </NavLink>
          )
        })}
      </nav>

      {/* User section */}
      <div className="p-2 border-t border-[#222]">
        {/* User info */}
        {!collapsed && (
          <div className="px-3 py-2 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#333] flex items-center justify-center text-white text-sm font-medium">
                {admin.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-white truncate">
                  {admin.username}
                </p>
                <span
                  className="text-[11px] font-medium px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: `${roleBadgeColor}20`,
                    color: roleBadgeColor,
                  }}
                >
                  {roleDisplayName}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Logout button */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={`
            flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-colors
            text-[#777] hover:bg-[#1a1a1a] hover:text-[#ff3040]
            disabled:opacity-50 disabled:cursor-not-allowed
            ${collapsed ? 'justify-center' : ''}
          `}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut size={20} />
          {!collapsed && <span className="text-[14px] font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  )
}
