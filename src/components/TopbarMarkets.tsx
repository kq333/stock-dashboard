import { NavLink } from 'react-router-dom'
import { useHideOnScroll } from '@/hooks/useHideOnScroll'

const marketSections = [
  { label: 'Crypto', to: '/markets', end: true },
  { label: 'Stocks', to: '/markets/stocks', end: false },
]

const TopbarMarkets = () => {
  const isHiddenOnScroll = useHideOnScroll()

  return (
    <header
      className={`fixed inset-x-0 z-20 border-b border-sidebar-border bg-sidebar py-4 transition-[translate] duration-300 ${
        isHiddenOnScroll ? 'max-lg:-translate-y-full' : 'translate-y-0'
      }`}
    >
      <nav aria-label="Market sections">
        <ul className="flex items-center justify-center gap-2 text-muted-foreground uppercase md:gap-8">
          {marketSections.map(({ end, label, to }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `block rounded-md px-4 py-2 text-base font-semibold transition-colors md:text-xl ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent hover:text-accent-foreground'
                  }`
                }
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}

export default TopbarMarkets
