/**
 * DonationModal
 *
 * Modal for donating $LIFE to other users.
 * Features:
 * - Amount input with quick select
 * - Form validation for donation amount
 * - Shows donation cost in $DOOM
 * - Recipient info display
 * - Success animation
 */

import { useState, useMemo, useCallback } from 'react'
import { X, Heart, Sparkles, AlertCircle } from 'lucide-react'
import { useUserStore } from '@/store'
import { formatNumber } from '@/lib/utils'
import { minValue, maxValue, validateField } from '@/lib/validation'
import { FormField } from '@/components/ui/FormField'
import type { Author } from '@/types'

interface DonationModalProps {
  recipient: Author
  onClose: () => void
  onSuccess?: () => void
}

/** Validation constants */
const MIN_DONATION = 1
const MAX_DONATION = 1000000

export function DonationModal({ recipient, onClose, onSuccess }: DonationModalProps) {
  const [amount, setAmount] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [touched, setTouched] = useState(false)

  const doomBalance = useUserStore((state) => state.doomBalance)
  const donateLife = useUserStore((state) => state.donateLife)

  const donationAmount = parseInt(amount) || 0
  const cost = donationAmount // 1:1 ratio for now

  // Build validation rules dynamically based on balance
  const amountRules = useMemo(() => [
    minValue(MIN_DONATION, `Minimum donation is ${MIN_DONATION} $LIFE`),
    maxValue(Math.min(doomBalance, MAX_DONATION),
      doomBalance < donationAmount
        ? `Insufficient balance. You have ${formatNumber(doomBalance)} $DOOM`
        : `Maximum donation is ${formatNumber(MAX_DONATION)} $LIFE`
    ),
  ], [doomBalance, donationAmount])

  // Validate amount
  const validation = useMemo(() => {
    if (!amount || amount.trim() === '') {
      return { isValid: false, error: 'Please enter an amount' }
    }
    return validateField(donationAmount, amountRules)
  }, [amount, donationAmount, amountRules])

  const amountError = touched ? validation.error : undefined
  const isValid = validation.isValid && donationAmount > 0 && cost <= doomBalance

  /** Handle amount change */
  const handleAmountChange = useCallback((value: string) => {
    // Only allow positive integers
    const sanitized = value.replace(/[^0-9]/g, '')
    setAmount(sanitized)
  }, [])

  /** Handle quick amount selection */
  const handleQuickAmount = useCallback((val: number) => {
    const cappedValue = Math.min(val, doomBalance)
    setAmount(String(cappedValue))
    setTouched(true)
  }, [doomBalance])

  /** Handle donation */
  const handleDonate = () => {
    setTouched(true)

    if (!isValid) return

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
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80"
      role="dialog"
      aria-modal="true"
      aria-labelledby="donation-modal-title"
    >
      <div
        className="w-full max-w-lg bg-[#111] rounded-t-3xl animate-slide-up"
        style={{ animation: 'slideUp 0.3s ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#333]">
          <button onClick={onClose} aria-label="Close donation dialog">
            <X size={24} className="text-white" aria-hidden="true" />
          </button>
          <h2 id="donation-modal-title" className="text-[17px] font-semibold text-white">Send Life</h2>
          <div className="w-6" aria-hidden="true" /> {/* Spacer for centering */}
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
                  <Sparkles size={12} aria-hidden="true" />
                  Will receive $LIFE
                </p>
              </div>
            </div>

            {/* Amount input */}
            <div className={`bg-[#1a1a1a] rounded-xl p-4 mb-4 ${
              amountError ? 'border border-[#ff3040]/50' : ''
            }`}>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="donation-amount" className="text-[13px] text-[#777]">Amount</label>
                <span className="text-[13px] text-[#777]" aria-live="polite">
                  Balance: {formatNumber(doomBalance)} $DOOM
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="donation-amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  aria-describedby="donation-info"
                  className="flex-1 bg-transparent text-[28px] font-bold text-white outline-none"
                />
                <span className="text-[15px] text-[#00ba7c]" aria-hidden="true">$LIFE</span>
              </div>

              {/* Quick amounts */}
              <div className="flex gap-2 mt-3">
                {[10, 50, 100, 500].map((val) => (
                  <button
                    key={val}
                    onClick={() => handleQuickAmount(val)}
                    disabled={doomBalance < val}
                    className={`px-3 py-1.5 rounded-lg text-[13px] transition-colors ${
                      doomBalance >= val
                        ? 'bg-[#333] text-white hover:bg-[#444]'
                        : 'bg-[#222] text-[#555] cursor-not-allowed'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* Validation error message */}
            {amountError && (
              <div className="mb-4 p-3 rounded-lg bg-[#1f0a0a] border border-[#ff3040]/30">
                <div className="flex items-center gap-2 text-[#ff3040]">
                  <AlertCircle size={14} />
                  <span className="text-[13px]">{amountError}</span>
                </div>
              </div>
            )}

            {/* Cost breakdown */}
            {donationAmount > 0 && !amountError && (
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
              disabled={!isValid}
              className={`w-full py-4 rounded-xl font-semibold text-[16px] transition-all ${
                isValid
                  ? 'bg-[#00ba7c] text-white'
                  : 'bg-[#333] text-[#777]'
              }`}
            >
              {cost > doomBalance
                ? 'Insufficient $DOOM'
                : donationAmount <= 0
                ? 'Enter Amount'
                : `Send ${formatNumber(donationAmount)} $LIFE`}
            </button>

            {/* Info */}
            <p id="donation-info" className="text-[12px] text-[#555] text-center mt-4">
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
