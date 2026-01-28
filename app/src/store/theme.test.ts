/**
 * Theme Store Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useThemeStore } from './theme'

// Mock matchMedia
const mockMatchMedia = vi.fn()
const mockAddEventListener = vi.fn()

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
})

// Mock document.documentElement
const mockClassList = {
  add: vi.fn(),
  remove: vi.fn(),
}

Object.defineProperty(document, 'documentElement', {
  writable: true,
  value: { classList: mockClassList },
})

describe('Theme Store', () => {
  beforeEach(() => {
    // Reset store state
    useThemeStore.setState({ mode: 'dark', resolvedTheme: 'dark' })

    // Clear mocks
    vi.clearAllMocks()
    mockMatchMedia.mockClear()
    mockAddEventListener.mockClear()

    // Default matchMedia mock
    mockMatchMedia.mockReturnValue({
      matches: true,
      addEventListener: mockAddEventListener,
    })
  })

  describe('setTheme', () => {
    it('should set dark theme', () => {
      const { setTheme } = useThemeStore.getState()
      setTheme('dark')

      const state = useThemeStore.getState()
      expect(state.mode).toBe('dark')
      expect(state.resolvedTheme).toBe('dark')
      expect(mockClassList.add).toHaveBeenCalledWith('dark')
    })

    it('should set light theme', () => {
      const { setTheme } = useThemeStore.getState()
      setTheme('light')

      const state = useThemeStore.getState()
      expect(state.mode).toBe('light')
      expect(state.resolvedTheme).toBe('light')
      expect(mockClassList.add).toHaveBeenCalledWith('light')
    })

    it('should set system theme and resolve to dark when system prefers dark', () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: mockAddEventListener,
      })

      const { setTheme } = useThemeStore.getState()
      setTheme('system')

      const state = useThemeStore.getState()
      expect(state.mode).toBe('system')
      expect(state.resolvedTheme).toBe('dark')
    })

    it('should set system theme and resolve to light when system prefers light', () => {
      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener: mockAddEventListener,
      })

      const { setTheme } = useThemeStore.getState()
      setTheme('system')

      const state = useThemeStore.getState()
      expect(state.mode).toBe('system')
      expect(state.resolvedTheme).toBe('light')
    })

    it('should remove existing theme classes before adding new one', () => {
      const { setTheme } = useThemeStore.getState()
      setTheme('light')

      expect(mockClassList.remove).toHaveBeenCalledWith('dark', 'light')
    })
  })

  describe('initTheme', () => {
    it('should apply dark theme on init when mode is dark', () => {
      useThemeStore.setState({ mode: 'dark' })

      const { initTheme } = useThemeStore.getState()
      initTheme()

      expect(mockClassList.add).toHaveBeenCalledWith('dark')
    })

    it('should apply light theme on init when mode is light', () => {
      useThemeStore.setState({ mode: 'light' })

      const { initTheme } = useThemeStore.getState()
      initTheme()

      expect(mockClassList.add).toHaveBeenCalledWith('light')
    })

    it('should set up system preference listener when mode is system', () => {
      useThemeStore.setState({ mode: 'system' })

      const { initTheme } = useThemeStore.getState()
      initTheme()

      expect(mockAddEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    })

    it('should not set up listener when theme is not system', () => {
      useThemeStore.setState({ mode: 'dark' })
      mockAddEventListener.mockClear()

      const { initTheme } = useThemeStore.getState()
      initTheme()

      expect(mockAddEventListener).not.toHaveBeenCalled()
    })
  })
})
