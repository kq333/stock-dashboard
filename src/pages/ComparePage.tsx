import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, GitCompareArrows, Plus, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useBinanceLivePrices } from '@/hooks/useBinanceLivePrices'
import { useFinnhubStockPrices } from '@/hooks/useFinnhubStockPrices'
import { useCoinMarketsQuery } from '@/services/coinGeckoService'
import { DASHBOARD_STOCKS, SP500_LEADERS, useWatchlistStocksQuery } from '@/services/stockService'

type ComparisonAsset = {
  id: string
  name: string
  symbol: string
  type: 'crypto' | 'stock'
}

const COMPARE_STORAGE_KEY = 'stock-dashboard-compare'
const MAX_COMPARISON_ASSETS = 4
const DEFAULT_COMPARISON: ComparisonAsset[] = [
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', type: 'crypto' },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', type: 'crypto' },
  { id: 'AAPL', name: 'Apple', symbol: 'AAPL', type: 'stock' },
]

const stockOptions = Array.from(
  new Map(
    [...DASHBOARD_STOCKS, ...SP500_LEADERS].map((company) => [company.symbol, company]),
  ).values(),
)

const isComparisonAsset = (value: unknown): value is ComparisonAsset => {
  if (!value || typeof value !== 'object') return false

  const asset = value as Partial<ComparisonAsset>

  return (
    typeof asset.id === 'string' &&
    typeof asset.name === 'string' &&
    typeof asset.symbol === 'string' &&
    (asset.type === 'crypto' || asset.type === 'stock')
  )
}

const getInitialComparison = () => {
  try {
    const savedComparison = localStorage.getItem(COMPARE_STORAGE_KEY)
    if (!savedComparison) return DEFAULT_COMPARISON

    const parsed: unknown = JSON.parse(savedComparison)
    return Array.isArray(parsed) &&
      parsed.length <= MAX_COMPARISON_ASSETS &&
      parsed.every(isComparisonAsset)
      ? parsed
      : DEFAULT_COMPARISON
  } catch {
    return DEFAULT_COMPARISON
  }
}

const formatCurrency = (value?: number | null, compact = false) => {
  if (value === undefined || value === null) return '—'

  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    maximumFractionDigits: compact ? 2 : value < 1 ? 6 : 2,
    notation: compact ? 'compact' : 'standard',
    style: 'currency',
  }).format(value)
}

