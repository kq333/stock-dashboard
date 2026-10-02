import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { Link, matchPath, NavLink, useLocation } from 'react-router-dom'
import {
  BriefcaseBusiness,
  CalendarDays,
  ChartCandlestick,
  ChevronLeft,
  ChevronRight,
  GitCompareArrows,
  LayoutDashboard,
  Menu,
  Moon,
  Rss,
  Settings,
  Star,
  Sun,
  X,
} from 'lucide-react'
import { useHideOnScroll } from '@/hooks/useHideOnScroll'
import { useTheme } from '@/hooks/useTheme'

type SidebarProps = {
  isCollapsed: boolean
  onToggle: () => void
}

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/watchlist': 'Watchlist',
  '/portfolio': 'Portfolio',
  '/compare': 'Compare',
  '/calendar': 'Calendar',
  '/markets': 'Crypto',
  '/markets/stocks': 'Stocks',
  '/news': 'News',
  '/settings': 'Settings',
}

const getPageTitle = (pathname: string, t: (text: string) => string) => {
  const path = pathname.replace(/\/+$/, '') || '/'
  const title = pageTitles[path.toLowerCase()]
  if (title) return t(title)

  const stock = matchPath('/markets/stocks/:symbol', path)
  if (stock?.params.symbol) return `${stock.params.symbol.toUpperCase()} · ${t('Stocks')}`

  const crypto = matchPath('/markets/:currencyId', path)
  if (crypto?.params.currencyId) {
    const name = crypto.params.currencyId
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
    return `${name} · ${t('Crypto')}`
  }

  return t('Dashboard')
}

