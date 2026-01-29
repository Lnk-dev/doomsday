/**
 * User Table Component
 *
 * Displays users in a table with status badges and actions
 */

import { formatRelativeTime } from '../../lib/formatDate'
import { MoreHorizontal, Ban, AlertTriangle, Eye } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import type { UserView } from '../../types/admin'

interface UserTableProps {
  users: UserView[]
  onViewUser: (user: UserView) => void
  onBanUser: (user: UserView) => void
  onWarnUser: (user: UserView) => void
  isLoading?: boolean
}

function StatusBadge({ status }: { status: UserView['status'] }) {
  const styles = {
    active: 'bg-green-500/10 text-green-500',
    banned: 'bg-red-500/10 text-red-500',
    warned: 'bg-yellow-500/10 text-yellow-500',
  }

  const labels = {
    active: 'Active',
    banned: 'Banned',
    warned: 'Warned',
  }

  return (
    <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}

interface ActionMenuProps {
  user: UserView
  onView: () => void
  onBan: () => void
  onWarn: () => void
}

function ActionMenu({ user, onView, onBan, onWarn }: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className="p-1.5 rounded-lg hover:bg-[#222] text-[#777] hover:text-white transition-colors"
      >
        <MoreHorizontal size={16} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-xl z-20 py-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onView()
              setIsOpen(false)
            }}
            className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-[#ccc] hover:bg-[#222] hover:text-white transition-colors"
          >
            <Eye size={14} />
            View Details
          </button>
          {user.status !== 'banned' && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onBan()
                setIsOpen(false)
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-red-400 hover:bg-[#222] hover:text-red-300 transition-colors"
            >
              <Ban size={14} />
              Ban User
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onWarn()
              setIsOpen(false)
            }}
            className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-yellow-400 hover:bg-[#222] hover:text-yellow-300 transition-colors"
          >
            <AlertTriangle size={14} />
            Warn User
          </button>
        </div>
      )}
    </div>
  )
}

export function UserTable({ users, onViewUser, onBanUser, onWarnUser, isLoading }: UserTableProps) {
  if (isLoading) {
    return (
      <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
        <div className="animate-pulse">
          <div className="h-12 bg-[#1a1a1a] border-b border-[#222]" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 border-b border-[#222] last:border-0" />
          ))}
        </div>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="bg-[#111] border border-[#222] rounded-xl p-8 text-center">
        <p className="text-[14px] text-[#555]">No users found</p>
      </div>
    )
  }

  return (
    <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#0a0a0a] border-b border-[#222]">
              <th className="text-left px-4 py-3 text-[12px] font-medium text-[#777] uppercase tracking-wider">
                User
              </th>
              <th className="text-left px-4 py-3 text-[12px] font-medium text-[#777] uppercase tracking-wider">
                Status
              </th>
              <th className="text-left px-4 py-3 text-[12px] font-medium text-[#777] uppercase tracking-wider hidden md:table-cell">
                Joined
              </th>
              <th className="text-left px-4 py-3 text-[12px] font-medium text-[#777] uppercase tracking-wider hidden lg:table-cell">
                Last Active
              </th>
              <th className="text-right px-4 py-3 text-[12px] font-medium text-[#777] uppercase tracking-wider hidden sm:table-cell">
                Posts
              </th>
              <th className="text-right px-4 py-3 text-[12px] font-medium text-[#777] uppercase tracking-wider hidden sm:table-cell">
                Bets
              </th>
              <th className="text-right px-4 py-3 text-[12px] font-medium text-[#777] uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                onClick={() => onViewUser(user)}
                className="border-b border-[#222] last:border-0 hover:bg-[#1a1a1a] cursor-pointer transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#333] flex items-center justify-center text-white text-[13px] font-medium overflow-hidden">
                      {user.avatar ? (
                        <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        user.username.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="text-[14px] font-medium text-white">{user.username}</p>
                      {user.email && (
                        <p className="text-[12px] text-[#555]">{user.email}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={user.status} />
                </td>
                <td className="px-4 py-3 text-[13px] text-[#777] hidden md:table-cell">
                  {formatRelativeTime(user.createdAt)}
                </td>
                <td className="px-4 py-3 text-[13px] text-[#777] hidden lg:table-cell">
                  {user.lastActiveAt
                    ? formatRelativeTime(user.lastActiveAt)
                    : 'Never'}
                </td>
                <td className="px-4 py-3 text-[13px] text-[#777] text-right hidden sm:table-cell">
                  {user.postCount.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-[13px] text-[#777] text-right hidden sm:table-cell">
                  {user.betCount.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <ActionMenu
                    user={user}
                    onView={() => onViewUser(user)}
                    onBan={() => onBanUser(user)}
                    onWarn={() => onWarnUser(user)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
