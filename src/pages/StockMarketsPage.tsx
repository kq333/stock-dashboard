import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowUp, Search } from 'lucide-react'
import { useFinnhubStockPrices } from '@/hooks/useFinnhubStockPrices'
import { useWatchlist } from '@/hooks/useWatchlist'
import { SP500_LEADERS, useStockMarketQuery } from '@/services/stockService'
import WatchlistButton from '@/components/WatchlistButton'

const formatPrice = (value: number | null) =>
  value === null
    ? '—'
    : new Intl.NumberFormat('en-US', {
        currency: 'USD',
        maximumFractionDigits: 2,
        style: 'currency',
      }).format(value)

const StockSkeleton = () => (
  <>
    {Array.from({ length: 10 }, (_, index) => (
      <tr key={index} className="border-b border-border">
        {Array.from({ length: 6 }, (_, cell) => (
          <td
            key={cell}
            className={`py-4 ${
              cell === 1
                ? 'hidden px-4 sm:table-cell md:px-6'
                : cell === 2
                  ? 'hidden px-4 lg:table-cell lg:px-6'
                  : cell === 5
                    ? 'px-1 sm:px-4 md:px-6'
                    : 'px-2 sm:px-4 md:px-6'
            }`}
          >
            <div
              className={`h-4 animate-pulse rounded bg-muted ${
                cell === 1 ? 'w-40' : cell === 4 ? 'ml-auto w-20' : 'w-20'
              }`}
            />
          </td>
        ))}
      </tr>
    ))}
  </>
)

const StockMarketsPage = () => {
  const [search, setSearch] = useState('')
  const { data: stocks = [], error, isPending } = useStockMarketQuery()
  const { isInWatchlist, toggleAsset } = useWatchlist()
  const {
    error: liveError,
    isConnected,
    prices,
  } = useFinnhubStockPrices(SP500_LEADERS.map(({ symbol }) => symbol))
  const searchValue = search.trim().toLowerCase()
  const filteredStocks = stocks.filter(
    ({ name, symbol }) =>
      name.toLowerCase().includes(searchValue) || symbol.toLowerCase().includes(searchValue),
  )

  return (
    <section className="p-4 md:p-6">
      <div className="mx-auto max-w-7xl rounded-xl border border-border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border p-4 md:p-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">S&amp;P 500 leaders</h1>
              <span
                className={`size-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`}
                title={isConnected ? 'Finnhub live prices connected' : 'Connecting to Finnhub'}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              50 major constituents · Finnhub live US trades
            </p>
          </div>

          <label className="relative w-full sm:w-72">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <span className="sr-only">Search S&amp;P 500 stocks</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search company or symbol..."
              className="w-full rounded-md border border-input bg-background py-2 pr-3 pl-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border text-left text-sm text-muted-foreground">
                <th className="px-2 py-3 font-medium sm:px-4 md:px-6">Symbol</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell md:px-6">Company</th>
                <th className="hidden px-4 py-3 font-medium lg:table-cell lg:px-6">Sector</th>
                <th className="px-2 py-3 text-right font-medium sm:px-4 md:px-6">Price</th>
                <th className="px-2 py-3 text-right font-medium sm:px-4 md:px-6">Change</th>
                <th className="w-11 px-1 py-3 sm:w-16 sm:px-4 md:px-6">
                  <span className="sr-only">Watchlist</span>
                </th>
              </tr>
            </thead>
            <tbody aria-busy={isPending}>
              {isPending && <StockSkeleton />}
              {!isPending &&
                filteredStocks.map((stock) => {
                  const livePrice = prices[stock.symbol]
                  const displayedPrice = livePrice?.price ?? stock.quote?.c ?? null

                  return (
                    <tr
                      key={stock.symbol}
                      className="border-b border-border transition-colors last:border-0 hover:bg-muted/50"
                    >
                      <td className="px-2 py-4 font-semibold sm:px-4 md:px-6">
                        <Link to={`/markets/stocks/${stock.symbol}`} className="hover:underline">
                          <span className="block">{stock.symbol}</span>
                          <span className="block max-w-24 truncate text-xs font-normal text-muted-foreground sm:hidden">
                            {stock.name}
                          </span>
                        </Link>
                      </td>
                      <td className="hidden px-4 py-4 sm:table-cell md:px-6">{stock.name}</td>
                      <td className="hidden px-4 py-4 text-sm text-muted-foreground lg:table-cell lg:px-6">
                        {stock.sector}
                      </td>
                      <td
                        className={`px-2 py-4 text-right text-sm font-medium whitespace-nowrap tabular-nums transition-colors sm:px-4 sm:text-base md:px-6 ${
                          livePrice?.direction === 'up'
                            ? 'text-green-600 dark:text-green-400'
                            : livePrice?.direction === 'down'
                              ? 'text-red-600 dark:text-red-400'
                              : ''
                        }`}
                      >
                        <span className="inline-flex items-center gap-1">
                          {livePrice?.direction === 'up' && <ArrowUp className="size-3.5" />}
                          {livePrice?.direction === 'down' && <ArrowDown className="size-3.5" />}
                          {formatPrice(displayedPrice)}
                        </span>
                      </td>
                      <td
                        className={`px-2 py-4 text-right text-sm font-medium whitespace-nowrap sm:px-4 sm:text-base md:px-6 ${
                          (stock.quote?.dp ?? 0) >= 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {!stock.quote
                          ? '—'
                          : `${stock.quote.dp >= 0 ? '+' : ''}${stock.quote.dp.toFixed(2)}%`}
                      </td>
                      <td className="px-1 py-4 text-right sm:px-4 md:px-6">
                        <WatchlistButton
                          assetName={stock.name}
                          isSaved={isInWatchlist({ id: stock.symbol, type: 'stock' })}
                          onToggle={() =>
                            toggleAsset({
                              id: stock.symbol,
                              name: stock.name,
                              symbol: stock.symbol,
                              type: 'stock',
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

        {!isPending && filteredStocks.length === 0 && !error && (
          <p className="p-8 text-center text-muted-foreground">No stocks match “{search}”.</p>
        )}
        {(error || liveError) && (
          <p className="p-6 text-sm text-destructive">{error?.message ?? liveError}</p>
        )}
      </div>
    </section>
  )
}

export default StockMarketsPage
