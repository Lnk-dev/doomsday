/**
 * Toast Store Tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useToastStore, toast } from './toast'

describe('toast store', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useToastStore.setState({ toasts: [] })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initial state', () => {
    it('should have empty toasts array', () => {
      const state = useToastStore.getState()
      expect(state.toasts).toEqual([])
    })
  })

  describe('addToast', () => {
    it('should add a toast', () => {
      const { addToast } = useToastStore.getState()

      addToast('Test message', 'success')

      const state = useToastStore.getState()
      expect(state.toasts).toHaveLength(1)
      expect(state.toasts[0].message).toBe('Test message')
      expect(state.toasts[0].type).toBe('success')
    })

    it('should return toast ID', () => {
      const { addToast } = useToastStore.getState()

      const id = addToast('Test message', 'info')

      expect(id).toBeDefined()
      expect(typeof id).toBe('string')
    })

    it('should generate unique IDs', () => {
      const { addToast } = useToastStore.getState()

      const id1 = addToast('Message 1', 'success')
      const id2 = addToast('Message 2', 'error')

      expect(id1).not.toBe(id2)
    })

    it('should use default duration of 4000ms', () => {
      const { addToast } = useToastStore.getState()

      addToast('Test message', 'success')

      const state = useToastStore.getState()
      expect(state.toasts[0].duration).toBe(4000)
    })

    it('should accept custom duration', () => {
      const { addToast } = useToastStore.getState()

      addToast('Test message', 'success', { duration: 2000 })

      const state = useToastStore.getState()
      expect(state.toasts[0].duration).toBe(2000)
    })

    it('should set createdAt timestamp', () => {
      const { addToast } = useToastStore.getState()
      const now = Date.now()
      vi.setSystemTime(now)

      addToast('Test message', 'success')

      const state = useToastStore.getState()
      expect(state.toasts[0].createdAt).toBe(now)
    })

    it('should auto-dismiss after duration', () => {
      const { addToast } = useToastStore.getState()

      addToast('Test message', 'success', { duration: 2000 })

      expect(useToastStore.getState().toasts).toHaveLength(1)

      vi.advanceTimersByTime(2000)

      expect(useToastStore.getState().toasts).toHaveLength(0)
    })

    it('should not auto-dismiss when duration is 0', () => {
      const { addToast } = useToastStore.getState()

      addToast('Test message', 'success', { duration: 0 })

      vi.advanceTimersByTime(10000)

      expect(useToastStore.getState().toasts).toHaveLength(1)
    })

    it('should limit toasts to MAX_TOASTS (5)', () => {
      const { addToast } = useToastStore.getState()

      for (let i = 0; i < 7; i++) {
        addToast(`Message ${i}`, 'info', { duration: 0 })
      }

      expect(useToastStore.getState().toasts).toHaveLength(5)
    })

    it('should remove oldest toast when limit exceeded', () => {
      const { addToast } = useToastStore.getState()

      for (let i = 0; i < 6; i++) {
        addToast(`Message ${i}`, 'info', { duration: 0 })
      }

      const toasts = useToastStore.getState().toasts
      expect(toasts[0].message).toBe('Message 1')
      expect(toasts[4].message).toBe('Message 5')
    })
  })

  describe('removeToast', () => {
    it('should remove a toast by ID', () => {
      const { addToast, removeToast } = useToastStore.getState()

      const id = addToast('Test message', 'success', { duration: 0 })
      expect(useToastStore.getState().toasts).toHaveLength(1)

      removeToast(id)
      expect(useToastStore.getState().toasts).toHaveLength(0)
    })

    it('should only remove specified toast', () => {
      const { addToast, removeToast } = useToastStore.getState()

      const id1 = addToast('Message 1', 'success', { duration: 0 })
      addToast('Message 2', 'error', { duration: 0 })

      removeToast(id1)

      const toasts = useToastStore.getState().toasts
      expect(toasts).toHaveLength(1)
      expect(toasts[0].message).toBe('Message 2')
    })

    it('should handle non-existent ID gracefully', () => {
      const { removeToast } = useToastStore.getState()

      // Should not throw
      removeToast('non-existent-id')

      expect(useToastStore.getState().toasts).toEqual([])
    })
  })

  describe('clearToasts', () => {
    it('should remove all toasts', () => {
      const { addToast, clearToasts } = useToastStore.getState()

      addToast('Message 1', 'success', { duration: 0 })
      addToast('Message 2', 'error', { duration: 0 })
      addToast('Message 3', 'warning', { duration: 0 })

      clearToasts()

      expect(useToastStore.getState().toasts).toEqual([])
    })
  })

  describe('toast helper', () => {
    it('should create success toast', () => {
      toast.success('Success message')

      const toasts = useToastStore.getState().toasts
      expect(toasts[0].type).toBe('success')
      expect(toasts[0].message).toBe('Success message')
    })

    it('should create error toast', () => {
      toast.error('Error message')

      const toasts = useToastStore.getState().toasts
      expect(toasts[0].type).toBe('error')
    })

    it('should create warning toast', () => {
      toast.warning('Warning message')

      const toasts = useToastStore.getState().toasts
      expect(toasts[0].type).toBe('warning')
    })

    it('should create info toast', () => {
      toast.info('Info message')

      const toasts = useToastStore.getState().toasts
      expect(toasts[0].type).toBe('info')
    })

    it('should dismiss specific toast', () => {
      const id = toast.success('Test', { duration: 0 })

      toast.dismiss(id)

      expect(useToastStore.getState().toasts).toHaveLength(0)
    })

    it('should dismiss all toasts', () => {
      toast.success('Test 1', { duration: 0 })
      toast.error('Test 2', { duration: 0 })

      toast.dismissAll()

      expect(useToastStore.getState().toasts).toHaveLength(0)
    })

    it('should accept options', () => {
      toast.success('Test', { duration: 1000 })

      expect(useToastStore.getState().toasts[0].duration).toBe(1000)
    })
  })
})
