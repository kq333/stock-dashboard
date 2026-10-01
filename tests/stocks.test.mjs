import assert from 'node:assert/strict'
import { test } from 'node:test'
import { QueryClient, QueryObserver } from '@tanstack/react-query'
import { loadTypeScript } from './helpers/load-typescript.mjs'

const {
  fetchWatchlistStocks,
  fetchStockMarket,
  fetchDashboardStocks,
  watchlistStocksQueryOptions,
} = loadTypeScript(new URL('../src/services/stockService.ts', import.meta.url))
const quote = { c: 200, d: 1, dp: 0.5, h: 202, l: 195, o: 199, pc: 199, t: 1 }

test('saved symbols outside the preset list are fetched and deduplicated', async (t) => {
  const symbols = []
  t.mock.method(globalThis, 'fetch', async (url) => {
    symbols.push(new URL(url, 'http://localhost').searchParams.get('symbol'))
    return Response.json(quote)
  })
  const rows = await fetchWatchlistStocks(['PLTR', ' pltr ', 'AAPL'])
  assert.deepEqual(symbols, ['PLTR', 'AAPL'])
  assert.equal(rows[0].symbol, 'PLTR')
  assert.equal(rows[0].quote.c, 200)
})

test('complete REST failures reject instead of caching a successful empty valuation', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response('', { status: 503 }))
  await assert.rejects(fetchWatchlistStocks(['AAPL']), /unavailable/)
  await assert.rejects(fetchStockMarket(), /unavailable/)
  await assert.rejects(fetchDashboardStocks(), /unavailable/)
})

test('partial failure retains usable quotes and identifies missing symbols', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url) =>
    String(url).includes('PLTR') ? new Response('', { status: 429 }) : Response.json(quote),
  )
  const rows = await fetchWatchlistStocks(['AAPL', 'PLTR'])
  assert.equal(rows[0].quote.c, 200)
  assert.equal(rows[0].quoteError, null)
  assert.equal(rows[1].quote, null)
  assert.match(rows[1].quoteError, /PLTR/)
})

test('HTTP 200 with an unusable quote does not become a zero-price position', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({ ...quote, c: 0, dp: null }))
  await assert.rejects(fetchWatchlistStocks(['INVALID']), /unavailable/)
})

test('an aborted quote batch preserves cancellation', async (t) => {
  const controller = new AbortController()
  controller.abort()
  t.mock.method(globalThis, 'fetch', async () => {
    throw controller.signal.reason
  })
  await assert.rejects(fetchWatchlistStocks(['AAPL'], controller.signal), { name: 'AbortError' })
})

test('a crypto-only watchlist has no stock loading state or requests', async (t) => {
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => Response.json(quote))
  const client = new QueryClient()
  t.after(() => client.clear())
  const observer = new QueryObserver(client, watchlistStocksQueryOptions([]))
  const unsubscribe = observer.subscribe(() => {})
  t.after(unsubscribe)
  assert.equal(observer.getCurrentResult().isLoading, false)
  assert.equal(observer.getCurrentResult().isFetching, false)
  assert.deepEqual(await fetchWatchlistStocks([]), [])
  assert.equal(fetchMock.mock.callCount(), 0)
})
