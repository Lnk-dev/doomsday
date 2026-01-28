import { PageHeader } from '@/components/layout/PageHeader'
import { Settings, Wallet } from 'lucide-react'

export function ProfilePage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Profile"
        action={
          <button className="p-2 rounded-full hover:bg-neutral-800 transition-colors">
            <Settings size={20} className="text-neutral-400" />
          </button>
        }
      />

      <div className="flex-1 px-4 py-4 space-y-4">
        {/* Wallet connection */}
        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-neutral-800">
              <Wallet size={24} className="text-neutral-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-neutral-400">Not connected</p>
              <p className="text-neutral-500 text-xs">Connect wallet to save progress</p>
            </div>
            <button className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-sm font-medium transition-colors">
              Connect
            </button>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
            <p className="text-xs text-neutral-500 mb-1">$DOOM Balance</p>
            <p className="text-2xl font-bold text-red-400">0</p>
          </div>
          <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
            <p className="text-xs text-neutral-500 mb-1">$LIFE Balance</p>
            <p className="text-2xl font-bold text-green-400">0</p>
          </div>
          <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
            <p className="text-xs text-neutral-500 mb-1">Days Living</p>
            <p className="text-2xl font-bold text-neutral-200">0</p>
          </div>
          <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
            <p className="text-xs text-neutral-500 mb-1">Active Bets</p>
            <p className="text-2xl font-bold text-neutral-200">0</p>
          </div>
        </div>

        {/* Activity section */}
        <div className="rounded-xl bg-neutral-900 border border-neutral-800">
          <div className="p-4 border-b border-neutral-800">
            <h3 className="font-semibold text-neutral-200">Recent Activity</h3>
          </div>
          <div className="p-8 text-center">
            <p className="text-neutral-500">No activity yet</p>
            <p className="text-sm text-neutral-600 mt-1">
              Start posting or betting to see your history
            </p>
          </div>
        </div>

        {/* Anonymous mode info */}
        <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-900/50">
          <p className="text-sm text-amber-400 font-medium mb-1">Anonymous Mode</p>
          <p className="text-xs text-amber-200/70">
            You can use Doomsday without connecting a wallet. Your data is stored locally.
            Connect a wallet to sync across devices and earn real tokens.
          </p>
        </div>
      </div>
    </div>
  )
}
