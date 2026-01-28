/**
 * SettingsPage
 *
 * User settings and preferences.
 * Features:
 * - Account settings
 * - Notification preferences
 * - Display preferences
 * - Danger zone (logout, delete)
 */

import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  User,
  Bell,
  Moon,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Trash2,
  Volume2,
  Eye,
} from 'lucide-react'
import { useUserStore } from '@/store'
import { useState } from 'react'

/** Setting item component */
interface SettingItemProps {
  icon: React.ReactNode
  label: string
  description?: string
  onClick?: () => void
  rightElement?: React.ReactNode
  danger?: boolean
}

function SettingItem({ icon, label, description, onClick, rightElement, danger }: SettingItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-3 hover:bg-[#111] transition-colors ${
        danger ? 'text-[#ff3040]' : 'text-white'
      }`}
    >
      <div className={danger ? 'text-[#ff3040]' : 'text-[#777]'}>{icon}</div>
      <div className="flex-1 text-left">
        <p className="text-[15px] font-medium">{label}</p>
        {description && (
          <p className="text-[13px] text-[#555]">{description}</p>
        )}
      </div>
      {rightElement || <ChevronRight size={18} className="text-[#555]" />}
    </button>
  )
}

/** Toggle switch component */
interface ToggleProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
}

function Toggle({ enabled, onChange }: ToggleProps) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`w-11 h-6 rounded-full transition-colors ${
        enabled ? 'bg-[#ff3040]' : 'bg-[#333]'
      }`}
    >
      <div
        className={`w-5 h-5 rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-5.5' : 'translate-x-0.5'
        }`}
        style={{ transform: `translateX(${enabled ? '22px' : '2px'})` }}
      />
    </button>
  )
}

export function SettingsPage() {
  const navigate = useNavigate()
  const author = useUserStore((state) => state.author)
  const isConnected = useUserStore((state) => state.isConnected)

  // Local state for toggles
  const [notifications, setNotifications] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [darkMode, setDarkMode] = useState(true)
  const [showBalance, setShowBalance] = useState(true)

  /** Handle logout */
  const handleLogout = () => {
    // Clear local storage
    localStorage.removeItem('doomsday-posts')
    localStorage.removeItem('doomsday-user')
    localStorage.removeItem('doomsday-events')
    window.location.reload()
  }

  return (
    <div className="flex flex-col min-h-full bg-black">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-[#333]">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft size={24} className="text-white" />
        </button>
        <h1 className="text-[17px] font-semibold text-white">Settings</h1>
      </div>

      {/* Account section */}
      <div className="mt-4">
        <h2 className="px-4 text-[13px] font-semibold text-[#777] mb-2">ACCOUNT</h2>
        <div className="border-y border-[#333]">
          <SettingItem
            icon={<User size={20} />}
            label="Profile"
            description={`@${author.username}`}
            onClick={() => navigate('/profile')}
          />
          <SettingItem
            icon={<Shield size={20} />}
            label="Privacy"
            description={isConnected ? 'Connected wallet' : 'Anonymous mode'}
          />
        </div>
      </div>

      {/* Notifications section */}
      <div className="mt-6">
        <h2 className="px-4 text-[13px] font-semibold text-[#777] mb-2">NOTIFICATIONS</h2>
        <div className="border-y border-[#333]">
          <SettingItem
            icon={<Bell size={20} />}
            label="Push notifications"
            description="Get notified about bets and events"
            rightElement={<Toggle enabled={notifications} onChange={setNotifications} />}
          />
          <SettingItem
            icon={<Volume2 size={20} />}
            label="Sound"
            description="Play sounds for notifications"
            rightElement={<Toggle enabled={soundEnabled} onChange={setSoundEnabled} />}
          />
        </div>
      </div>

      {/* Display section */}
      <div className="mt-6">
        <h2 className="px-4 text-[13px] font-semibold text-[#777] mb-2">DISPLAY</h2>
        <div className="border-y border-[#333]">
          <SettingItem
            icon={<Moon size={20} />}
            label="Dark mode"
            description="Always on for doom vibes"
            rightElement={<Toggle enabled={darkMode} onChange={setDarkMode} />}
          />
          <SettingItem
            icon={<Eye size={20} />}
            label="Show balance"
            description="Display token balances"
            rightElement={<Toggle enabled={showBalance} onChange={setShowBalance} />}
          />
        </div>
      </div>

      {/* Support section */}
      <div className="mt-6">
        <h2 className="px-4 text-[13px] font-semibold text-[#777] mb-2">SUPPORT</h2>
        <div className="border-y border-[#333]">
          <SettingItem
            icon={<HelpCircle size={20} />}
            label="Help & FAQ"
            description="Get help with Doomsday"
          />
        </div>
      </div>

      {/* Danger zone */}
      <div className="mt-6">
        <h2 className="px-4 text-[13px] font-semibold text-[#ff3040] mb-2">DANGER ZONE</h2>
        <div className="border-y border-[#333]">
          <SettingItem
            icon={<LogOut size={20} />}
            label="Reset local data"
            description="Clear all local data and start fresh"
            onClick={handleLogout}
            danger
          />
          <SettingItem
            icon={<Trash2 size={20} />}
            label="Delete account"
            description="Permanently delete your account"
            danger
          />
        </div>
      </div>

      {/* Version info */}
      <div className="px-4 py-8 text-center">
        <p className="text-[13px] text-[#555]">Doomsday v0.1.0</p>
        <p className="text-[12px] text-[#444] mt-1">The end is near</p>
      </div>
    </div>
  )
}
