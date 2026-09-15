import { queryOptions, useQuery } from '@tanstack/react-query'

const FINNHUB_API_URL = '/api/finnhub'

export type StockCompany = {
  symbol: string
  name: string
  sector: string
}

export type StockQuote = {
  c: number
  d: number
  dp: number
  h: number
  l: number
  o: number
  pc: number
  t: number
}

export type StockProfile = {
  country: string
  currency: string
  exchange: string
  finnhubIndustry: string
  ipo: string
  logo: string
  marketCapitalization: number
  name: string
  phone: string
  shareOutstanding: number
  ticker: string
  weburl: string
}

export type StockMarketRow = StockCompany & {
  quote: StockQuote | null
}

export type StockMarketStatus = {
  exchange: string
  holiday: string | null
  isOpen: boolean
  session: 'pre-market' | 'regular' | 'post-market' | null
  t: number
  timezone: string
}

export const DASHBOARD_STOCKS: StockCompany[] = [
  { symbol: 'SPY', name: 'S&P 500 ETF', sector: 'Market index' },
  { symbol: 'QQQ', name: 'Nasdaq 100 ETF', sector: 'Market index' },
  { symbol: 'DIA', name: 'Dow Jones ETF', sector: 'Market index' },
  { symbol: 'AAPL', name: 'Apple', sector: 'Information Technology' },
  { symbol: 'NVDA', name: 'Nvidia', sector: 'Information Technology' },
]

export const SP500_LEADERS: StockCompany[] = [
  ['AAPL', 'Apple', 'Information Technology'],
  ['MSFT', 'Microsoft', 'Information Technology'],
  ['NVDA', 'Nvidia', 'Information Technology'],
  ['AMZN', 'Amazon', 'Consumer Discretionary'],
  ['GOOGL', 'Alphabet Class A', 'Communication Services'],
  ['META', 'Meta Platforms', 'Communication Services'],
  ['BRK.B', 'Berkshire Hathaway', 'Financials'],
  ['AVGO', 'Broadcom', 'Information Technology'],
  ['TSLA', 'Tesla', 'Consumer Discretionary'],
  ['JPM', 'JPMorgan Chase', 'Financials'],
  ['WMT', 'Walmart', 'Consumer Staples'],
  ['LLY', 'Eli Lilly', 'Health Care'],
  ['V', 'Visa', 'Financials'],
  ['MA', 'Mastercard', 'Financials'],
  ['XOM', 'Exxon Mobil', 'Energy'],
  ['UNH', 'UnitedHealth Group', 'Health Care'],
  ['COST', 'Costco', 'Consumer Staples'],
  ['NFLX', 'Netflix', 'Communication Services'],
  ['ORCL', 'Oracle', 'Information Technology'],
  ['HD', 'Home Depot', 'Consumer Discretionary'],
  ['PG', 'Procter & Gamble', 'Consumer Staples'],
  ['JNJ', 'Johnson & Johnson', 'Health Care'],
  ['ABBV', 'AbbVie', 'Health Care'],
  ['BAC', 'Bank of America', 'Financials'],
  ['KO', 'Coca-Cola', 'Consumer Staples'],
  ['PM', 'Philip Morris', 'Consumer Staples'],
  ['CRM', 'Salesforce', 'Information Technology'],
  ['CSCO', 'Cisco', 'Information Technology'],
  ['IBM', 'IBM', 'Information Technology'],
  ['GE', 'GE Aerospace', 'Industrials'],
  ['AMD', 'AMD', 'Information Technology'],
  ['DIS', 'Walt Disney', 'Communication Services'],
  ['MCD', "McDonald's", 'Consumer Discretionary'],
  ['ABT', 'Abbott Laboratories', 'Health Care'],
  ['PEP', 'PepsiCo', 'Consumer Staples'],
  ['TMO', 'Thermo Fisher Scientific', 'Health Care'],
  ['ACN', 'Accenture', 'Information Technology'],
  ['LIN', 'Linde', 'Materials'],
  ['WFC', 'Wells Fargo', 'Financials'],
  ['QCOM', 'Qualcomm', 'Information Technology'],
  ['TXN', 'Texas Instruments', 'Information Technology'],
  ['AMGN', 'Amgen', 'Health Care'],
  ['INTU', 'Intuit', 'Information Technology'],
  ['ISRG', 'Intuitive Surgical', 'Health Care'],
  ['CAT', 'Caterpillar', 'Industrials'],
  ['GS', 'Goldman Sachs', 'Financials'],
  ['VZ', 'Verizon', 'Communication Services'],
  ['BKNG', 'Booking Holdings', 'Consumer Discretionary'],
  ['RTX', 'RTX', 'Industrials'],
  ['SPGI', 'S&P Global', 'Financials'],
].map(([symbol, name, sector]) => ({ symbol, name, sector }))

