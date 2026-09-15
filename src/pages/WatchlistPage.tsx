import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Plus, Search, Star, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useBinanceLivePrices } from '@/hooks/useBinanceLivePrices'
import { useFinnhubStockPrices } from '@/hooks/useFinnhubStockPrices'
import { useWatchlist, type WatchlistAsset } from '@/hooks/useWatchlist'
import { useCoinMarketsQuery } from '@/services/coinGeckoService'
import { DASHBOARD_STOCKS, SP500_LEADERS, useWatchlistStocksQuery } from '@/services/stockService'

const stockOptions = Array.from(
  new Map(
    [...DASHBOARD_STOCKS, ...SP500_LEADERS].map((company) => [company.symbol, company]),
  ).values(),
)

const formatPrice = (value?: number | null) => {
  if (value === undefined || value === null) return '—'

  return new Intl.NumberFormat(undefined, {
    currency: 'USD',
    maximumFractionDigits: value < 1 ? 6 : 2,
    style: 'currency',
  }).format(value)
}

const formatPercent = (value?: number | null) => {
  if (value === undefined || value === null) return '—'
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

type ChangeProps = {
  direction?: 'up' | 'down' | 'unchanged'
  value?: number | null
}

const Change = ({ direction, value }: ChangeProps) => {
  if (value === undefined || value === null) {
    return <span className="text-muted-foreground">—</span>
  }

  const isPositive = value >= 0

  return (
    <span
      className={`inline-flex items-center justify-end gap-1 font-medium ${
        isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
      }`}
    >
      {direction === 'up' && <ArrowUp className="size-3.5" aria-hidden="true" />}
      {direction === 'down' && <ArrowDown className="size-3.5" aria-hidden="true" />}
      {formatPercent(value)}
    </span>
  )
}

const WatchlistPage = () => {
  const {
    addAsset: addAssetToWatchlist,
    removeAsset: removeAssetFromWatchlist,
    watchlist,
  } = useWatchlist()
  const [search, setSearch] = useState('')
  const {
    data: coinMarkets = [],
    error: coinError,
    isPending: areCoinsPending,
  } = useCoinMarketsQuery()
  const { error: cryptoLiveError, prices: cryptoLivePrices } = useBinanceLivePrices()
  const stockSymbols = watchlist
    .filter((asset) => asset.type === 'stock')
    .map(({ symbol }) => symbol)
  const {
    data: watchlistStocks = [],
    error: stockError,
    isPending: areStocksPending,
  } = useWatchlistStocksQuery(stockSymbols)
  const {
    error: stockLiveError,
    isConnected: areStocksConnected,
    prices: stockLivePrices,
  } = useFinnhubStockPrices(stockSymbols)

  const searchResults = useMemo(() => {
    const searchValue = search.trim().toLowerCase()
    if (!searchValue) return []

    const savedKeys = new Set(watchlist.map(({ id, type }) => `${type}:${id}`))
    const cryptoResults: WatchlistAsset[] = coinMarkets
      .filter(
        ({ id, name, symbol }) =>
          !savedKeys.has(`crypto:${id}`) &&
          (name.toLowerCase().includes(searchValue) || symbol.toLowerCase().includes(searchValue)),
      )
      .slice(0, 5)
      .map(({ id, name, symbol }) => ({
        id,
        name,
        symbol: symbol.toUpperCase(),
        type: 'crypto',
      }))
    const stockResults: WatchlistAsset[] = stockOptions
      .filter(
        ({ name, symbol }) =>
          !savedKeys.has(`stock:${symbol}`) &&
          (name.toLowerCase().includes(searchValue) || symbol.toLowerCase().includes(searchValue)),
      )
      .slice(0, 5)
      .map(({ name, symbol }) => ({
        id: symbol,
        name,
        symbol,
        type: 'stock',
      }))

    return [...cryptoResults, ...stockResults].slice(0, 8)
  }, [coinMarkets, search, watchlist])

  const coinById = new Map(coinMarkets.map((coin) => [coin.id, coin]))
  const stockBySymbol = new Map(watchlistStocks.map((stock) => [stock.symbol, stock]))
  const errors = [coinError?.message, stockError?.message, cryptoLiveError, stockLiveError].filter(
    Boolean,
  )

  const handleAddAsset = (asset: WatchlistAsset) => {
    addAssetToWatchlist(asset)
    setSearch('')
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Personal market
          </p>
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight sm:text-4xl">
            <Star className="size-8 fill-current" aria-hidden="true" />
            Watchlist
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your saved assets are stored in this browser.
          </p>
        </div>

        <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className={`size-2 rounded-full ${
              areStocksConnected ? 'bg-green-500' : 'bg-yellow-500'
            }`}
          />
          Live prices {areStocksConnected ? 'connected' : 'connecting'}
        </span>
      </div>

      <div className="relative mb-4 max-w-xl">
        <label className="relative block">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <span className="sr-only">Search assets to add</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search crypto, company or symbol..."
            className="w-full rounded-lg border border-input bg-background py-3 pr-4 pl-10 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>

        {search.trim() && (
          <div className="absolute top-full right-0 left-0 z-20 mt-2 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg">
            {searchResults.length > 0 ? (
              <ul className="max-h-80 overflow-y-auto p-1">
                {searchResults.map((asset) => (
                  <li key={`${asset.type}:${asset.id}`}>
                    <button
                      type="button"
                      onClick={() => handleAddAsset(asset)}
                      className="flex w-full cursor-pointer items-center justify-between gap-4 rounded-md px-3 py-2 text-left transition-colors hover:bg-accent"
                    >
                      <span>
                        <span className="block text-sm font-medium">{asset.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {asset.symbol} · {asset.type}
                        </span>
                      </span>
                      <Plus className="size-4 shrink-0" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-4 text-sm text-muted-foreground">
                {areCoinsPending ? 'Loading available assets...' : 'No new assets found.'}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-border p-4 md:px-6">
          <div>
            <h2 className="text-xl font-semibold">Saved assets</h2>
            <p className="text-sm text-muted-foreground">
              {watchlist.length} {watchlist.length === 1 ? 'asset' : 'assets'}
            </p>
          </div>
        </div>

        {watchlist.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-160 border-collapse">
              <thead>
                <tr className="border-b border-border text-left text-sm text-muted-foreground">
                  <th className="px-4 py-3 font-medium md:px-6">Asset</th>
                  <th className="px-4 py-3 font-medium md:px-6">Type</th>
                  <th className="px-4 py-3 text-right font-medium md:px-6">Live price</th>
                  <th className="px-4 py-3 text-right font-medium md:px-6">24h</th>
                  <th className="w-16 px-4 py-3 md:px-6">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {watchlist.map((asset) => {
                  const coin = asset.type === 'crypto' ? coinById.get(asset.id) : undefined
                  const stock = asset.type === 'stock' ? stockBySymbol.get(asset.symbol) : undefined
                  const cryptoLivePrice =
                    asset.type === 'crypto'
                      ? cryptoLivePrices[`${asset.symbol.toUpperCase()}USDT`]
                      : undefined
                  const stockLivePrice =
                    asset.type === 'stock' ? stockLivePrices[asset.symbol] : undefined
                  const price =
                    cryptoLivePrice?.price ??
                    stockLivePrice?.price ??
                    coin?.current_price ??
                    stock?.quote?.c
                  const change =
                    asset.type === 'crypto' ? coin?.price_change_percentage_24h : stock?.quote?.dp
                  const direction = cryptoLivePrice?.direction ?? stockLivePrice?.direction
                  const destination =
                    asset.type === 'crypto'
                      ? `/markets/${asset.id}`
                      : `/markets/stocks/${asset.symbol}`

                  return (
                    <tr
                      key={`${asset.type}:${asset.id}`}
                      className="border-b border-border transition-colors last:border-0 hover:bg-muted/50"
                    >
                      <td className="px-4 py-4 md:px-6">
                        <Link
                          to={destination}
                          className="flex items-center gap-3 font-medium hover:underline"
                        >
                          {coin?.image ? (
                            <img src={coin.image} alt="" className="size-9 rounded-full" />
                          ) : (
                            <span className="grid size-9 place-items-center rounded-full bg-muted text-xs font-bold">
                              {asset.symbol.slice(0, 2)}
                            </span>
                          )}
                          <span>
                            <span className="block">{asset.name}</span>
                            <span className="text-xs text-muted-foreground">{asset.symbol}</span>
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground capitalize md:px-6">
                        {asset.type}
                      </td>
                      <td className="px-4 py-4 text-right font-semibold tabular-nums md:px-6">
                        {formatPrice(price)}
                      </td>
                      <td className="px-4 py-4 text-right md:px-6">
                        <Change direction={direction} value={change} />
                      </td>
                      <td className="px-4 py-4 text-right md:px-6">
                        <button
                          type="button"
                          onClick={() => removeAssetFromWatchlist(asset)}
                          className="inline-flex size-9 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                          aria-label={`Remove ${asset.name} from watchlist`}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid min-h-64 place-items-center p-8 text-center">
            <div>
              <Star className="mx-auto size-10 text-muted-foreground" aria-hidden="true" />
              <h2 className="mt-4 text-lg font-semibold">Your watchlist is empty</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Search above to add a cryptocurrency or stock.
              </p>
            </div>
          </div>
        )}

        {(areStocksPending || areCoinsPending) && watchlist.length > 0 && (
          <p className="border-t border-border p-3 text-center text-xs text-muted-foreground">
            Updating market data...
          </p>
        )}
      </div>

      {errors.length > 0 && (
        <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          Some watchlist data is temporarily unavailable: {errors[0]}
        </p>
      )}
    </section>
  )
}

export default WatchlistPage
