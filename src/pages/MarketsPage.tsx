import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowUp, Search } from 'lucide-react'
import { useBinanceCryptoList } from '@/hooks/useBinanceCryptoList'
import { useBinanceLivePrices } from '@/hooks/useBinanceLivePrices'
import { useWatchlist } from '@/hooks/useWatchlist'
import { useCoinMarketsQuery } from '@/services/coinGeckoService'
import WatchlistButton from '@/components/WatchlistButton'

const formatPrice = (price: number | null) => {
  if (price === null) return '—'

  return new Intl.NumberFormat(undefined, {
    currency: 'USD',
    maximumFractionDigits: price < 1 ? 8 : 2,
    style: 'currency',
  }).format(price)
}

const formatCompactCurrency = (value: number | null) => {
  if (value === null) return '—'

  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    maximumFractionDigits: 2,
    notation: 'compact',
    style: 'currency',
  }).format(value)
}

const CryptoTableSkeleton = () => (
  <>
    {Array.from({ length: 8 }, (_, index) => (
      <tr key={index} className="border-b border-border last:border-0">
        <td className="hidden px-4 py-4 sm:table-cell md:px-6">
          <div className="h-4 w-6 animate-pulse rounded bg-muted" />
        </td>
        <td className="px-2 py-4 sm:px-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="size-9 shrink-0 animate-pulse rounded-full bg-muted" />
            <div className="space-y-2">
              <div className="h-4 w-28 animate-pulse rounded bg-muted" />
              <div className="h-3 w-12 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </td>
        <td className="px-2 py-4 sm:px-4 md:px-6">
          <div className="ml-auto h-4 w-24 animate-pulse rounded bg-muted" />
        </td>
        <td className="px-2 py-4 sm:px-4 md:px-6">
          <div className="ml-auto h-4 w-14 animate-pulse rounded bg-muted" />
        </td>
        <td className="hidden px-4 py-4 lg:table-cell lg:px-6">
          <div className="ml-auto h-4 w-24 animate-pulse rounded bg-muted" />
        </td>
        <td className="hidden px-4 py-4 lg:table-cell lg:px-6">
          <div className="ml-auto h-4 w-20 animate-pulse rounded bg-muted" />
        </td>
        <td className="px-1 py-4 sm:px-4 md:px-6">
          <div className="ml-auto size-9 animate-pulse rounded bg-muted" />
        </td>
      </tr>
    ))}
  </>
)

