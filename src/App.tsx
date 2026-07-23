import { lazy, Suspense, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import Sidebar from './components/Sidebar'

const MarketsLayout = lazy(() => import('./components/MarketsLayout'))
const MarketsPage = lazy(() => import('./pages/MarketsPage'))
const CryptoDetailsPage = lazy(() => import('./pages/CryptoDetailsPage'))
const StockMarketsPage = lazy(() => import('./pages/StockMarketsPage'))
const StockDetailsPage = lazy(() => import('./pages/StockDetailsPage'))
const NewsPage = lazy(() => import('./pages/NewsPage'))

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
              <Route path="/" element={<Navigate to="/markets" replace />} />

              <Route path="/markets" element={<MarketsLayout />}>
                <Route index element={<MarketsPage />} />
                <Route path="stocks" element={<StockMarketsPage />} />
                <Route path="stocks/:symbol" element={<StockDetailsPage />} />
                <Route path=":currencyId" element={<CryptoDetailsPage />} />
              </Route>
              <Route path="/dashboard" element={<Navigate to="/markets" replace />} />
              <Route path="/news" element={<NewsPage />} />

              <Route path="*" element={<Navigate to="/markets" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
