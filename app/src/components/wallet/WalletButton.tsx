/**
 * Wallet Button Component
 * Issue #33: Implement Solana wallet connection
 * Issue #49: Accessibility improvements (WCAG 2.1)
 *
 * Displays wallet connection status and allows connect/disconnect.
 * Includes full keyboard navigation and screen reader support.
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
        aria-busy={connecting}
        className={`flex items-center gap-2 px-4 py-2 bg-[#ff3040] hover:bg-[#ff3040]/90
          text-white font-medium rounded-lg transition-colors disabled:opacity-50
          focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black ${className}`}
      >
        <Wallet className="w-4 h-4" aria-hidden="true" />
        {connecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
    )
  }

  // Connected - compact variant (just address)
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`} role="group" aria-label="Wallet actions">
        <button
          onClick={handleCopyAddress}
          aria-label={copied ? 'Address copied' : `Copy wallet address ${shortenedAddress}`}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700
            text-zinc-200 text-sm font-mono rounded-lg transition-colors
            focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
          {shortenedAddress}
        </button>
        <button
          onClick={disconnect}
          aria-label="Disconnect wallet"
          className="p-1.5 text-zinc-400 hover:text-red-400 transition-colors
            focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-lg"
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    )
  }

  // Connected - default variant (full details)
  return (
    <div
      className={`flex flex-col gap-2 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700 ${className}`}
      role="region"
      aria-label="Wallet information"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full" aria-hidden="true" />
          <span className="text-sm text-zinc-400">Connected</span>
        </div>
        <button
          onClick={disconnect}
          aria-label="Disconnect wallet"
          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-red-400 transition-colors
            focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-lg"
        >
          <LogOut className="w-3 h-3" aria-hidden="true" />
          Disconnect
        </button>
      </div>

      <button
        onClick={handleCopyAddress}
        aria-label={copied ? 'Address copied' : `Copy wallet address ${shortenedAddress}`}
        className="flex items-center gap-2 text-sm font-mono text-zinc-200 hover:text-white transition-colors
          focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-lg"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-green-400" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5 text-zinc-500" aria-hidden="true" />}
        {shortenedAddress}
      </button>

      {formattedSolBalance !== null && (
        <div className="flex items-center justify-between pt-2 border-t border-zinc-700">
          <span className="text-sm text-zinc-400">Balance</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-200">{formattedSolBalance} SOL</span>
            <button
              onClick={handleRefresh}
              aria-label={refreshing ? 'Refreshing balance' : 'Refresh balance'}
              aria-busy={refreshing}
              className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors
                focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-full"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
