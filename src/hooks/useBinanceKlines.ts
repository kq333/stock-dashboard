import { useEffect, useState } from 'react'
import type { CandlestickData, UTCTimestamp } from 'lightweight-charts'

export type BinanceConnectionStatus = 'connecting' | 'connected' | 'disconnected'

type BinanceKline = [
  number,
  string,
  string,
  string,
  string,
  string,
  number,
  string,
  number,
  string,
  string,
  string,
]

type BinanceKlinesResponse = {
  status: number
  result?: BinanceKline[]
  error?: {
    msg: string
  }
}

const BINANCE_WEBSOCKET_URL = 'wss://ws-api.binance.com/ws-api/v3?returnRateLimits=false'
const KLINES_REQUEST_INTERVAL = 5_000
const RECONNECT_DELAY = 3_000

const toCandlestick = (kline: BinanceKline): CandlestickData<UTCTimestamp> => ({
  time: Math.floor(kline[0] / 1_000) as UTCTimestamp,
  open: Number(kline[1]),
  high: Number(kline[2]),
  low: Number(kline[3]),
  close: Number(kline[4]),
})

export const useBinanceKlines = (symbol = 'BTCUSDT', interval = '1m') => {
  const [candles, setCandles] = useState<CandlestickData<UTCTimestamp>[]>([])
  const [status, setStatus] = useState<BinanceConnectionStatus>('connecting')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let socket: WebSocket | null = null
    let requestInterval: ReturnType<typeof setInterval> | undefined
    let reconnectTimeout: ReturnType<typeof setTimeout> | undefined
    let isActive = true

    const requestKlines = () => {
      if (socket?.readyState !== WebSocket.OPEN) return

      socket.send(
        JSON.stringify({
          id: `${symbol}-${interval}`,
          method: 'klines',
          params: {
            symbol,
            interval,
            limit: 200,
          },
        }),
      )
    }

    const connect = () => {
      setStatus('connecting')
      socket = new WebSocket(BINANCE_WEBSOCKET_URL)

      socket.onopen = () => {
        if (!isActive) return

        setStatus('connected')
        setError(null)
        requestKlines()
        requestInterval = setInterval(requestKlines, KLINES_REQUEST_INTERVAL)
      }

      socket.onmessage = (event: MessageEvent<string>) => {
        try {
          const response = JSON.parse(event.data) as BinanceKlinesResponse

          if (response.status !== 200 || !response.result) {
            throw new Error(response.error?.msg ?? 'Could not retrieve Binance market data.')
          }

          setCandles(response.result.map(toCandlestick))
          setError(null)
        } catch (messageError) {
          setError(
            messageError instanceof Error
              ? messageError.message
              : 'Received an invalid response from Binance.',
          )
        }
      }

      socket.onerror = () => {
        setError('Could not connect to the Binance WebSocket API.')
      }

      socket.onclose = () => {
        if (requestInterval) clearInterval(requestInterval)
        if (!isActive) return

        setStatus('disconnected')
        reconnectTimeout = setTimeout(connect, RECONNECT_DELAY)
      }
    }

    connect()

    return () => {
      isActive = false
      if (requestInterval) clearInterval(requestInterval)
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
      socket?.close()
    }
  }, [interval, symbol])

  return {
    candles,
    error,
    status,
  }
}
