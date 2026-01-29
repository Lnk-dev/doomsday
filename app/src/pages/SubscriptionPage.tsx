/**
 * SubscriptionPage
 *
 * Subscription management page featuring:
 * - Pricing table with all tiers
 * - Feature comparison matrix
 * - FAQ section
 * - Current plan indicator
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Shield,
  Zap,
} from 'lucide-react'
import {
  SubscriptionTier,
  SUBSCRIPTION_PLANS,
  canAccessFeature,
} from '@/lib/subscriptions'
import type { SubscriptionFeature } from '@/lib/subscriptions'
import { useSubscriptionStore } from '@/store/subscription'
import type { BillingPeriod } from '@/store/subscription'
import { PricingCard } from '@/components/subscription/PricingCard'
import { toast } from '@/store'

/** Feature comparison data */
const COMPARISON_FEATURES: {
  name: string
  feature?: SubscriptionFeature
  custom?: Record<SubscriptionTier, string | boolean>
}[] = [
  {
    name: 'Daily predictions',
    custom: {
      [SubscriptionTier.FREE]: '5',
      [SubscriptionTier.BASIC]: '25',
      [SubscriptionTier.PRO]: 'Unlimited',
      [SubscriptionTier.ELITE]: 'Unlimited',
    },
  },
  { name: 'Ad-free experience', feature: 'no_ads' },
  { name: 'Basic analytics', feature: 'basic_analytics' },
  { name: 'Advanced analytics', feature: 'advanced_analytics' },
  { name: 'Priority support', feature: 'priority_support' },
  { name: 'VIP support', feature: 'vip_support' },
  { name: 'Profile badges', feature: 'profile_badges' },
  { name: 'Custom themes', feature: 'custom_themes' },
  { name: 'Exclusive events', feature: 'exclusive_events' },
  { name: 'API access', feature: 'api_access' },
]

/** FAQ data */
const FAQS = [
  {
    question: 'Can I cancel my subscription anytime?',
    answer:
      'Yes, you can cancel your subscription at any time. Your benefits will continue until the end of your current billing period.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'We accept all major credit cards, debit cards, and cryptocurrency payments including SOL and USDC on Solana.',
  },
  {
    question: 'Can I change my plan later?',
    answer:
      'Absolutely! You can upgrade or downgrade your plan at any time. Upgrades take effect immediately, while downgrades apply at the end of your billing period.',
  },
  {
    question: 'Is there a free trial?',
    answer:
      'The Free tier lets you explore Doomsday with limited features. For paid plans, we offer a 7-day money-back guarantee if you\'re not satisfied.',
  },
  {
    question: 'What happens to my predictions if I downgrade?',
    answer:
      'Your prediction history is always preserved. However, you may lose access to advanced analytics and be subject to daily prediction limits based on your new tier.',
  },
  {
    question: 'Do you offer team or enterprise plans?',
    answer:
      'Yes! For teams of 5 or more, contact us for custom pricing. Enterprise plans include dedicated support, custom integrations, and SLAs.',
  },
]

