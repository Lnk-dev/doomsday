/**
 * Transaction Helper Utilities
 * Issue #103: Transaction history and receipts UI
 */

import type { TransactionStatus } from '@/lib/solana/transaction'

export type TransactionType = 'send' | 'receive' | 'bet' | 'reward' | 'stake' | 'unstake' | 'swap' | 'transfer' | 'other'

export interface TransactionMetadata {
  token?: 'DOOM' | 'LIFE' | 'SOL'
  amount?: number
  recipient?: string
  sender?: string
  eventId?: string
  eventTitle?: string
  betSide?: 'doom' | 'life'
  fee?: number
  slot?: number
}

export interface TransactionFilter {
  types?: TransactionType[]
  status?: TransactionStatus[]
  searchQuery?: string
  dateFrom?: number
  dateTo?: number
}

export interface PaginationState {
  page: number
  pageSize: number
  totalPages: number
  totalCount: number
}

export function applyTransactionFilter<T extends { type: string; status: TransactionStatus; signature?: string; description: string; createdAt: number; metadata?: TransactionMetadata }>(transactions: T[], filter: TransactionFilter): T[] {
  let result = transactions
  if (filter.types?.length) result = result.filter(tx => filter.types!.includes(tx.type as TransactionType))
  if (filter.status?.length) result = result.filter(tx => filter.status!.includes(tx.status))
  if (filter.searchQuery?.trim()) {
    const q = filter.searchQuery.toLowerCase().trim()
    result = result.filter(tx => tx.signature?.toLowerCase().includes(q) || tx.description.toLowerCase().includes(q) || tx.metadata?.recipient?.toLowerCase().includes(q) || tx.metadata?.sender?.toLowerCase().includes(q) || tx.metadata?.eventTitle?.toLowerCase().includes(q))
  }
  if (filter.dateFrom) result = result.filter(tx => tx.createdAt >= filter.dateFrom!)
  if (filter.dateTo) result = result.filter(tx => tx.createdAt <= filter.dateTo!)
  return result
}

export function paginateItems<T>(items: T[], page: number, pageSize: number): { items: T[]; pagination: PaginationState } {
  const totalCount = items.length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const validPage = Math.max(1, Math.min(page, totalPages))
  return { items: items.slice((validPage - 1) * pageSize, validPage * pageSize), pagination: { page: validPage, pageSize, totalPages, totalCount } }
}

export function getTransactionTypeName(type: TransactionType): string {
  return { send: 'Transfer Out', receive: 'Transfer In', bet: 'Bet Placed', reward: 'Reward Claimed', stake: 'Tokens Staked', unstake: 'Tokens Unstaked', swap: 'Token Swap', transfer: 'Transfer', other: 'Transaction' }[type] || 'Transaction'
}

export function formatTransactionDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function shortenAddress(address: string, chars = 8): string {
  if (address.length <= chars * 2 + 3) return address
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}

export function exportTransactionsToCSV<T extends { id: string; type: string; status: string; description: string; signature?: string; createdAt: number; metadata?: TransactionMetadata }>(transactions: T[]): string {
  const headers = ['ID', 'Type', 'Status', 'Description', 'Signature', 'Token', 'Amount', 'Recipient', 'Sender', 'Event', 'Fee (SOL)', 'Date']
  const rows = transactions.map(tx => {
    const m = tx.metadata || {}
    return [tx.id, tx.type, tx.status, `"${tx.description.replace(/"/g, '""')}"`, tx.signature || '', m.token || '', m.amount?.toString() || '', m.recipient || '', m.sender || '', m.eventTitle || '', m.fee !== undefined ? (m.fee / 1e9).toFixed(9) : '', new Date(tx.createdAt).toISOString()]
  })
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
}
