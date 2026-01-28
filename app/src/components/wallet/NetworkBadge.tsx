/**
 * Network Badge Component
 * Issue #105: Mainnet vs devnet environment configuration
 *
 * Displays current Solana network with visual indicator.
 */

import { getNetworkConfig, getNetworkDisplayName, isMainnet } from '@/lib/solana/config'

interface NetworkBadgeProps {
  className?: string
  showLabel?: boolean
}

export function NetworkBadge({ className = '', showLabel = true }: NetworkBadgeProps) {
  const config = getNetworkConfig()
  const displayName = getNetworkDisplayName()
  const mainnet = isMainnet()

  const colors = {
    'mainnet-beta': 'bg-green-500/20 text-green-400 border-green-500/30',
    'devnet': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'testnet': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'localnet': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  }

  const colorClass = colors[config.network] || colors.devnet

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-medium ${colorClass} ${className}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${mainnet ? 'bg-green-400' : 'bg-yellow-400'}`} />
      {showLabel && <span>{displayName}</span>}
    </div>
  )
}
