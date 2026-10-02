import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'

import './index.css'
import App from './App.tsx'
import { queryClient } from './lib/queryClient'
import { i18n, startLanguageSync } from './i18n'

const stopLanguageSync = startLanguageSync()
if (import.meta.hot) import.meta.hot.dispose(stopLanguageSync)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </I18nextProvider>
  </StrictMode>,
)
