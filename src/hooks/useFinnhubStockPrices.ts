import { useEffect, useState } from 'react'
import type { PriceDirection } from '@/hooks/useBinanceLivePrices'

type LiveStockPrice = {
  direction: PriceDirection
  price: number
}

type FinnhubTradeMessage = {
  type: 'trade'
  data: {
    p: number
    s: string
  }[]
}

const RECONNECT_DELAY = 3_000

export const useFinnhubStockPrices = (symbols: string[]) => {
  const [prices, setPrices] = useState<Record<string, LiveStockPrice>>({})
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const symbolsKey = [
    ...new Set(symbols.map((symbol) => symbol.trim().toUpperCase()).filter(Boolean)),
  ]
    .sort()
    .join(',')

  useEffect(() => {
    const subscribedSymbols = symbolsKey.split(',').filter(Boolean)
    if (subscribedSymbols.length === 0) return

    let socket: WebSocket | null = null
    let reconnectTimeout: ReturnType<typeof setTimeout> | undefined
    let isActive = true

    const connect = () => {
      if (!isActive) return
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      socket = new WebSocket(`${protocol}//${window.location.host}/api/finnhub/ws`)

      socket.onopen = () => {
        if (!isActive) return
        setIsConnected(true)
        setError(null)
        subscribedSymbols.forEach((symbol) => {
          socket?.send(JSON.stringify({ symbol, type: 'subscribe' }))
        })
      }

      socket.onmessage = (event: MessageEvent<string>) => {
        if (!isActive) return
        const message = JSON.parse(event.data) as
          FinnhubTradeMessage | { type: 'error'; msg: string }

        if (message.type === 'error') {
          setError(message.msg)
          return
        }

        if (message.type !== 'trade') return

        setPrices((currentPrices) => {
          const nextPrices = { ...currentPrices }

          message.data.forEach(({ p: price, s: symbol }) => {
            const previousPrice = currentPrices[symbol]?.price
            nextPrices[symbol] = {
              direction:
                previousPrice === undefined || previousPrice === price
                  ? 'unchanged'
                  : price > previousPrice
                    ? 'up'
                    : 'down',
              price,
            }
          })

          return nextPrices
        })
      }

      socket.onerror = () => {
        if (isActive) setError('Could not connect to Finnhub live prices.')
      }
      socket.onclose = () => {
        if (!isActive) return
        setIsConnected(false)
        reconnectTimeout = setTimeout(connect, RECONNECT_DELAY)
      }
    }

    // StrictMode immediately cleans up its first effect. Defer opening the
    // socket so that this cleanup can cancel it before a handshake starts.
    const connectTimeout = setTimeout(connect, 0)

    return () => {
      isActive = false
      clearTimeout(connectTimeout)
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
      if (socket) {
        const retiredSocket = socket
        retiredSocket.onmessage = null
        retiredSocket.onerror = null
        retiredSocket.onclose = null
        if (retiredSocket.readyState === WebSocket.CONNECTING) {
          // Closing a pending handshake produces a browser console error.
          // Retire it as soon as it opens, without subscribing to any symbols.
          retiredSocket.onopen = () => retiredSocket.close()
        } else {
          retiredSocket.onopen = null
          retiredSocket.close()
        }
      }
    }
  }, [symbolsKey])

  return {
    error: symbols.length > 0 ? error : null,
    isConnected: symbols.length > 0 && isConnected,
    prices,
  }
}
