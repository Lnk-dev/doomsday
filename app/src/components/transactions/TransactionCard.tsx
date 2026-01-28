import { ArrowUpRight, ArrowDownLeft, Coins, Trophy, Lock, Unlock, RefreshCw, ArrowLeftRight, Clock, CheckCircle2, XCircle, Loader2, ExternalLink } from 'lucide-react'
import type { TrackedTransaction } from '@/store/transactions'
import type { TransactionType, TransactionMetadata } from '@/lib/transactions'
import { formatRelativeTime, formatNumber } from '@/lib/utils'
import { getExplorerUrl } from '@/lib/solana/config'

export interface DisplayTransaction extends Omit<TrackedTransaction, 'type'> { type: TransactionType; metadata?: TransactionMetadata }

interface TransactionCardProps { transaction: DisplayTransaction | TrackedTransaction; onClick?: () => void; selected?: boolean }

const getTypeIcon = (type: string) => { const c = 'w-5 h-5'; return { send: <ArrowUpRight className={c} />, receive: <ArrowDownLeft className={c} />, bet: <Coins className={c} />, reward: <Trophy className={c} />, stake: <Lock className={c} />, unstake: <Unlock className={c} />, swap: <RefreshCw className={c} /> }[type] || <ArrowLeftRight className={c} /> }
const getTypeBgColor = (type: string) => ({ send: 'bg-[var(--color-doom,#ff3040)]/20', stake: 'bg-[var(--color-doom,#ff3040)]/20', receive: 'bg-[var(--color-life,#00ff00)]/20', reward: 'bg-[var(--color-life,#00ff00)]/20', unstake: 'bg-[var(--color-life,#00ff00)]/20', bet: 'bg-[var(--color-warning,#ffad1f)]/20', swap: 'bg-blue-500/20' }[type] || 'bg-[var(--color-bg-tertiary,#1a1a1a)]')
const getTypeIconColor = (type: string) => ({ send: 'text-[var(--color-doom,#ff3040)]', stake: 'text-[var(--color-doom,#ff3040)]', receive: 'text-[var(--color-life,#00ff00)]', reward: 'text-[var(--color-life,#00ff00)]', unstake: 'text-[var(--color-life,#00ff00)]', bet: 'text-[var(--color-warning,#ffad1f)]', swap: 'text-blue-400' }[type] || 'text-[var(--color-text-muted,#555)]')
const getStatusDisplay = (status: string) => ({ confirmed: { icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-[var(--color-life,#00ff00)]' }, failed: { icon: <XCircle className="w-4 h-4" />, color: 'text-[var(--color-doom,#ff3040)]' }, pending: { icon: <Loader2 className="w-4 h-4 animate-spin" />, color: 'text-[var(--color-warning,#ffad1f)]' }, signing: { icon: <Loader2 className="w-4 h-4 animate-spin" />, color: 'text-[var(--color-warning,#ffad1f)]' }, sending: { icon: <Loader2 className="w-4 h-4 animate-spin" />, color: 'text-[var(--color-warning,#ffad1f)]' }, confirming: { icon: <Loader2 className="w-4 h-4 animate-spin" />, color: 'text-[var(--color-warning,#ffad1f)]' } }[status] || { icon: <Clock className="w-4 h-4" />, color: 'text-[var(--color-text-muted,#555)]' })
const getTypeName = (type: string) => ({ send: 'Sent', receive: 'Received', bet: 'Bet', reward: 'Reward', stake: 'Staked', unstake: 'Unstaked', swap: 'Swap', transfer: 'Transfer', other: 'Transaction' }[type] || 'Transaction')

export function TransactionCard({ transaction, onClick, selected = false }: TransactionCardProps) {
  const isOutgoing = transaction.type === 'send' || transaction.type === 'stake'
  const statusDisplay = getStatusDisplay(transaction.status)
  const metadata = 'metadata' in transaction ? transaction.metadata : undefined

  return (
    <button type="button" onClick={onClick} className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors hover:bg-[var(--color-bg-secondary,#111)] ${selected ? 'bg-[var(--color-bg-secondary,#111)] border-l-2 border-[var(--color-doom,#ff3040)]' : ''}`} aria-label={`${getTypeName(transaction.type)} transaction`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getTypeBgColor(transaction.type)}`}><span className={getTypeIconColor(transaction.type)}>{getTypeIcon(transaction.type)}</span></div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2"><span className="text-[14px] font-semibold text-[var(--color-text-primary,#f5f5f5)]">{getTypeName(transaction.type)}</span>{metadata?.token && <span className="text-[12px] px-1.5 py-0.5 rounded bg-[var(--color-bg-tertiary,#1a1a1a)] text-[var(--color-text-secondary,#777)]">{metadata.token}</span>}</div>
        <p className="text-[12px] text-[var(--color-text-muted,#555)] truncate mt-0.5">{transaction.description}</p>
      </div>
      {metadata?.amount !== undefined && <div className="text-right"><p className={`text-[14px] font-semibold ${isOutgoing ? 'text-[var(--color-doom,#ff3040)]' : 'text-[var(--color-life,#00ff00)]'}`}>{isOutgoing ? '-' : '+'}{formatNumber(metadata.amount)}</p>{metadata.token && <p className="text-[10px] text-[var(--color-text-muted,#555)]">{metadata.token}</p>}</div>}
      <div className="flex flex-col items-end gap-1 ml-2"><div className={`flex items-center gap-1 ${statusDisplay.color}`}>{statusDisplay.icon}</div><span className="text-[11px] text-[var(--color-text-muted,#555)]">{formatRelativeTime(transaction.createdAt)}</span></div>
      {transaction.signature && <a href={getExplorerUrl(transaction.signature, 'tx')} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="p-1.5 rounded-full hover:bg-[var(--color-bg-tertiary,#1a1a1a)] text-[var(--color-text-muted,#555)] hover:text-[var(--color-text-secondary,#777)] transition-colors" aria-label="View on Solana Explorer"><ExternalLink className="w-4 h-4" /></a>}
    </button>
  )
}
