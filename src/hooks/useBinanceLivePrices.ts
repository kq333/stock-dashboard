import { useEffect, useState } from 'react'
import type { BinanceConnectionStatus } from '@/hooks/useBinanceKlines'

export type PriceDirection = 'up' | 'down' | 'unchanged'

export type LivePrice = {
  price: number
  direction: PriceDirection
}

type BinanceMiniTicker = {
  s: string
  c: string
}

const BINANCE_TICKER_STREAM = 'wss://stream.binance.com:9443/ws/!miniTicker@arr'
const RECONNECT_DELAY = 3_000

export const useBinanceLivePrices = () => {
  const [prices, setPrices] = useState<Record<string, LivePrice>>({})
  const [status, setStatus] = useState<BinanceConnectionStatus>('connecting')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let socket: WebSocket | null = null
    let reconnectTimeout: ReturnType<typeof setTimeout> | undefined
    let isActive = true

    const connect = () => {
      setStatus('connecting')
      socket = new WebSocket(BINANCE_TICKER_STREAM)

      socket.onopen = () => {
        if (!isActive) return
        setStatus('connected')
        setError(null)
      }

      socket.onmessage = (event: MessageEvent<string>) => {
        try {
          const tickers = JSON.parse(event.data) as BinanceMiniTicker[]

          setPrices((currentPrices) => {
            const nextPrices = { ...currentPrices }

            tickers.forEach(({ c: closePrice, s: symbol }) => {
              if (!symbol.endsWith('USDT')) return

              const price = Number(closePrice)
              const previousPrice = currentPrices[symbol]?.price

              nextPrices[symbol] = {
                price,
                direction:
                  previousPrice === undefined || price === previousPrice
                    ? 'unchanged'
                    : price > previousPrice
                      ? 'up'
                      : 'down',
              }
            })

            return nextPrices
          })
        } catch {
          setError('Received invalid live-price data from Binance.')
        }
      }

      socket.onerror = () => {
        setError('Could not connect to the Binance live-price stream.')
      }

      socket.onclose = () => {
        if (!isActive) return
        setStatus('disconnected')
        reconnectTimeout = setTimeout(connect, RECONNECT_DELAY)
      }
    }

    connect()

    return () => {
      isActive = false
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
      socket?.close()
    }
  }, [])

  return { error, prices, status }
}
