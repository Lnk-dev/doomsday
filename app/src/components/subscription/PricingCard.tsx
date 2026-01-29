/**
 * PricingCard Component
 *
 * Displays an individual subscription tier with:
 * - Price information
 * - Feature checklist
 * - CTA button (Subscribe/Current Plan/Upgrade)
 * - Popular badge for PRO tier
 */

import { Check, Star, Zap, Crown } from 'lucide-react'
import {
  SubscriptionTier,
  formatPrice,
  formatYearlyPrice,
  calculateYearlySavings,
  isHigherTier,
} from '@/lib/subscriptions'
import type { SubscriptionPlan } from '@/lib/subscriptions'
import { useSubscriptionStore } from '@/store/subscription'
import type { BillingPeriod } from '@/store/subscription'

interface PricingCardProps {
  plan: SubscriptionPlan
  billingPeriod: BillingPeriod
  onSelect: (tier: SubscriptionTier) => void
  isLoading?: boolean
}

/** Get icon for tier */
function getTierIcon(tier: SubscriptionTier) {
  switch (tier) {
    case SubscriptionTier.FREE:
      return null
    case SubscriptionTier.BASIC:
      return <Zap className="w-5 h-5" />
    case SubscriptionTier.PRO:
      return <Star className="w-5 h-5" />
    case SubscriptionTier.ELITE:
      return <Crown className="w-5 h-5" />
  }
}

export function PricingCard({
  plan,
  billingPeriod,
  onSelect,
  isLoading = false,
}: PricingCardProps) {
  const currentTier = useSubscriptionStore((state) => state.getCurrentTier())
  const isCurrentPlan = currentTier === plan.tier
  const canUpgrade = isHigherTier(plan.tier, currentTier)
  const canDowngrade = isHigherTier(currentTier, plan.tier)

  const displayPrice =
    billingPeriod === 'monthly'
      ? formatPrice(plan.price)
      : formatYearlyPrice(plan.yearlyPrice)

  const yearlySavings = calculateYearlySavings(plan.tier)
  const showSavings = billingPeriod === 'yearly' && yearlySavings > 0

  /** Get button text and style */
  const getButtonConfig = () => {
    if (isCurrentPlan) {
      return {
        text: 'Current Plan',
        className:
          'w-full py-3 px-4 rounded-xl font-semibold bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] cursor-default',
        disabled: true,
      }
    }
    if (canUpgrade) {
      return {
        text: 'Upgrade',
        className: `w-full py-3 px-4 rounded-xl font-semibold transition-all hover:opacity-90 text-white`,
        style: { backgroundColor: plan.color },
        disabled: false,
      }
    }
    if (canDowngrade) {
      return {
        text: 'Downgrade',
        className:
          'w-full py-3 px-4 rounded-xl font-semibold border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors',
        disabled: false,
      }
    }
    // Free tier when on free
    return {
      text: 'Get Started',
      className: `w-full py-3 px-4 rounded-xl font-semibold transition-all hover:opacity-90 text-white`,
      style: { backgroundColor: plan.color },
      disabled: false,
    }
  }

  const buttonConfig = getButtonConfig()
  const tierIcon = getTierIcon(plan.tier)

  return (
    <div
      className={`relative flex flex-col p-6 rounded-2xl border transition-all ${
        plan.popular
          ? 'border-[#ff6b35] bg-gradient-to-b from-[#ff6b35]/5 to-transparent scale-105 shadow-xl shadow-[#ff6b35]/10'
          : 'border-[var(--color-border)] bg-[var(--color-bg-secondary)]'
      } ${isCurrentPlan ? 'ring-2 ring-[var(--color-doom)]' : ''}`}
    >
      {/* Popular badge */}
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#ff6b35] text-white">
            Most Popular
          </span>
        </div>
      )}

      {/* Current plan indicator */}
      {isCurrentPlan && (
        <div className="absolute -top-3 right-4">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[var(--color-doom)] text-white">
            Current
          </span>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          {tierIcon && (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${plan.color}20`, color: plan.color }}
            >
              {tierIcon}
            </div>
          )}
          <h3
            className="text-xl font-bold"
            style={{ color: plan.tier === SubscriptionTier.FREE ? 'var(--color-text-primary)' : plan.color }}
          >
            {plan.name}
          </h3>
        </div>
        <p className="text-[var(--color-text-secondary)] text-sm">
          {plan.description}
        </p>
      </div>

      {/* Price */}
      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-[var(--color-text-primary)]">
            {displayPrice === 'Free' ? 'Free' : displayPrice.replace('/mo', '')}
          </span>
          {plan.price > 0 && (
            <span className="text-[var(--color-text-muted)]">/month</span>
          )}
        </div>
        {showSavings && (
          <p className="text-sm text-[#00ba7c] mt-1">
            Save ${yearlySavings}/year
          </p>
        )}
        {billingPeriod === 'yearly' && plan.yearlyPrice > 0 && (
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Billed ${plan.yearlyPrice} annually
          </p>
        )}
      </div>

      {/* Features */}
      <ul className="flex-1 space-y-3 mb-6">
        {plan.featureDescriptions.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{
                backgroundColor: `${plan.color}20`,
                color: plan.color,
              }}
            >
              <Check className="w-3 h-3" />
            </div>
            <span className="text-sm text-[var(--color-text-secondary)]">
              {feature}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <button
        onClick={() => onSelect(plan.tier)}
        disabled={buttonConfig.disabled || isLoading}
        className={buttonConfig.className}
        style={buttonConfig.style}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Processing...
          </span>
        ) : (
          buttonConfig.text
        )}
      </button>
    </div>
  )
}
