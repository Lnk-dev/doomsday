/**
 * NotificationSettingsPage
 *
 * Granular notification preferences for users.
 * Features category-based controls, quiet hours, and delivery preferences.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Bell,
  BellOff,
  Users,
  TrendingUp,
  Shield,
  Megaphone,
  Mail,
  Smartphone,
  Moon,
  Clock,
  Save,
  ChevronRight,
  Info,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'

interface NotificationCategory {
  id: string
  label: string
  description: string
  icon: typeof Bell
  color: string
  enabled: boolean
  push: boolean
  email: boolean
  inApp: boolean
}

interface QuietHours {
  enabled: boolean
  startTime: string
  endTime: string
  allowUrgent: boolean
}

export function NotificationSettingsPage() {
  const navigate = useNavigate()
  const [hasChanges, setHasChanges] = useState(false)

  // Notification categories state
  const [categories, setCategories] = useState<NotificationCategory[]>([
    {
      id: 'social',
      label: 'Social',
      description: 'Follows, likes, replies, reposts, mentions',
      icon: Users,
      color: '#00ba7c',
      enabled: true,
      push: true,
      email: false,
      inApp: true,
    },
    {
      id: 'betting',
      label: 'Predictions',
      description: 'Bet confirmations, outcomes, stake updates',
      icon: TrendingUp,
      color: '#ff3040',
      enabled: true,
      push: true,
      email: true,
      inApp: true,
    },
    {
      id: 'system',
      label: 'System',
      description: 'Security alerts, account updates, terms changes',
      icon: Shield,
      color: '#3b82f6',
      enabled: true,
      push: true,
      email: true,
      inApp: true,
    },
    {
      id: 'marketing',
      label: 'Marketing',
      description: 'New features, promotions, community highlights',
      icon: Megaphone,
      color: '#f59e0b',
      enabled: false,
      push: false,
      email: false,
      inApp: true,
    },
  ])

  // Quiet hours state
  const [quietHours, setQuietHours] = useState<QuietHours>({
    enabled: false,
    startTime: '22:00',
    endTime: '07:00',
    allowUrgent: true,
  })

  // DND state
  const [dndActive, setDndActive] = useState(false)
  const [dndDuration, setDndDuration] = useState<string | null>(null)

  const toggleCategory = (id: string) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === id ? { ...cat, enabled: !cat.enabled } : cat
      )
    )
    setHasChanges(true)
  }

  const toggleCategoryChannel = (id: string, channel: 'push' | 'email' | 'inApp') => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === id ? { ...cat, [channel]: !cat[channel] } : cat
      )
    )
    setHasChanges(true)
  }

  const handleSave = () => {
    // In production, this would save to backend/localStorage
    setHasChanges(false)
    // Show toast or confirmation
  }

  const activateDND = (duration: string) => {
    setDndActive(true)
    setDndDuration(duration)
  }

  return (
    <div className="flex flex-col min-h-full bg-black pb-20">
      <PageHeader
        title="Notifications"
        leftAction={
          <button onClick={() => navigate(-1)} className="p-1">
            <ArrowLeft size={24} className="text-white" />
          </button>
        }
        rightAction={
          hasChanges ? (
            <button
              onClick={handleSave}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#ff3040] text-white text-[13px] font-semibold rounded-full"
            >
              <Save size={14} />
              Save
            </button>
          ) : (
            <Bell size={20} className="text-[#777]" />
          )
        }
      />

      {/* DND Banner */}
      {dndActive && (
        <div className="mx-4 mt-4 p-3 bg-[#ff3040]/10 border border-[#ff3040]/30 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BellOff size={20} className="text-[#ff3040]" />
            <div>
              <p className="text-[14px] text-white font-medium">Do Not Disturb Active</p>
              <p className="text-[12px] text-[#ff3040]">
                {dndDuration === 'custom' ? 'Until you turn it off' : `For ${dndDuration}`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setDndActive(false)}
            className="px-3 py-1.5 text-[13px] text-[#ff3040] hover:bg-[#ff3040]/10 rounded-lg"
          >
            Turn Off
          </button>
        </div>
      )}

      {/* Quick DND */}
      <div className="px-4 py-4 border-b border-[#222]">
        <h2 className="text-[13px] font-semibold text-[#777] mb-3">DO NOT DISTURB</h2>
        <div className="flex flex-wrap gap-2">
          {['1 hour', '4 hours', '8 hours', '24 hours'].map((duration) => (
            <button
              key={duration}
              onClick={() => activateDND(duration)}
              disabled={dndActive}
              className={`px-4 py-2 rounded-full text-[13px] font-medium transition-colors ${
                dndActive
                  ? 'bg-[#1a1a1a] text-[#555] cursor-not-allowed'
                  : 'bg-[#1a1a1a] text-white hover:bg-[#222]'
              }`}
            >
              {duration}
            </button>
          ))}
        </div>
      </div>

      {/* Notification Categories */}
      <div className="px-4 py-4">
        <h2 className="text-[13px] font-semibold text-[#777] mb-3">NOTIFICATION TYPES</h2>
        <div className="space-y-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-[#111] rounded-xl border border-[#222] overflow-hidden"
            >
              {/* Category Header */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    <category.icon size={20} style={{ color: category.color }} />
                  </div>
                  <div>
                    <p className="text-[15px] font-medium text-white">{category.label}</p>
                    <p className="text-[12px] text-[#777]">{category.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleCategory(category.id)}
                  className={`w-11 h-6 rounded-full transition-colors ${
                    category.enabled ? 'bg-[#ff3040]' : 'bg-[#333]'
                  }`}
                >
                  <div
                    className="w-5 h-5 rounded-full bg-white transition-transform"
                    style={{
                      transform: `translateX(${category.enabled ? '22px' : '2px'})`,
                    }}
                  />
                </button>
              </div>

              {/* Channel Options (only if enabled) */}
              {category.enabled && (
                <div className="px-4 pb-4 flex gap-2">
                  <button
                    onClick={() => toggleCategoryChannel(category.id, 'push')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
                      category.push
                        ? 'bg-[#00ba7c]/20 text-[#00ba7c]'
                        : 'bg-[#1a1a1a] text-[#777]'
                    }`}
                  >
                    <Smartphone size={14} />
                    Push
                  </button>
                  <button
                    onClick={() => toggleCategoryChannel(category.id, 'email')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
                      category.email
                        ? 'bg-[#00ba7c]/20 text-[#00ba7c]'
                        : 'bg-[#1a1a1a] text-[#777]'
                    }`}
                  >
                    <Mail size={14} />
                    Email
                  </button>
                  <button
                    onClick={() => toggleCategoryChannel(category.id, 'inApp')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
                      category.inApp
                        ? 'bg-[#00ba7c]/20 text-[#00ba7c]'
                        : 'bg-[#1a1a1a] text-[#777]'
                    }`}
                  >
                    <Bell size={14} />
                    In-App
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="px-4 py-4 border-t border-[#222]">
        <h2 className="text-[13px] font-semibold text-[#777] mb-3">QUIET HOURS</h2>
        <div className="bg-[#111] rounded-xl border border-[#222] overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-[#222]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#9333ea]/20 flex items-center justify-center">
                <Moon size={20} className="text-[#9333ea]" />
              </div>
              <div>
                <p className="text-[15px] font-medium text-white">Enable Quiet Hours</p>
                <p className="text-[12px] text-[#777]">Pause notifications during set times</p>
              </div>
            </div>
            <button
              onClick={() => {
                setQuietHours((prev) => ({ ...prev, enabled: !prev.enabled }))
                setHasChanges(true)
              }}
              className={`w-11 h-6 rounded-full transition-colors ${
                quietHours.enabled ? 'bg-[#9333ea]' : 'bg-[#333]'
              }`}
            >
              <div
                className="w-5 h-5 rounded-full bg-white transition-transform"
                style={{
                  transform: `translateX(${quietHours.enabled ? '22px' : '2px'})`,
                }}
              />
            </button>
          </div>

          {quietHours.enabled && (
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-[12px] text-[#777] mb-1 block">Start Time</label>
                  <div className="flex items-center gap-2 px-3 py-2 bg-[#1a1a1a] rounded-lg">
                    <Clock size={16} className="text-[#777]" />
                    <input
                      type="time"
                      value={quietHours.startTime}
                      onChange={(e) => {
                        setQuietHours((prev) => ({ ...prev, startTime: e.target.value }))
                        setHasChanges(true)
                      }}
                      className="bg-transparent text-white text-[14px] outline-none"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="text-[12px] text-[#777] mb-1 block">End Time</label>
                  <div className="flex items-center gap-2 px-3 py-2 bg-[#1a1a1a] rounded-lg">
                    <Clock size={16} className="text-[#777]" />
                    <input
                      type="time"
                      value={quietHours.endTime}
                      onChange={(e) => {
                        setQuietHours((prev) => ({ ...prev, endTime: e.target.value }))
                        setHasChanges(true)
                      }}
                      className="bg-transparent text-white text-[14px] outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-[#777]" />
                  <span className="text-[14px] text-[#aaa]">Allow urgent security alerts</span>
                </div>
                <button
                  onClick={() => {
                    setQuietHours((prev) => ({ ...prev, allowUrgent: !prev.allowUrgent }))
                    setHasChanges(true)
                  }}
                  className={`w-11 h-6 rounded-full transition-colors ${
                    quietHours.allowUrgent ? 'bg-[#00ba7c]' : 'bg-[#333]'
                  }`}
                >
                  <div
                    className="w-5 h-5 rounded-full bg-white transition-transform"
                    style={{
                      transform: `translateX(${quietHours.allowUrgent ? '22px' : '2px'})`,
                    }}
                  />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Settings Link */}
      <div className="px-4 py-4">
        <button
          onClick={() => navigate('/settings')}
          className="w-full flex items-center justify-between p-4 bg-[#111] rounded-xl border border-[#222] hover:border-[#333] transition-colors"
        >
          <div className="flex items-center gap-3">
            <Info size={20} className="text-[#777]" />
            <span className="text-[14px] text-white">Sound & Vibration Settings</span>
          </div>
          <ChevronRight size={20} className="text-[#777]" />
        </button>
      </div>

      {/* Info Note */}
      <div className="px-4 py-4">
        <p className="text-[12px] text-[#555] text-center">
          Changes to email notifications may take up to 24 hours to take effect.
        </p>
      </div>
    </div>
  )
}
