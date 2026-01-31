/**
 * Resolution Service
 *
 * Handles determination of resolution types and evidence requirements
 * based on event characteristics and pool size.
 */

import type { Event, VerificationSource } from '../../db/schema'

export type ResolutionType = 'automatic' | 'oracle' | 'multi_sig' | 'community'

export interface ResolutionRequirement {
  type: ResolutionType
  evidenceCount: number
  description: string
}

/**
 * Determine the appropriate resolution type for an event
 *
 * Resolution tiers:
 * - Automatic: Event has an API data source for programmatic resolution
 * - Multi-sig: High stakes (>10,000 DOOM) require multiple signers
 * - Oracle: Default, resolved by platform oracle
 *
 * @param event - The prediction event
 * @param sources - Verification sources for the event
 * @returns The determined resolution type
 */
export function determineResolutionType(
  event: Pick<Event, 'totalDoomStake' | 'totalLifeStake'>,
  sources: Array<{ sourceType?: string | null }>
): ResolutionType {
  const totalPool = (event.totalDoomStake ?? 0) + (event.totalLifeStake ?? 0)

  // Automatic: has API data source
  const hasApiSource = sources.some((s) => s.sourceType === 'api')
  if (hasApiSource) {
    return 'automatic'
  }

  // Multi-sig: high stakes (>10,000 DOOM)
  if (totalPool > 10000) {
    return 'multi_sig'
  }

  // Oracle: default
  return 'oracle'
}

/**
 * Get evidence requirement based on total pool size
 *
 * Evidence tiers:
 * - < 1,000 DOOM: No evidence required
 * - 1,000 - 9,999 DOOM: 1 source link
 * - 10,000 - 99,999 DOOM: 2 sources + screenshot
 * - >= 100,000 DOOM: 3 sources + review
 *
 * @param totalPool - Total DOOM staked on the event
 * @returns Number of evidence pieces required
 */
export function getEvidenceRequirement(totalPool: number): number {
  if (totalPool < 1000) return 0
  if (totalPool < 10000) return 1
  if (totalPool < 100000) return 2
  return 3
}

/**
 * Get full resolution requirements for an event
 */
export function getResolutionRequirements(
  event: Pick<Event, 'totalDoomStake' | 'totalLifeStake'>,
  sources: Pick<VerificationSource, 'sourceType'>[]
): ResolutionRequirement {
  const totalPool = (event.totalDoomStake ?? 0) + (event.totalLifeStake ?? 0)
  const type = determineResolutionType(event, sources)
  const evidenceCount = getEvidenceRequirement(totalPool)

  let description = ''
  switch (type) {
    case 'automatic':
      description = 'This event will be resolved automatically using API data'
      break
    case 'multi_sig':
      description = 'High-stakes event requiring multiple admin signatures for resolution'
      break
    case 'oracle':
      description = 'Event will be resolved by the platform oracle with evidence review'
      break
    case 'community':
      description = 'Event will be resolved by community vote'
      break
  }

  return { type, evidenceCount, description }
}

/**
 * Calculate the dispute window end time
 * Dispute window is 24 hours after resolution is proposed
 */
export function calculateDisputeWindowEnd(proposedAt: Date): Date {
  const disputeWindow = new Date(proposedAt)
  disputeWindow.setHours(disputeWindow.getHours() + 24)
  return disputeWindow
}

/**
 * Check if we're within the dispute window
 */
export function isWithinDisputeWindow(proposedAt: Date | null): boolean {
  if (!proposedAt) return false
  const windowEnd = calculateDisputeWindowEnd(proposedAt)
  return new Date() < windowEnd
}

/**
 * Validate dispute stake amount
 * Minimum 50 DOOM, with higher stakes for larger pools
 */
export function getMinimumDisputeStake(totalPool: number): number {
  // Base minimum is 50 DOOM
  const baseMinimum = 50

  // For pools over 10k, require 0.5% of pool
  if (totalPool > 10000) {
    return Math.max(baseMinimum, Math.floor(totalPool * 0.005))
  }

  return baseMinimum
}

/**
 * Calculate escalation cost
 * To escalate a rejected dispute to community vote
 */
export function getEscalationCost(totalPool: number): number {
  // Base cost is 200 DOOM
  const baseCost = 200

  // For pools over 50k, require 1% of pool
  if (totalPool > 50000) {
    return Math.max(baseCost, Math.floor(totalPool * 0.01))
  }

  return baseCost
}
