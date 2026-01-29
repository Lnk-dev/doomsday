/**
 * Admin Users Page
 *
 * User management with search, filters, and actions
 */

import { useState, useEffect, useCallback } from 'react'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { adminApi } from '../lib/adminApi'
import { useAdminAuthStore } from '../store/adminAuth'
import { UserTable } from '../components/users/UserTable'
import { UserDetailModal } from '../components/users/UserDetailModal'
import { BanUserDialog } from '../components/users/BanUserDialog'
import { WarnUserDialog } from '../components/users/WarnUserDialog'
import type { UserView, UserFilters, PaginatedUsers } from '../types/admin'

type TabType = 'all' | 'active' | 'banned' | 'warned'

const TABS: { id: TabType; label: string }[] = [
  { id: 'all', label: 'All Users' },
  { id: 'active', label: 'Active' },
  { id: 'banned', label: 'Banned' },
  { id: 'warned', label: 'Warned' },
]

export function AdminUsersPage() {
  const hasPermission = useAdminAuthStore((state) => state.hasPermission)
  const canBan = hasPermission('users.ban')
  const canWarn = hasPermission('users.warn')

  // State
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [sortBy, setSortBy] = useState<UserFilters['sortBy']>('createdAt')
  const [sortOrder, setSortOrder] = useState<UserFilters['sortOrder']>('desc')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)

  // Data state
  const [data, setData] = useState<PaginatedUsers | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal state
  const [selectedUser, setSelectedUser] = useState<UserView | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showBanDialog, setShowBanDialog] = useState(false)
  const [showWarnDialog, setShowWarnDialog] = useState(false)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
      setPage(1) // Reset to first page on search
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const filters: UserFilters = {
        query: debouncedQuery || undefined,
        status: activeTab === 'all' ? undefined : activeTab,
        sortBy,
        sortOrder,
      }

      const result = await adminApi.getUsers(filters, page, pageSize)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }, [debouncedQuery, activeTab, sortBy, sortOrder, page, pageSize])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Handlers
  const handleViewUser = (user: UserView) => {
    setSelectedUser(user)
    setShowDetailModal(true)
  }

  const handleBanUser = (user: UserView) => {
    if (!canBan) return
    setSelectedUser(user)
    setShowBanDialog(true)
  }

  const handleWarnUser = (user: UserView) => {
    if (!canWarn) return
    setSelectedUser(user)
    setShowWarnDialog(true)
  }

  const handleActionComplete = () => {
    setShowBanDialog(false)
    setShowWarnDialog(false)
    setShowDetailModal(false)
    setSelectedUser(null)
    fetchUsers() // Refresh the list
  }

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    setPage(1)
  }

  const handleSortChange = (newSortBy: UserFilters['sortBy']) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(newSortBy)
      setSortOrder('desc')
    }
    setPage(1)
  }

  return (
    <div className="space-y-6">
      {/* Header with search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-semibold text-white">User Management</h2>
          <p className="text-[14px] text-[#777]">
            {data?.total.toLocaleString() ?? 0} total users
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            className="w-full sm:w-64 pl-9 pr-4 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-white text-[14px] placeholder:text-[#555] focus:outline-none focus:border-[#ff3040] transition-colors"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-[#111] border border-[#222] rounded-lg w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`px-4 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-[#222] text-white'
                : 'text-[#777] hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sort controls */}
      <div className="flex items-center gap-2">
        <span className="text-[13px] text-[#777]">Sort by:</span>
        {[
          { id: 'createdAt', label: 'Joined' },
          { id: 'lastActiveAt', label: 'Last Active' },
          { id: 'postCount', label: 'Posts' },
          { id: 'username', label: 'Username' },
        ].map((option) => (
          <button
            key={option.id}
            onClick={() => handleSortChange(option.id as UserFilters['sortBy'])}
            className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors ${
              sortBy === option.id
                ? 'bg-[#ff3040]/10 text-[#ff3040]'
                : 'bg-[#1a1a1a] text-[#777] hover:text-white'
            }`}
          >
            {option.label}
            {sortBy === option.id && (
              <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
            )}
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-[14px] text-red-400">{error}</p>
        </div>
      )}

      {/* User table */}
      <UserTable
        users={data?.users ?? []}
        onViewUser={handleViewUser}
        onBanUser={handleBanUser}
        onWarnUser={handleWarnUser}
        isLoading={isLoading}
      />

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-[#777]">
            Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, data.total)} of {data.total.toLocaleString()}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="p-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-[#777] hover:text-white hover:border-[#444] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-[13px] text-[#777]">
              Page {page} of {data.totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === data.totalPages}
              className="p-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-[#777] hover:text-white hover:border-[#444] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showDetailModal && selectedUser && (
        <UserDetailModal
          userId={selectedUser.id}
          onClose={() => {
            setShowDetailModal(false)
            setSelectedUser(null)
          }}
          onBan={() => {
            setShowDetailModal(false)
            setShowBanDialog(true)
          }}
          onWarn={() => {
            setShowDetailModal(false)
            setShowWarnDialog(true)
          }}
        />
      )}

      {showBanDialog && selectedUser && (
        <BanUserDialog
          user={selectedUser}
          onClose={() => {
            setShowBanDialog(false)
            setSelectedUser(null)
          }}
          onSuccess={handleActionComplete}
        />
      )}

      {showWarnDialog && selectedUser && (
        <WarnUserDialog
          user={selectedUser}
          onClose={() => {
            setShowWarnDialog(false)
            setSelectedUser(null)
          }}
          onSuccess={handleActionComplete}
        />
      )}
    </div>
  )
}
