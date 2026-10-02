import type { TFunction } from 'i18next'

// Translate application error messages at render time, without changing query caches.
export function translateError(text: string | null | undefined, t: TFunction): string {
  const message = text ?? ''
  const request =
    /^(CoinGecko|Finnhub(?: calendar| stock| news)?) request failed with status (\d+)\.?$/.exec(
      message,
    )
  if (request) return t('Request failed', { provider: request[1], status: request[2] })
  const quote = /^No valid quote available for (.+)\.$/.exec(message)
  if (quote) return t('Quote invalid', { symbol: quote[1] })
  const unavailable = /^Quote unavailable for (.+)\.$/.exec(message)
  if (unavailable) return t('Quote unavailable', { symbol: unavailable[1] })
  const limit = /^You can compare up to (\d+) assets\.$/.exec(message)
  if (limit) return t('Comparison limit', { max: limit[1] })
  return t(message)
}
