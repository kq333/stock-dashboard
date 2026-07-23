import { useEffect, useState } from 'react'
import type { BinanceConnectionStatus } from '@/hooks/useBinanceKlines'

export type BinanceCrypto = {
  asset: string
  symbol: string
}

type BinanceSymbol = {
  symbol: string
  status: string
  baseAsset: string
  quoteAsset: string
}

type BinanceExchangeInfoResponse = {
  status: number
  result?: {
    symbols: BinanceSymbol[]
  }
  error?: {
    msg: string
  }
}

const BINANCE_WEBSOCKET_URL = 'wss://ws-api.binance.com/ws-api/v3?returnRateLimits=false'
const RECONNECT_DELAY = 3_000

export const useBinanceCryptoList = () => {
  const [cryptos, setCryptos] = useState<BinanceCrypto[]>([])
  const [status, setStatus] = useState<BinanceConnectionStatus>('connecting')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let socket: WebSocket | null = null
    let reconnectTimeout: ReturnType<typeof setTimeout> | undefined
    let isActive = true

    const connect = () => {
      setStatus('connecting')
      socket = new WebSocket(BINANCE_WEBSOCKET_URL)

      socket.onopen = () => {
        if (!isActive) return

        setStatus('connected')
        setError(null)
        socket?.send(
          JSON.stringify({
            id: 'active-crypto-list',
            method: 'exchangeInfo',
            params: {
              showPermissionSets: false,
              symbolStatus: 'TRADING',
            },
          }),
        )
      }

      socket.onmessage = (event: MessageEvent<string>) => {
        try {
          const response = JSON.parse(event.data) as BinanceExchangeInfoResponse

          if (response.status !== 200 || !response.result) {
            throw new Error(response.error?.msg ?? 'Could not retrieve the Binance crypto list.')
          }

          const uniqueAssets = new Map<string, BinanceCrypto>()

          response.result.symbols
            .filter(
              ({ baseAsset, quoteAsset, status: symbolStatus }) =>
                quoteAsset === 'USDT' && baseAsset !== 'USDT' && symbolStatus === 'TRADING',
            )
            .forEach(({ baseAsset, symbol }) => {
              if (!uniqueAssets.has(baseAsset)) {
                uniqueAssets.set(baseAsset, {
                  asset: baseAsset,
                  symbol,
                })
              }
            })

          setCryptos(
            Array.from(uniqueAssets.values()).sort((first, second) =>
              first.asset.localeCompare(second.asset),
            ),
          )
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

  return {
    cryptos,
    error,
    status,
  }
}
