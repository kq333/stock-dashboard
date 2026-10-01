import assert from 'node:assert/strict'
import { test } from 'node:test'
import { loadTypeScript } from './helpers/load-typescript.mjs'

const setup = (t) => {
  const timers = new Map()
  let timerId = 0
  t.mock.method(globalThis, 'setTimeout', (callback) => {
    timers.set(++timerId, callback)
    return timerId
  })
  t.mock.method(globalThis, 'clearTimeout', (id) => timers.delete(id))
  const previousWindow = globalThis.window
  const previousSocket = globalThis.WebSocket
  const sockets = []
  const updates = []
  class Socket {
    static CONNECTING = 0
    readyState = 0
    sent = []
    closed = false
    constructor(url) {
      this.url = url
      sockets.push(this)
    }
    send(message) {
      this.sent.push(JSON.parse(message))
    }
    close() {
      this.closed = true
    }
  }
  globalThis.window = { location: { protocol: 'http:', host: 'localhost:5173' } }
  globalThis.WebSocket = Socket
  t.after(() => {
    if (previousWindow === undefined) delete globalThis.window
    else globalThis.window = previousWindow
    globalThis.WebSocket = previousSocket
  })
  let effect
  const { useFinnhubStockPrices } = loadTypeScript(
    new URL('../src/hooks/useFinnhubStockPrices.ts', import.meta.url),
    {
      react: {
        useState: (initial) => [initial, (value) => updates.push(value)],
        useEffect: (callback) => {
          effect = callback
        },
      },
    },
  )
  const runTimers = () => {
    const callbacks = [...timers.values()]
    timers.clear()
    callbacks.forEach((callback) => callback())
  }
  return {
    sockets,
    updates,
    runTimers,
    mount: (symbols) => {
      useFinnhubStockPrices(symbols)
      return effect()
    },
  }
}

test('StrictMode cleanup cancels the first handshake and opens one normalized subscription', (t) => {
  const { sockets, mount, runTimers } = setup(t)
  mount(['AAPL'])()
  const cleanup = mount([' aapl ', 'AAPL', 'MSFT'])
  runTimers()
  assert.equal(sockets.length, 1)
  assert.equal(sockets[0].url, 'ws://localhost:5173/api/finnhub/ws')
  sockets[0].readyState = 1
  sockets[0].onopen()
  assert.deepEqual(sockets[0].sent, [
    { symbol: 'AAPL', type: 'subscribe' },
    { symbol: 'MSFT', type: 'subscribe' },
  ])
  cleanup()
  assert.equal(sockets[0].closed, true)
})

test('unmount during connection retires the socket without subscribing or updating state', (t) => {
  const { sockets, mount, runTimers, updates } = setup(t)
  const cleanup = mount(['AAPL'])
  runTimers()
  const lateClose = sockets[0].onclose
  cleanup()
  assert.equal(sockets[0].closed, false)
  sockets[0].onopen()
  lateClose()
  runTimers()
  assert.equal(sockets[0].closed, true)
  assert.equal(sockets[0].sent.length, 0)
  assert.equal(sockets.length, 1)
  assert.equal(updates.length, 0)
})

test('a genuine disconnect reconnects but unmount cancels a pending retry', (t) => {
  const { sockets, mount, runTimers } = setup(t)
  const cleanup = mount(['AAPL'])
  runTimers()
  sockets[0].onclose()
  runTimers()
  assert.equal(sockets.length, 2)
  sockets[1].onclose()
  cleanup()
  runTimers()
  assert.equal(sockets.length, 2)
})
