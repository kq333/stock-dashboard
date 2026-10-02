import { translateError } from '@/lib/translationErrors'
import { formatNumber, getLocale } from '@/lib/formatters'
import { useTranslation } from 'react-i18next'
import { lazy, Suspense } from 'react'
import { ArrowDown, ArrowRight, ArrowUp, Clock3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useBinanceLivePrices } from '@/hooks/useBinanceLivePrices'
import { useFinnhubStockPrices } from '@/hooks/useFinnhubStockPrices'
import {
  useCoinMarketsQuery,
  useCryptoGlobalQuery,
  type CoinMarket,
} from '@/services/coinGeckoService'
import { useNewsQuery } from '@/services/newsService'
import { DASHBOARD_STOCKS, useDashboardStocksQuery } from '@/services/stockService'

const CryptoChart = lazy(() => import('@/components/CryptoChart'))

const CRYPTO_WATCHLIST = ['bitcoin', 'ethereum', 'solana']
const DASHBOARD_SYMBOLS = DASHBOARD_STOCKS.map(({ symbol }) => symbol)

const formatCurrency = (locale: string, value?: number | null, compact = false) => {
  if (value === undefined || value === null) return '—'

  return new Intl.NumberFormat(locale, {
    currency: 'USD',
    maximumFractionDigits: compact ? 2 : value < 1 ? 6 : 2,
    notation: compact ? 'compact' : 'standard',
    style: 'currency',
  }).format(value)
}

const formatPercent = (locale: string, value?: number | null) => {
  if (value === undefined || value === null) return '—'
  return `${value >= 0 ? '+' : ''}${formatNumber(value, 2, locale)}%`
}

type ChangeProps = {
  value?: number | null
}

