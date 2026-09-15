import assert from 'node:assert/strict'
import { EventEmitter, once } from 'node:events'
import { readFile } from 'node:fs/promises'
import { request } from 'node:http'
import * as path from 'node:path'
import { test } from 'node:test'
import vm from 'node:vm'
import { createDashboardServer } from '../backend/app.mjs'
import vercelServer from '../api/finnhub.js'

const start = async (t, server) => {
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  t.after(() => new Promise((resolve) => server.close(resolve)))
  return (url, options = {}) =>
    new Promise((resolve, reject) => {
      const req = request(
        { hostname: '127.0.0.1', port: server.address().port, path: url, ...options },
        (res) => {
          let body = ''
          res.on('data', (chunk) => (body += chunk))
          res.on('end', () => resolve({ status: res.statusCode, body }))
        },
      )
      req.on('error', reject)
      req.end()
    })
}

test('Vercel entry exports an HTTP server without starting a listener', () => {
  assert.equal(vercelServer.listening, false)
  assert.equal(vercelServer.listenerCount('upgrade'), 1)
})

test('API-only server rejects malformed requests and does not serve the SPA', async (t) => {
  const get = await start(t, createDashboardServer({ apiKey: '' }))
  assert.equal((await get('/', { headers: { host: '[' } })).status, 400)
  assert.equal((await get('/api/finnhub/quote?symbol=AAPL')).status, 503)
  assert.equal((await get('/settings')).status, 404)
  const status = await get('/api/finnhub/status')
  assert.equal(status.status, 200)
  assert.deepEqual(JSON.parse(status.body), { configured: false })
})

test('REST routes forward only approved parameters and the server key', async (t) => {
  const calls = []
  t.mock.method(globalThis, 'fetch', async (url) => {
    calls.push(new URL(url))
    return new Response('{"ok":true}', { status: 200 })
  })
  const get = await start(t, createDashboardServer({ apiKey: 'test-server-key' }))
  for (const endpoint of [
    '/quote',
    '/stock/profile2',
    '/stock/market-status',
    '/news',
    '/calendar/earnings',
    '/calendar/ipo',
  ]) {
    const result = await get(
      `/api/finnhub${endpoint}?symbol=AAPL&exchange=US&category=general&from=2026-01-01&to=2026-01-02&token=client-key&extra=ignored`,
    )
    assert.equal(result.status, 200)
    const upstream = calls.at(-1)
    assert.equal(upstream.pathname, `/api/v1${endpoint}`)
    assert.equal(upstream.searchParams.get('token'), 'test-server-key')
    assert.equal(upstream.searchParams.has('extra'), false)
    assert.equal(result.body.includes('test-server-key'), false)
  }
  assert.equal(calls[0].searchParams.get('symbol'), 'AAPL')
  assert.equal(calls[0].searchParams.has('category'), false)
  assert.equal((await get('/api/finnhub/unknown')).status, 404)
  assert.equal((await get('/api/finnhub/quote', { method: 'POST' })).status, 405)
  assert.equal(calls.length, 6)
  t.mock.method(globalThis, 'fetch', async () => {
    throw new Error('upstream unavailable')
  })
  assert.equal((await get('/api/finnhub/quote?symbol=AAPL')).status, 502)
})

test('WebSocket validates upgrades and forwards queued and immediate messages as text', async () => {
  let upstream
  let client
  class FakeWebSocket extends EventEmitter {
    static OPEN = 1
    readyState = 0
    sent = []
    constructor() {
      super()
      upstream = this
    }
    send(data, options) {
      this.sent.push({ data, options })
    }
    close() {
      this.closed = true
    }
  }
  class FakeWebSocketServer {
    handleUpgrade(_request, _socket, _head, callback) {
      client = new EventEmitter()
      client.readyState = 1
      client.send = (data, options) => {
        client.received = { data, options }
      }
      callback(client)
    }
  }
  // Execute the shared backend with an in-memory upstream; no Finnhub connection is made.
  const source = (await readFile(new URL('../backend/app.mjs', import.meta.url), 'utf8'))
    .replace(/^import .*\r?\n/gm, '')
    .replace('export const createDashboardServer', 'globalThis.createDashboardServer')
  const context = vm.createContext({
    ...path,
    createServer: () => new EventEmitter(),
    WebSocket: FakeWebSocket,
    WebSocketServer: FakeWebSocketServer,
    URL,
    Buffer,
  })
  vm.runInContext(source, context)
  const server = context.createDashboardServer({ apiKey: 'test-server-key' })
  for (const headers of [{ host: '[' }, { host: 'example.com', origin: 'invalid' }]) {
    let response
    server.emit(
      'upgrade',
      { url: '/api/finnhub/ws', headers },
      {
        end(value) {
          response = value
        },
      },
      Buffer.alloc(0),
    )
    assert.match(response, /400 Bad Request/)
  }
  let rejected = false
  server.emit(
    'upgrade',
    {
      url: '/api/finnhub/ws',
      headers: { host: 'example.com', origin: 'https://other.com' },
    },
    {
      write() {},
      destroy() {
        rejected = true
      },
    },
    Buffer.alloc(0),
  )
  assert.equal(rejected, true)
  server.emit(
    'upgrade',
    {
      url: '/api/finnhub/ws',
      headers: { host: 'example.com', origin: 'https://example.com' },
    },
    {},
    Buffer.alloc(0),
  )
  client.emit('message', Buffer.from('{"type":"subscribe","symbol":"AAPL"}'))
  assert.equal(upstream.sent.length, 0)
  upstream.readyState = 1
  upstream.emit('open')
  client.emit('message', Buffer.from('{"type":"unsubscribe","symbol":"AAPL"}'))
  client.emit('message', Buffer.from('{"type":"invalid","symbol":"AAPL"}'))
  assert.equal(upstream.sent.length, 2)
  for (const message of upstream.sent) assert.equal(message.options.binary, false)
  const trade = Buffer.from('{"type":"trade","data":[]}')
  upstream.emit('message', trade, false)
  assert.equal(client.received.data, trade)
  assert.equal(client.received.options.binary, false)
  client.emit('close')
  assert.equal(upstream.closed, true)
})
