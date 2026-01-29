/**
 * User Detail Modal
 *
 * Shows detailed user information with tabs for activity
 */

import { useState, useEffect } from 'react'
import { X, Ban, AlertTriangle, ExternalLink, Loader2 } from 'lucide-react'
import { formatRelativeTime, formatDateTime } from '../../lib/formatDate'
import { adminApi } from '../../lib/adminApi'
import { useAdminAuthStore } from '../../store/adminAuth'
import type { UserDetail } from '../../types/admin'

interface UserDetailModalProps {
  userId: string
  onClose: () => void
  onBan: () => void
  onWarn: () => void
}

type TabType = 'posts' | 'bets' | 'warnings' | 'audit'

const TABS: { id: TabType; label: string }[] = [
  { id: 'posts', label: 'Posts' },
  { id: 'bets', label: 'Bets' },
  { id: 'warnings', label: 'Warnings' },
  { id: 'audit', label: 'Audit Log' },
]

export function UserDetailModal({ userId, onClose, onBan, onWarn }: UserDetailModalProps) {
  const hasPermission = useAdminAuthStore((state) => state.hasPermission)
  const canBan = hasPermission('users.ban')
  const canWarn = hasPermission('users.warn')

  const [user, setUser] = useState<UserDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('posts')

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await adminApi.getUserDetail(userId)
        setUser(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load user')
      } finally {
        setIsLoading(false)
      }
    }
    fetchUser()
  }, [userId])

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const statusColors = {
    active: 'bg-green-500/10 text-green-500',
    banned: 'bg-red-500/10 text-red-500',
    warned: 'bg-yellow-500/10 text-yellow-500',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#111] border border-[#222] rounded-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#222]">
          <h2 className="text-[17px] font-semibold text-white">User Details</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#222] text-[#777] hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-6 h-6 text-[#ff3040] animate-spin" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-[14px] text-red-400">{error}</p>
            </div>
          ) : user ? (
            <>
              {/* User info header */}
              <div className="p-4 border-b border-[#222]">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#333] flex items-center justify-center text-white text-[24px] font-medium overflow-hidden">
                    {user.avatar ? (
                      <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      user.username.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-[18px] font-semibold text-white">{user.username}</h3>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${statusColors[user.status]}`}>
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </span>
                    </div>
                    {user.email && (
                      <p className="text-[13px] text-[#777] mb-1">{user.email}</p>
                    )}
                    {user.bio && (
                      <p className="text-[13px] text-[#999] mb-2">{user.bio}</p>
                    )}
                    <p className="text-[12px] text-[#555]">
                      Joined {formatRelativeTime(user.createdAt)}
                      {user.lastActiveAt && (
                        <> · Last active {formatRelativeTime(user.lastActiveAt)}</>
                      )}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 mt-4">
                  <div className="text-center p-3 bg-[#0a0a0a] rounded-lg">
                    <p className="text-[18px] font-bold text-white">{user.doomBalance.toLocaleString()}</p>
                    <p className="text-[11px] text-[#777]">DOOM</p>
                  </div>
                  <div className="text-center p-3 bg-[#0a0a0a] rounded-lg">
                    <p className="text-[18px] font-bold text-white">{user.lifeBalance.toLocaleString()}</p>
                    <p className="text-[11px] text-[#777]">LIFE</p>
                  </div>
                  <div className="text-center p-3 bg-[#0a0a0a] rounded-lg">
                    <p className="text-[18px] font-bold text-white">{user.postCount.toLocaleString()}</p>
                    <p className="text-[11px] text-[#777]">Posts</p>
                  </div>
                  <div className="text-center p-3 bg-[#0a0a0a] rounded-lg">
                    <p className="text-[18px] font-bold text-white">{user.betCount.toLocaleString()}</p>
                    <p className="text-[11px] text-[#777]">Bets</p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 p-2 border-b border-[#222]">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-[#222] text-white'
                        : 'text-[#777] hover:text-white'
                    }`}
                  >
                    {tab.label}
                    {tab.id === 'warnings' && user.warningCount > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.5 bg-yellow-500/20 text-yellow-500 text-[10px] rounded">
                        {user.warningCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="p-4">
                {activeTab === 'posts' && (
                  <div className="space-y-3">
                    {user.posts.length === 0 ? (
                      <p className="text-[14px] text-[#555] text-center py-8">No posts</p>
                    ) : (
                      user.posts.slice(0, 10).map((post) => (
                        <div key={post.id} className="p-3 bg-[#0a0a0a] rounded-lg">
                          <p className="text-[13px] text-[#ccc] mb-2 line-clamp-2">{post.content}</p>
                          <div className="flex items-center gap-4 text-[11px] text-[#555]">
                            <span>{post.likes} likes</span>
                            <span>{post.replies} replies</span>
                            <span>{formatRelativeTime(post.createdAt)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'bets' && (
                  <div className="space-y-3">
                    {user.bets.length === 0 ? (
                      <p className="text-[14px] text-[#555] text-center py-8">No bets</p>
                    ) : (
                      user.bets.slice(0, 10).map((bet) => (
                        <div key={bet.id} className="p-3 bg-[#0a0a0a] rounded-lg">
                          <p className="text-[13px] text-[#ccc] mb-1">{bet.eventTitle}</p>
                          <div className="flex items-center gap-4 text-[11px]">
                            <span className={bet.outcome === 'doom' ? 'text-red-400' : 'text-green-400'}>
                              {bet.outcome.toUpperCase()}
                            </span>
                            <span className="text-[#777]">{bet.amount.toLocaleString()} tokens</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                              bet.status === 'won' ? 'bg-green-500/20 text-green-400' :
                              bet.status === 'lost' ? 'bg-red-500/20 text-red-400' :
                              bet.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {bet.status}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'warnings' && (
                  <div className="space-y-3">
                    {user.warnings.length === 0 ? (
                      <p className="text-[14px] text-[#555] text-center py-8">No warnings</p>
                    ) : (
                      user.warnings.map((warning) => (
                        <div key={warning.id} className="p-3 bg-[#0a0a0a] rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              warning.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                              warning.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-blue-500/20 text-blue-400'
                            }`}>
                              {warning.severity}
                            </span>
                            <span className="text-[11px] text-[#555]">
                              by {warning.issuedBy}
                            </span>
                          </div>
                          <p className="text-[13px] text-[#ccc]">{warning.message}</p>
                          <p className="text-[11px] text-[#555] mt-1">
                            {formatDateTime(warning.createdAt)}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'audit' && (
                  <div className="space-y-3">
                    {user.auditLog.length === 0 ? (
                      <p className="text-[14px] text-[#555] text-center py-8">No audit log entries</p>
                    ) : (
                      user.auditLog.slice(0, 20).map((entry) => (
                        <div key={entry.id} className="p-3 bg-[#0a0a0a] rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[13px] text-[#ccc]">{entry.action}</span>
                            <span className="text-[11px] text-[#555]">
                              {formatRelativeTime(entry.createdAt)}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#555]">
                            by {entry.performedByUsername}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Footer with actions */}
        {user && (
          <div className="flex items-center justify-between p-4 border-t border-[#222]">
            <a
              href={`/profile/${user.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-[#777] hover:text-white transition-colors"
            >
              <ExternalLink size={14} />
              View Public Profile
            </a>
            <div className="flex items-center gap-2">
              {canWarn && (
                <button
                  onClick={onWarn}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 rounded-lg text-[13px] font-medium transition-colors"
                >
                  <AlertTriangle size={14} />
                  Warn
                </button>
              )}
              {canBan && user.status !== 'banned' && (
                <button
                  onClick={onBan}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg text-[13px] font-medium transition-colors"
                >
                  <Ban size={14} />
                  Ban
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
