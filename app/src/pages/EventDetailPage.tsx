/**
 * EventDetailPage
 * Issues #34, #35, #36, #54: On-chain betting integration
 *
 * Detailed view of a prediction event with betting UI.
 * Features:
 * - Live countdown timer
 * - Doom vs Life stake visualization
 * - Bet placement with on-chain transactions
 * - Potential payout calculation
 * - Odds chart
 * - Related posts section
 */

import { useParams, useNavigate } from 'react-router-dom'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { ArrowLeft, Clock, TrendingUp, AlertTriangle, Sparkles, Wallet, Loader2 } from 'lucide-react'
import { useEventsStore, useUserStore } from '@/store'
import { formatCountdown, formatNumber } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { BetConfirmation } from '@/components/betting/BetConfirmation'
import { OddsChart, generateMockOddsData } from '@/components/betting/OddsChart'
import { calculateEstimatedPayout, Outcome } from '@/lib/solana/programs/predictionMarket'
import { useTokenBalance } from '@/hooks/useTokenBalance'

/** Category color mapping */
const categoryColors: Record<string, string> = {
  technology: '#3b82f6',
  economic: '#f59e0b',
  climate: '#22c55e',
  war: '#ef4444',
  natural: '#8b5cf6',
  social: '#ec4899',
  other: '#6b7280',
}