const Change = ({ value }: ChangeProps) => {
  const { i18n } = useTranslation()
  const locale = getLocale(i18n.resolvedLanguage)

  if (value === undefined || value === null) {
    return <span className="text-muted-foreground">—</span>
  }

  const isPositive = value >= 0

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap font-medium ${
        isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
      }`}
    >
      {isPositive ? (
        <ArrowUp className="size-3.5" aria-hidden="true" />
      ) : (
        <ArrowDown className="size-3.5" aria-hidden="true" />
      )}
      {formatPercent(locale, value)}
    </span>
  )
}

type MetricCardProps = {
  isLoading: boolean
  label: string
  supportingText?: string
  value: string
}

const MetricCard = ({ isLoading, label, supportingText, value }: MetricCardProps) => (
  <article className="min-w-0 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm">
    <p className="text-sm font-medium text-muted-foreground">{label}</p>
    {isLoading ? (
      <div className="mt-3 h-8 w-32 animate-pulse rounded bg-muted" />
    ) : (
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
    )}
    {supportingText && <p className="mt-1 text-xs text-muted-foreground">{supportingText}</p>}
  </article>
)

type MoverListProps = {
  coins: CoinMarket[]
  title: string
}

const MoverList = ({ coins, title }: MoverListProps) => (
  <div className="min-w-0">
    <h3 className="mb-3 text-sm font-semibold text-muted-foreground">{title}</h3>
    <div className="space-y-1">
      {coins.map((coin) => (
        <Link
          key={coin.id}
          to={`/markets/${coin.id}`}
          className="flex items-center justify-between gap-4 rounded-lg px-2 py-2 transition-colors hover:bg-muted"
        >
          <span className="flex min-w-0 items-center gap-2">
            <img src={coin.image} alt="" className="size-7 shrink-0 rounded-full" loading="lazy" />
            <span className="truncate text-sm font-medium">{coin.name}</span>
          </span>
          <Change value={coin.price_change_percentage_24h} />
        </Link>
      ))}
    </div>
  </div>
)

const DashboardPage = () => {
  const { t, i18n } = useTranslation()
  const locale = getLocale(i18n.resolvedLanguage)

  const { data: coins = [], error: coinError, isPending: areCoinsPending } = useCoinMarketsQuery()
  const {
    data: globalResponse,
    error: globalError,
    isPending: isGlobalPending,
  } = useCryptoGlobalQuery()
  const {
    data: stockDashboard,
    error: stockError,
    isPending: areStocksPending,
  } = useDashboardStocksQuery()
  const { data: news = [], error: newsError, isPending: isNewsPending } = useNewsQuery('general')
  const {
    error: cryptoLiveError,
    prices: cryptoLivePrices,
    status: cryptoConnection,
  } = useBinanceLivePrices()
  const {
    error: stockLiveError,
    isConnected: areStocksConnected,
    prices: stockLivePrices,
  } = useFinnhubStockPrices(DASHBOARD_SYMBOLS)

  const globalData = globalResponse?.data
  const marketStatus = stockDashboard?.marketStatus
  const cryptoWatchlist = CRYPTO_WATCHLIST.map((id) => coins.find((coin) => coin.id === id)).filter(
    (coin): coin is CoinMarket => Boolean(coin),
  )
  const movers = coins
    .filter((coin) => coin.price_change_percentage_24h !== null)
    .sort(
      (first, second) =>
        (second.price_change_percentage_24h ?? 0) - (first.price_change_percentage_24h ?? 0),
    )
  const gainers = movers.slice(0, 4)
  const losers = movers.slice(-4).reverse()
  const errors = [
    coinError?.message,
    globalError?.message,
    stockError?.message ?? stockDashboard?.stocks?.find((stock) => stock.quoteError)?.quoteError,
    newsError?.message,
    cryptoLiveError,
    stockLiveError,
  ].filter(Boolean)

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            {t('Market overview')}
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('Dashboard')}</h1>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <span
              className={`size-2 rounded-full ${
                cryptoConnection === 'connected' ? 'bg-green-500' : 'bg-yellow-500'
              }`}
            />
            {t('Crypto live')}
          </span>
          <span className="inline-flex items-center gap-2">
            <span
              className={`size-2 rounded-full ${
                areStocksConnected ? 'bg-green-500' : 'bg-yellow-500'
              }`}
            />
            {t('Stocks live')}
          </span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          isLoading={isGlobalPending}
          label={t('Total crypto market cap')}
          value={formatCurrency(locale, globalData?.total_market_cap.usd, true)}
          supportingText={t('Today change', {
            change: formatPercent(locale, globalData?.market_cap_change_percentage_24h_usd),
          })}
        />
        <MetricCard
          isLoading={isGlobalPending}
          label={t('24h crypto volume')}
          value={formatCurrency(locale, globalData?.total_volume.usd, true)}
          supportingText={t('Active assets', {
            count: globalData?.active_cryptocurrencies?.toLocaleString(locale) ?? '—',
          })}
        />
        <MetricCard
          isLoading={isGlobalPending}
          label={t('Bitcoin dominance')}
          value={
            globalData?.market_cap_percentage.btc === undefined
              ? '—'
              : `${formatNumber(globalData.market_cap_percentage.btc, 1, locale)}%`
          }
          supportingText={`ETH ${globalData?.market_cap_percentage.eth === undefined ? '—' : formatNumber(globalData.market_cap_percentage.eth, 1, locale)}%`}
        />
        <MetricCard
          isLoading={areStocksPending}
          label={t('US market')}
          value={marketStatus ? (marketStatus.isOpen ? t('Open') : t('Closed')) : t('Unavailable')}
          supportingText={
            marketStatus?.session
              ? t(marketStatus.session.replace('-', ' '))
              : (marketStatus?.holiday ?? t('Current exchange status'))
          }
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <article className="min-w-0 rounded-xl border border-border bg-card p-3 text-card-foreground shadow-sm sm:p-5 xl:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">{t('Live watchlist')}</h2>
              <p className="text-sm text-muted-foreground">
                {t('Crypto, indices and selected stocks')}
              </p>
            </div>
            <Link
              to="/markets"
              className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
            >
              {t('All markets')}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full table-fixed border-collapse text-xs sm:table-auto sm:text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="w-[40%] pb-3 pr-2 font-medium sm:w-auto">{t('Asset')}</th>
                  <th className="w-[35%] pb-3 pr-2 text-right font-medium sm:w-auto">
                    {t('Live price')}
                  </th>
                  <th className="w-1/4 pb-3 text-right font-medium sm:w-auto">24h</th>
                </tr>
              </thead>
              <tbody>
                {cryptoWatchlist.map((coin) => {
                  const symbol = `${coin.symbol.toUpperCase()}USDT`
                  const livePrice = cryptoLivePrices[symbol]

                  return (
                    <tr key={coin.id} className="border-b border-border last:border-0">
                      <td className="py-3 pr-2">
                        <Link
                          to={`/markets/${coin.id}`}
                          className="flex min-w-0 items-center gap-1.5 font-medium hover:underline sm:gap-2"
                        >
                          <img
                            src={coin.image}
                            alt=""
                            className="size-5 shrink-0 rounded-full sm:size-7"
                          />
                          <span className="min-w-0">
                            <span className="block truncate sm:inline" title={coin.name}>
                              {coin.name}
                            </span>
                            <span className="block text-xs text-muted-foreground uppercase sm:ml-2 sm:inline">
                              {coin.symbol}
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td className="py-3 pr-2 text-right font-medium tabular-nums [overflow-wrap:anywhere]">
                        {formatCurrency(locale, livePrice?.price ?? coin.current_price)}
                      </td>
                      <td className="py-3 text-right">
                        <Change value={coin.price_change_percentage_24h} />
                      </td>
                    </tr>
                  )
                })}

                {(stockDashboard?.stocks ?? []).map((stock) => {
                  const livePrice = stockLivePrices[stock.symbol]

                  return (
                    <tr key={stock.symbol} className="border-b border-border last:border-0">
                      <td className="py-3 pr-2">
                        <Link
                          to={`/markets/stocks/${stock.symbol}`}
                          className="block min-w-0 font-medium hover:underline"
                        >
                          <span className="block truncate sm:inline" title={stock.name}>
                            {stock.name}
                          </span>
                          <span className="block text-xs text-muted-foreground sm:ml-2 sm:inline">
                            {stock.symbol}
                          </span>
                        </Link>
                      </td>
                      <td className="py-3 pr-2 text-right font-medium tabular-nums [overflow-wrap:anywhere]">
                        {formatCurrency(locale, livePrice?.price ?? stock.quote?.c)}
                      </td>
                      <td className="py-3 text-right">
                        <Change value={stock.quote?.dp} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {(areCoinsPending || areStocksPending) && (
              <div className="space-y-3 py-4">
                {Array.from({ length: 5 }, (_, index) => (
                  <div key={index} className="h-8 animate-pulse rounded bg-muted" />
                ))}
              </div>
            )}
          </div>
        </article>

        <article className="min-w-0 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">{t('Crypto movers')}</h2>
            <span className="text-xs text-muted-foreground">{t('24 hours')}</span>
          </div>
          {areCoinsPending ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }, (_, index) => (
                <div key={index} className="h-9 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
              <MoverList title={t('Top gainers')} coins={gainers} />
              <MoverList title={t('Top losers')} coins={losers} />
            </div>
          )}
        </article>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <article className="min-w-0 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm xl:col-span-2">
          <Suspense fallback={<div className="h-98 animate-pulse rounded-lg bg-muted" />}>
            <CryptoChart symbol="BTCUSDT" title="Bitcoin / USDT" height={340} />
          </Suspense>
        </article>

        <article className="min-w-0 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">{t('Latest news')}</h2>
              <p className="text-sm text-muted-foreground">{t('Market headlines')}</p>
            </div>
            <Link to="/news" className="text-sm font-medium hover:underline">
              {t('View all')}
            </Link>
          </div>

          {isNewsPending ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="h-20 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {news.slice(0, 4).map((article) => (
                <a
                  key={article.id}
                  href={article.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group block py-4 first:pt-0 last:pb-0"
                >
                  <h3 className="line-clamp-2 text-sm font-semibold group-hover:underline">
                    {article.headline}
                  </h3>
                  <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{article.source}</span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="size-3" aria-hidden="true" />
                      {new Date(article.datetime * 1_000).toLocaleDateString(locale)}
                    </span>
                  </p>
                </a>
              ))}
            </div>
          )}
        </article>
      </div>

      {errors.length > 0 && (
        <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {t('Some dashboard data is temporarily unavailable:')} {translateError(errors[0], t)}
        </p>
      )}
    </section>
  )
}

export default DashboardPage
