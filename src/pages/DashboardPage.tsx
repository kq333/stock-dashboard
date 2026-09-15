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

const formatCurrency = (value?: number | null, compact = false) => {
  if (value === undefined || value === null) return '—'

  return new Intl.NumberFormat(undefined, {
    currency: 'USD',
    maximumFractionDigits: compact ? 2 : value < 1 ? 6 : 2,
    notation: compact ? 'compact' : 'standard',
    style: 'currency',
  }).format(value)
}

const formatPercent = (value?: number | null) => {
  if (value === undefined || value === null) return '—'
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

type ChangeProps = {
  value?: number | null
}

const Change = ({ value }: ChangeProps) => {
  if (value === undefined || value === null) {
    return <span className="text-muted-foreground">—</span>
  }

  const isPositive = value >= 0

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium ${
        isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
      }`}
    >
      {isPositive ? (
        <ArrowUp className="size-3.5" aria-hidden="true" />
      ) : (
        <ArrowDown className="size-3.5" aria-hidden="true" />
      )}
      {formatPercent(value)}
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
  <article className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm">
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
  <div>
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
    stockError?.message,
    newsError?.message,
    cryptoLiveError,
    stockLiveError,
  ].filter(Boolean)

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Market overview
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Dashboard</h1>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <span
              className={`size-2 rounded-full ${
                cryptoConnection === 'connected' ? 'bg-green-500' : 'bg-yellow-500'
              }`}
            />
            Crypto live
          </span>
          <span className="inline-flex items-center gap-2">
            <span
              className={`size-2 rounded-full ${
                areStocksConnected ? 'bg-green-500' : 'bg-yellow-500'
              }`}
            />
            Stocks live
          </span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          isLoading={isGlobalPending}
          label="Total crypto market cap"
          value={formatCurrency(globalData?.total_market_cap.usd, true)}
          supportingText={
            formatPercent(globalData?.market_cap_change_percentage_24h_usd) + ' today'
          }
        />
        <MetricCard
          isLoading={isGlobalPending}
          label="24h crypto volume"
          value={formatCurrency(globalData?.total_volume.usd, true)}
          supportingText={`${globalData?.active_cryptocurrencies?.toLocaleString() ?? '—'} active assets`}
        />
        <MetricCard
          isLoading={isGlobalPending}
          label="Bitcoin dominance"
          value={
            globalData?.market_cap_percentage.btc === undefined
              ? '—'
              : `${globalData.market_cap_percentage.btc.toFixed(1)}%`
          }
          supportingText={`ETH ${globalData?.market_cap_percentage.eth?.toFixed(1) ?? '—'}%`}
        />
        <MetricCard
          isLoading={areStocksPending}
          label="US market"
          value={marketStatus ? (marketStatus.isOpen ? 'Open' : 'Closed') : 'Unavailable'}
          supportingText={
            marketStatus?.session
              ? marketStatus.session.replace('-', ' ')
              : (marketStatus?.holiday ?? 'Current exchange status')
          }
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <article className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Live watchlist</h2>
              <p className="text-sm text-muted-foreground">Crypto, indices and selected stocks</p>
            </div>
            <Link
              to="/markets"
              className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
            >
              All markets
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-130 border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-3 font-medium">Asset</th>
                  <th className="pb-3 text-right font-medium">Live price</th>
                  <th className="pb-3 text-right font-medium">24h</th>
                </tr>
              </thead>
              <tbody>
                {cryptoWatchlist.map((coin) => {
                  const symbol = `${coin.symbol.toUpperCase()}USDT`
                  const livePrice = cryptoLivePrices[symbol]

                  return (
                    <tr key={coin.id} className="border-b border-border last:border-0">
                      <td className="py-3">
                        <Link
                          to={`/markets/${coin.id}`}
                          className="flex items-center gap-2 font-medium hover:underline"
                        >
                          <img src={coin.image} alt="" className="size-7 rounded-full" />
                          {coin.name}
                          <span className="text-xs text-muted-foreground uppercase">
                            {coin.symbol}
                          </span>
                        </Link>
                      </td>
                      <td className="py-3 text-right font-medium tabular-nums">
                        {formatCurrency(livePrice?.price ?? coin.current_price)}
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
                      <td className="py-3">
                        <Link
                          to={`/markets/stocks/${stock.symbol}`}
                          className="font-medium hover:underline"
                        >
                          {stock.name}
                          <span className="ml-2 text-xs text-muted-foreground">{stock.symbol}</span>
                        </Link>
                      </td>
                      <td className="py-3 text-right font-medium tabular-nums">
                        {formatCurrency(livePrice?.price ?? stock.quote?.c)}
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

        <article className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Crypto movers</h2>
            <span className="text-xs text-muted-foreground">24 hours</span>
          </div>
          {areCoinsPending ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }, (_, index) => (
                <div key={index} className="h-9 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
              <MoverList title="Top gainers" coins={gainers} />
              <MoverList title="Top losers" coins={losers} />
            </div>
          )}
        </article>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <article className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm xl:col-span-2">
          <Suspense fallback={<div className="h-98 animate-pulse rounded-lg bg-muted" />}>
            <CryptoChart symbol="BTCUSDT" title="Bitcoin / USDT" height={340} />
          </Suspense>
        </article>

        <article className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Latest news</h2>
              <p className="text-sm text-muted-foreground">Market headlines</p>
            </div>
            <Link to="/news" className="text-sm font-medium hover:underline">
              View all
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
                      {new Date(article.datetime * 1_000).toLocaleDateString()}
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
          Some dashboard data is temporarily unavailable: {errors[0]}
        </p>
      )}
    </section>
  )
}

export default DashboardPage
