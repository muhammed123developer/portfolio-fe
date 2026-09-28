import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

/**
 * Light / dark / system theme, persisted across visits.
 *
 * Written by hand rather than pulling in next-themes: the whole behaviour is
 * about forty lines, and the library is built around a framework this project
 * does not use.
 *
 * "system" is a real third state, not a one-off initial guess — it keeps
 * following the OS setting, so a laptop switching to dark at sunset updates
 * the page without a reload.
 */

export type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'portfolio-theme'

interface ThemeContextValue {
  theme: Theme
  /** The theme actually being displayed once "system" is resolved. */
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function prefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

/** localStorage throws in some privacy modes, so every access is guarded. */
function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  } catch {
    // Ignore — fall through to the default.
  }
  return 'system'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme)
  const [systemIsDark, setSystemIsDark] = useState(() =>
    typeof window === 'undefined' ? false : prefersDark()
  )

  // Keep following the OS while the theme is "system".
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (event: MediaQueryListEvent) => setSystemIsDark(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  const resolvedTheme: 'light' | 'dark' =
    theme === 'system' ? (systemIsDark ? 'dark' : 'light') : theme

  // Tailwind 4's dark variant is configured as `.dark` in index.css, so the
  // class on <html> is what actually switches the palette.
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', resolvedTheme === 'dark')
    // Tells the browser to render native controls and scrollbars to match.
    root.style.colorScheme = resolvedTheme
  }, [resolvedTheme])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Persistence is a convenience; the theme still applies this session.
    }
  }, [])

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used inside a ThemeProvider')
  return context
}
