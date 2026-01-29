/**
 * CreatorDashboardPage
 * Issue #117: Build creator monetization dashboard UI
 *
 * Main dashboard for creators to view earnings, stats, and manage withdrawals.
 */

import { useState, useCallback } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { EarningsCard, StatsOverview, EarningsChart } from '@/components/creator'
import { useCreatorStore } from '@/store/creator'
import { useWalletStore } from '@/store/wallet'
import { formatEarnings } from '@/lib/creatorStats'
import {
  X,
  ArrowUpRight,
  CheckCircle,
  Clock,
  AlertCircle,
  Wallet,
  History,
  Settings,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

type WithdrawalStatus = 'pending' | 'processing' | 'completed' | 'failed'

/** Withdrawal Modal */
function WithdrawalModal({
  onClose,
  onConfirm,
  maxAmount,
  minAmount,
}: {
  onClose: () => void
  onConfirm: (amount: number) => void
  maxAmount: number
  minAmount: number
}) {
  const [amount, setAmount] = useState(maxAmount.toString())
  const parsedAmount = parseFloat(amount) || 0
  const isValid = parsedAmount >= minAmount && parsedAmount <= maxAmount

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="w-full max-w-md mx-4 rounded-2xl bg-[#1a1a1a] border border-[#333] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[#333]">
          <h3 className="text-[18px] font-bold text-white">Withdraw Funds</h3>
          <button onClick={onClose} className="p-1 hover:bg-[#333] rounded-lg transition-colors">
            <X size={20} className="text-[#777]" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-[13px] text-[#777] mb-2">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777]">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={minAmount}
                max={maxAmount}
                step="0.01"
                className="w-full pl-8 pr-4 py-3 rounded-xl bg-[#111] border border-[#333] text-white text-[16px] focus:outline-none focus:border-[#00ba7c]"
              />
            </div>
            <div className="flex justify-between mt-2 text-[12px] text-[#555]">
              <span>Min: {formatEarnings(minAmount)}</span>
              <button
                onClick={() => setAmount(maxAmount.toString())}
                className="text-[#00ba7c] hover:underline"
              >
                Max: {formatEarnings(maxAmount)}
              </button>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#111] border border-[#222]">
            <div className="flex justify-between text-[13px] mb-1">
              <span className="text-[#777]">You will receive</span>
              <span className="text-white font-semibold">{formatEarnings(parsedAmount)}</span>
            </div>
            <p className="text-[11px] text-[#555]">
              Funds will be sent to your connected wallet
            </p>
          </div>

          <button
            onClick={() => onConfirm(parsedAmount)}
            disabled={!isValid}
            className={`w-full py-3 rounded-xl text-[15px] font-semibold flex items-center justify-center gap-2 transition-colors ${
              isValid
                ? 'bg-[#00ba7c] text-white hover:bg-[#00a56f]'
                : 'bg-[#333] text-[#777] cursor-not-allowed'
            }`}
          >
            <ArrowUpRight size={18} />
            Confirm Withdrawal
          </button>
        </div>
      </div>
    </div>
  )
}

/** Transaction status badge */
function StatusBadge({ status }: { status: WithdrawalStatus }) {
  const config: Record<WithdrawalStatus, { icon: React.ReactNode; color: string; bg: string }> = {
    pending: { icon: <Clock size={12} />, color: '#f59e0b', bg: '#f59e0b20' },
    processing: { icon: <Clock size={12} />, color: '#3b82f6', bg: '#3b82f620' },
    completed: { icon: <CheckCircle size={12} />, color: '#00ba7c', bg: '#00ba7c20' },
    failed: { icon: <AlertCircle size={12} />, color: '#ff3040', bg: '#ff304020' },
  }

  const { icon, color, bg } = config[status]

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
      style={{ backgroundColor: bg, color }}
    >
      {icon}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

export function CreatorDashboardPage() {
  const navigate = useNavigate()
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)

  // Wallet state
  const primaryWallet = useWalletStore((state) => state.getPrimaryWallet())
  const isWalletConnected = !!primaryWallet

  // Creator state
  const pendingPayouts = useCreatorStore((state) => state.pendingPayouts)
  const minimumWithdrawal = useCreatorStore((state) => state.minimumWithdrawal)
  const withdrawalHistory = useCreatorStore((state) => state.withdrawalHistory)
  const requestWithdrawal = useCreatorStore((state) => state.requestWithdrawal)

  const handleWithdraw = useCallback(() => {
    if (isWalletConnected) {
      setShowWithdrawModal(true)
    }
  }, [isWalletConnected])

  const handleConfirmWithdrawal = useCallback(
    (amount: number) => {
      if (primaryWallet) {
        const result = requestWithdrawal(amount, primaryWallet.address)
        if (result) {
          setShowWithdrawModal(false)
          // In production, would trigger actual blockchain transaction
        }
      }
    },
    [primaryWallet, requestWithdrawal]
  )

  const recentWithdrawals = withdrawalHistory.slice(0, 5)

  return (
    <div className="flex flex-col min-h-full pb-20">
      <PageHeader
        title="Creator Dashboard"
        rightAction={
          <button onClick={() => navigate('/settings')} className="p-1">
            <Settings size={24} className="text-white" />
          </button>
        }
      />

      <div className="px-4 py-4 space-y-4">
        {/* Wallet connection warning */}
        {!isWalletConnected && (
          <div className="p-4 rounded-2xl bg-[#ff6b3510] border border-[#ff6b3530]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#ff6b3520] flex items-center justify-center">
                <Wallet size={20} className="text-[#ff6b35]" />
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-semibold text-white">Connect Wallet</p>
                <p className="text-[12px] text-[#777]">Required to withdraw earnings</p>
              </div>
              <button className="px-4 py-2 rounded-xl bg-[#ff6b35] text-white text-[13px] font-semibold">
                Connect
              </button>
            </div>
          </div>
        )}

        {/* Earnings Card */}
        <EarningsCard onWithdraw={handleWithdraw} />

        {/* Earnings Chart */}
        <EarningsChart />

        {/* Stats Overview */}
        <StatsOverview />

        {/* Recent Transactions */}
        <div className="rounded-2xl bg-[#1a1a1a] border border-[#333] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#333] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#f59e0b20] flex items-center justify-center">
                <History size={18} className="text-[#f59e0b]" />
              </div>
              <h3 className="text-[16px] font-semibold text-white">Recent Withdrawals</h3>
            </div>
          </div>

          <div className="divide-y divide-[#222]">
            {recentWithdrawals.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-[14px] text-[#555]">No withdrawals yet</p>
              </div>
            ) : (
              recentWithdrawals.map((withdrawal) => (
                <div key={withdrawal.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[14px] font-semibold text-white">
                      {formatEarnings(withdrawal.amount)}
                    </p>
                    <p className="text-[12px] text-[#555]">
                      {new Date(withdrawal.requestedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge status={withdrawal.status} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <WithdrawalModal
          onClose={() => setShowWithdrawModal(false)}
          onConfirm={handleConfirmWithdrawal}
          maxAmount={pendingPayouts}
          minAmount={minimumWithdrawal}
        />
      )}
    </div>
  )
}
