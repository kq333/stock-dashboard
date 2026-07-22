import { lazy, Suspense, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import Sidebar from './components/Sidebar'

const DashboardPage = lazy(() => import('./pages/DashboardPage'))
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
          className={`min-h-screen transition-[padding] duration-300 ${
            isCollapsed ? 'pl-18' : 'pl-64'
          }`}
        >
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              <Route path="/dashboard" element={<DashboardPage />} />
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