const MarketsPage = () => {
  const [search, setSearch] = useState('')
  const { cryptos, error: binanceListError } = useBinanceCryptoList()
  const { error: livePriceError, prices, status } = useBinanceLivePrices()
  const { data: coinMarkets, error: coinGeckoError, isPending } = useCoinMarketsQuery()
  const { isInWatchlist, toggleAsset } = useWatchlist()

  const markets = useMemo(() => {
    const binanceSymbols = new Map(cryptos.map((crypto) => [crypto.asset, crypto.symbol]))
    const searchValue = search.trim().toLowerCase()

    return (coinMarkets ?? [])
      .filter((coin) => binanceSymbols.has(coin.symbol.toUpperCase()))
      .filter(
        (coin) =>
          coin.name.toLowerCase().includes(searchValue) ||
          coin.symbol.toLowerCase().includes(searchValue),
      )
      .map((coin) => ({
        ...coin,
        binanceSymbol: binanceSymbols.get(coin.symbol.toUpperCase())!,
      }))
  }, [coinMarkets, cryptos, search])

  const error = binanceListError ?? livePriceError ?? coinGeckoError?.message

  return (
    <section className="p-4 md:p-6">
      <div className="mx-auto max-w-7xl rounded-xl border border-border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border p-4 md:p-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Cryptocurrency market</h1>
              <span
                className={`size-2 rounded-full ${
                  status === 'connected'
                    ? 'bg-green-500'
                    : status === 'connecting'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`}
                title={`Live prices: ${status}`}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              CoinGecko market data with live Binance prices
            </p>
          </div>

          <label className="relative w-full sm:w-72">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <span className="sr-only">Search cryptocurrencies</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name or symbol..."
              className="w-full rounded-md border border-input bg-background py-2 pr-3 pl-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border text-left text-sm text-muted-foreground">
                <th className="hidden w-16 px-4 py-3 font-medium sm:table-cell md:px-6">#</th>
                <th className="px-2 py-3 font-medium sm:px-4 md:px-6">Currency</th>
                <th className="px-2 py-3 text-right font-medium sm:px-4 md:px-6">Live price</th>
                <th className="px-2 py-3 text-right font-medium sm:px-4 md:px-6">24h</th>
                <th className="hidden px-4 py-3 text-right font-medium lg:table-cell lg:px-6">
                  Market cap
                </th>
                <th className="hidden px-4 py-3 text-right font-medium lg:table-cell lg:px-6">
                  Volume
                </th>
                <th className="w-11 px-1 py-3 sm:w-16 sm:px-4 md:px-6">
                  <span className="sr-only">Watchlist</span>
                </th>
              </tr>
            </thead>
            <tbody aria-busy={isPending}>
              {isPending && <CryptoTableSkeleton />}

              {!isPending &&
                markets.map((coin) => {
                  const livePrice = prices[coin.binanceSymbol]
                  const displayedPrice = livePrice?.price ?? coin.current_price

                  return (
                    <tr
                      key={coin.id}
                      className="border-b border-border transition-colors last:border-0 hover:bg-muted/50"
                    >
                      <td className="hidden px-4 py-4 text-sm text-muted-foreground sm:table-cell md:px-6">
                        {coin.market_cap_rank ?? '—'}
                      </td>
                      <td className="px-2 py-4 sm:px-4 md:px-6">
                        <Link
                          to={`/markets/${coin.id}`}
                          className="flex min-w-0 items-center gap-2 font-medium hover:underline sm:gap-3"
                        >
                          <img
                            src={coin.image}
                            alt=""
                            className="size-9 rounded-full"
                            loading="lazy"
                          />
                          <span className="min-w-0">
                            <span className="block max-w-24 truncate sm:max-w-none">
                              {coin.name}
                            </span>
                            <span className="block text-xs text-muted-foreground uppercase">
                              {coin.symbol}
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td
                        className={`px-2 py-4 text-right text-sm font-semibold whitespace-nowrap tabular-nums transition-colors sm:px-4 sm:text-base md:px-6 ${
                          livePrice?.direction === 'up'
                            ? 'text-green-600 dark:text-green-400'
                            : livePrice?.direction === 'down'
                              ? 'text-red-600 dark:text-red-400'
                              : ''
                        }`}
                      >
                        <span className="inline-flex items-center justify-end gap-1">
                          {livePrice?.direction === 'up' && <ArrowUp className="size-3.5" />}
                          {livePrice?.direction === 'down' && <ArrowDown className="size-3.5" />}
                          {formatPrice(displayedPrice)}
                        </span>
                      </td>
                      <td
                        className={`px-2 py-4 text-right text-sm font-medium whitespace-nowrap sm:px-4 sm:text-base md:px-6 ${
                          (coin.price_change_percentage_24h ?? 0) >= 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {coin.price_change_percentage_24h === null
                          ? '—'
                          : `${coin.price_change_percentage_24h.toFixed(2)}%`}
                      </td>
                      <td className="hidden px-4 py-4 text-right tabular-nums lg:table-cell lg:px-6">
                        {formatCompactCurrency(coin.market_cap)}
                      </td>
                      <td className="hidden px-4 py-4 text-right tabular-nums lg:table-cell lg:px-6">
                        {formatCompactCurrency(coin.total_volume)}
                      </td>
                      <td className="px-1 py-4 text-right sm:px-4 md:px-6">
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
                        />
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>

        {!isPending && markets.length === 0 && !error && (
          <p className="p-8 text-center text-muted-foreground">
            No cryptocurrencies match “{search}”.
          </p>
        )}

        {error && <p className="p-6 text-sm text-destructive">{error}</p>}
      </div>
    </section>
  )
}

export default MarketsPage
