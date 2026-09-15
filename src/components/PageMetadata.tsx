import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const pages: Record<string, { title: string; description: string; noindex?: boolean }> = {
  '/dashboard': {
    title: 'Market Overview',
    description:
      'Explore stock and cryptocurrency markets, price movements, and financial news in one dashboard.',
  },
  '/markets': {
    title: 'Cryptocurrency Prices',
    description:
      'Explore cryptocurrency prices, market capitalization, trading volume, and interactive charts.',
  },
  '/markets/stocks': {
    title: 'Stock Prices',
    description:
      'Browse leading US stocks, follow price changes, and explore company profiles and market data.',
  },
  '/news': {
    title: 'Financial & Market News',
    description:
      'Read the latest financial headlines covering stock markets, cryptocurrency, and mergers.',
  },
  '/calendar': {
    title: 'Earnings & IPO Calendar',
    description:
      'Explore upcoming company earnings announcements and IPOs with the market events calendar.',
  },
  '/compare': {
    title: 'Compare Assets',
    description: 'Compare market assets and explore their performance side by side.',
  },
  '/watchlist': {
    title: 'Your Watchlist',
    description: 'Follow your saved stocks and cryptocurrencies in a personal market watchlist.',
    noindex: true,
  },
  '/portfolio': {
    title: 'Your Portfolio',
    description: 'Review your personal portfolio and follow the performance of your holdings.',
    noindex: true,
  },
  '/settings': {
    title: 'Settings',
    description: 'Customize your Stock Dashboard preferences and market data settings.',
    noindex: true,
  },
}

const setMeta = (attribute: 'name' | 'property', key: string, content: string) => {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.append(element)
  }
  element.content = content
}

export default function PageMetadata() {
  const { pathname } = useLocation()

  useEffect(() => {
    const path = pathname.replace(/\/+$/, '') || '/'
    let page = pages[path] ?? pages['/dashboard']
    const stock = /^\/markets\/stocks\/([^/]+)$/.exec(path)
    const crypto = /^\/markets\/([^/]+)$/.exec(path)
    if (stock || (crypto && !pages[path])) {
      const asset = (stock?.[1] ?? crypto?.[1] ?? '').replace(/-/g, ' ').slice(0, 80)
      const name = stock ? asset.toUpperCase() : asset
      page = {
        title: `${name} ${stock ? 'Stock' : 'Crypto'} Price & Details`,
        description: `Explore ${name} price information, charts, and ${stock ? 'company' : 'cryptocurrency'} market details on Stock Dashboard.`,
      }
    }

    const title = `${page.title} | Stock Dashboard`
    document.title = title
    setMeta('name', 'description', page.description)
    setMeta('name', 'robots', page.noindex ? 'noindex, follow' : 'index, follow')
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', page.description)
    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', page.description)

    // Only publish canonical URLs when the production domain has been configured.
    const siteUrl = import.meta.env.VITE_SITE_URL
    if (siteUrl) {
      try {
        const site = new URL(siteUrl)
        if (!['https:', 'http:'].includes(site.protocol)) return
        const url = new URL(path === '/' ? '/dashboard' : path, site.origin).href
        let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
        if (!canonical) {
          canonical = document.createElement('link')
          canonical.rel = 'canonical'
          document.head.append(canonical)
        }
        canonical.href = url
        setMeta('property', 'og:url', url)
      } catch {
        // A malformed optional site URL must not prevent the application from rendering.
      }
    }
  }, [pathname])

  return null
}
