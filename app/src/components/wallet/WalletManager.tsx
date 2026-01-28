/**
 * WalletManager Component
 * Issue #102: Wallet lifecycle and multi-wallet support
 */

import { useState } from 'react'
import { Wallet, Star, Edit2, Trash2, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { useWalletStore, shortenAddress, getWalletDisplayName } from '@/store'
import type { ConnectionHistoryEntry } from '@/store'

export function WalletManager() {
  const [editingWallet, setEditingWallet] = useState<string | null>(null)
  const [editNickname, setEditNickname] = useState('')
  const [showHistory, setShowHistory] = useState(false)

  const wallets = useWalletStore((state) => state.getConnectedWallets())
  const primaryAddress = useWalletStore((state) => state.primaryWalletAddress)
  const connectionHistory = useWalletStore((state) => state.connectionHistory)
  const setPrimaryWallet = useWalletStore((state) => state.setPrimaryWallet)
  const setWalletNickname = useWalletStore((state) => state.setWalletNickname)
  const removeWallet = useWalletStore((state) => state.removeWallet)
  const clearHistory = useWalletStore((state) => state.clearHistory)

  const handleSaveNickname = (address: string) => {
    if (editNickname.trim()) setWalletNickname(address, editNickname.trim())
    setEditingWallet(null)
    setEditNickname('')
  }

  const formatDate = (ts: number) => new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="bg-[#111] rounded-2xl border border-[#333] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#333]">
        <div className="flex items-center gap-2">
          <Wallet size={18} className="text-[#777]" />
          <h3 className="text-[15px] font-semibold text-white">Connected Wallets</h3>
        </div>
        <span className="text-[13px] text-[#777]">{wallets.length} connected</span>
      </div>
      <div className="divide-y divide-[#222]">
        {wallets.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Wallet size={32} className="mx-auto mb-2 text-[#333]" />
            <p className="text-[14px] text-[#777]">No wallets connected</p>
          </div>
        ) : wallets.map((wallet) => (
          <div key={wallet.address} className="px-4 py-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                {editingWallet === wallet.address ? (
                  <div className="flex items-center gap-2">
                    <input type="text" value={editNickname} onChange={(e) => setEditNickname(e.target.value)} placeholder="Nickname" className="flex-1 bg-[#222] border border-[#444] rounded-lg px-2 py-1 text-[14px] text-white outline-none" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') handleSaveNickname(wallet.address); if (e.key === 'Escape') setEditingWallet(null) }} />
                    <button onClick={() => handleSaveNickname(wallet.address)} className="px-2 py-1 bg-[#00ba7c] text-white text-[12px] rounded-lg">Save</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-medium text-white truncate">{getWalletDisplayName(wallet)}</span>
                    {wallet.address === primaryAddress && <span className="flex items-center gap-1 px-1.5 py-0.5 bg-[#00ba7c20] text-[#00ba7c] text-[10px] font-medium rounded-full"><Star size={10} fill="currentColor" />Primary</span>}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[12px] text-[#777] font-mono">{shortenAddress(wallet.address, 6)}</span>
                  <span className="text-[11px] text-[#555] px-1.5 py-0.5 bg-[#222] rounded">{wallet.walletType}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 ml-2">
                {wallet.address !== primaryAddress && <button onClick={() => setPrimaryWallet(wallet.address)} className="p-1.5 text-[#777] hover:text-[#00ba7c] rounded-lg" title="Set as primary"><Star size={16} /></button>}
                <button onClick={() => { setEditingWallet(wallet.address); setEditNickname(wallet.nickname || '') }} className="p-1.5 text-[#777] hover:text-white rounded-lg" title="Edit"><Edit2 size={16} /></button>
                <button onClick={() => removeWallet(wallet.address)} className="p-1.5 text-[#777] hover:text-[#ff3040] rounded-lg" title="Disconnect"><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {connectionHistory.length > 0 && (
        <div className="border-t border-[#333]">
          <button onClick={() => setShowHistory(!showHistory)} className="w-full flex items-center justify-between px-4 py-3 text-[14px] text-[#777] hover:bg-[#1a1a1a]">
            <div className="flex items-center gap-2"><Clock size={16} /><span>History</span></div>
            {showHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showHistory && <div className="px-4 pb-3 space-y-2">
            {connectionHistory.slice(0, 5).map((e, i) => <HistoryEntry key={`${e.address}-${i}`} entry={e} formatDate={formatDate} />)}
            <button onClick={clearHistory} className="text-[12px] text-[#ff3040] hover:underline">Clear</button>
          </div>}
        </div>
      )}
    </div>
  )
}

function HistoryEntry({ entry, formatDate }: { entry: ConnectionHistoryEntry; formatDate: (ts: number) => string }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 bg-[#0a0a0a] rounded-lg">
      <div>
        <span className="text-[13px] text-white font-mono">{entry.nickname || shortenAddress(entry.address, 4)}</span>
        <div className="flex items-center gap-2 mt-0.5"><span className="text-[11px] text-[#555]">{entry.walletType}</span><span className="text-[11px] text-[#555]">{formatDate(entry.connectedAt)}</span></div>
      </div>
      {entry.disconnectedAt ? <span className="text-[11px] text-[#ff3040]">Disconnected</span> : <span className="text-[11px] text-[#00ba7c]">Active</span>}
    </div>
  )
}
