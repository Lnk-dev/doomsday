import { X, Copy, ExternalLink, CheckCircle2, XCircle, Loader2, Clock, AlertTriangle, RefreshCw, FileText } from 'lucide-react'
import { useState } from 'react'
import type { TrackedTransaction } from '@/store/transactions'
import type { TransactionType, TransactionMetadata } from '@/lib/transactions'
import { getTransactionTypeName, formatTransactionDate, shortenAddress } from '@/lib/transactions'
import { formatNumber } from '@/lib/utils'
import { getExplorerUrl, getNetworkDisplayName } from '@/lib/solana/config'

interface DisplayTransaction extends Omit<TrackedTransaction, 'type'> { type: TransactionType; metadata?: TransactionMetadata }
interface TransactionDetailsProps { transaction: DisplayTransaction | TrackedTransaction; onClose: () => void; onViewReceipt?: () => void; onRetry?: () => void }

const getStatusDisplay = (status: string) => ({ confirmed: { icon: <CheckCircle2 className="w-5 h-5" />, color: 'text-[var(--color-life,#00ff00)]', bgColor: 'bg-[var(--color-life,#00ff00)]/20', label: 'Confirmed' }, failed: { icon: <XCircle className="w-5 h-5" />, color: 'text-[var(--color-doom,#ff3040)]', bgColor: 'bg-[var(--color-doom,#ff3040)]/20', label: 'Failed' }, pending: { icon: <Loader2 className="w-5 h-5 animate-spin" />, color: 'text-[var(--color-warning,#ffad1f)]', bgColor: 'bg-[var(--color-warning,#ffad1f)]/20', label: 'Pending' }, signing: { icon: <Loader2 className="w-5 h-5 animate-spin" />, color: 'text-[var(--color-warning,#ffad1f)]', bgColor: 'bg-[var(--color-warning,#ffad1f)]/20', label: 'Signing' }, sending: { icon: <Loader2 className="w-5 h-5 animate-spin" />, color: 'text-[var(--color-warning,#ffad1f)]', bgColor: 'bg-[var(--color-warning,#ffad1f)]/20', label: 'Sending' }, confirming: { icon: <Loader2 className="w-5 h-5 animate-spin" />, color: 'text-[var(--color-warning,#ffad1f)]', bgColor: 'bg-[var(--color-warning,#ffad1f)]/20', label: 'Confirming' } }[status] || { icon: <Clock className="w-5 h-5" />, color: 'text-[var(--color-text-muted,#555)]', bgColor: 'bg-[var(--color-bg-tertiary,#1a1a1a)]', label: status })

