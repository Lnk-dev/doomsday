/**
 * Wallet Button Component
 * Issue #33: Implement Solana wallet connection
 *
 * Displays wallet connection status and allows connect/disconnect.
 */

import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { Wallet, LogOut, Copy, Check, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { useWallet } from '@/hooks/useWallet'

interface WalletButtonProps {
  variant?: 'default' | 'compact'
  className?: string
}

export function WalletButton({ variant = 'default', className = '' }: WalletButtonProps) {
  const { setVisible } = useWalletModal()
  const {
    connected,
    connecting,
    shortenedAddress,
    address,
    formattedSolBalance,
    disconnect,
    refreshBalance,
  } = useWallet()

  const [copied, setCopied] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const handleConnect = () => {
    setVisible(true)
  }

  const handleCopyAddress = async () => {
    if (!address) return
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy address:', error)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await refreshBalance()
    setTimeout(() => setRefreshing(false), 500)
  }

  // Not connected - show connect button
  if (!connected) {
    return (
      <button
        onClick={handleConnect}
        disabled={connecting}
        className={`flex items-center gap-2 px-4 py-2 bg-[#ff3040] hover:bg-[#ff3040]/90
          text-white font-medium rounded-lg transition-colors disabled:opacity-50 ${className}`}
      >
        <Wallet className="w-4 h-4" />
        {connecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
    )
  }

  // Connected - compact variant (just address)
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <button
          onClick={handleCopyAddress}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700
            text-zinc-200 text-sm font-mono rounded-lg transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          {shortenedAddress}
        </button>
        <button
          onClick={disconnect}
          className="p-1.5 text-zinc-400 hover:text-red-400 transition-colors"
          title="Disconnect"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    )
  }

  // Connected - default variant (full details)
  return (
    <div className={`flex flex-col gap-2 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full" />
          <span className="text-sm text-zinc-400">Connected</span>
        </div>
        <button
          onClick={disconnect}
          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-3 h-3" />
          Disconnect
        </button>
      </div>

      <button
        onClick={handleCopyAddress}
        className="flex items-center gap-2 text-sm font-mono text-zinc-200 hover:text-white transition-colors"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-500" />}
        {shortenedAddress}
      </button>

      {formattedSolBalance !== null && (
        <div className="flex items-center justify-between pt-2 border-t border-zinc-700">
          <span className="text-sm text-zinc-400">Balance</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-200">{formattedSolBalance} SOL</span>
            <button
              onClick={handleRefresh}
              className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
              title="Refresh balance"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
