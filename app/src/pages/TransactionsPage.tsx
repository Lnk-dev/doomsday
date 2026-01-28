import { useState, useMemo, useCallback } from 'react'
import { Search, Download, Trash2, X } from 'lucide-react'
import { useTransactionStore } from '@/store/transactions'
import { TransactionList, TransactionDetails, TransactionReceipt, type DisplayTransaction } from '@/components/transactions'
import type { TrackedTransaction } from '@/store/transactions'
import type { TransactionType, TransactionFilter } from '@/lib/transactions'
import { applyTransactionFilter, paginateItems, exportTransactionsToCSV } from '@/lib/transactions'

type TabFilter = 'all' | 'sent' | 'received' | 'bets' | 'rewards'
const tabToTypes: Record<TabFilter, TransactionType[] | undefined> = { all: undefined, sent: ['send', 'stake'], received: ['receive', 'unstake'], bets: ['bet'], rewards: ['reward'] }
const PAGE_SIZE = 10

export function TransactionsPage() {
  const transactions = useTransactionStore((state) => state.transactions)
  const clearAll = useTransactionStore((state) => state.clearAll)
  const [activeTab, setActiveTab] = useState<TabFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedTransaction, setSelectedTransaction] = useState<DisplayTransaction | TrackedTransaction | null>(null)
  const [showReceipt, setShowReceipt] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const filter: TransactionFilter = useMemo(() => ({ types: tabToTypes[activeTab], searchQuery: searchQuery.trim() || undefined }), [activeTab, searchQuery])
  const filteredTransactions = useMemo(() => applyTransactionFilter(transactions, filter), [transactions, filter])
  const { items: paginatedTransactions, pagination } = useMemo(() => paginateItems(filteredTransactions, currentPage, PAGE_SIZE), [filteredTransactions, currentPage])

  const handleTabChange = useCallback((tab: TabFilter) => { setActiveTab(tab); setCurrentPage(1) }, [])
  const handleSearch = useCallback((query: string) => { setSearchQuery(query); setCurrentPage(1) }, [])
  const handleExport = useCallback(() => { const csv = exportTransactionsToCSV(filteredTransactions); const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`; a.click(); URL.revokeObjectURL(url) }, [filteredTransactions])
  const handleClearAll = useCallback(() => { clearAll(); setShowClearConfirm(false); setSelectedTransaction(null) }, [clearAll])
  const handleSelectTransaction = useCallback((tx: DisplayTransaction | TrackedTransaction) => { setSelectedTransaction(tx); setShowReceipt(false) }, [])
  const handleCloseDetails = useCallback(() => { setSelectedTransaction(null); setShowReceipt(false) }, [])
  const handleViewReceipt = useCallback(() => { setShowReceipt(true) }, [])

  const tabs: { id: TabFilter; label: string }[] = [{ id: 'all', label: 'All' }, { id: 'sent', label: 'Sent' }, { id: 'received', label: 'Received' }, { id: 'bets', label: 'Bets' }, { id: 'rewards', label: 'Rewards' }]

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary,#000)]">
      <header className="sticky top-0 z-40 bg-[var(--color-bg-primary,#000)]/80 backdrop-blur-md border-b border-[var(--color-border,#333)]">
        <div className="px-4 py-3"><h1 className="text-[20px] font-bold text-[var(--color-text-primary,#f5f5f5)]">Transactions</h1></div>
        <div className="px-4 pb-3"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted,#555)]" /><input type="text" value={searchQuery} onChange={(e) => handleSearch(e.target.value)} placeholder="Search by ID, description, or address..." className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--color-bg-secondary,#111)] border border-[var(--color-border,#333)] text-[14px] text-[var(--color-text-primary,#f5f5f5)] placeholder:text-[var(--color-text-muted,#555)] focus:outline-none focus:border-[var(--color-doom,#ff3040)]" />{searchQuery && <button type="button" onClick={() => handleSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[var(--color-bg-tertiary,#1a1a1a)] text-[var(--color-text-muted,#555)]" aria-label="Clear search"><X className="w-4 h-4" /></button>}</div></div>
        <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">{tabs.map((tab) => <button key={tab.id} type="button" onClick={() => handleTabChange(tab.id)} className={`px-4 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors ${activeTab === tab.id ? 'bg-[var(--color-doom,#ff3040)] text-white' : 'bg-[var(--color-bg-tertiary,#1a1a1a)] text-[var(--color-text-secondary,#777)] hover:bg-[var(--color-bg-secondary,#111)]'}`}>{tab.label}</button>)}</div>
        <div className="px-4 py-2 flex items-center justify-between border-t border-[var(--color-border,#333)]"><span className="text-[12px] text-[var(--color-text-muted,#555)]">{pagination.totalCount} transaction{pagination.totalCount !== 1 ? 's' : ''}</span><div className="flex items-center gap-2"><button type="button" onClick={handleExport} disabled={filteredTransactions.length === 0} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-[var(--color-text-secondary,#777)] hover:bg-[var(--color-bg-tertiary,#1a1a1a)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors" aria-label="Export to CSV"><Download className="w-4 h-4" />Export</button><button type="button" onClick={() => setShowClearConfirm(true)} disabled={transactions.length === 0} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-[var(--color-doom,#ff3040)] hover:bg-[var(--color-doom,#ff3040)]/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" aria-label="Clear all transactions"><Trash2 className="w-4 h-4" />Clear All</button></div></div>
      </header>
      <main><TransactionList transactions={paginatedTransactions} pagination={pagination} onPageChange={setCurrentPage} onSelectTransaction={handleSelectTransaction} selectedId={selectedTransaction?.id} emptyMessage={searchQuery ? 'No matching transactions' : activeTab !== 'all' ? `No ${activeTab} transactions` : 'No transactions yet'} emptyDescription={searchQuery ? 'Try adjusting your search or filters.' : 'Your transaction history will appear here once you make your first transaction.'} /></main>
      {selectedTransaction && !showReceipt && <TransactionDetails transaction={selectedTransaction} onClose={handleCloseDetails} onViewReceipt={selectedTransaction.status === 'confirmed' ? handleViewReceipt : undefined} />}
      {selectedTransaction && showReceipt && <TransactionReceipt transaction={selectedTransaction} onClose={handleCloseDetails} />}
      {showClearConfirm && <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"><div className="bg-[var(--color-bg-primary,#000)] w-full max-w-sm rounded-2xl overflow-hidden border border-[var(--color-border,#333)]"><div className="p-6 text-center"><div className="w-12 h-12 rounded-full bg-[var(--color-doom,#ff3040)]/20 flex items-center justify-center mx-auto mb-4"><Trash2 className="w-6 h-6 text-[var(--color-doom,#ff3040)]" /></div><h3 className="text-[18px] font-bold text-[var(--color-text-primary,#f5f5f5)] mb-2">Clear All Transactions?</h3><p className="text-[14px] text-[var(--color-text-secondary,#777)]">This will permanently delete all {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} from your history. This action cannot be undone.</p></div><div className="flex gap-2 p-4 border-t border-[var(--color-border,#333)]"><button type="button" onClick={() => setShowClearConfirm(false)} className="flex-1 py-3 rounded-xl border border-[var(--color-border,#333)] text-[var(--color-text-primary,#f5f5f5)] text-[14px] font-semibold hover:bg-[var(--color-bg-tertiary,#1a1a1a)] transition-colors">Cancel</button><button type="button" onClick={handleClearAll} className="flex-1 py-3 rounded-xl bg-[var(--color-doom,#ff3040)] text-white text-[14px] font-semibold hover:opacity-90 transition-opacity">Clear All</button></div></div></div>}
    </div>
  )
}

export default TransactionsPage