const fetchFinnhub = async <Data>(
  path: string,
  params: Record<string, string>,
  signal?: AbortSignal,
): Promise<Data> => {
  const query = new URLSearchParams(params)

  const response = await fetch(`${FINNHUB_API_URL}${path}?${query}`, { signal })

  if (!response.ok) {
    throw new Error(`Finnhub stock request failed with status ${response.status}.`)
  }

  return response.json() as Promise<Data>
}

export const fetchStockQuote = (symbol: string, signal?: AbortSignal) =>
  fetchFinnhub<StockQuote>('/quote', { symbol }, signal)

export const fetchStockProfile = (symbol: string, signal?: AbortSignal) =>
  fetchFinnhub<StockProfile>('/stock/profile2', { symbol }, signal)

export const fetchStockMarketStatus = (signal?: AbortSignal) =>
  fetchFinnhub<StockMarketStatus>('/stock/market-status', { exchange: 'US' }, signal)

export const fetchStockMarket = async (signal?: AbortSignal): Promise<StockMarketRow[]> => {
  const results = await Promise.allSettled(
    SP500_LEADERS.map(({ symbol }) => fetchStockQuote(symbol, signal)),
  )

  return SP500_LEADERS.map((company, index) => ({
    ...company,
    quote: results[index].status === 'fulfilled' ? results[index].value : null,
  }))
}

export const fetchStockDetails = async (symbol: string, signal?: AbortSignal) => {
  const [quote, profile] = await Promise.all([
    fetchStockQuote(symbol, signal),
    fetchStockProfile(symbol, signal),
  ])

  return { profile, quote }
}

export const fetchDashboardStocks = async (signal?: AbortSignal) => {
  const [quoteResults, marketStatus] = await Promise.all([
    Promise.allSettled(DASHBOARD_STOCKS.map(({ symbol }) => fetchStockQuote(symbol, signal))),
    fetchStockMarketStatus(signal).catch(() => null),
  ])

  return {
    marketStatus,
    stocks: DASHBOARD_STOCKS.map((company, index) => ({
      ...company,
      quote: quoteResults[index].status === 'fulfilled' ? quoteResults[index].value : null,
    })),
  }
}

export const fetchWatchlistStocks = async (
  symbols: string[],
  signal?: AbortSignal,
): Promise<StockMarketRow[]> => {
  const companies = symbols
    .map((symbol) =>
      [...DASHBOARD_STOCKS, ...SP500_LEADERS].find((company) => company.symbol === symbol),
    )
    .filter((company): company is StockCompany => Boolean(company))
  const quoteResults = await Promise.allSettled(
    companies.map(({ symbol }) => fetchStockQuote(symbol, signal)),
  )

  return companies.map((company, index) => ({
    ...company,
    quote: quoteResults[index].status === 'fulfilled' ? quoteResults[index].value : null,
  }))
}

export const stockMarketQueryOptions = () =>
  queryOptions({
    queryKey: ['stock-market', 'sp500-leaders'],
    queryFn: ({ signal }) => fetchStockMarket(signal),
    refetchInterval: 5 * 60_000,
    staleTime: 5 * 60_000,
    retry: 1,
  })

export const stockDetailsQueryOptions = (symbol: string) =>
  queryOptions({
    queryKey: ['stock-details', symbol],
    queryFn: ({ signal }) => fetchStockDetails(symbol, signal),
    refetchInterval: 60_000,
    staleTime: 60_000,
    retry: 1,
  })

export const dashboardStocksQueryOptions = () =>
  queryOptions({
    queryKey: ['dashboard-stocks'],
    queryFn: ({ signal }) => fetchDashboardStocks(signal),
    refetchInterval: 5 * 60_000,
    staleTime: 5 * 60_000,
    retry: 1,
  })

export const watchlistStocksQueryOptions = (symbols: string[]) =>
  queryOptions({
    queryKey: ['watchlist-stocks', [...symbols].sort()],
    queryFn: ({ signal }) => fetchWatchlistStocks(symbols, signal),
    enabled: symbols.length > 0,
    refetchInterval: 5 * 60_000,
    staleTime: 5 * 60_000,
    retry: 1,
  })

export const useStockMarketQuery = () => useQuery(stockMarketQueryOptions())

export const useStockDetailsQuery = (symbol: string) => useQuery(stockDetailsQueryOptions(symbol))

export const useDashboardStocksQuery = () => useQuery(dashboardStocksQueryOptions())

export const useWatchlistStocksQuery = (symbols: string[]) =>
  useQuery(watchlistStocksQueryOptions(symbols))
