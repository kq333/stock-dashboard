import { useCallback, useEffect, useSyncExternalStore } from 'react'

export type ThemePreference = 'light' | 'dark' | 'system'

const THEME_STORAGE_KEY = 'theme'
const THEME_CHANGE_EVENT = 'stock-dashboard-theme-change'
const DARK_MODE_QUERY = '(prefers-color-scheme: dark)'

const getThemePreference = (): ThemePreference => {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)

  return savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system'
    ? savedTheme
    : 'system'
}

const getThemeSnapshot = () => {
  const systemTheme = window.matchMedia(DARK_MODE_QUERY).matches ? 'dark' : 'light'
  return `${getThemePreference()}:${systemTheme}`
}

const subscribeToTheme = (onStoreChange: () => void) => {
  const mediaQuery = window.matchMedia(DARK_MODE_QUERY)
  const handleStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY) onStoreChange()
  }

  window.addEventListener('storage', handleStorage)
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange)
  mediaQuery.addEventListener('change', onStoreChange)

  return () => {
    window.removeEventListener('storage', handleStorage)
    window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange)
    mediaQuery.removeEventListener('change', onStoreChange)
  }
}

export const useTheme = () => {
  const snapshot = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, () => 'system:light')
  const [theme, systemTheme] = snapshot.split(':') as [
    ThemePreference,
    Exclude<ThemePreference, 'system'>,
  ]
  const resolvedTheme = theme === 'system' ? systemTheme : theme

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark')
    // Opt out of automatic browser darkening when the app resolves to light mode.
    document.documentElement.style.colorScheme = resolvedTheme === 'light' ? 'only light' : 'dark'
  }, [resolvedTheme])

  const setTheme = useCallback((nextTheme: ThemePreference) => {
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT))
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }, [resolvedTheme, setTheme])

  return {
    isDark: resolvedTheme === 'dark',
    resolvedTheme,
    setTheme,
    theme,
    toggleTheme,
  }
}
