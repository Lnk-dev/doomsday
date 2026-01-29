/**
 * Bet Confirmation Component
 * Issues #34, #35, #36: On-chain betting UI
 *
 * Modal component for confirming and executing bet placement transactions.
 */

import { useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { AlertTriangle, Loader2, CheckCircle, XCircle, Skull, Heart } from 'lucide-react'
import { useEventsStore } from '@/store/events'
import { usePredictionsStore } from '@/store/predictions'
import { useTransaction } from '@/hooks/useTransaction'
import { getExplorerUrl } from '@/lib/solana/config'
import { calculateEstimatedPayout, Outcome } from '@/lib/solana/programs/predictionMarket'

interface BetConfirmationProps {
  eventId: string
  onChainEventId?: number
  eventTitle: string
  outcome: 'doom' | 'life'
  amount: number
  currentDoomPool: number
  currentLifePool: number
  onClose: () => void
  onSuccess?: () => void
}

type ConfirmationState = 'preview' | 'signing' | 'confirming' | 'success' | 'error'

export function BetConfirmation({
  eventId,
  onChainEventId,
  eventTitle,
  outcome,
  amount,
  currentDoomPool,
  currentLifePool,
  onClose,
  onSuccess,
}: BetConfirmationProps) {
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  const { placeBet, placeBetOnChain } = useEventsStore()
  const { recordPrediction } = usePredictionsStore()
  const { sendTransaction, isLoading } = useTransaction()

  const [state, setState] = useState<ConfirmationState>('preview')
  const [error, setError] = useState<string | null>(null)
  const [signature, setSignature] = useState<string | null>(null)

  // Calculate estimated payout
  const feeBasisPoints = 200 // 2% fee
  const { payout, fee, odds } = calculateEstimatedPayout(
    amount,
    outcome === 'doom' ? Outcome.Doom : Outcome.Life,
    currentDoomPool,
    currentLifePool,
    feeBasisPoints
  )

  const potentialProfit = payout - amount
  const impliedProbability = outcome === 'doom' ? odds : 100 - odds

  const handleConfirm = async () => {
    if (!publicKey) {
      setError('Please connect your wallet')
      return
    }

    try {
      // Check if this is an on-chain event
      if (onChainEventId !== undefined) {
        setState('signing')

        // Build the transaction
        const { transaction } = await placeBetOnChain(
          connection,
          publicKey,
          onChainEventId,
          outcome,
          amount
        )

        setState('confirming')

        // Send transaction
        const result = await sendTransaction(
          transaction,
          'bet',
          `Bet ${amount} on ${outcome.toUpperCase()}`
        )

        if (result.success && result.signature) {
          setSignature(result.signature)
          setState('success')

          // Record prediction locally
          recordPrediction(eventId, publicKey.toBase58(), outcome, amount)

          onSuccess?.()
        } else if (result.error) {
          setError(result.error.message)
          setState('error')
        }
      } else {
        // Local mock bet (for development)
        placeBet(eventId, outcome, amount, publicKey.toBase58())
        recordPrediction(eventId, publicKey.toBase58(), outcome, amount)
        setState('success')
        onSuccess?.()
      }
    } catch (err) {
      console.error('Bet failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to place bet')
      setState('error')
    }
  }

  const renderPreview = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-bold text-white mb-2">Confirm Your Bet</h3>
        <p className="text-zinc-400 text-sm">{eventTitle}</p>
      </div>

      {/* Outcome Selection */}
      <div
        className={`p-4 rounded-lg border-2 ${
          outcome === 'doom'
            ? 'border-red-500 bg-red-500/10'
            : 'border-emerald-500 bg-emerald-500/10'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {outcome === 'doom' ? (
              <Skull className="w-5 h-5 text-red-500" />
            ) : (
              <Heart className="w-5 h-5 text-emerald-500" />
            )}
            <span className="font-medium text-white">
              Betting on {outcome === 'doom' ? 'DOOM' : 'LIFE'}
            </span>
          </div>
          <span className="text-sm text-zinc-400">
            {impliedProbability.toFixed(1)}% implied odds
          </span>
        </div>
      </div>

      {/* Bet Details */}
      <div className="bg-zinc-800 rounded-lg p-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-400">Bet Amount</span>
          <span className="text-white font-medium">
            {amount.toLocaleString()} ${outcome === 'doom' ? 'DOOM' : 'LIFE'}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-zinc-400">Estimated Payout</span>
          <span className="text-emerald-400 font-medium">
            {payout.toLocaleString(undefined, { maximumFractionDigits: 2 })} tokens
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-zinc-400">Potential Profit</span>
          <span className="text-emerald-400 font-medium">
            +{potentialProfit.toLocaleString(undefined, { maximumFractionDigits: 2 })} tokens
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-zinc-400">Platform Fee (2%)</span>
          <span className="text-zinc-500">
            {fee.toLocaleString(undefined, { maximumFractionDigits: 2 })} tokens
          </span>
        </div>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-200">
          Bets are final and cannot be reversed. Funds will be locked until the event is resolved.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg font-medium text-white transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={isLoading}
          className={`flex-1 px-4 py-3 rounded-lg font-medium text-white transition-colors ${
            outcome === 'doom'
              ? 'bg-red-600 hover:bg-red-500'
              : 'bg-emerald-600 hover:bg-emerald-500'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          Confirm Bet
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
      <h3 className="text-lg font-bold text-white mb-2">Confirming Transaction</h3>
      <p className="text-zinc-400 text-sm">Waiting for blockchain confirmation...</p>
    </div>
  )

  const renderSuccess = () => (
    <div className="text-center py-8">
      <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
      <h3 className="text-lg font-bold text-white mb-2">Bet Placed Successfully!</h3>
      <p className="text-zinc-400 text-sm mb-4">
        Your bet of {amount.toLocaleString()} ${outcome === 'doom' ? 'DOOM' : 'LIFE'} has been placed.
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
      <h3 className="text-lg font-bold text-white mb-2">Transaction Failed</h3>
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