export function TransactionDetails({ transaction, onClose, onViewReceipt, onRetry }: TransactionDetailsProps) {
  const [copied, setCopied] = useState<string | null>(null)
  const statusDisplay = getStatusDisplay(transaction.status)
  const isOutgoing = transaction.type === 'send' || transaction.type === 'stake'
  const metadata = 'metadata' in transaction ? transaction.metadata : undefined
  const networkName = getNetworkDisplayName()

  const handleCopy = async (text: string, field: string) => { try { await navigator.clipboard.writeText(text); setCopied(field); setTimeout(() => setCopied(null), 2000) } catch {} }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-bg-primary,#000)] w-full max-w-lg rounded-2xl overflow-hidden border border-[var(--color-border,#333)]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border,#333)]"><h2 className="text-[18px] font-bold text-[var(--color-text-primary,#f5f5f5)]">Transaction Details</h2><button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-[var(--color-bg-tertiary,#1a1a1a)] text-[var(--color-text-secondary,#777)] transition-colors" aria-label="Close"><X className="w-5 h-5" /></button></div>
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="flex items-center gap-3"><div className={`w-12 h-12 rounded-full flex items-center justify-center ${statusDisplay.bgColor}`}><span className={statusDisplay.color}>{statusDisplay.icon}</span></div><div><p className={`text-[16px] font-semibold ${statusDisplay.color}`}>{statusDisplay.label}</p><p className="text-[13px] text-[var(--color-text-muted,#555)]">{getTransactionTypeName(transaction.type as TransactionType)}</p></div></div>
          {metadata?.amount !== undefined && <div className="p-4 rounded-xl bg-[var(--color-bg-secondary,#111)]"><p className="text-[12px] text-[var(--color-text-muted,#555)] mb-1">Amount</p><p className={`text-[28px] font-bold ${isOutgoing ? 'text-[var(--color-doom,#ff3040)]' : 'text-[var(--color-life,#00ff00)]'}`}>{isOutgoing ? '-' : '+'}{formatNumber(metadata.amount)}{metadata.token && <span className="text-[16px] ml-2 text-[var(--color-text-secondary,#777)]">{metadata.token}</span>}</p></div>}
          <div className="space-y-3">
            <div><p className="text-[12px] text-[var(--color-text-muted,#555)] mb-1">Description</p><p className="text-[14px] text-[var(--color-text-primary,#f5f5f5)]">{transaction.description}</p></div>
            <div><p className="text-[12px] text-[var(--color-text-muted,#555)] mb-1">Date</p><p className="text-[14px] text-[var(--color-text-primary,#f5f5f5)]">{formatTransactionDate(transaction.createdAt)}</p></div>
            {transaction.signature && <div><p className="text-[12px] text-[var(--color-text-muted,#555)] mb-1">Transaction ID</p><div className="flex items-center gap-2"><code className="text-[13px] text-[var(--color-text-secondary,#777)] font-mono">{shortenAddress(transaction.signature, 12)}</code><button type="button" onClick={() => handleCopy(transaction.signature!, 'signature')} className="p-1 rounded hover:bg-[var(--color-bg-tertiary,#1a1a1a)] text-[var(--color-text-muted,#555)] transition-colors" aria-label="Copy">{copied === 'signature' ? <CheckCircle2 className="w-4 h-4 text-[var(--color-life,#00ff00)]" /> : <Copy className="w-4 h-4" />}</button></div></div>}
            {metadata?.recipient && <div><p className="text-[12px] text-[var(--color-text-muted,#555)] mb-1">To</p><div className="flex items-center gap-2"><code className="text-[13px] text-[var(--color-text-secondary,#777)] font-mono">{shortenAddress(metadata.recipient, 8)}</code><button type="button" onClick={() => handleCopy(metadata.recipient!, 'recipient')} className="p-1 rounded hover:bg-[var(--color-bg-tertiary,#1a1a1a)] text-[var(--color-text-muted,#555)] transition-colors" aria-label="Copy">{copied === 'recipient' ? <CheckCircle2 className="w-4 h-4 text-[var(--color-life,#00ff00)]" /> : <Copy className="w-4 h-4" />}</button></div></div>}
            {metadata?.sender && <div><p className="text-[12px] text-[var(--color-text-muted,#555)] mb-1">From</p><div className="flex items-center gap-2"><code className="text-[13px] text-[var(--color-text-secondary,#777)] font-mono">{shortenAddress(metadata.sender, 8)}</code><button type="button" onClick={() => handleCopy(metadata.sender!, 'sender')} className="p-1 rounded hover:bg-[var(--color-bg-tertiary,#1a1a1a)] text-[var(--color-text-muted,#555)] transition-colors" aria-label="Copy">{copied === 'sender' ? <CheckCircle2 className="w-4 h-4 text-[var(--color-life,#00ff00)]" /> : <Copy className="w-4 h-4" />}</button></div></div>}
            {metadata?.eventTitle && <div><p className="text-[12px] text-[var(--color-text-muted,#555)] mb-1">Event</p><p className="text-[14px] text-[var(--color-text-primary,#f5f5f5)]">{metadata.eventTitle}</p></div>}
            {metadata?.betSide && <div><p className="text-[12px] text-[var(--color-text-muted,#555)] mb-1">Prediction</p><span className={`inline-flex px-2 py-0.5 rounded text-[12px] font-semibold ${metadata.betSide === 'doom' ? 'bg-[var(--color-doom,#ff3040)]/20 text-[var(--color-doom,#ff3040)]' : 'bg-[var(--color-life,#00ff00)]/20 text-[var(--color-life,#00ff00)]'}`}>{metadata.betSide.toUpperCase()}</span></div>}
            {metadata?.fee !== undefined && <div><p className="text-[12px] text-[var(--color-text-muted,#555)] mb-1">Network Fee</p><p className="text-[14px] text-[var(--color-text-primary,#f5f5f5)]">{(metadata.fee / 1e9).toFixed(6)} SOL</p></div>}
            {metadata?.slot && <div><p className="text-[12px] text-[var(--color-text-muted,#555)] mb-1">Slot</p><p className="text-[14px] text-[var(--color-text-primary,#f5f5f5)]">{metadata.slot.toLocaleString()}</p></div>}
            <div><p className="text-[12px] text-[var(--color-text-muted,#555)] mb-1">Network</p><p className="text-[14px] text-[var(--color-text-primary,#f5f5f5)]">Solana {networkName}</p></div>
          </div>
          {transaction.error && <div className="p-3 rounded-xl bg-[var(--color-doom,#ff3040)]/10 border border-[var(--color-doom,#ff3040)]/30"><div className="flex items-start gap-2"><AlertTriangle className="w-5 h-5 text-[var(--color-doom,#ff3040)] flex-shrink-0 mt-0.5" /><div><p className="text-[13px] font-semibold text-[var(--color-doom,#ff3040)]">{transaction.error.type}</p><p className="text-[12px] text-[var(--color-text-secondary,#777)] mt-1">{transaction.error.message}</p>{transaction.error.recoverable && <p className="text-[11px] text-[var(--color-text-muted,#555)] mt-2">This error may be recoverable. Try again in a moment.</p>}</div></div></div>}
        </div>
        <div className="flex gap-2 p-4 border-t border-[var(--color-border,#333)]">
          {transaction.status === 'failed' && transaction.error?.retryable && onRetry && <button type="button" onClick={onRetry} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--color-doom,#ff3040)] text-white text-[14px] font-semibold hover:opacity-90 transition-opacity"><RefreshCw className="w-4 h-4" />Retry</button>}
          {transaction.status === 'confirmed' && onViewReceipt && <button type="button" onClick={onViewReceipt} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-[var(--color-border,#333)] text-[var(--color-text-primary,#f5f5f5)] text-[14px] font-semibold hover:bg-[var(--color-bg-tertiary,#1a1a1a)] transition-colors"><FileText className="w-4 h-4" />View Receipt</button>}
          {transaction.signature && <a href={getExplorerUrl(transaction.signature, 'tx')} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-[var(--color-border,#333)] text-[var(--color-text-primary,#f5f5f5)] text-[14px] font-semibold hover:bg-[var(--color-bg-tertiary,#1a1a1a)] transition-colors"><ExternalLink className="w-4 h-4" />Explorer</a>}
        </div>
      </div>
    </div>
  )
}
