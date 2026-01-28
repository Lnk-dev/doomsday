import { ChevronLeft, ChevronRight, History } from 'lucide-react'
import { TransactionCard, type DisplayTransaction } from './TransactionCard'
import type { TrackedTransaction } from '@/store/transactions'
import type { PaginationState } from '@/lib/transactions'
import { Skeleton } from '@/components/ui/Skeleton'

interface TransactionListProps { transactions: (DisplayTransaction | TrackedTransaction)[]; pagination?: PaginationState; onPageChange?: (page: number) => void; onSelectTransaction?: (tx: DisplayTransaction | TrackedTransaction) => void; selectedId?: string; isLoading?: boolean; emptyMessage?: string; emptyDescription?: string }

function TransactionCardSkeleton() {
  return <div className="px-4 py-3 flex items-center gap-3"><Skeleton variant="circle" width={40} height={40} /><div className="flex-1 min-w-0"><Skeleton variant="text" width={100} height={14} className="mb-1" /><Skeleton variant="text" width="70%" height={12} /></div><div className="text-right"><Skeleton variant="text" width={60} height={14} className="mb-1 ml-auto" /><Skeleton variant="text" width={40} height={10} className="ml-auto" /></div><div className="flex flex-col items-end gap-1"><Skeleton variant="circle" width={16} height={16} /><Skeleton variant="text" width={30} height={11} /></div></div>
}

export function TransactionList({ transactions, pagination, onPageChange, onSelectTransaction, selectedId, isLoading = false, emptyMessage = 'No transactions yet', emptyDescription = 'Your transaction history will appear here once you make your first transaction.' }: TransactionListProps) {
  if (isLoading) return <div className="divide-y divide-[var(--color-border,#333)]">{Array.from({ length: 5 }).map((_, i) => <TransactionCardSkeleton key={i} />)}</div>
  if (transactions.length === 0) return <div className="flex flex-col items-center justify-center py-16 px-8"><div className="w-16 h-16 rounded-full bg-[var(--color-bg-tertiary,#1a1a1a)] flex items-center justify-center mb-4"><History size={32} className="text-[var(--color-text-muted,#555)]" /></div><h2 className="text-[20px] font-bold text-[var(--color-text-primary,#f5f5f5)] mb-2 text-center">{emptyMessage}</h2><p className="text-[14px] text-[var(--color-text-secondary,#777)] text-center max-w-sm">{emptyDescription}</p></div>

  return (
    <div>
      <div className="divide-y divide-[var(--color-border,#333)]">{transactions.map((tx) => <TransactionCard key={tx.id} transaction={tx} onClick={() => onSelectTransaction?.(tx)} selected={selectedId === tx.id} />)}</div>
      {pagination && pagination.totalPages > 1 && <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--color-border,#333)]"><button type="button" onClick={() => onPageChange?.(pagination.page - 1)} disabled={pagination.page <= 1} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[13px] font-medium text-[var(--color-text-secondary,#777)] hover:bg-[var(--color-bg-tertiary,#1a1a1a)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors" aria-label="Previous page"><ChevronLeft className="w-4 h-4" />Previous</button><span className="text-[13px] text-[var(--color-text-muted,#555)]">Page {pagination.page} of {pagination.totalPages}{pagination.totalCount > 0 && <span className="ml-2">({pagination.totalCount} total)</span>}</span><button type="button" onClick={() => onPageChange?.(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[13px] font-medium text-[var(--color-text-secondary,#777)] hover:bg-[var(--color-bg-tertiary,#1a1a1a)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors" aria-label="Next page">Next<ChevronRight className="w-4 h-4" /></button></div>}
    </div>
  )
}

export function TransactionListSkeleton({ count = 5 }: { count?: number }) {
  return <div className="divide-y divide-[var(--color-border,#333)]">{Array.from({ length: count }).map((_, i) => <TransactionCardSkeleton key={i} />)}</div>
}
