import { queryOptions, useQuery } from '@tanstack/react-query'

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3'

export type CoinMarket = {
  id: string
  symbol: string
  name: string
  image: string
  current_price: number | null
  market_cap: number | null
  market_cap_rank: number | null
  total_volume: number | null
  high_24h: number | null
  low_24h: number | null
  price_change_percentage_24h: number | null
}

export type CoinDetails = {
  id: string
  symbol: string
  name: string
  image: {
    large: string
  }
  market_cap_rank: number | null
  categories: string[]
  market_data: {
    current_price: { usd?: number }
    market_cap: { usd?: number }
    total_volume: { usd?: number }
    high_24h: { usd?: number }
    low_24h: { usd?: number }
    price_change_percentage_24h: number | null
    circulating_supply: number | null
    total_supply: number | null
    max_supply: number | null
    ath: { usd?: number }
    atl: { usd?: number }
  }
}

const getHeaders = (): HeadersInit => {
  const apiKey = import.meta.env.VITE_COINGECKO_API_KEY

  return apiKey ? { 'x-cg-demo-api-key': apiKey } : {}
}

const fetchCoinGecko = async <Data>(path: string, signal?: AbortSignal): Promise<Data> => {
  const response = await fetch(`${COINGECKO_API_URL}${path}`, {
    headers: getHeaders(),
    signal,
  })

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('CoinGecko rate limit reached. Please try again shortly.')
    }

    throw new Error(`CoinGecko request failed with status ${response.status}.`)
  }

  return response.json() as Promise<Data>
}

export const coinMarketsQueryOptions = () =>
  queryOptions({
    queryKey: ['coin-markets', 'usd'],
    queryFn: ({ signal }) =>
      fetchCoinGecko<CoinMarket[]>(
        '/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false',
        signal,
      ),
    staleTime: 60_000,
    retry: 1,
  })

export const coinDetailsQueryOptions = (coinId: string) =>
  queryOptions({
    queryKey: ['coin-details', coinId],
    queryFn: ({ signal }) =>
      fetchCoinGecko<CoinDetails>(
        `/coins/${encodeURIComponent(
          coinId,
        )}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false`,
        signal,
      ),
    staleTime: 60_000,
    retry: 1,
  })

export const useCoinMarketsQuery = () => useQuery(coinMarketsQueryOptions())

export const useCoinDetailsQuery = (coinId: string) => useQuery(coinDetailsQueryOptions(coinId))
