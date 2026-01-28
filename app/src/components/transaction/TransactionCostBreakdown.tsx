/**
 * Transaction Cost Breakdown Component
 * Issue #104: Gas fee estimation and optimization UI
 *
 * Shows itemized transaction costs including amount, gas fee, and platform fee.
 * Also displays potential savings when using lower priority.
 */

import { ChevronDown, ChevronUp, Info } from 'lucide-react'
import { useState } from 'react'
import {
  GasPriority,
  PRIORITY_NAMES,
  formatGasFee,
  calculateSavings,
  lamportsToSol,
  type GasEstimate,
} from '@/lib/gasFees'

interface TransactionCostBreakdownProps {
  /** Amount being transacted in the token's base units */
  amount: number
  /** Token symbol (e.g., 'SOL', 'DOOM') */
  tokenSymbol: string
  /** Token price in USD (for USD display) */
  tokenPriceUsd?: number
  /** Selected gas estimate */
  gasEstimate: GasEstimate
  /** Platform fee in lamports (optional) */
  platformFeeLamports?: number
  /** Whether to show expanded breakdown */
  defaultExpanded?: boolean
  /** Whether to show savings comparison */
  showSavings?: boolean
}

interface CostLineProps {
  label: string
  value: string
  subValue?: string
  highlight?: boolean
  muted?: boolean
}

function CostLine({ label, value, subValue, highlight = false, muted = false }: CostLineProps) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className={`text-sm ${muted ? 'text-[#555555]' : 'text-[#999999]'}`}>
        {label}
      </span>
      <div className="text-right">
        <span
          className={`text-sm font-medium ${
            highlight ? 'text-[#f5f5f5]' : muted ? 'text-[#555555]' : 'text-[#cccccc]'
          }`}
        >
          {value}
        </span>
        {subValue && (
          <span className="text-xs text-[#777777] ml-1.5">
            ({subValue})
          </span>
        )}
      </div>
    </div>
  )
}

export function TransactionCostBreakdown({
  amount,
  tokenSymbol,
  tokenPriceUsd = 0,
  gasEstimate,
  platformFeeLamports = 0,
  defaultExpanded = false,
  showSavings = true,
}: TransactionCostBreakdownProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  // Calculate totals
  const gasFee = formatGasFee(gasEstimate.lamports)
  const platformFee = formatGasFee(platformFeeLamports)

  const totalFeesLamports = gasEstimate.lamports + platformFeeLamports
  const totalFees = formatGasFee(totalFeesLamports)

  // Calculate USD values
  const amountUsd = tokenPriceUsd > 0 ? `$${(amount * tokenPriceUsd).toFixed(2)}` : undefined
  const totalUsd = tokenPriceUsd > 0
    ? `$${(amount * tokenPriceUsd + gasEstimate.usd + lamportsToSol(platformFeeLamports) * tokenPriceUsd).toFixed(2)}`
    : undefined

  // Calculate potential savings if using LOW priority
  const savings = gasEstimate.priority !== GasPriority.LOW
    ? calculateSavings(gasEstimate.priority, GasPriority.LOW)
    : null

  return (
    <div className="rounded-lg border border-[#333333] bg-[#1a1a1a] overflow-hidden">
      {/* Header / Toggle */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#222222] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#f5f5f5]">
            Transaction Summary
          </span>
          <Info className="w-3.5 h-3.5 text-[#555555]" />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-[#f5f5f5]">
            Total: {amount} {tokenSymbol}
            {totalFeesLamports > 0 && (
              <span className="text-[#777777] font-normal"> + {totalFees.sol}</span>
            )}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-[#777777]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#777777]" />
          )}
        </div>
      </button>

      {/* Expanded breakdown */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-1 border-t border-[#333333]">
          {/* Amount */}
          <CostLine
            label="Amount"
            value={`${amount} ${tokenSymbol}`}
            subValue={amountUsd}
          />

          {/* Gas fee */}
          <CostLine
            label={`Network Fee (${PRIORITY_NAMES[gasEstimate.priority]})`}
            value={gasFee.sol}
            subValue={gasFee.usd}
          />

          {/* Platform fee (if any) */}
          {platformFeeLamports > 0 && (
            <CostLine
              label="Platform Fee"
              value={platformFee.sol}
              subValue={platformFee.usd}
            />
          )}

          {/* Divider */}
          <div className="my-2 border-t border-[#333333]" />

          {/* Total */}
          <CostLine
            label="Total Cost"
            value={`${amount} ${tokenSymbol} + ${totalFees.sol}`}
            subValue={totalUsd}
            highlight
          />

          {/* Estimated time */}
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-[#777777]">Estimated confirmation time</span>
            <span className="text-[#1d9bf0] font-medium">{gasEstimate.estimatedTime}</span>
          </div>

          {/* Savings indicator */}
          {showSavings && savings && savings.lamports > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-[#00ba7c]/10 border border-[#00ba7c]/30">
              <div className="flex items-center gap-2 text-[#00ba7c]">
                <span className="text-xs font-medium">
                  Save {formatGasFee(savings.lamports).combined} with Low priority
                </span>
              </div>
              <p className="mt-1 text-xs text-[#777777]">
                Using Low priority may take longer (~60s) but costs less.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Compact inline cost display
 */
export function TransactionCostInline({
  amount,
  tokenSymbol,
  gasEstimate,
}: Pick<TransactionCostBreakdownProps, 'amount' | 'tokenSymbol' | 'gasEstimate'>) {
  const gasFee = formatGasFee(gasEstimate.lamports)

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-[#f5f5f5] font-medium">
        {amount} {tokenSymbol}
      </span>
      <span className="text-[#555555]">+</span>
      <span className="text-[#777777]">{gasFee.sol} fee</span>
    </div>
  )
}

/**
 * Fee comparison table for all priority levels
 */
export function FeeComparisonTable({
  estimates,
  selectedPriority,
}: {
  estimates: GasEstimate[]
  selectedPriority: GasPriority
}) {
  return (
    <div className="rounded-lg border border-[#333333] overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#1a1a1a]">
            <th className="px-4 py-2 text-left text-xs font-medium text-[#777777]">Priority</th>
            <th className="px-4 py-2 text-right text-xs font-medium text-[#777777]">Fee</th>
            <th className="px-4 py-2 text-right text-xs font-medium text-[#777777]">Time</th>
          </tr>
        </thead>
        <tbody>
          {estimates.map((estimate) => {
            const isSelected = estimate.priority === selectedPriority
            const fee = formatGasFee(estimate.lamports)

            return (
              <tr
                key={estimate.priority}
                className={`border-t border-[#333333] ${
                  isSelected ? 'bg-[#1d9bf0]/10' : ''
                }`}
              >
                <td className="px-4 py-2">
                  <span
                    className={`font-medium ${
                      isSelected ? 'text-[#1d9bf0]' : 'text-[#f5f5f5]'
                    }`}
                  >
                    {PRIORITY_NAMES[estimate.priority]}
                  </span>
                </td>
                <td className="px-4 py-2 text-right">
                  <div className="text-[#cccccc]">{fee.sol}</div>
                  <div className="text-xs text-[#777777]">{fee.usd}</div>
                </td>
                <td className="px-4 py-2 text-right text-[#999999]">
                  {estimate.estimatedTime}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
