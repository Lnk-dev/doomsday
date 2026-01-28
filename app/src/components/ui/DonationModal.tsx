/**
 * DonationModal
 *
 * Modal for donating $LIFE to other users.
 * Features:
 * - Amount input with quick select
 * - Shows donation cost in $DOOM
 * - Recipient info display
 * - Success animation
 */

import { useState } from 'react'
import { X, Heart, Sparkles } from 'lucide-react'
import { useUserStore } from '@/store'
import { formatNumber } from '@/lib/utils'
import type { Author } from '@/types'

interface DonationModalProps {
  recipient: Author
  onClose: () => void
  onSuccess?: () => void
}

export function DonationModal({ recipient, onClose, onSuccess }: DonationModalProps) {
  const [amount, setAmount] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const doomBalance = useUserStore((state) => state.doomBalance)
  const donateLife = useUserStore((state) => state.donateLife)

  const donationAmount = parseInt(amount) || 0
  const cost = donationAmount // 1:1 ratio for now

  /** Handle donation */
  const handleDonate = () => {
    if (donationAmount <= 0 || cost > doomBalance) return

    const success = donateLife(donationAmount)
    if (success) {
      setShowSuccess(true)
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 1500)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80">
      <div
        className="w-full max-w-lg bg-[#111] rounded-t-3xl animate-slide-up"
        style={{ animation: 'slideUp 0.3s ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#333]">
          <button onClick={onClose}>
            <X size={24} className="text-white" />
          </button>
          <h2 className="text-[17px] font-semibold text-white">Send Life</h2>
          <div className="w-6" /> {/* Spacer for centering */}
        </div>

        {showSuccess ? (
          <div className="flex flex-col items-center justify-center py-16 px-8">
            <div className="w-16 h-16 rounded-full bg-[#00ba7c] flex items-center justify-center mb-4 animate-bounce">
              <Heart size={32} className="text-white fill-white" />
            </div>
            <p className="text-[17px] font-semibold text-white">Life Sent!</p>
            <p className="text-[14px] text-[#777] mt-1">
              You donated {formatNumber(donationAmount)} $LIFE to @{recipient.username}
            </p>
          </div>
        ) : (
          <div className="p-4">
            {/* Recipient */}
            <div className="flex items-center gap-3 p-4 bg-[#1a1a1a] rounded-xl mb-4">
              <div className="w-12 h-12 rounded-full bg-[#333]" />
              <div>
                <p className="text-[15px] font-semibold text-white">
                  @{recipient.username}
                </p>
                <p className="text-[13px] text-[#00ba7c] flex items-center gap-1">
                  <Sparkles size={12} />
                  Will receive $LIFE
                </p>
              </div>
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
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="flex-1 bg-transparent text-[28px] font-bold text-white outline-none"
                />
                <span className="text-[15px] text-[#00ba7c]">$LIFE</span>
              </div>

              {/* Quick amounts */}
              <div className="flex gap-2 mt-3">
                {[10, 50, 100, 500].map((val) => (
                  <button
                    key={val}
                    onClick={() => setAmount(String(Math.min(val, doomBalance)))}
                    className="px-3 py-1.5 rounded-lg bg-[#333] text-[13px] text-white hover:bg-[#444] transition-colors"
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* Cost breakdown */}
            {donationAmount > 0 && (
              <div className="bg-[#0a0a0a] rounded-xl p-4 mb-4 border border-[#222]">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-[#777]">Cost</span>
                  <span className="text-[15px] font-semibold text-[#ff3040]">
                    {formatNumber(cost)} $DOOM
                  </span>
                </div>
                <p className="text-[12px] text-[#555] mt-1">
                  1 $DOOM = 1 $LIFE donation
                </p>
              </div>
            )}

            {/* Donate button */}
            <button
              onClick={handleDonate}
              disabled={donationAmount <= 0 || cost > doomBalance}
              className={`w-full py-4 rounded-xl font-semibold text-[16px] transition-all ${
                donationAmount > 0 && cost <= doomBalance
                  ? 'bg-[#00ba7c] text-white'
                  : 'bg-[#333] text-[#777]'
              }`}
            >
              {cost > doomBalance
                ? 'Insufficient $DOOM'
                : `Send ${formatNumber(donationAmount || 0)} $LIFE`}
            </button>

            {/* Info */}
            <p className="text-[12px] text-[#555] text-center mt-4">
              $LIFE donations support creators in the life feed
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
