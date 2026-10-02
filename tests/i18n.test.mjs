import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { I18nextProvider, useTranslation } from 'react-i18next'
import { loadTypeScript } from './helpers/load-typescript.mjs'

const english = JSON.parse(readFileSync(new URL('../src/locales/en.json', import.meta.url), 'utf8'))
const polish = JSON.parse(readFileSync(new URL('../src/locales/pl.json', import.meta.url), 'utf8'))
const loadI18n = () =>
  loadTypeScript(new URL('../src/i18n.ts', import.meta.url), {
    './locales/en.json': english,
    './locales/pl.json': polish,
  })
const { formatNumber, getLocale } = loadTypeScript(
  new URL('../src/lib/formatters.ts', import.meta.url),
)
const { translateError } = loadTypeScript(
  new URL('../src/lib/translationErrors.ts', import.meta.url),
)

function browser(t, initial = null) {
  let saved = initial
  const events = new Map()
  const replaceGlobal = (name, value) => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, name)
    Object.defineProperty(globalThis, name, { value, configurable: true, writable: true })
    t.after(() => {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor)
      else delete globalThis[name]
    })
  }
  replaceGlobal('localStorage', {
    getItem: () => saved,
    setItem: (_key, value) => {
      saved = value
    },
  })
  replaceGlobal('window', {
    addEventListener: (name, handler) => events.set(name, handler),
    removeEventListener: (name) => events.delete(name),
  })
  return {
    events,
    saved: () => saved,
    update: (value) => {
      saved = value
    },
  }
}

test('language defaults to English and restores only supported saved preferences', (t) => {
  const state = browser(t)
  assert.equal(loadI18n().i18n.resolvedLanguage, 'en')
  state.update('pl')
  assert.equal(loadI18n().i18n.resolvedLanguage, 'pl')
  state.update('unsupported')
  assert.equal(loadI18n().i18n.resolvedLanguage, 'en')
})

test('library language changes persist preferences and update number formatting', async (t) => {
  const state = browser(t)
  const module = loadI18n()
  const stopSync = module.startLanguageSync()
  await module.i18n.changeLanguage('pl')
  assert.equal(state.saved(), 'pl')
  assert.equal(getLocale(module.i18n.resolvedLanguage), 'pl-PL')
  assert.equal(formatNumber(12.5, 2, getLocale(module.i18n.resolvedLanguage)), '12,50')
  await module.i18n.changeLanguage('en')
  assert.equal(state.saved(), 'en')
  assert.equal(formatNumber(12.5, 2, getLocale(module.i18n.resolvedLanguage)), '12.50')
  stopSync()
  assert.equal(state.events.size, 0)
})

test('storage changes from another tab and clearing storage update the active language', (t) => {
  const state = browser(t, 'pl')
  const module = loadI18n()
  const stopSync = module.startLanguageSync()
  state.update('en')
  state.events.get('storage')({ key: module.LANGUAGE_STORAGE_KEY })
  assert.equal(module.i18n.resolvedLanguage, 'en')
  state.update('pl')
  state.events.get('storage')({ key: 'unrelated' })
  assert.equal(module.i18n.resolvedLanguage, 'en')
  state.events.get('storage')({ key: module.LANGUAGE_STORAGE_KEY })
  assert.equal(module.i18n.resolvedLanguage, 'pl')
  state.update(null)
  state.events.get('storage')({ key: null })
  assert.equal(module.i18n.resolvedLanguage, 'en')
  stopSync()
})

test('unavailable browser storage still allows switching during the session', async (t) => {
  browser(t)
  t.mock.method(localStorage, 'getItem', () => {
    throw new Error('blocked')
  })
  t.mock.method(localStorage, 'setItem', () => {
    throw new Error('blocked')
  })
  const module = loadI18n()
  const stopSync = module.startLanguageSync()
  assert.equal(module.i18n.resolvedLanguage, 'en')
  await module.i18n.changeLanguage('pl')
  assert.equal(module.i18n.resolvedLanguage, 'pl')
  stopSync()
})

test('library translations interpolate complete sentences and preserve provider content', () => {
  const { i18n } = loadI18n()
  const pl = i18n.getFixedT('pl')
  const en = i18n.getFixedT('en')
  assert.equal(pl('Dashboard'), 'Pulpit')
  assert.equal(en('Dashboard'), 'Dashboard')
  assert.equal(pl('Selection count', { count: 2, max: 4 }), 'Wybrane aktywa: 2 z 4')
  assert.equal(
    pl('Remove watchlist asset', { name: '$& <Bitcoin>' }),
    'Usuń $& <Bitcoin> z obserwowanych',
  )
  assert.equal(pl('Apple'), 'Apple')
  assert.equal(pl('constructor'), 'constructor')
  assert.equal(en('toString'), 'toString')
  assert.equal(
    translateError('Finnhub news request failed with status 429', pl),
    'Nie udało się pobrać danych Finnhub news (HTTP 429).',
  )
  assert.equal(
    translateError('Quote unavailable for AAPL.', pl),
    'Notowanie AAPL jest chwilowo niedostępne.',
  )
  assert.equal(
    translateError('CoinGecko rate limit reached. Please try again shortly.', pl),
    'Przekroczono limit zapytań CoinGecko. Spróbuj ponownie za chwilę.',
  )
})

test('English and Polish resources have the same keys and interpolation parameters', () => {
  assert.deepEqual(Object.keys(english).sort(), Object.keys(polish).sort())
  const placeholders = (value) =>
    [...value.matchAll(/\{\{(\w+)\}\}/g)].map((match) => match[1]).sort()
  for (const [key, value] of Object.entries(english)) {
    // The English asset title includes its market type; Polish uses a neutral title.
    const en = placeholders(value).filter(
      (name) => key !== 'Asset metadata title' || name !== 'type',
    )
    assert.deepEqual(en, placeholders(polish[key]), key)
  }
})

test('react-i18next hooks render translated text, interpolation, and locale through the provider', async (t) => {
  const state = browser(t)
  const module = loadI18n()
  const stopSync = module.startLanguageSync()
  function Sample() {
    const { t, i18n } = useTranslation()
    return createElement(
      'p',
      null,
      [
        t('Dashboard'),
        t('Selection count', { count: 2, max: 4 }),
        getLocale(i18n.resolvedLanguage),
        translateError('Quote unavailable for AAPL.', t),
      ].join(' | '),
    )
  }
  const render = () =>
    renderToStaticMarkup(
      createElement(I18nextProvider, { i18n: module.i18n }, createElement(Sample)),
    )
  assert.match(render(), /Dashboard \| 2 of 4 assets selected \| en-US/)
  await module.i18n.changeLanguage('pl')
  assert.equal(state.saved(), 'pl')
  assert.match(render(), /Pulpit \| Wybrane aktywa: 2 z 4 \| pl-PL/)
  assert.match(render(), /Notowanie AAPL jest chwilowo niedostępne/)
  stopSync()
})
