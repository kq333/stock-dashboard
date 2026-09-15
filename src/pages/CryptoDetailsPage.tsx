import { ArrowLeft, ArrowDown, ArrowUp } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import CryptoChart from '@/components/CryptoChart'
import WatchlistButton from '@/components/WatchlistButton'
import { useBinanceLivePrices } from '@/hooks/useBinanceLivePrices'
import { useWatchlist } from '@/hooks/useWatchlist'
import { useCoinDetailsQuery } from '@/services/coinGeckoService'

const formatCurrency = (value?: number | null, compact = false) => {
  if (value === undefined || value === null) return '—'

  return new Intl.NumberFormat(undefined, {
    currency: 'USD',
    maximumFractionDigits: compact ? 2 : value < 1 ? 8 : 2,
    notation: compact ? 'compact' : 'standard',
    style: 'currency',
  }).format(value)
}

const formatNumber = (value?: number | null) => {
  if (value === undefined || value === null) return '—'
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value)
}

type MetricProps = {
  label: string
  value: string
}

const Metric = ({ label, value }: MetricProps) => (
  <div className="rounded-lg border border-border bg-card p-4">
    <dt className="text-sm text-muted-foreground">{label}</dt>
    <dd className="mt-1 text-lg font-semibold">{value}</dd>
  </div>
)

const CryptoDetailsPage = () => {
  const { currencyId = '' } = useParams()
  const { data: coin, error, isPending } = useCoinDetailsQuery(currencyId)
  const { prices } = useBinanceLivePrices()
  const { isInWatchlist, toggleAsset } = useWatchlist()
  const binanceSymbol = coin ? `${coin.symbol.toUpperCase()}USDT` : ''
  const livePrice = prices[binanceSymbol]
  const currentPrice = livePrice?.price ?? coin?.market_data.current_price.usd

  if (isPending) {
    return <p className="p-8 text-center text-muted-foreground">Loading currency details...</p>
  }

  if (error || !coin) {
    return (
      <section className="p-6">
        <Link
          to="/markets"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium hover:underline"
        >
          <ArrowLeft className="size-4" />
          Back to market
        </Link>
        <p className="text-destructive">{error?.message ?? 'Currency was not found.'}</p>
      </section>
    )
  }

  const change = coin.market_data.price_change_percentage_24h

  return (
    <section className="p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <Link
          to="/markets"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to market
        </Link>

        <div className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <img src={coin.image.large} alt="" className="size-16 rounded-full" />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-bold">{coin.name}</h1>
                  <span className="rounded bg-muted px-2 py-1 text-sm font-medium text-muted-foreground uppercase">
                    {coin.symbol}
                  </span>
                  <WatchlistButton
                    assetName={coin.name}
                    isSaved={isInWatchlist({ id: coin.id, type: 'crypto' })}
                    onToggle={() =>
                      toggleAsset({
                        id: coin.id,
                        name: coin.name,
                        symbol: coin.symbol.toUpperCase(),
                        type: 'crypto',
                      })
                    }
                    showLabel
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Market rank #{coin.market_cap_rank ?? '—'}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p
                className={`text-3xl font-bold transition-colors ${
                  livePrice?.direction === 'up'
                    ? 'text-green-600 dark:text-green-400'
                    : livePrice?.direction === 'down'
                      ? 'text-red-600 dark:text-red-400'
                      : ''
                }`}
              >
                {formatCurrency(currentPrice)}
              </p>
              <p
                className={`mt-1 inline-flex items-center justify-end gap-1 font-medium ${
                  (change ?? 0) >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {(change ?? 0) >= 0 ? (
                  <ArrowUp className="size-4" />
                ) : (
                  <ArrowDown className="size-4" />
                )}
                {change === null ? '—' : `${change.toFixed(2)}%`} (24h)
              </p>
            </div>
          </div>

          {coin.categories.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {coin.categories.slice(0, 5).map((category) => (
                <span
                  key={category}
                  className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
                >
                  {category}
                </span>
              ))}
            </div>
          )}
        </div>

        <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            label="Market cap"
            value={formatCurrency(coin.market_data.market_cap.usd, true)}
          />
          <Metric
            label="24h volume"
            value={formatCurrency(coin.market_data.total_volume.usd, true)}
          />
          <Metric label="24h high" value={formatCurrency(coin.market_data.high_24h.usd)} />
          <Metric label="24h low" value={formatCurrency(coin.market_data.low_24h.usd)} />
          <Metric label="All-time high" value={formatCurrency(coin.market_data.ath.usd)} />
          <Metric label="All-time low" value={formatCurrency(coin.market_data.atl.usd)} />
          <Metric
            label="Circulating supply"
            value={formatNumber(coin.market_data.circulating_supply)}
          />
          <Metric label="Maximum supply" value={formatNumber(coin.market_data.max_supply)} />
        </dl>

        <div className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm md:p-6">
          <CryptoChart symbol={binanceSymbol} />
        </div>
      </div>
    </section>
  )
}

export default CryptoDetailsPage
