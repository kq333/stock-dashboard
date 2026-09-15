import { queryOptions, useQuery } from '@tanstack/react-query'

const FINNHUB_NEWS_URL = '/api/finnhub/news'

export type NewsCategory = 'general' | 'crypto' | 'merger'

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

export const fetchNews = async (
  category: NewsCategory = 'general',
  signal?: AbortSignal,
): Promise<NewsArticle[]> => {
  const query = new URLSearchParams({ category })

  const response = await fetch(`${FINNHUB_NEWS_URL}?${query}`, { signal })

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
