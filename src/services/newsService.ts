import { queryOptions, useQuery } from '@tanstack/react-query'

const FINNHUB_NEWS_URL = 'https://finnhub.io/api/v1/news'

export type NewsCategory = 'general' | 'forex' | 'crypto' | 'merger'

export type NewsArticle = {
  category: string
  datetime: number
  headline: string
  id: number
  image: string
  related: string
  source: string
  summary: string
  url: string
}

const getApiKey = () => {
  const apiKey = import.meta.env.NEWS_STOCK_API_KEY

  if (!apiKey || apiKey === 'replace_with_your_api_key') {
    throw new Error('NEWS_STOCK_API_KEY is not configured in .env.local')
  }

  return apiKey
}

export const fetchNews = async (
  category: NewsCategory = 'general',
  signal?: AbortSignal,
): Promise<NewsArticle[]> => {
  const url = new URL(FINNHUB_NEWS_URL)
  url.searchParams.set('category', category)
  url.searchParams.set('token', getApiKey())

  const response = await fetch(url, { signal })

  if (!response.ok) {
    throw new Error(`Finnhub news request failed with status ${response.status}`)
  }

  const data: unknown = await response.json()

  if (!Array.isArray(data)) {
    throw new Error('Finnhub returned an invalid news response')
  }

  return data as NewsArticle[]
}

export const newsQueryOptions = (category: NewsCategory = 'general') =>
  queryOptions({
    queryKey: ['news', category],
    queryFn: ({ signal }) => fetchNews(category, signal),
    staleTime: 5 * 60 * 1000,
  })

export const useNewsQuery = (category: NewsCategory = 'general') =>
  useQuery(newsQueryOptions(category))
