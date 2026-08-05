import { lazy, Suspense, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import Sidebar from './components/Sidebar'

const MarketsLayout = lazy(() => import('./components/MarketsLayout'))
const MarketsPage = lazy(() => import('./pages/MarketsPage'))
const CryptoDetailsPage = lazy(() => import('./pages/CryptoDetailsPage'))
const StockMarketsPage = lazy(() => import('./pages/StockMarketsPage'))
const StockDetailsPage = lazy(() => import('./pages/StockDetailsPage'))
const NewsPage = lazy(() => import('./pages/NewsPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const WatchlistPage = lazy(() => import('./pages/WatchlistPage'))
const PortfolioPage = lazy(() => import('./pages/PortfolioPage'))
const ComparePage = lazy(() => import('./pages/ComparePage'))
const CalendarPage = lazy(() => import('./pages/CalendarPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))

const DEFAULT_ROUTES = new Set([
  '/dashboard',
  '/markets',
  '/watchlist',
  '/portfolio',
  '/compare',
  '/calendar',
  '/news',
])

const DefaultRouteRedirect = () => {
  const savedRoute = localStorage.getItem('stock-dashboard-default-route')
  const destination = savedRoute && DEFAULT_ROUTES.has(savedRoute) ? savedRoute : '/dashboard'

  return <Navigate to={destination} replace />
}

function App() {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <Sidebar
          isCollapsed={isCollapsed}
          onToggle={() => setIsCollapsed((collapsed) => !collapsed)}
        />

        <main
          className={`min-h-screen pl-0 transition-[padding] duration-300 ${
            isCollapsed ? 'lg:pl-18' : 'lg:pl-64'
          }`}
        >
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<DefaultRouteRedirect />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/watchlist" element={<WatchlistPage />} />
              <Route path="/portfolio" element={<PortfolioPage />} />
              <Route path="/compare" element={<ComparePage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/settings" element={<SettingsPage />} />

              <Route path="/markets" element={<MarketsLayout />}>
                <Route index element={<MarketsPage />} />
                <Route path="stocks" element={<StockMarketsPage />} />
                <Route path="stocks/:symbol" element={<StockDetailsPage />} />
                <Route path=":currencyId" element={<CryptoDetailsPage />} />
              </Route>
              <Route path="/news" element={<NewsPage />} />

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
