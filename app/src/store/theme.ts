/**
 * Theme Store
 *
 * Manages dark/light mode theme preferences.
 * Features:
 * - Dark, light, and system theme modes
 * - Persists preference to localStorage
 * - Applies theme class to document root
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'dark' | 'light' | 'system'

interface ThemeState {
  /** Current theme mode setting */
  mode: ThemeMode
  /** Resolved theme (what's actually displayed) */
  resolvedTheme: 'dark' | 'light'
  /** Set theme mode */
  setTheme: (mode: ThemeMode) => void
  /** Initialize theme on app load */
  initTheme: () => void
}

/** Get system preference */
function getSystemPreference(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** Apply theme to document */
function applyTheme(theme: 'dark' | 'light') {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.classList.remove('dark', 'light')
  root.classList.add(theme)
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'dark',
      resolvedTheme: 'dark',

      setTheme: (mode: ThemeMode) => {
        const resolvedTheme = mode === 'system' ? getSystemPreference() : mode
        applyTheme(resolvedTheme)
        set({ mode, resolvedTheme })
      },

      initTheme: () => {
        const { mode } = get()
        const resolvedTheme = mode === 'system' ? getSystemPreference() : mode
        applyTheme(resolvedTheme)
        set({ resolvedTheme })

        // Listen for system preference changes
        if (mode === 'system' && typeof window !== 'undefined') {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
          const handleChange = (e: MediaQueryListEvent) => {
            const newTheme = e.matches ? 'dark' : 'light'
            applyTheme(newTheme)
            set({ resolvedTheme: newTheme })
          }
          mediaQuery.addEventListener('change', handleChange)
        }
      },
    }),
    {
      name: 'doomsday-theme',
      partialize: (state) => ({ mode: state.mode }),
    }
  )
)
