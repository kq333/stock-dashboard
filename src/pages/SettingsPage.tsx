import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { Database, KeyRound, Monitor, Moon, RotateCcw, Settings, Sun } from 'lucide-react'
import { useTheme, type ThemePreference } from '@/hooks/useTheme'

export const DEFAULT_ROUTE_STORAGE_KEY = 'stock-dashboard-default-route'

const routeOptions = [
  { label: 'Dashboard', value: '/dashboard' },
  { label: 'Markets', value: '/markets' },
  { label: 'Watchlist', value: '/watchlist' },
  { label: 'Portfolio', value: '/portfolio' },
  { label: 'Compare', value: '/compare' },
  { label: 'Calendar', value: '/calendar' },
  { label: 'News', value: '/news' },
] as const

const getDefaultRoute = () => {
  const savedRoute = localStorage.getItem(DEFAULT_ROUTE_STORAGE_KEY)
  return routeOptions.some(({ value }) => value === savedRoute) ? savedRoute! : '/dashboard'
}

const themeOptions: {
  icon: typeof Sun
  label: string
  value: ThemePreference
}[] = [
  { icon: Sun, label: 'Light', value: 'light' },
  { icon: Moon, label: 'Dark', value: 'dark' },
  { icon: Monitor, label: 'System', value: 'system' },
]

const savedDataOptions = [
  {
    description: 'Restore the default Bitcoin, Ethereum, Apple and Nvidia watchlist.',
    event: 'stock-dashboard-watchlist-change',
    key: 'stock-dashboard-watchlist',
    label: 'Reset watchlist',
  },
  {
    description: 'Remove all saved positions and purchase information.',
    key: 'stock-dashboard-portfolio',
    label: 'Clear portfolio',
  },
  {
    description: 'Restore the default Bitcoin, Ethereum and Apple comparison.',
    key: 'stock-dashboard-compare',
    label: 'Reset comparison',
  },
]

const SettingsPage = () => {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage === 'pl' ? 'pl' : 'en'

  const { setTheme, theme } = useTheme()
  const [defaultRoute, setDefaultRoute] = useState(getDefaultRoute)
  const [finnhubConfigured, setFinnhubConfigured] = useState<boolean | null>(null)
  const coinGeckoConfigured = Boolean(
    import.meta.env.VITE_COINGECKO_API_KEY &&
    import.meta.env.VITE_COINGECKO_API_KEY !== 'replace_with_your_coingecko_demo_api_key',
  )

  useEffect(() => {
    const controller = new AbortController()

    fetch('/api/finnhub/status', { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((status: { configured?: boolean }) => setFinnhubConfigured(status.configured === true))
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return
        setFinnhubConfigured(false)
      })

    return () => controller.abort()
  }, [])

  const updateDefaultRoute = (route: string) => {
    setDefaultRoute(route)
    localStorage.setItem(DEFAULT_ROUTE_STORAGE_KEY, route)
  }

  const resetSavedData = (label: string, key: string, event?: string) => {
    const shouldReset = window.confirm(t('Reset confirmation', { action: t(label) }))
    if (!shouldReset) return

    localStorage.removeItem(key)
    if (event) window.dispatchEvent(new Event(event))
  }

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-7">
        <p className="mb-1 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
          {t('Preferences')}
        </p>
        <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight sm:text-4xl">
          <Settings className="size-8" aria-hidden="true" />
          {t('Settings')}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('Customize the dashboard and manage locally saved data.')}
        </p>
      </div>

      <div className="space-y-4">
        <article className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm sm:p-6">
          <h2 className="text-xl font-semibold">{t('Language')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('Choose the interface language. Your choice is saved in this browser.')}
          </p>
          <label className="mt-5 grid max-w-md gap-1.5 text-sm font-medium">
            {t('Interface language')}
            <select
              value={language}
              onChange={(event) => i18n.changeLanguage(event.target.value === 'pl' ? 'pl' : 'en')}
              className="h-11 rounded-md border border-input bg-background px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="en" lang="en">
                English (EN)
              </option>
              <option value="pl" lang="pl">
                Polski (PL)
              </option>
            </select>
          </label>
        </article>
        <article className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm sm:p-6">
          <div>
            <h2 className="text-xl font-semibold">{t('Appearance')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('Choose a theme or follow your operating system preference.')}
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {themeOptions.map(({ icon: Icon, label, value }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                  theme === value ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted'
                }`}
              >
                <Icon className="size-5" aria-hidden="true" />
                <span>
                  <span className="block font-medium">{t(label)}</span>
                  <span className="text-xs text-muted-foreground">
                    {value === 'system' ? t('Use device setting') : t(`${label} colors`)}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </article>

        <article className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm sm:p-6">
          <div>
            <h2 className="text-xl font-semibold">{t('Start page')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('Select where the application opens when visiting the root URL.')}
            </p>
          </div>

          <label className="mt-5 grid max-w-md gap-1.5 text-sm font-medium">
            {t('Default route')}
            <select
              value={defaultRoute}
              onChange={(event) => updateDefaultRoute(event.target.value)}
              className="h-11 rounded-md border border-input bg-background px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {routeOptions.map(({ label, value }) => (
                <option key={value} value={value}>
                  {t(label)}
                </option>
              ))}
            </select>
          </label>
        </article>

        <article className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <KeyRound className="mt-0.5 size-5 text-muted-foreground" aria-hidden="true" />
            <div>
              <h2 className="text-xl font-semibold">{t('API configuration')}</h2>
              <p className="text-sm text-muted-foreground">
                {t('Configuration status only. Secret values are never displayed here.')}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              {
                configured: finnhubConfigured,
                description: 'Protected server proxy for stocks, news and calendars',
                label: 'Finnhub',
              },
              {
                configured: coinGeckoConfigured,
                description: 'Crypto metadata and market statistics',
                label: 'CoinGecko demo key',
              },
            ].map(({ configured, description, label }) => (
              <div
                key={label}
                className="flex items-center justify-between gap-4 rounded-lg border border-border p-4"
              >
                <div>
                  <p className="font-medium">{t(label)}</p>
                  <p className="text-xs text-muted-foreground">{t(description)}</p>
                </div>
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium ${
                    configured === true
                      ? 'bg-green-500/10 text-green-700 dark:text-green-300'
                      : configured === false
                        ? 'bg-red-500/10 text-red-700 dark:text-red-300'
                        : 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300'
                  }`}
                >
                  <span
                    className={`size-2 rounded-full ${
                      configured === true
                        ? 'bg-green-500'
                        : configured === false
                          ? 'bg-red-500'
                          : 'bg-yellow-500'
                    }`}
                  />
                  {configured === null
                    ? t('Checking')
                    : configured
                      ? t('Configured')
                      : label === 'Finnhub'
                        ? t('Missing')
                        : t('Optional')}
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <Database className="mt-0.5 size-5 text-muted-foreground" aria-hidden="true" />
            <div>
              <h2 className="text-xl font-semibold">{t('Local data')}</h2>
              <p className="text-sm text-muted-foreground">
                {t('Watchlist, portfolio and comparison data are stored only in this browser.')}
              </p>
            </div>
          </div>

          <div className="mt-5 divide-y divide-border rounded-lg border border-border">
            {savedDataOptions.map(({ description, event, key, label }) => (
              <div
                key={key}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{t(label)}</p>
                  <p className="text-xs text-muted-foreground">{t(description)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => resetSavedData(label, key, event)}
                  className="inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md border border-border px-3 text-sm font-medium transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <RotateCcw className="size-4" aria-hidden="true" />
                  {t(label)}
                </button>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  )
}

export default SettingsPage
