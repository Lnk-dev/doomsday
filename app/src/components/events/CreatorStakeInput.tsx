/**
 * CreatorStakeInput
 *
 * Component for entering creator stake on their own event.
 * Includes amount input, outcome selector, and balance check.
 */

import { useState } from 'react'
import { Info, Skull, Heart, AlertCircle, Coins } from 'lucide-react'

interface CreatorStakeInputProps {
  amount: number
  outcome: 'doom' | 'life'
  balance: number
  onAmountChange: (amount: number) => void
  onOutcomeChange: (outcome: 'doom' | 'life') => void
}

const presetAmounts = [50, 100, 250, 500, 1000]

export function CreatorStakeInput({
  amount,
  outcome,
  balance,
  onAmountChange,
  onOutcomeChange,
}: CreatorStakeInputProps) {
  const [showInfo, setShowInfo] = useState(false)

  const isOverBalance = amount > balance
  const hasStake = amount > 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-[13px] text-[#777]">Creator Stake (Optional)</label>
          <button
            type="button"
            onClick={() => setShowInfo(!showInfo)}
            className="text-[#555] hover:text-[#999]"
          >
            <Info size={14} />
          </button>
        </div>
        <div className="flex items-center gap-1 text-[12px] text-[#777]">
          <Coins size={12} />
          Balance: <span className="text-white">{balance.toLocaleString()} DOOM</span>
        </div>
      </div>

      {showInfo && (
        <div className="p-3 bg-[#1a1a1a] rounded-lg border border-[#333] text-[12px] text-[#999]">
          <p className="font-medium text-white mb-1">Why stake on your own event?</p>
          <ul className="space-y-1 pl-4 list-disc">
            <li>Shows confidence in your prediction</li>
            <li>Increases your quality score (+15 points)</li>
            <li>Stakes 500+ earn bonus (+10 points)</li>
            <li>Builds credibility with bettors</li>
          </ul>
        </div>
      )}

      {/* Outcome selector */}
      <div>
        <label className="text-[12px] text-[#555] mb-2 block">Your Position</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onOutcomeChange('doom')}
            className={`p-4 rounded-lg border-2 transition-all ${
              outcome === 'doom'
                ? 'border-[#ff3040] bg-[#ff3040]/10'
                : 'border-[#333] hover:border-[#ff3040]/50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Skull size={20} className={outcome === 'doom' ? 'text-[#ff3040]' : 'text-[#777]'} />
              <span className={`text-[14px] font-semibold ${outcome === 'doom' ? 'text-[#ff3040]' : 'text-[#999]'}`}>
                DOOM
              </span>
            </div>
            <p className="text-[11px] text-[#555] mt-1">Event will happen</p>
          </button>

          <button
            type="button"
            onClick={() => onOutcomeChange('life')}
            className={`p-4 rounded-lg border-2 transition-all ${
              outcome === 'life'
                ? 'border-[#00ba7c] bg-[#00ba7c]/10'
                : 'border-[#333] hover:border-[#00ba7c]/50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Heart size={20} className={outcome === 'life' ? 'text-[#00ba7c]' : 'text-[#777]'} />
              <span className={`text-[14px] font-semibold ${outcome === 'life' ? 'text-[#00ba7c]' : 'text-[#999]'}`}>
                LIFE
              </span>
            </div>
            <p className="text-[11px] text-[#555] mt-1">Event won't happen</p>
          </button>
        </div>
      </div>

      {/* Amount input */}
      <div>
        <label className="text-[12px] text-[#555] mb-2 block">Stake Amount</label>
        <div className="relative">
          <input
            type="number"
            value={amount || ''}
            onChange={(e) => onAmountChange(parseInt(e.target.value) || 0)}
            placeholder="0"
            min={0}
            max={balance}
            className={`w-full bg-[#1a1a1a] text-[20px] text-white p-4 pr-20 rounded-lg outline-none focus:ring-2 ${
              isOverBalance ? 'ring-2 ring-[#ff3040]' : 'focus:ring-[#ff3040]'
            }`}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px] text-[#777]">
            DOOM
          </span>
        </div>

        {isOverBalance && (
          <div className="flex items-center gap-1 mt-2 text-[#ff3040]">
            <AlertCircle size={12} />
            <span className="text-[11px]">Insufficient balance</span>
          </div>
        )}

        {/* Preset buttons */}
        <div className="flex flex-wrap gap-2 mt-3">
          {presetAmounts.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onAmountChange(preset)}
              disabled={preset > balance}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                amount === preset
                  ? 'bg-[#ff3040] text-white'
                  : preset > balance
                  ? 'bg-[#222] text-[#444] cursor-not-allowed'
                  : 'bg-[#222] text-[#999] hover:bg-[#333]'
              }`}
            >
              {preset}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onAmountChange(balance)}
            disabled={balance === 0}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
              amount === balance
                ? 'bg-[#ff3040] text-white'
                : balance === 0
                ? 'bg-[#222] text-[#444] cursor-not-allowed'
                : 'bg-[#222] text-[#999] hover:bg-[#333]'
            }`}
          >
            MAX
          </button>
        </div>
      </div>

      {/* Stake summary */}
      {hasStake && !isOverBalance && (
        <div className="p-3 bg-[#1a1a1a] rounded-lg border border-[#333]">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-[#777]">Your stake</span>
            <span className="text-[14px] font-semibold text-white">
              {amount.toLocaleString()} DOOM on{' '}
              <span className={outcome === 'doom' ? 'text-[#ff3040]' : 'text-[#00ba7c]'}>
                {outcome.toUpperCase()}
              </span>
            </span>
          </div>
          {amount >= 500 && (
            <p className="text-[11px] text-[#00ba7c] mt-1">
              +25 quality points (15 base + 10 bonus)
            </p>
          )}
          {amount > 0 && amount < 500 && (
            <p className="text-[11px] text-[#777] mt-1">
              +15 quality points (stake 500+ for +10 bonus)
            </p>
          )}
        </div>
      )}

      {/* Skip option */}
      {!hasStake && (
        <p className="text-[11px] text-[#555] text-center">
          Staking is optional but improves your quality score
        </p>
      )}
    </div>
  )
}
