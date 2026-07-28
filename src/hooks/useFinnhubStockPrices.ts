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
  const symbolsKey = symbols.join(',')

  useEffect(() => {
    const subscribedSymbols = symbolsKey.split(',').filter(Boolean)
    const apiKey = import.meta.env.NEWS_STOCK_API_KEY
    if (!apiKey || subscribedSymbols.length === 0) return

    let socket: WebSocket | null = null
    let reconnectTimeout: ReturnType<typeof setTimeout> | undefined
    let isActive = true

    const connect = () => {
      socket = new WebSocket(`wss://ws.finnhub.io?token=${apiKey}`)

      socket.onopen = () => {
        if (!isActive) return
        setIsConnected(true)
        setError(null)
        subscribedSymbols.forEach((symbol) => {
          socket?.send(JSON.stringify({ symbol, type: 'subscribe' }))
        })
      }

      socket.onmessage = (event: MessageEvent<string>) => {
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

      socket.onerror = () => setError('Could not connect to Finnhub live prices.')
      socket.onclose = () => {
        setIsConnected(false)
        if (isActive) reconnectTimeout = setTimeout(connect, RECONNECT_DELAY)
      }
    }

    connect()

    return () => {
      isActive = false
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
      socket?.close()
    }
  }, [symbolsKey])

  return { error, isConnected, prices }
}