const Sidebar = ({ isCollapsed, onToggle }: SidebarProps) => {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage === 'pl' ? 'pl' : 'en'

  const { pathname } = useLocation()
  const pageTitle = getPageTitle(pathname, t)
  const isHiddenOnScroll = useHideOnScroll({ showOnScrollUp: false, topOffset: 8 })
  const [isMobileOpen, setIsMobileOpen] = useState<boolean | null>(null)
  const isMobileHidden = isMobileOpen === null ? isHiddenOnScroll : !isMobileOpen
  const { isDark, toggleTheme } = useTheme()

  useEffect(() => {
    const scrollTarget = document.getElementById('page-content') ?? window
    const resumeAutoHide = () => setIsMobileOpen(null)

    scrollTarget.addEventListener('scroll', resumeAutoHide, { passive: true })
    return () => scrollTarget.removeEventListener('scroll', resumeAutoHide)
  }, [])

  return (
    <>
      <header className="relative z-60 flex h-16 shrink-0 items-center gap-3 border-b border-sidebar-border bg-sidebar px-3 text-sidebar-foreground lg:hidden">
        <button
          type="button"
          className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-md hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none"
          onClick={() => setIsMobileOpen(isMobileHidden)}
          aria-label={isMobileHidden ? t('Open navigation') : t('Close navigation')}
          aria-expanded={!isMobileHidden}
          aria-controls="main-sidebar"
        >
          {isMobileHidden ? (
            <Menu className="size-5" aria-hidden="true" />
          ) : (
            <X className="size-5" aria-hidden="true" />
          )}
        </button>
        <p className="min-w-0 truncate font-semibold" title={pageTitle}>
          {pageTitle}
        </p>
      </header>
      <aside
        id="main-sidebar"
        className={`fixed top-16 left-0 z-50 flex h-[calc(100dvh-4rem)] max-h-dvh flex-col border-r border-sidebar-border bg-sidebar p-4 text-sidebar-foreground transition-[width,translate,background-color,border-color] duration-300 motion-reduce:transition-none lg:top-0 lg:h-dvh ${
          isCollapsed ? 'w-18' : 'w-18 lg:w-64'
        } ${isMobileHidden ? 'max-lg:invisible max-lg:-translate-x-full' : 'translate-x-0'}`}
      >
        <button
          type="button"
          className="absolute top-4 -right-3 z-10 hidden size-7 cursor-pointer items-center justify-center rounded-full border border-sidebar-border bg-sidebar shadow-sm transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none lg:flex"
          onClick={onToggle}
          aria-label={isCollapsed ? t('Expand sidebar') : t('Collapse sidebar')}
        >
          {isCollapsed ? (
            <ChevronRight className="pointer-events-none size-4" />
          ) : (
            <ChevronLeft className="pointer-events-none size-4" />
          )}
        </button>

        <Link
          to="/dashboard"
          className={`mb-6 shrink-0 overflow-hidden whitespace-nowrap text-center text-xl font-semibold transition-opacity duration-200 max-lg:hidden ${
            isCollapsed ? 'invisible opacity-0' : 'visible opacity-100'
          }`}
        >
          Stock Dashboard
        </Link>

        <nav
          className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto"
          aria-label={t('Main navigation')}
        >
          <NavLink
            aria-label={t('Dashboard')}
            to="/dashboard"
            className={({ isActive }) =>
              `rounded-md px-3 py-2 font-medium transition-[background-color] ${
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
              }`
            }
          >
            <div className="flex min-w-0 items-center gap-2">
              <LayoutDashboard className="size-5 shrink-0" />
              <span
                className={`overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 max-lg:max-w-0 max-lg:opacity-0 ${
                  isCollapsed ? 'max-w-0 opacity-0' : 'max-w-32 opacity-100'
                }`}
              >
                {t('Dashboard')}
              </span>
            </div>
          </NavLink>

          <NavLink
            aria-label={t('Watchlist')}
            to="/watchlist"
            className={({ isActive }) =>
              `rounded-md px-3 py-2 font-medium transition-[background-color] ${
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
              }`
            }
          >
            <div className="flex min-w-0 items-center gap-2">
              <Star className="size-5 shrink-0" />
              <span
                className={`overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 max-lg:max-w-0 max-lg:opacity-0 ${
                  isCollapsed ? 'max-w-0 opacity-0' : 'max-w-32 opacity-100'
                }`}
              >
                {t('Watchlist')}
              </span>
            </div>
          </NavLink>

          <NavLink
            aria-label={t('Portfolio')}
            to="/portfolio"
            className={({ isActive }) =>
              `rounded-md px-3 py-2 font-medium transition-[background-color] ${
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
              }`
            }
          >
            <div className="flex min-w-0 items-center gap-2">
              <BriefcaseBusiness className="size-5 shrink-0" />
              <span
                className={`overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 max-lg:max-w-0 max-lg:opacity-0 ${
                  isCollapsed ? 'max-w-0 opacity-0' : 'max-w-32 opacity-100'
                }`}
              >
                {t('Portfolio')}
              </span>
            </div>
          </NavLink>

          <NavLink
            aria-label={t('Compare')}
            to="/compare"
            className={({ isActive }) =>
              `rounded-md px-3 py-2 font-medium transition-[background-color] ${
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
              }`
            }
          >
            <div className="flex min-w-0 items-center gap-2">
              <GitCompareArrows className="size-5 shrink-0" />
              <span
                className={`overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 max-lg:max-w-0 max-lg:opacity-0 ${
                  isCollapsed ? 'max-w-0 opacity-0' : 'max-w-32 opacity-100'
                }`}
              >
                {t('Compare')}
              </span>
            </div>
          </NavLink>

          <NavLink
            aria-label={t('Calendar')}
            to="/calendar"
            className={({ isActive }) =>
              `rounded-md px-3 py-2 font-medium transition-[background-color] ${
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
              }`
            }
          >
            <div className="flex min-w-0 items-center gap-2">
              <CalendarDays className="size-5 shrink-0" />
              <span
                className={`overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 max-lg:max-w-0 max-lg:opacity-0 ${
                  isCollapsed ? 'max-w-0 opacity-0' : 'max-w-32 opacity-100'
                }`}
              >
                {t('Calendar')}
              </span>
            </div>
          </NavLink>

          <NavLink
            aria-label={t('Markets')}
            to="/markets"
            className={({ isActive }) =>
              `rounded-md px-3 py-2 font-medium transition-[background-color] ${
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
              }`
            }
          >
            <div className="flex min-w-0 items-center gap-2">
              <ChartCandlestick className="size-5 shrink-0" />
              <span
                className={`overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 max-lg:max-w-0 max-lg:opacity-0 ${
                  isCollapsed ? 'max-w-0 opacity-0' : 'max-w-32 opacity-100'
                }`}
              >
                {t('Markets')}
              </span>
            </div>
          </NavLink>

          <NavLink
            aria-label={t('News')}
            to="/news"
            className={({ isActive }) =>
              `rounded-md px-3 py-2 font-medium transition-[background-color] ${
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
              }`
            }
          >
            <div className="flex min-w-0 items-center gap-2">
              <Rss className="size-5 shrink-0" />
              <span
                className={`overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 max-lg:max-w-0 max-lg:opacity-0 ${
                  isCollapsed ? 'max-w-0 opacity-0' : 'max-w-32 opacity-100'
                }`}
              >
                {t('News')}
              </span>
            </div>
          </NavLink>

          <NavLink
            aria-label={t('Settings')}
            to="/settings"
            className={({ isActive }) =>
              `rounded-md px-3 py-2 font-medium transition-[background-color] ${
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
              }`
            }
          >
            <div className="flex min-w-0 items-center gap-2">
              <Settings className="size-5 shrink-0" />
              <span
                className={`overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 max-lg:max-w-0 max-lg:opacity-0 ${
                  isCollapsed ? 'max-w-0 opacity-0' : 'max-w-32 opacity-100'
                }`}
              >
                {t('Settings')}
              </span>
            </div>
          </NavLink>
        </nav>

        <div
          role="group"
          aria-label={t('Interface language')}
          className={`mt-4 flex shrink-0 gap-1 rounded-md border border-sidebar-border p-1 max-lg:flex-col ${isCollapsed ? 'flex-col' : ''}`}
        >
          {(['en', 'pl'] as const).map((option) => (
            <button
              key={option}
              type="button"
              lang={option}
              aria-label={option === 'pl' ? t('Switch to Polish') : t('Switch to English')}
              aria-pressed={language === option}
              onClick={() => void i18n.changeLanguage(option)}
              className={`min-h-10 min-w-0 flex-1 cursor-pointer rounded-sm text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none ${
                language === option
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
            >
              {option.toUpperCase()}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          className="mt-2 flex min-w-0 shrink-0 items-center gap-2 rounded-md border border-sidebar-border px-3 py-2 font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none"
          aria-label={isDark ? t('Enable light mode') : t('Enable dark mode')}
        >
          {isDark ? <Sun className="size-5 shrink-0" /> : <Moon className="size-5 shrink-0" />}
          <span
            className={`overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 max-lg:max-w-0 max-lg:opacity-0 ${
              isCollapsed ? 'max-w-0 opacity-0' : 'max-w-32 opacity-100'
            }`}
          >
            {isDark ? t('Light mode') : t('Dark mode')}
          </span>
        </button>
      </aside>
    </>
  )
}

export default Sidebar
