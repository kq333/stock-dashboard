import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { ChevronLeft, ChevronRight, LayoutDashboard, Moon, Rss, Sun } from 'lucide-react'

type SidebarProps = {
  isCollapsed: boolean
  onToggle: () => void
}

const Sidebar = ({ isCollapsed, onToggle }: SidebarProps) => {
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem('theme')

    if (savedTheme) {
      return savedTheme === 'dark'
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-sidebar-border bg-sidebar p-4 text-sidebar-foreground transition-[width,background-color,border-color] duration-300 ${
        isCollapsed ? 'w-18' : 'w-64'
      }`}
    >
      <button
        type="button"
        className="absolute top-4 -right-3 z-10 flex size-7 cursor-pointer items-center justify-center rounded-full border border-sidebar-border bg-sidebar shadow-sm transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none"
        onClick={onToggle}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? (
          <ChevronRight className="pointer-events-none size-4" />
        ) : (
          <ChevronLeft className="pointer-events-none size-4" />
        )}
      </button>

      <div
        className={`mb-6 overflow-hidden whitespace-nowrap text-xl font-semibold transition-opacity duration-200 text-center ${
          isCollapsed ? 'invisible opacity-0' : 'visible opacity-100'
        }`}
      >
        Stock Dashboard
      </div>

      <nav className="flex flex-col gap-2" aria-label="Main navigation">
        <NavLink
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
              className={`overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 ${
                isCollapsed ? 'max-w-0 opacity-0' : 'max-w-32 opacity-100'
              }`}
            >
              Dashboard
            </span>
          </div>
        </NavLink>

        <NavLink
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
              className={`overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 ${
                isCollapsed ? 'max-w-0 opacity-0' : 'max-w-32 opacity-100'
              }`}
            >
              News
            </span>
          </div>
        </NavLink>
      </nav>

      <button
        type="button"
        onClick={() => setIsDark((dark) => !dark)}
        className="mt-auto flex min-w-0 items-center gap-2 rounded-md border border-sidebar-border px-3 py-2 font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none"
        aria-label={isDark ? 'Enable light mode' : 'Enable dark mode'}
      >
        {isDark ? <Sun className="size-5 shrink-0" /> : <Moon className="size-5 shrink-0" />}
        <span
          className={`overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 ${
            isCollapsed ? 'max-w-0 opacity-0' : 'max-w-32 opacity-100'
          }`}
        >
          {isDark ? 'Light mode' : 'Dark mode'}
        </span>
      </button>
    </aside>
  )
}

export default Sidebar