const ComparePage = () => {
  const [comparison, setComparison] = useState<ComparisonAsset[]>(getInitialComparison)
  const [selectedAsset, setSelectedAsset] = useState('')
  const [formError, setFormError] = useState('')
  const {
    data: coinMarkets = [],
    error: coinError,
    isPending: areCoinsPending,
  } = useCoinMarketsQuery()
  const { error: cryptoLiveError, prices: cryptoLivePrices } = useBinanceLivePrices()
  const stockSymbols = comparison
    .filter((asset) => asset.type === 'stock')
    .map(({ symbol }) => symbol)
  const {
    data: comparisonStocks = [],
    error: stockError,
    isPending: areStocksPending,
  } = useWatchlistStocksQuery(stockSymbols)
  const { error: stockLiveError, prices: stockLivePrices } = useFinnhubStockPrices(stockSymbols)

  useEffect(() => {
    localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(comparison))
  }, [comparison])

  const coinById = new Map(coinMarkets.map((coin) => [coin.id, coin]))
  const stockBySymbol = new Map(comparisonStocks.map((stock) => [stock.symbol, stock]))
  const selectedKeys = new Set(comparison.map(({ id, type }) => `${type}:${id}`))
  const comparisonData = comparison.map((asset) => {
    const coin = asset.type === 'crypto' ? coinById.get(asset.id) : undefined
    const stock = asset.type === 'stock' ? stockBySymbol.get(asset.symbol) : undefined
    const livePrice =
      asset.type === 'crypto'
        ? cryptoLivePrices[`${asset.symbol.toUpperCase()}USDT`]?.price
        : stockLivePrices[asset.symbol]?.price
    const currentPrice = livePrice ?? coin?.current_price ?? stock?.quote?.c ?? null
    const high = coin?.high_24h ?? stock?.quote?.h ?? null
    const low = coin?.low_24h ?? stock?.quote?.l ?? null
    const change = coin?.price_change_percentage_24h ?? stock?.quote?.dp ?? null
    const rangePosition =
      currentPrice !== null && high !== null && low !== null && high > low
        ? Math.min(Math.max(((currentPrice - low) / (high - low)) * 100, 0), 100)
        : null

    return {
      ...asset,
      change,
      currentPrice,
      high,
      image: coin?.image,
      low,
      marketCap: coin?.market_cap ?? null,
      rangePosition,
      sector: stock?.sector,
      volume: coin?.total_volume ?? null,
    }
  })
  const availableChanges = comparisonData.filter(
    (asset): asset is typeof asset & { change: number } => asset.change !== null,
  )
  const bestPerformer =
    availableChanges.length > 0
      ? availableChanges.reduce((best, asset) => (asset.change > best.change ? asset : best))
      : null
  const errors = [coinError?.message, stockError?.message, cryptoLiveError, stockLiveError].filter(
    Boolean,
  )

  const addSelectedAsset = () => {
    if (!selectedAsset) {
      setFormError('Select an asset to compare.')
      return
    }

    if (comparison.length >= MAX_COMPARISON_ASSETS) {
      setFormError(`You can compare up to ${MAX_COMPARISON_ASSETS} assets.`)
      return
    }

    const [type, id] = selectedAsset.split(':') as ['crypto' | 'stock', string]
    const coin = type === 'crypto' ? coinById.get(id) : undefined
    const stock = type === 'stock' ? stockOptions.find(({ symbol }) => symbol === id) : undefined
    const asset = coin
      ? {
          id: coin.id,
          name: coin.name,
          symbol: coin.symbol.toUpperCase(),
          type: 'crypto' as const,
        }
      : stock
        ? {
            id: stock.symbol,
            name: stock.name,
            symbol: stock.symbol,
            type: 'stock' as const,
          }
        : null

    if (!asset) {
      setFormError('The selected asset is unavailable.')
      return
    }

    setComparison((currentComparison) => [...currentComparison, asset])
    setSelectedAsset('')
    setFormError('')
  }

  const removeAsset = (assetToRemove: ComparisonAsset) => {
    setComparison((currentComparison) =>
      currentComparison.filter(
        (asset) => asset.id !== assetToRemove.id || asset.type !== assetToRemove.type,
      ),
    )
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Market analysis
          </p>
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight sm:text-4xl">
            <GitCompareArrows className="size-8" aria-hidden="true" />
            Compare
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Compare the live performance of up to four cryptocurrencies or stocks.
          </p>
        </div>

        {bestPerformer && (
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm">
            <p className="text-xs text-muted-foreground">Best performer today</p>
            <p className="mt-0.5 font-semibold text-green-600 dark:text-green-400">
              {bestPerformer.name} +{bestPerformer.change.toFixed(2)}%
            </p>
          </div>
        )}
      </div>

      <article className="mb-4 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="grid min-w-0 flex-1 gap-1.5 text-sm font-medium">
            Add asset
            <select
              value={selectedAsset}
              onChange={(event) => setSelectedAsset(event.target.value)}
              disabled={comparison.length >= MAX_COMPARISON_ASSETS}
              className="h-11 w-full rounded-md border border-input bg-background px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">
                {comparison.length >= MAX_COMPARISON_ASSETS
                  ? 'Maximum four assets selected'
                  : 'Select crypto or stock'}
              </option>
              <optgroup label="Cryptocurrencies">
                {coinMarkets
                  .filter((coin) => !selectedKeys.has(`crypto:${coin.id}`))
                  .map((coin) => (
                    <option key={coin.id} value={`crypto:${coin.id}`}>
                      {coin.name} ({coin.symbol.toUpperCase()})
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Stocks and ETFs">
                {stockOptions
                  .filter((stock) => !selectedKeys.has(`stock:${stock.symbol}`))
                  .map((stock) => (
                    <option key={stock.symbol} value={`stock:${stock.symbol}`}>
                      {stock.name} ({stock.symbol})
                    </option>
                  ))}
              </optgroup>
            </select>
          </label>

          <button
            type="button"
            onClick={addSelectedAsset}
            disabled={comparison.length >= MAX_COMPARISON_ASSETS || areCoinsPending}
            className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="size-4" aria-hidden="true" />
            Add to comparison
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            {comparison.length} of {MAX_COMPARISON_ASSETS} assets selected
          </p>
          {formError && <p className="text-sm text-destructive">{formError}</p>}
        </div>
      </article>

      {comparisonData.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {comparisonData.map((asset) => {
            const isPositive = (asset.change ?? 0) >= 0
            const isBest = bestPerformer?.id === asset.id && bestPerformer.type === asset.type
            const destination =
              asset.type === 'crypto' ? `/markets/${asset.id}` : `/markets/stocks/${asset.symbol}`

            return (
              <article
                key={`${asset.type}:${asset.id}`}
                className={`relative rounded-xl border bg-card p-5 text-card-foreground shadow-sm ${
                  isBest ? 'border-green-500/60' : 'border-border'
                }`}
              >
                <button
                  type="button"
                  onClick={() => removeAsset(asset)}
                  className="absolute top-3 right-3 inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  aria-label={`Remove ${asset.name} from comparison`}
                >
                  <X className="size-4" aria-hidden="true" />
                </button>

                <Link
                  to={destination}
                  className="flex min-w-0 items-center gap-3 pr-8 hover:underline"
                >
                  {asset.image ? (
                    <img src={asset.image} alt="" className="size-10 rounded-full" />
                  ) : (
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted text-xs font-bold">
                      {asset.symbol.slice(0, 2)}
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{asset.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {asset.symbol} · {asset.type}
                    </span>
                  </span>
                </Link>

                <div className="mt-5">
                  <p className="text-2xl font-bold">{formatCurrency(asset.currentPrice)}</p>
                  <p
                    className={`mt-1 inline-flex items-center gap-1 text-sm font-semibold ${
                      isPositive
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {isPositive ? (
                      <ArrowUp className="size-3.5" aria-hidden="true" />
                    ) : (
                      <ArrowDown className="size-3.5" aria-hidden="true" />
                    )}
                    {asset.change === null
                      ? '—'
                      : `${isPositive ? '+' : ''}${asset.change.toFixed(2)}%`}
                  </p>
                </div>

                <dl className="mt-5 space-y-3 border-t border-border pt-4 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">24h high</dt>
                    <dd className="font-medium">{formatCurrency(asset.high)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">24h low</dt>
                    <dd className="font-medium">{formatCurrency(asset.low)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Market cap</dt>
                    <dd className="font-medium">
                      {asset.marketCap !== null ? formatCurrency(asset.marketCap, true) : '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">
                      {asset.type === 'crypto' ? '24h volume' : 'Sector'}
                    </dt>
                    <dd className="max-w-36 truncate text-right font-medium">
                      {asset.type === 'crypto'
                        ? asset.volume !== null
                          ? formatCurrency(asset.volume, true)
                          : '—'
                        : (asset.sector ?? '—')}
                    </dd>
                  </div>
                </dl>

                <div className="mt-5">
                  <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                    <span>24h price range</span>
                    <span>
                      {asset.rangePosition === null ? '—' : `${asset.rangePosition.toFixed(0)}%`}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-300"
                      style={{ width: `${asset.rangePosition ?? 0}%` }}
                    />
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="grid min-h-72 place-items-center rounded-xl border border-dashed border-border p-8 text-center">
          <div>
            <GitCompareArrows
              className="mx-auto size-10 text-muted-foreground"
              aria-hidden="true"
            />
            <h2 className="mt-4 text-lg font-semibold">No assets selected</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add at least two assets to start comparing their performance.
            </p>
          </div>
        </div>
      )}

      {(areCoinsPending || areStocksPending) && comparison.length > 0 && (
        <p className="mt-4 text-center text-xs text-muted-foreground">Updating market data...</p>
      )}

      {errors.length > 0 && (
        <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          Some comparison data is temporarily unavailable: {errors[0]}
        </p>
      )}
    </section>
  )
}

export default ComparePage
