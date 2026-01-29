/**
 * ActivityPage
 * Issue #56: Add @mentions and user tagging
 *
 * Page for viewing notifications including mentions.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, AtSign, Heart, Users, Repeat2, CheckCheck } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useNotificationsStore, type Notification } from '@/store/notifications'
import { formatRelativeTime } from '@/lib/utils'

type ActivityTab = 'all' | 'mentions' | 'likes' | 'follows'

const tabs: { id: ActivityTab; label: string; icon: typeof Bell }[] = [
  { id: 'all', label: 'All', icon: Bell },
  { id: 'mentions', label: 'Mentions', icon: AtSign },
  { id: 'likes', label: 'Likes', icon: Heart },
  { id: 'follows', label: 'Follows', icon: Users },
]

export function ActivityPage() {
  const [activeTab, setActiveTab] = useState<ActivityTab>('all')
  const navigate = useNavigate()

  const notifications = useNotificationsStore((state) => state.notifications)
  const markAsRead = useNotificationsStore((state) => state.markAsRead)
  const markAllAsRead = useNotificationsStore((state) => state.markAllAsRead)
  const unreadCount = useNotificationsStore((state) => state.unreadCount)

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'all') return true
    if (activeTab === 'mentions') return n.type === 'mention'
    if (activeTab === 'likes') return n.type === 'like'
    if (activeTab === 'follows') return n.type === 'follow'
    return true
  })

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id)

    if (notification.postId) {
      navigate(`/post/${notification.postId}`)
    } else if (notification.type === 'follow') {
      navigate(`/timeline/${notification.fromUsername}`)
    }
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'mention':
        return <AtSign size={16} className="text-[#1d9bf0]" />
      case 'like':
        return <Heart size={16} className="text-[#ff3040]" fill="#ff3040" />
      case 'reply':
        return <Bell size={16} className="text-[#00ba7c]" />
      case 'follow':
        return <Users size={16} className="text-[#9333ea]" />
      case 'repost':
        return <Repeat2 size={16} className="text-[#00ba7c]" />
      default:
        return <Bell size={16} className="text-[#777]" />
    }
  }

  const getNotificationText = (notification: Notification) => {
    switch (notification.type) {
      case 'mention':
        return 'mentioned you'
      case 'like':
        return 'liked your post'
      case 'reply':
        return 'replied to your post'
      case 'follow':
        return 'started following you'
      case 'repost':
        return 'reposted your post'
      default:
        return 'interacted with you'
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="Activity"
        rightAction={
          unreadCount > 0 ? (
            <button
              onClick={markAllAsRead}
              className="p-1 text-[#777] hover:text-white transition-colors"
              aria-label="Mark all as read"
            >
              <CheckCheck size={22} />
            </button>
          ) : undefined
        }
      />

      {/* Tab bar */}
      <div className="flex border-b border-[#333]">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-[14px] font-semibold transition-colors relative ${
                activeTab === tab.id ? 'text-white' : 'text-[#777]'
              }`}
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{tab.label}</span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
              )}
            </button>
          )
        })}
      </div>

      {/* Notifications list */}
      <div className="flex-1">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#777]">
            <Bell size={48} className="mb-4 opacity-50" />
            <p className="text-[15px] font-medium">
              No {activeTab === 'all' ? 'activity' : activeTab} yet
            </p>
            <p className="text-[13px] mt-1">
              {activeTab === 'mentions'
                ? "When someone mentions you, you'll see it here"
                : activeTab === 'likes'
                  ? "When someone likes your post, you'll see it here"
                  : activeTab === 'follows'
                    ? "When someone follows you, you'll see it here"
                    : "Your notifications will appear here"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#333]">
            {filteredNotifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${
                  notification.isRead ? 'bg-transparent' : 'bg-[#1a1a1a]'
                } hover:bg-[#1a1a1a]`}
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-full bg-[#252525] flex-shrink-0 flex items-center justify-center">
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] text-white">
                    <span className="font-semibold text-[#1d9bf0]">
                      @{notification.fromUsername}
                    </span>{' '}
                    {getNotificationText(notification)}
                  </p>
                  {notification.preview && (
                    <p className="text-[14px] text-[#777] truncate mt-0.5">
                      {notification.preview}
                    </p>
                  )}
                  <p className="text-[13px] text-[#555] mt-1">
                    {formatRelativeTime(notification.createdAt)}
                  </p>
                </div>

                {/* Unread indicator */}
                {!notification.isRead && (
                  <div className="w-2 h-2 rounded-full bg-[#1d9bf0] flex-shrink-0 mt-2" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
