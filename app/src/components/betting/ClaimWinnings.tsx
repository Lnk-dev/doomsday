/**
 * Claim Winnings Component
 * Issues #34, #35, #36: On-chain winnings claim UI
 *
 * Component for claiming winnings from resolved prediction events.
 */

import { useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Loader2, CheckCircle, XCircle, Trophy, Coins } from 'lucide-react'
import { useEventsStore } from '@/store/events'
import { usePredictionsStore } from '@/store/predictions'
import { useTransaction } from '@/hooks/useTransaction'
import { getExplorerUrl } from '@/lib/solana/config'

interface ClaimWinningsProps {
  eventId: string
  onChainEventId?: number
  eventTitle: string
  outcome: 'doom' | 'life'
  amount: number
  estimatedPayout: number
  onClose: () => void
  onSuccess?: () => void
}

type ClaimState = 'preview' | 'signing' | 'confirming' | 'success' | 'error'

export function ClaimWinnings({
  eventId,
  onChainEventId,
  eventTitle,
  outcome,
  amount,
  estimatedPayout,
  onClose,
  onSuccess,
}: ClaimWinningsProps) {
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  const { claimWinningsOnChain } = useEventsStore()
  const { markPredictionClaimed } = usePredictionsStore()
  const { sendTransaction, isLoading } = useTransaction()

  const [state, setState] = useState<ClaimState>('preview')
  const [error, setError] = useState<string | null>(null)
  const [signature, setSignature] = useState<string | null>(null)

  const profit = estimatedPayout - amount

  const handleClaim = async () => {
    if (!publicKey) {
      setError('Please connect your wallet')
      return
    }

    if (onChainEventId === undefined) {
      // Local mock - just mark as claimed
      const predictions = usePredictionsStore.getState().predictions
      const prediction = predictions.find(
        (p) => p.eventId === eventId && p.userId === publicKey.toBase58()
      )
      if (prediction) {
        markPredictionClaimed(prediction.id)
      }
      setState('success')
      onSuccess?.()
      return
    }

    try {
      setState('signing')

      const betOutcome = outcome === 'doom' ? 0 : 1
      const { transaction } = await claimWinningsOnChain(
        connection,
        publicKey,
        onChainEventId,
        betOutcome as 0 | 1
      )

      setState('confirming')

      const result = await sendTransaction(
        transaction,
        'other',
        `Claim winnings from ${eventTitle}`
      )

      if (result.success && result.signature) {
        setSignature(result.signature)
        setState('success')

        // Mark prediction as claimed locally
        const predictions = usePredictionsStore.getState().predictions
        const prediction = predictions.find(
          (p) => p.eventId === eventId && p.userId === publicKey.toBase58()
        )
        if (prediction) {
          markPredictionClaimed(prediction.id)
        }

        onSuccess?.()
      } else if (result.error) {
        setError(result.error.message)
        setState('error')
      }
    } catch (err) {
      console.error('Claim failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to claim winnings')
      setState('error')
    }
  }

  const renderPreview = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white mb-2">Claim Your Winnings!</h3>
        <p className="text-zinc-400 text-sm">{eventTitle}</p>
      </div>

      {/* Winning Outcome */}
      <div
        className={`p-4 rounded-lg border-2 text-center ${
          outcome === 'doom'
            ? 'border-red-500 bg-red-500/10'
            : 'border-emerald-500 bg-emerald-500/10'
        }`}
      >
        <span className="font-medium text-white">
          You bet on {outcome === 'doom' ? 'DOOM' : 'LIFE'} and WON!
        </span>
      </div>

      {/* Payout Details */}
      <div className="bg-zinc-800 rounded-lg p-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-400">Original Bet</span>
          <span className="text-white font-medium">
            {amount.toLocaleString()} ${outcome === 'doom' ? 'DOOM' : 'LIFE'}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-zinc-400">Winnings</span>
          <span className="text-emerald-400 font-medium">
            +{profit.toLocaleString(undefined, { maximumFractionDigits: 2 })} tokens
          </span>
        </div>
        <div className="border-t border-zinc-700 my-2" />
        <div className="flex justify-between">
          <span className="text-zinc-300 font-medium">Total Payout</span>
          <span className="text-emerald-400 font-bold text-lg">
            {estimatedPayout.toLocaleString(undefined, { maximumFractionDigits: 2 })} tokens
          </span>
        </div>
      </div>

      {/* Payout Breakdown */}
      <div className="flex items-start gap-2 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
        <Coins className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-emerald-200">
          You'll receive your original bet back plus your share of the losing pool (minus 2% platform fee).
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg font-medium text-white transition-colors"
        >
          Later
        </button>
        <button
          onClick={handleClaim}
          disabled={isLoading}
          className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Claim Winnings
        </button>
      </div>
    </div>
  )

  const renderSigning = () => (
    <div className="text-center py-8">
      <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
      <h3 className="text-lg font-bold text-white mb-2">Waiting for Signature</h3>
      <p className="text-zinc-400 text-sm">Please approve the transaction in your wallet...</p>
    </div>
  )

  const renderConfirming = () => (
    <div className="text-center py-8">
      <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
      <h3 className="text-lg font-bold text-white mb-2">Processing Claim</h3>
      <p className="text-zinc-400 text-sm">Waiting for blockchain confirmation...</p>
    </div>
  )

  const renderSuccess = () => (
    <div className="text-center py-8">
      <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
      <h3 className="text-lg font-bold text-white mb-2">Winnings Claimed!</h3>
      <p className="text-zinc-400 text-sm mb-2">
        {estimatedPayout.toLocaleString(undefined, { maximumFractionDigits: 2 })} tokens have been transferred to your wallet.
      </p>
      {signature && (
        <a
          href={getExplorerUrl(signature, 'tx')}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 text-sm underline"
        >
          View transaction on Explorer
        </a>
      )}
      <button
        onClick={onClose}
        className="mt-6 w-full px-4 py-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg font-medium text-white transition-colors"
      >
        Close
      </button>
    </div>
  )

  const renderError = () => (
    <div className="text-center py-8">
      <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
      <h3 className="text-lg font-bold text-white mb-2">Claim Failed</h3>
      <p className="text-red-400 text-sm mb-4">{error}</p>
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg font-medium text-white transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            setError(null)
            setState('preview')
          }}
          className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium text-white transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 rounded-xl p-6 w-full max-w-md mx-4 border border-zinc-800">
        {state === 'preview' && renderPreview()}
        {state === 'signing' && renderSigning()}
        {state === 'confirming' && renderConfirming()}
        {state === 'success' && renderSuccess()}
        {state === 'error' && renderError()}
      </div>
    </div>
  )
}

/**
 * Card component showing claimable winnings for an event
 */
interface ClaimableWinningsCardProps {
  eventId: string
  onChainEventId?: number
  eventTitle: string
  outcome: 'doom' | 'life'
  amount: number
  estimatedPayout: number
  onClaim: () => void
}

export function ClaimableWinningsCard({
  eventTitle,
  amount,
  estimatedPayout,
  onClaim,
}: ClaimableWinningsCardProps) {
  const profit = estimatedPayout - amount

  return (
    <div className="bg-gradient-to-r from-emerald-900/50 to-zinc-900 rounded-lg p-4 border border-emerald-500/30">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="text-emerald-400 text-sm font-medium">Winner!</span>
          </div>
          <h4 className="font-medium text-white truncate">{eventTitle}</h4>
          <div className="flex items-center gap-4 mt-2 text-sm text-zinc-400">
            <span>Bet: {amount.toLocaleString()}</span>
            <span className="text-emerald-400">
              +{profit.toLocaleString(undefined, { maximumFractionDigits: 2 })} profit
            </span>
          </div>
        </div>
        <button
          onClick={onClaim}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium text-white text-sm transition-colors whitespace-nowrap"
        >
          Claim {estimatedPayout.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </button>
      </div>
    </div>
  )
}
