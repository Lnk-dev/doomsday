/**
 * MyBetsPage
 * Issues #34, #35, #36: User betting history with on-chain integration
 *
 * Shows user's betting history, pending bets, and claimable winnings.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import {
  ArrowLeft,
  Clock,
  Trophy,
  XCircle,
  Loader2,
  ChevronRight,
  RefreshCw,
  Wallet,
} from 'lucide-react'
import { useEventsStore, usePredictionsStore } from '@/store'
import { formatNumber, formatDate } from '@/lib/utils'
import { ClaimWinnings, ClaimableWinningsCard } from '@/components/betting'

type BetFilter = 'all' | 'pending' | 'won' | 'lost'

interface BetDisplayItem {
  id: string
  eventId: string
  eventTitle: string
  outcome: 'doom' | 'life'
  amount: number
  placedAt: number
  status: 'pending' | 'won' | 'lost' | 'cancelled'
  estimatedPayout?: number
  canClaim: boolean
  claimed: boolean
  onChainEventId?: number
  onChainPDA?: string
}

export function MyBetsPage() {
  const navigate = useNavigate()
  const { connection } = useConnection()
  const { publicKey, connected } = useWallet()

  // Store hooks
  const getEvent = useEventsStore((state) => state.getEvent)
  const onChainBets = useEventsStore((state) => state.onChainBets)
  const syncUserBetsFromChain = useEventsStore((state) => state.syncUserBetsFromChain)
  const eventsLoading = useEventsStore((state) => state.isLoading)

  const getUserPredictions = usePredictionsStore((state) => state.getUserPredictions)
  const getPredictionStats = usePredictionsStore((state) => state.getPredictionStats)
  const syncUserStatsFromChain = usePredictionsStore((state) => state.syncUserStatsFromChain)
  const onChainStats = usePredictionsStore((state) => state.onChainStats)
  const predictionsLoading = usePredictionsStore((state) => state.isLoading)

  // Local state
  const [filter, setFilter] = useState<BetFilter>('all')
  const [claimingBet, setClaimingBet] = useState<BetDisplayItem | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Get user ID
  const userId = publicKey?.toBase58() || 'local-user'

  // Combine local predictions and on-chain bets
  const allBets: BetDisplayItem[] = (() => {
    const items: BetDisplayItem[] = []

    // Add local predictions
    const userPredictions = getUserPredictions(userId)
    for (const pred of userPredictions) {
      const event = getEvent(pred.eventId)
      if (!event) continue

      let status: BetDisplayItem['status'] = 'pending'
      if (pred.resolved) {
        status = pred.won ? 'won' : 'lost'
      }

      items.push({
        id: pred.id,
        eventId: pred.eventId,
        eventTitle: event.title,
        outcome: pred.side,
        amount: pred.amount,
        placedAt: pred.createdAt,
        status,
        estimatedPayout: pred.won ? pred.amount * 2 : undefined, // Simplified
        canClaim: status === 'won' && !pred.claimed,
        claimed: pred.claimed || false,
        onChainEventId: event.onChainEventId,
        onChainPDA: event.onChainPDA,
      })
    }

    // Add on-chain bets that aren't already in predictions
    for (const [pda, bet] of Object.entries(onChainBets)) {
      const existingIndex = items.findIndex((i) => i.onChainPDA === pda)
      if (existingIndex === -1) {
        const event = getEvent(bet.eventId)

        items.push({
          id: `onchain-${pda}`,
          eventId: bet.eventId,
          eventTitle: event?.title || 'Unknown Event',
          outcome: bet.outcome,
          amount: bet.amount,
          placedAt: bet.placedAt,
          status: bet.canClaim ? 'won' : bet.claimed ? 'won' : 'pending',
          estimatedPayout: bet.estimatedPayout,
          canClaim: bet.canClaim,
          claimed: bet.claimed,
          onChainEventId: event?.onChainEventId,
          onChainPDA: pda,
        })
      }
    }

    // Sort by date
    items.sort((a, b) => b.placedAt - a.placedAt)

    return items
  })()

  // Filter bets
  const filteredBets = allBets.filter((bet) => {
    if (filter === 'all') return true
    if (filter === 'pending') return bet.status === 'pending'
    if (filter === 'won') return bet.status === 'won'
    if (filter === 'lost') return bet.status === 'lost'
    return true
  })

  // Get stats - normalize on-chain stats to match local stats interface
  const localStats = getPredictionStats(userId)
  const stats = onChainStats
    ? {
        total: onChainStats.totalBets,
        won: onChainStats.wins,
        lost: onChainStats.losses,
        accuracy: onChainStats.totalBets > 0
          ? (onChainStats.wins / onChainStats.totalBets) * 100
          : 0,
        totalWagered: onChainStats.totalWagered,
        netProfit: onChainStats.netProfit,
        currentStreak: onChainStats.currentStreak,
        bestStreak: onChainStats.bestStreak,
        worstStreak: onChainStats.worstStreak,
      }
    : localStats

  // Claimable winnings
  const claimableWinnings = allBets.filter((bet) => bet.canClaim)

  // Sync on-chain data
  useEffect(() => {
    if (connected && publicKey) {
      syncUserBetsFromChain(connection, publicKey)
      syncUserStatsFromChain(connection, publicKey)
    }
  }, [connected, publicKey, connection, syncUserBetsFromChain, syncUserStatsFromChain])

  const handleRefresh = async () => {
    if (!connected || !publicKey) return
    setIsRefreshing(true)
    await Promise.all([
      syncUserBetsFromChain(connection, publicKey),
      syncUserStatsFromChain(connection, publicKey),
    ])
    setIsRefreshing(false)
  }

  const isLoading = eventsLoading || predictionsLoading

  return (
    <div className="flex flex-col min-h-full bg-black">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-[#333]">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft size={24} className="text-white" />
        </button>
        <h1 className="text-[18px] font-bold text-white flex-1">My Bets</h1>
        {connected && (
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <RefreshCw
              size={20}
              className={`text-zinc-400 ${isRefreshing ? 'animate-spin' : ''}`}
            />
          </button>
        )}
      </div>

      {/* Wallet Connection Notice */}
      {!connected && (
        <div className="m-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
          <div className="flex items-center gap-2 text-blue-400">
            <Wallet size={18} />
            <span className="text-[14px] font-medium">Connect wallet for on-chain bets</span>
          </div>
          <p className="text-[12px] text-blue-300/70 mt-1">
            Showing local bets only. Connect your wallet to see on-chain betting history.
          </p>
        </div>
      )}

      {/* Stats Overview */}
      <div className="p-4 border-b border-[#333]">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#1a1a1a] rounded-xl p-3 text-center">
            <p className="text-[24px] font-bold text-white">{stats.total}</p>
            <p className="text-[12px] text-[#777]">Total Bets</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl p-3 text-center">
            <p className="text-[24px] font-bold text-emerald-400">{stats.won}</p>
            <p className="text-[12px] text-[#777]">Won</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl p-3 text-center">
            <p className="text-[24px] font-bold text-red-400">{stats.lost}</p>
            <p className="text-[12px] text-[#777]">Lost</p>
          </div>
        </div>

        <div className="flex justify-between mt-4 text-[13px]">
          <div>
            <span className="text-[#777]">Win Rate: </span>
            <span className="text-white font-medium">{stats.accuracy.toFixed(1)}%</span>
          </div>
          <div>
            <span className="text-[#777]">Net P/L: </span>
            <span
              className={`font-medium ${
                stats.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {stats.netProfit >= 0 ? '+' : ''}
              {formatNumber(stats.netProfit)}
            </span>
          </div>
        </div>
      </div>

      {/* Claimable Winnings */}
      {claimableWinnings.length > 0 && (
        <div className="p-4 border-b border-[#333]">
          <h3 className="text-[14px] font-semibold text-white mb-3 flex items-center gap-2">
            <Trophy size={16} className="text-yellow-500" />
            Claimable Winnings ({claimableWinnings.length})
          </h3>
          <div className="space-y-2">
            {claimableWinnings.map((bet) => (
              <ClaimableWinningsCard
                key={bet.id}
                eventId={bet.eventId}
                onChainEventId={bet.onChainEventId}
                eventTitle={bet.eventTitle}
                outcome={bet.outcome}
                amount={bet.amount}
                estimatedPayout={bet.estimatedPayout || bet.amount * 2}
                onClaim={() => setClaimingBet(bet)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 px-4 py-3 border-b border-[#333] overflow-x-auto">
        {(['all', 'pending', 'won', 'lost'] as BetFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors ${
              filter === f
                ? 'bg-white text-black'
                : 'bg-[#1a1a1a] text-[#777]'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Bets List */}
      <div className="flex-1">
        {isLoading && filteredBets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 size={32} className="text-zinc-500 animate-spin" />
            <p className="text-[14px] text-[#777] mt-3">Loading bets...</p>
          </div>
        ) : filteredBets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Clock size={48} className="text-[#333] mb-4" />
            <p className="text-[15px] text-[#777]">
              {filter === 'all' ? 'No bets yet' : `No ${filter} bets`}
            </p>
            <button
              onClick={() => navigate('/events')}
              className="mt-4 text-[14px] text-blue-400"
            >
              Explore Events
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#222]">
            {filteredBets.map((bet) => (
              <BetListItem
                key={bet.id}
                bet={bet}
                onClick={() => navigate(`/events/${bet.eventId}`)}
                onClaim={bet.canClaim ? () => setClaimingBet(bet) : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {/* Claim Modal */}
      {claimingBet && (
        <ClaimWinnings
          eventId={claimingBet.eventId}
          onChainEventId={claimingBet.onChainEventId}
          eventTitle={claimingBet.eventTitle}
          outcome={claimingBet.outcome}
          amount={claimingBet.amount}
          estimatedPayout={claimingBet.estimatedPayout || claimingBet.amount * 2}
          onClose={() => setClaimingBet(null)}
          onSuccess={() => {
            setClaimingBet(null)
            if (connected && publicKey) {
              handleRefresh()
            }
          }}
        />
      )}
    </div>
  )
}

interface BetListItemProps {
  bet: BetDisplayItem
  onClick: () => void
  onClaim?: () => void
}

function BetListItem({ bet, onClick, onClaim }: BetListItemProps) {
  const statusConfig = {
    pending: {
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10',
      icon: Clock,
      label: 'Pending',
    },
    won: {
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-400/10',
      icon: Trophy,
      label: 'Won',
    },
    lost: {
      color: 'text-red-400',
      bgColor: 'bg-red-400/10',
      icon: XCircle,
      label: 'Lost',
    },
    cancelled: {
      color: 'text-zinc-400',
      bgColor: 'bg-zinc-400/10',
      icon: XCircle,
      label: 'Cancelled',
    },
  }

  const config = statusConfig[bet.status]
  const StatusIcon = config.icon

  return (
    <div className="px-4 py-3 hover:bg-[#111] transition-colors">
      <div className="flex items-start gap-3">
        {/* Status Icon */}
        <div className={`p-2 rounded-full ${config.bgColor}`}>
          <StatusIcon size={16} className={config.color} />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0" onClick={onClick}>
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-white text-[14px] truncate">
              {bet.eventTitle}
            </h4>
            {bet.onChainPDA && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
                ON-CHAIN
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-[12px] text-[#777]">
            <span
              className={`font-medium ${
                bet.outcome === 'doom' ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {bet.outcome.toUpperCase()}
            </span>
            <span>{formatNumber(bet.amount)} tokens</span>
            <span>{formatDate(bet.placedAt)}</span>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          {bet.canClaim && onClaim ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onClaim()
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white text-[12px] font-medium transition-colors"
            >
              Claim
            </button>
          ) : bet.status === 'won' && bet.claimed ? (
            <span className="text-[12px] text-emerald-400">Claimed</span>
          ) : (
            <span className={`text-[12px] ${config.color}`}>{config.label}</span>
          )}
          <ChevronRight size={16} className="text-[#555]" />
        </div>
      </div>
    </div>
  )
}