export function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const { connection } = useConnection()
  const { connected } = useWallet()

  // Store hooks
  const getEvent = useEventsStore((state) => state.getEvent)
  const placeBet = useEventsStore((state) => state.placeBet)
  const syncEventFromChain = useEventsStore((state) => state.syncEventFromChain)
  const isLoading = useEventsStore((state) => state.isLoading)

  // User store for mock mode
  const doomBalance = useUserStore((state) => state.doomBalance)
  const spendDoom = useUserStore((state) => state.spendDoom)
  const userId = useUserStore((state) => state.userId)

  // Token balances (for on-chain mode)
  const { doomBalance: onChainDoomBalance, lifeBalance: onChainLifeBalance } = useTokenBalance()

  // Local state
  const [selectedSide, setSelectedSide] = useState<'doom' | 'life'>('doom')
  const [betAmount, setBetAmount] = useState('')
  const [countdown, setCountdown] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [oddsTimeRange, setOddsTimeRange] = useState<'1h' | '24h' | '7d' | '30d' | 'all'>('24h')

  const event = eventId ? getEvent(eventId) : undefined

  // Determine if this is an on-chain event
  const isOnChainEvent = !!event?.onChainEventId

  // Get effective balance
  const effectiveBalance = isOnChainEvent && connected
    ? selectedSide === 'doom'
      ? onChainDoomBalance?.uiAmount ?? 0
      : onChainLifeBalance?.uiAmount ?? 0
    : doomBalance

  // Update countdown every second
  useEffect(() => {
    if (!event) return

    const updateCountdown = () => {
      setCountdown(formatCountdown(event.countdownEnd))
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [event])

  // Sync on-chain event data
  useEffect(() => {
    if (event?.onChainEventId !== undefined && connected) {
      syncEventFromChain(connection, event.onChainEventId)
    }
  }, [event?.onChainEventId, connected, connection, syncEventFromChain])

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full p-8">
        <AlertTriangle size={48} className="text-[#ff3040] mb-4" />
        <p className="text-[15px] text-[#777]">Event not found</p>
        <button
          onClick={() => navigate('/events')}
          className="mt-4 text-[#ff3040]"
        >
          Back to Events
        </button>
      </div>
    )
  }

  const totalStake = event.doomStake + event.lifeStake
  const doomPercent = totalStake > 0 ? (event.doomStake / totalStake) * 100 : 50
  const lifePercent = 100 - doomPercent

  // Calculate potential payout
  const amount = parseFloat(betAmount) || 0
  const feeBasisPoints = 200 // 2% platform fee

  const { payout: potentialWin } = calculateEstimatedPayout(
    amount,
    selectedSide === 'doom' ? Outcome.Doom : Outcome.Life,
    event.doomStake,
    event.lifeStake,
    feeBasisPoints
  )

  const categoryColor = categoryColors[event.category] || categoryColors.other

  // Generate mock odds data for chart
  const oddsData = generateMockOddsData(
    oddsTimeRange === '1h' ? 0.04 : oddsTimeRange === '24h' ? 1 : oddsTimeRange === '7d' ? 7 : 30,
    event.doomStake,
    event.lifeStake
  )

  /** Handle bet placement */
  const handlePlaceBet = () => {
    if (amount <= 0 || amount > effectiveBalance) return

    if (isOnChainEvent && connected) {
      // Show confirmation modal for on-chain bet
      setShowConfirmation(true)
    } else {
      // Local mock bet
      const success = spendDoom(amount)
      if (success) {
        placeBet(event.id, selectedSide, amount, userId)
        setBetAmount('')
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 2000)
      }
    }
  }

  const handleBetSuccess = () => {
    setBetAmount('')
    setShowSuccess(true)
    setShowConfirmation(false)
    setTimeout(() => setShowSuccess(false), 2000)

    // Refresh event data
    if (event.onChainEventId !== undefined) {
      syncEventFromChain(connection, event.onChainEventId)
    }
  }

  return (
    <div className="flex flex-col min-h-full bg-black">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-[#333]">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft size={24} className="text-white" />
        </button>
        <div className="flex-1">
          <span
            className="text-[12px] font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${categoryColor}30`, color: categoryColor }}
          >
            {event.category}
          </span>
          {isOnChainEvent && (
            <span className="ml-2 text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
              ON-CHAIN
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-[#ff3040]">
          <Clock size={14} />
          <span className="text-[13px] font-mono">{countdown}</span>
        </div>
      </div>

      {/* Event content */}
      <div className="p-4">
        <h1 className="text-[22px] font-bold text-white mb-2">{event.title}</h1>
        <p className="text-[15px] text-[#999] leading-relaxed">{event.description}</p>

        {/* Creator */}
        <div className="flex items-center gap-2 mt-4">
          <div className="w-6 h-6 rounded-full bg-[#333]" />
          <span className="text-[13px] text-[#777]">
            by @{event.createdBy.username || event.createdBy.address?.slice(0, 8) || 'anonymous'}
          </span>
        </div>
      </div>

      {/* Stakes visualization */}
      <div className="px-4 py-6 border-y border-[#333] bg-[#0a0a0a]">
        <div className="flex justify-between mb-3">
          <div>
            <p className="text-[12px] text-[#777] mb-1">DOOM Stakes</p>
            <p className="text-[20px] font-bold text-[#ff3040]">
              {formatNumber(event.doomStake)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[12px] text-[#777] mb-1">LIFE Stakes</p>
            <p className="text-[20px] font-bold text-[#00ba7c]">
              {formatNumber(event.lifeStake)}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-3 rounded-full bg-[#333] overflow-hidden flex">
          <div
            className="h-full bg-gradient-to-r from-[#ff3040] to-[#ff6060] transition-all duration-500"
            style={{ width: `${doomPercent}%` }}
          />
          <div
            className="h-full bg-gradient-to-r from-[#00ba7c] to-[#00d68f] transition-all duration-500"
            style={{ width: `${lifePercent}%` }}
          />
        </div>

        <div className="flex justify-between mt-2">
          <span className="text-[13px] text-[#ff3040]">{doomPercent.toFixed(1)}%</span>
          <span className="text-[13px] text-[#00ba7c]">{lifePercent.toFixed(1)}%</span>
        </div>

        <div className="text-center mt-4">
          <p className="text-[12px] text-[#777]">Total Staked</p>
          <p className="text-[16px] font-semibold text-white">
            {formatNumber(totalStake)} tokens
          </p>
        </div>
      </div>

      {/* Odds Chart */}
      <div className="p-4">
        <OddsChart
          data={oddsData}
          eventTitle="Historical Odds"
          timeRange={oddsTimeRange}
          onTimeRangeChange={setOddsTimeRange}
        />
      </div>

      {/* Betting UI */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-semibold text-white">Place Your Bet</h3>
          {isLoading && (
            <Loader2 size={16} className="animate-spin text-zinc-500" />
          )}
        </div>

        {/* Wallet connection notice for on-chain events */}
        {isOnChainEvent && !connected && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 text-blue-400">
              <Wallet size={18} />
              <span className="text-[14px] font-medium">Connect wallet to bet on-chain</span>
            </div>
            <p className="text-[12px] text-blue-300/70 mt-1">
              This event uses blockchain transactions for betting.
            </p>
          </div>
        )}

        {/* Side selector */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setSelectedSide('doom')}
            className={`flex-1 py-3 rounded-xl font-semibold text-[15px] transition-all ${
              selectedSide === 'doom'
                ? 'bg-[#ff3040] text-white'
                : 'bg-[#1a1a1a] text-[#777] border border-[#333]'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <AlertTriangle size={16} />
              DOOM
            </span>
          </button>
          <button
            onClick={() => setSelectedSide('life')}
            className={`flex-1 py-3 rounded-xl font-semibold text-[15px] transition-all ${
              selectedSide === 'life'
                ? 'bg-[#00ba7c] text-white'
                : 'bg-[#1a1a1a] text-[#777] border border-[#333]'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <Sparkles size={16} />
              LIFE
            </span>
          </button>
        </div>

        {/* Amount input */}
        <div className="bg-[#1a1a1a] rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] text-[#777]">Amount</span>
            <span className="text-[13px] text-[#777]">
              Balance: {formatNumber(effectiveBalance)} {isOnChainEvent ? (selectedSide === 'doom' ? '$DOOM' : '$LIFE') : '$DOOM'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              placeholder="0"
              className="flex-1 bg-transparent text-[24px] font-bold text-white outline-none"
            />
            <span className="text-[15px] text-[#777]">
              {isOnChainEvent ? (selectedSide === 'doom' ? '$DOOM' : '$LIFE') : '$DOOM'}
            </span>
          </div>

          {/* Quick amounts */}
          <div className="flex gap-2 mt-3">
            {[100, 500, 1000].map((val) => (
              <button
                key={val}
                onClick={() => setBetAmount(String(Math.min(val, effectiveBalance)))}
                className="px-3 py-1.5 rounded-lg bg-[#333] text-[13px] text-white"
              >
                {val}
              </button>
            ))}
            <button
              onClick={() => setBetAmount(String(effectiveBalance))}
              className="px-3 py-1.5 rounded-lg bg-[#333] text-[13px] text-white"
            >
              MAX
            </button>
          </div>
        </div>

        {/* Potential payout */}
        {amount > 0 && (
          <div className="bg-[#1a1a1a] rounded-xl p-4 mb-4 border border-[#333]">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-[#777]">Potential Win</span>
              <div className="flex items-center gap-1 text-[#00ba7c]">
                <TrendingUp size={14} />
                <span className="text-[17px] font-bold">
                  {formatNumber(Math.floor(potentialWin))} tokens
                </span>
              </div>
            </div>
            <p className="text-[12px] text-[#555] mt-1">
              {((potentialWin / amount - 1) * 100).toFixed(0)}% return if {selectedSide === 'doom' ? 'event occurs' : 'event doesn\'t occur'}
            </p>
            {isOnChainEvent && (
              <p className="text-[11px] text-[#444] mt-1">
                2% platform fee deducted from winnings
              </p>
            )}
          </div>
        )}

        {/* Place bet button */}
        <button
          onClick={handlePlaceBet}
          disabled={amount <= 0 || amount > effectiveBalance || (isOnChainEvent && !connected)}
          className={`w-full py-4 rounded-xl font-semibold text-[16px] transition-all ${
            amount > 0 && amount <= effectiveBalance && (!isOnChainEvent || connected)
              ? selectedSide === 'doom'
                ? 'bg-[#ff3040] text-white'
                : 'bg-[#00ba7c] text-white'
              : 'bg-[#333] text-[#777]'
          }`}
        >
          {showSuccess
            ? 'Bet Placed!'
            : isOnChainEvent && !connected
              ? 'Connect Wallet to Bet'
              : amount > effectiveBalance
                ? 'Insufficient Balance'
                : `Bet ${formatNumber(amount || 0)} on ${selectedSide.toUpperCase()}`}
        </button>
      </div>

      {/* Info section */}
      <div className="px-4 pb-8">
        <div className="bg-[#1a1a1a] rounded-xl p-4">
          <h4 className="text-[13px] font-semibold text-white mb-2">How it works</h4>
          <ul className="text-[12px] text-[#777] space-y-1">
            <li>• <strong>DOOM:</strong> Bet that this event will occur before the countdown ends</li>
            <li>• <strong>LIFE:</strong> Bet that this event won't happen by the deadline</li>
            <li>• Winners split the losing side's stake proportionally</li>
            <li>• If the event occurs, DOOM bettors win. If it expires, LIFE wins.</li>
            {isOnChainEvent && (
              <li>• <strong>On-chain:</strong> Bets are secured by the Solana blockchain</li>
            )}
          </ul>
        </div>
      </div>

      {/* Bet Confirmation Modal */}
      {showConfirmation && (
        <BetConfirmation
          eventId={event.id}
          onChainEventId={event.onChainEventId}
          eventTitle={event.title}
          outcome={selectedSide}
          amount={amount}
          currentDoomPool={event.doomStake}
          currentLifePool={event.lifeStake}
          onClose={() => setShowConfirmation(false)}
          onSuccess={handleBetSuccess}
        />
      )}
    </div>
  )
}
