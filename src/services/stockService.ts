import { queryOptions, useQuery } from '@tanstack/react-query'

const FINNHUB_API_URL = 'https://finnhub.io/api/v1'

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

const getApiKey = () => {
  const apiKey = import.meta.env.NEWS_STOCK_API_KEY

  if (!apiKey || apiKey === 'replace_with_your_finnhub_api_key') {
    throw new Error('NEWS_STOCK_API_KEY is not configured in .env.local.')
  }

  return apiKey
}

const fetchFinnhub = async <Data>(
  path: string,
  params: Record<string, string>,
  signal?: AbortSignal,
): Promise<Data> => {
  const url = new URL(`${FINNHUB_API_URL}${path}`)
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value))
  url.searchParams.set('token', getApiKey())

  const response = await fetch(url, { signal })

  if (!response.ok) {
    throw new Error(`Finnhub stock request failed with status ${response.status}.`)
  }

  return response.json() as Promise<Data>
}

export const fetchStockQuote = (symbol: string, signal?: AbortSignal) =>
  fetchFinnhub<StockQuote>('/quote', { symbol }, signal)

export const fetchStockProfile = (symbol: string, signal?: AbortSignal) =>
  fetchFinnhub<StockProfile>('/stock/profile2', { symbol }, signal)

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

export const useStockMarketQuery = () => useQuery(stockMarketQueryOptions())

export const useStockDetailsQuery = (symbol: string) => useQuery(stockDetailsQueryOptions(symbol))
