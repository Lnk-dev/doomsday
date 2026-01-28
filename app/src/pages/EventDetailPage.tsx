/**
 * EventDetailPage
 *
 * Detailed view of a prediction event with betting UI.
 * Features:
 * - Live countdown timer
 * - Doom vs Life stake visualization
 * - Bet placement with amount input
 * - Potential payout calculation
 * - Related posts section
 */

import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, TrendingUp, AlertTriangle, Sparkles } from 'lucide-react'
import { useEventsStore, useUserStore } from '@/store'
import { formatCountdown, formatNumber } from '@/lib/utils'
import { useState, useEffect } from 'react'

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

  // Store hooks
  const getEvent = useEventsStore((state) => state.getEvent)
  const placeBet = useEventsStore((state) => state.placeBet)
  const doomBalance = useUserStore((state) => state.doomBalance)
  const spendDoom = useUserStore((state) => state.spendDoom)
  const userId = useUserStore((state) => state.userId)

  // Local state
  const [selectedSide, setSelectedSide] = useState<'doom' | 'life'>('doom')
  const [betAmount, setBetAmount] = useState('')
  const [countdown, setCountdown] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const event = eventId ? getEvent(eventId) : undefined

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
  const potentialWin = selectedSide === 'doom'
    ? amount > 0 && event.doomStake > 0
      ? (amount / (event.doomStake + amount)) * (totalStake + amount)
      : amount * 2
    : amount > 0 && event.lifeStake > 0
      ? (amount / (event.lifeStake + amount)) * (totalStake + amount)
      : amount * 2

  const categoryColor = categoryColors[event.category] || categoryColors.other

  /** Handle bet placement */
  const handlePlaceBet = () => {
    if (amount <= 0 || amount > doomBalance) return

    const success = spendDoom(amount)
    if (success) {
      placeBet(event.id, selectedSide, amount, userId)
      setBetAmount('')
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 2000)
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
            by @{event.createdBy.username}
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
            {formatNumber(totalStake)} $DOOM
          </p>
        </div>
      </div>

      {/* Betting UI */}
      <div className="p-4">
        <h3 className="text-[15px] font-semibold text-white mb-4">Place Your Bet</h3>

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
              Balance: {formatNumber(doomBalance)} $DOOM
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
            <span className="text-[15px] text-[#777]">$DOOM</span>
          </div>

          {/* Quick amounts */}
          <div className="flex gap-2 mt-3">
            {[100, 500, 1000].map((val) => (
              <button
                key={val}
                onClick={() => setBetAmount(String(Math.min(val, doomBalance)))}
                className="px-3 py-1.5 rounded-lg bg-[#333] text-[13px] text-white"
              >
                {val}
              </button>
            ))}
            <button
              onClick={() => setBetAmount(String(doomBalance))}
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
                  {formatNumber(Math.floor(potentialWin))} $DOOM
                </span>
              </div>
            </div>
            <p className="text-[12px] text-[#555] mt-1">
              {((potentialWin / amount - 1) * 100).toFixed(0)}% return if {selectedSide === 'doom' ? 'event occurs' : 'event doesn\'t occur'}
            </p>
          </div>
        )}

        {/* Place bet button */}
        <button
          onClick={handlePlaceBet}
          disabled={amount <= 0 || amount > doomBalance}
          className={`w-full py-4 rounded-xl font-semibold text-[16px] transition-all ${
            amount > 0 && amount <= doomBalance
              ? selectedSide === 'doom'
                ? 'bg-[#ff3040] text-white'
                : 'bg-[#00ba7c] text-white'
              : 'bg-[#333] text-[#777]'
          }`}
        >
          {showSuccess
            ? 'Bet Placed!'
            : amount > doomBalance
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
          </ul>
        </div>
      </div>
    </div>
  )
}
