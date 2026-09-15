import { queryOptions, useQuery } from '@tanstack/react-query'

const FINNHUB_API_URL = '/api/finnhub'

export type EarningsEvent = {
  date: string
  epsActual: number | null
  epsEstimate: number | null
  hour: 'bmo' | 'amc' | 'dmh' | ''
  quarter: number
  revenueActual: number | null
  revenueEstimate: number | null
  symbol: string
  year: number
}

export type IpoEvent = {
  date: string
  exchange: string
  name: string
  numberOfShares: number | null
  price: string
  status: 'expected' | 'priced' | 'withdrawn' | 'filed' | string
  symbol: string
  totalSharesValue: number | null
}

type EarningsCalendarResponse = {
  earningsCalendar: EarningsEvent[]
}

type IpoCalendarResponse = {
  ipoCalendar: IpoEvent[]
}

export type MarketCalendar = {
  earnings: EarningsEvent[]
  ipos: IpoEvent[]
}

const fetchFinnhubCalendar = async <Data>(
  path: string,
  from: string,
  to: string,
  signal?: AbortSignal,
): Promise<Data> => {
  const query = new URLSearchParams({ from, to })

  const response = await fetch(`${FINNHUB_API_URL}${path}?${query}`, { signal })

  if (!response.ok) {
    throw new Error(`Finnhub calendar request failed with status ${response.status}.`)
  }

  return response.json() as Promise<Data>
}

const fetchMarketCalendar = async (
  from: string,
  to: string,
  signal?: AbortSignal,
): Promise<MarketCalendar> => {
  const [earningsResponse, ipoResponse] = await Promise.all([
    fetchFinnhubCalendar<EarningsCalendarResponse>('/calendar/earnings', from, to, signal),
    fetchFinnhubCalendar<IpoCalendarResponse>('/calendar/ipo', from, to, signal),
  ])

  return {
    earnings: earningsResponse.earningsCalendar ?? [],
    ipos: ipoResponse.ipoCalendar ?? [],
  }
}

export const marketCalendarQueryOptions = (from: string, to: string) =>
  queryOptions({
    queryKey: ['market-calendar', from, to],
    queryFn: ({ signal }) => fetchMarketCalendar(from, to, signal),
    staleTime: 60 * 60_000,
    retry: 1,
  })

export const useMarketCalendarQuery = (from: string, to: string) =>
  useQuery(marketCalendarQueryOptions(from, to))