export function SubscriptionPage() {
  const navigate = useNavigate()

  // Subscription store
  const currentTier = useSubscriptionStore((state) => state.getCurrentTier())
  const subscribe = useSubscriptionStore((state) => state.subscribe)
  const upgradeTier = useSubscriptionStore((state) => state.upgradeTier)
  const downgradeTier = useSubscriptionStore((state) => state.downgradeTier)
  const currentSubscription = useSubscriptionStore(
    (state) => state.currentSubscription
  )

  // Local state
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly')
  const [isLoading, setIsLoading] = useState(false)
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  /** Handle plan selection */
  const handleSelectPlan = async (tier: SubscriptionTier) => {
    if (tier === currentTier) return

    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    try {
      if (tier === SubscriptionTier.FREE) {
        downgradeTier(tier)
        toast.success('Downgraded to Free plan')
      } else if (currentTier === SubscriptionTier.FREE) {
        subscribe(tier, billingPeriod)
        toast.success(`Subscribed to ${SUBSCRIPTION_PLANS[tier].name}!`)
      } else if (
        SUBSCRIPTION_PLANS[tier].price > SUBSCRIPTION_PLANS[currentTier].price
      ) {
        upgradeTier(tier)
        toast.success(`Upgraded to ${SUBSCRIPTION_PLANS[tier].name}!`)
      } else {
        downgradeTier(tier)
        toast.info(`Changed to ${SUBSCRIPTION_PLANS[tier].name}`)
      }
    } catch {
      toast.error('Failed to update subscription. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  /** Render feature cell in comparison table */
  const renderFeatureCell = (
    tier: SubscriptionTier,
    featureData: (typeof COMPARISON_FEATURES)[0]
  ) => {
    if (featureData.custom) {
      const value = featureData.custom[tier]
      if (typeof value === 'boolean') {
        return value ? (
          <Check className="w-5 h-5 text-[#00ba7c]" />
        ) : (
          <X className="w-5 h-5 text-[var(--color-text-muted)]" />
        )
      }
      return (
        <span className="text-sm text-[var(--color-text-primary)]">{value}</span>
      )
    }

    if (featureData.feature) {
      const hasFeature = canAccessFeature(tier, featureData.feature)
      return hasFeature ? (
        <Check className="w-5 h-5 text-[#00ba7c]" />
      ) : (
        <X className="w-5 h-5 text-[var(--color-text-muted)]" />
      )
    }

    return <X className="w-5 h-5 text-[var(--color-text-muted)]" />
  }

  return (
    <div className="flex flex-col min-h-full bg-[var(--color-bg-primary)]">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-4 px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg-primary)]">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft size={24} className="text-[var(--color-text-primary)]" />
        </button>
        <h1 className="text-[17px] font-semibold text-[var(--color-text-primary)]">
          Subscription
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Hero section */}
        <div className="px-4 py-8 text-center">
          <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-3">
            Choose Your Doom
          </h2>
          <p className="text-[var(--color-text-secondary)] max-w-md mx-auto">
            Unlock premium features and make unlimited predictions with a
            subscription plan that fits your needs.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center p-1 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                billingPeriod === 'monthly'
                  ? 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] shadow-sm'
                  : 'text-[var(--color-text-secondary)]'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                billingPeriod === 'yearly'
                  ? 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] shadow-sm'
                  : 'text-[var(--color-text-secondary)]'
              }`}
            >
              Yearly
              <span className="px-2 py-0.5 rounded-full text-xs bg-[#00ba7c]/10 text-[#00ba7c]">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing cards */}
        <div className="px-4 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {Object.values(SUBSCRIPTION_PLANS).map((plan) => (
              <PricingCard
                key={plan.tier}
                plan={plan}
                billingPeriod={billingPeriod}
                onSelect={handleSelectPlan}
                isLoading={isLoading}
              />
            ))}
          </div>
        </div>

        {/* Current subscription info */}
        {currentSubscription && currentSubscription.status === 'active' && (
          <div className="px-4 mb-12">
            <div className="max-w-2xl mx-auto p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
              <div className="flex items-center gap-3 mb-3">
                <CreditCard className="w-5 h-5 text-[var(--color-text-secondary)]" />
                <h3 className="font-semibold text-[var(--color-text-primary)]">
                  Current Subscription
                </h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-[var(--color-text-muted)]">Plan</p>
                  <p className="font-medium text-[var(--color-text-primary)]">
                    {SUBSCRIPTION_PLANS[currentSubscription.tier].name}
                  </p>
                </div>
                <div>
                  <p className="text-[var(--color-text-muted)]">Billing</p>
                  <p className="font-medium text-[var(--color-text-primary)] capitalize">
                    {currentSubscription.billingPeriod}
                  </p>
                </div>
                <div>
                  <p className="text-[var(--color-text-muted)]">Status</p>
                  <p className="font-medium text-[#00ba7c] capitalize">
                    {currentSubscription.status}
                  </p>
                </div>
                <div>
                  <p className="text-[var(--color-text-muted)]">Auto-renew</p>
                  <p className="font-medium text-[var(--color-text-primary)]">
                    {currentSubscription.autoRenew ? 'On' : 'Off'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Feature comparison table */}
        <div className="px-4 mb-12">
          <h3 className="text-xl font-bold text-[var(--color-text-primary)] text-center mb-6">
            Compare Plans
          </h3>
          <div className="max-w-4xl mx-auto overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="py-4 px-4 text-left text-sm font-medium text-[var(--color-text-secondary)]">
                    Feature
                  </th>
                  {Object.values(SUBSCRIPTION_PLANS).map((plan) => (
                    <th
                      key={plan.tier}
                      className="py-4 px-4 text-center text-sm font-medium"
                      style={{ color: plan.color }}
                    >
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_FEATURES.map((feature, index) => (
                  <tr
                    key={index}
                    className="border-b border-[var(--color-border)] last:border-0"
                  >
                    <td className="py-4 px-4 text-sm text-[var(--color-text-primary)]">
                      {feature.name}
                    </td>
                    {Object.values(SUBSCRIPTION_PLANS).map((plan) => (
                      <td
                        key={plan.tier}
                        className="py-4 px-4 text-center"
                      >
                        {renderFeatureCell(plan.tier, feature)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Trust badges */}
        <div className="px-4 mb-12">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap justify-center gap-8 py-6 border-y border-[var(--color-border)]">
              <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                <Shield className="w-5 h-5" />
                <span className="text-sm">Secure Payment</span>
              </div>
              <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                <Zap className="w-5 h-5" />
                <span className="text-sm">Instant Activation</span>
              </div>
              <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                <CreditCard className="w-5 h-5" />
                <span className="text-sm">Cancel Anytime</span>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ section */}
        <div className="px-4 pb-12">
          <h3 className="text-xl font-bold text-[var(--color-text-primary)] text-center mb-6">
            Frequently Asked Questions
          </h3>
          <div className="max-w-2xl mx-auto space-y-2">
            {FAQS.map((faq, index) => (
              <div
                key={index}
                className="border border-[var(--color-border)] rounded-xl overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedFaq(expandedFaq === index ? null : index)
                  }
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--color-bg-hover)] transition-colors"
                >
                  <span className="font-medium text-[var(--color-text-primary)]">
                    {faq.question}
                  </span>
                  {expandedFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-[var(--color-text-muted)]" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[var(--color-text-muted)]" />
                  )}
                </button>
                {expandedFaq === index && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
