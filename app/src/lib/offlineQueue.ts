/**
 * Offline Action Queue
 * Issue #48: PWA with offline support
 *
 * Queues actions when offline and syncs when back online
 */

import { openDB, type IDBPDatabase } from 'idb'

interface QueuedAction {
  id: string
  type: 'like' | 'comment' | 'post' | 'follow' | 'unfollow'
  payload: Record<string, unknown>
  timestamp: number
  retries: number
}

const DB_NAME = 'doomsday-offline'
const STORE_NAME = 'queued-actions'
const MAX_RETRIES = 3

class OfflineQueue {
  private db: IDBPDatabase | null = null
  private isProcessing = false
  private listeners: Set<() => void> = new Set()

  async init(): Promise<void> {
    if (this.db) return

    this.db = await openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        }
      },
    })
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
  }

  async addToQueue(
    action: Omit<QueuedAction, 'id' | 'timestamp' | 'retries'>
  ): Promise<string> {
    await this.init()

    const queuedAction: QueuedAction = {
      ...action,
      id: this.generateId(),
      timestamp: Date.now(),
      retries: 0,
    }

    await this.db!.put(STORE_NAME, queuedAction)
    this.notifyListeners()

    // Try to sync immediately if online
    if (navigator.onLine) {
      this.processQueue()
    }

    return queuedAction.id
  }

  async removeFromQueue(id: string): Promise<void> {
    await this.init()
    await this.db!.delete(STORE_NAME, id)
    this.notifyListeners()
  }

  async getQueuedActions(): Promise<QueuedAction[]> {
    await this.init()
    return this.db!.getAll(STORE_NAME)
  }

  async getQueuedCount(): Promise<number> {
    await this.init()
    return (await this.db!.getAll(STORE_NAME)).length
  }

  async processQueue(): Promise<void> {
    if (this.isProcessing || !navigator.onLine) return

    this.isProcessing = true

    try {
      await this.init()
      const actions = await this.db!.getAll(STORE_NAME)

      for (const action of actions) {
        try {
          await this.executeAction(action)
          await this.db!.delete(STORE_NAME, action.id)
          this.notifyListeners()
        } catch (error) {
          console.error('Failed to process queued action:', action, error)

          // Increment retry count
          action.retries++

          if (action.retries >= MAX_RETRIES) {
            // Max retries reached, remove from queue
            await this.db!.delete(STORE_NAME, action.id)
            console.error('Action failed after max retries, discarding:', action)
          } else {
            // Update retry count
            await this.db!.put(STORE_NAME, action)
          }
          this.notifyListeners()
        }
      }
    } finally {
      this.isProcessing = false
    }
  }

  private async executeAction(action: QueuedAction): Promise<void> {
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

    const endpoints: Record<string, { path: string; method: string }> = {
      like: { path: '/posts/like', method: 'POST' },
      comment: { path: '/posts/comment', method: 'POST' },
      post: { path: '/posts', method: 'POST' },
      follow: { path: '/users/follow', method: 'POST' },
      unfollow: { path: '/users/unfollow', method: 'POST' },
    }

    const endpoint = endpoints[action.type]
    if (!endpoint) {
      throw new Error(`Unknown action type: ${action.type}`)
    }

    const response = await fetch(`${API_BASE}${endpoint.path}`, {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(action.payload),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener())
  }
}

export const offlineQueue = new OfflineQueue()

// Process queue when coming back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    offlineQueue.processQueue()
  })

  // Initialize on load
  offlineQueue.init()
}
