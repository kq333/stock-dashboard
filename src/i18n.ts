import { createInstance } from 'i18next'
import { initReactI18next } from 'react-i18next'
import english from './locales/en.json'
import polish from './locales/pl.json'

export const LANGUAGE_STORAGE_KEY = 'stock-dashboard-language'

const readLanguage = () => {
  try {
    return localStorage.getItem(LANGUAGE_STORAGE_KEY) === 'pl' ? 'pl' : 'en'
  } catch {
    return 'en'
  }
}

export const i18n = createInstance()
void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: english },
    pl: { translation: polish },
  },
  lng: readLanguage(),
  supportedLngs: ['en', 'pl'],
  fallbackLng: 'en',
  initAsync: false,
  keySeparator: false,
  nsSeparator: false,
  interpolation: { escapeValue: false },
})

// Persist library language changes and synchronize preferences across browser tabs.
export function startLanguageSync() {
  const storageTarget = window
  const persistLanguage = () => {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, i18n.resolvedLanguage === 'pl' ? 'pl' : 'en')
    } catch {
      // Language switching still works when browser storage is unavailable.
    }
  }
  const onStorage = (event: StorageEvent) => {
    if (event.key === LANGUAGE_STORAGE_KEY || event.key === null) {
      const language = readLanguage()
      if (i18n.resolvedLanguage !== language) void i18n.changeLanguage(language)
    }
  }
  i18n.on('languageChanged', persistLanguage)
  storageTarget.addEventListener('storage', onStorage)
  return () => {
    i18n.off('languageChanged', persistLanguage)
    storageTarget.removeEventListener('storage', onStorage)
  }
}
