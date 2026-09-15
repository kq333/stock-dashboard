import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { ArrowDown, ArrowUp, BriefcaseBusiness, Plus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useBinanceLivePrices } from '@/hooks/useBinanceLivePrices'
import { useFinnhubStockPrices } from '@/hooks/useFinnhubStockPrices'
import { useCoinMarketsQuery } from '@/services/coinGeckoService'
import { DASHBOARD_STOCKS, SP500_LEADERS, useWatchlistStocksQuery } from '@/services/stockService'

type PortfolioHolding = {
  averageCost: number
  id: string
  name: string
  quantity: number
  symbol: string
  type: 'crypto' | 'stock'
}

const PORTFOLIO_STORAGE_KEY = 'stock-dashboard-portfolio'

const stockOptions = Array.from(
  new Map(
    [...DASHBOARD_STOCKS, ...SP500_LEADERS].map((company) => [company.symbol, company]),
  ).values(),
)

const isPortfolioHolding = (value: unknown): value is PortfolioHolding => {
  if (!value || typeof value !== 'object') return false

  const holding = value as Partial<PortfolioHolding>

  return (
    typeof holding.averageCost === 'number' &&
    holding.averageCost >= 0 &&
    typeof holding.id === 'string' &&
    typeof holding.name === 'string' &&
    typeof holding.quantity === 'number' &&
    holding.quantity > 0 &&
    typeof holding.symbol === 'string' &&
    (holding.type === 'crypto' || holding.type === 'stock')
  )
}

const getInitialPortfolio = () => {
  try {
    const savedPortfolio = localStorage.getItem(PORTFOLIO_STORAGE_KEY)
    if (!savedPortfolio) return []

    const parsed: unknown = JSON.parse(savedPortfolio)
    return Array.isArray(parsed) && parsed.every(isPortfolioHolding) ? parsed : []
  } catch {
    return []
  }
}

const formatCurrency = (value: number, compact = false) =>
  new Intl.NumberFormat('en-US', {
    currency: 'USD',
    maximumFractionDigits: compact ? 2 : value < 1 ? 6 : 2,
    notation: compact ? 'compact' : 'standard',
    style: 'currency',
  }).format(value)

const formatQuantity = (value: number) =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 8 }).format(value)

type SummaryCardProps = {
  label: string
  value: string
  valueClassName?: string
}

const SummaryCard = ({ label, value, valueClassName = '' }: SummaryCardProps) => (
  <article className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm">
    <p className="text-sm font-medium text-muted-foreground">{label}</p>
    <p className={`mt-2 text-2xl font-bold tracking-tight ${valueClassName}`}>{value}</p>
  </article>
)

const PortfolioPage = () => {
  const [holdings, setHoldings] = useState<PortfolioHolding[]>(getInitialPortfolio)
  const [selectedAsset, setSelectedAsset] = useState('')
  const [quantity, setQuantity] = useState('')
  const [averageCost, setAverageCost] = useState('')
  const [formError, setFormError] = useState('')
  const {
    data: coinMarkets = [],
    error: coinError,
    isPending: areCoinsPending,
  } = useCoinMarketsQuery()
  const { error: cryptoLiveError, prices: cryptoLivePrices } = useBinanceLivePrices()
  const stockSymbols = holdings
    .filter((holding) => holding.type === 'stock')
    .map(({ symbol }) => symbol)
  const {
    data: portfolioStocks = [],
    error: stockError,
    isPending: areStocksPending,
  } = useWatchlistStocksQuery(stockSymbols)
  const { error: stockLiveError, prices: stockLivePrices } = useFinnhubStockPrices(stockSymbols)

  useEffect(() => {
    localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(holdings))
  }, [holdings])

  const coinById = new Map(coinMarkets.map((coin) => [coin.id, coin]))
  const stockBySymbol = new Map(portfolioStocks.map((stock) => [stock.symbol, stock]))

  const positions = holdings.map((holding) => {
    const coin = holding.type === 'crypto' ? coinById.get(holding.id) : undefined
    const stock = holding.type === 'stock' ? stockBySymbol.get(holding.symbol) : undefined
    const livePrice =
      holding.type === 'crypto'
        ? cryptoLivePrices[`${holding.symbol.toUpperCase()}USDT`]?.price
        : stockLivePrices[holding.symbol]?.price
    const currentPrice = livePrice ?? coin?.current_price ?? stock?.quote?.c ?? 0
    const invested = holding.quantity * holding.averageCost
    const value = holding.quantity * currentPrice
    const profitLoss = value - invested
    const profitLossPercentage = invested > 0 ? (profitLoss / invested) * 100 : 0

    return {
      ...holding,
      currentPrice,
      image: coin?.image,
      invested,
      profitLoss,
      profitLossPercentage,
      value,
    }
  })

  const totals = useMemo(
    () =>
      positions.reduce(
        (result, position) => ({
          invested: result.invested + position.invested,
          value: result.value + position.value,
        }),
        { invested: 0, value: 0 },
      ),
    [positions],
  )
  const totalProfitLoss = totals.value - totals.invested
  const totalReturn = totals.invested > 0 ? (totalProfitLoss / totals.invested) * 100 : 0
  const errors = [coinError?.message, stockError?.message, cryptoLiveError, stockLiveError].filter(
    Boolean,
  )

  const handleAddHolding = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const parsedQuantity = Number(quantity)
    const parsedAverageCost = Number(averageCost)

    if (!selectedAsset || parsedQuantity <= 0 || parsedAverageCost < 0) {
      setFormError('Select an asset and enter a valid quantity and average purchase price.')
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

    setHoldings((currentHoldings) => {
      const existingHolding = currentHoldings.find(
        (holding) => holding.id === asset.id && holding.type === asset.type,
      )

      if (!existingHolding) {
        return [
          ...currentHoldings,
          {
            ...asset,
            averageCost: parsedAverageCost,
            quantity: parsedQuantity,
          },
        ]
      }

      const nextQuantity = existingHolding.quantity + parsedQuantity
      const nextAverageCost =
        (existingHolding.quantity * existingHolding.averageCost +
          parsedQuantity * parsedAverageCost) /
        nextQuantity

      return currentHoldings.map((holding) =>
        holding.id === asset.id && holding.type === asset.type
          ? {
              ...holding,
              averageCost: nextAverageCost,
              quantity: nextQuantity,
            }
          : holding,
      )
    })
    setSelectedAsset('')
    setQuantity('')
    setAverageCost('')
    setFormError('')
  }

  const removeHolding = (holdingToRemove: PortfolioHolding) => {
    setHoldings((currentHoldings) =>
      currentHoldings.filter(
        (holding) => holding.id !== holdingToRemove.id || holding.type !== holdingToRemove.type,
      ),
    )
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-7">
        <p className="mb-1 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
          Personal finance
        </p>
        <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight sm:text-4xl">
          <BriefcaseBusiness className="size-8" aria-hidden="true" />
          Portfolio
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Track your holdings and unrealized performance. Data stays in this browser.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Portfolio value" value={formatCurrency(totals.value, true)} />
        <SummaryCard label="Total invested" value={formatCurrency(totals.invested, true)} />
        <SummaryCard
          label="Unrealized profit/loss"
          value={`${totalProfitLoss >= 0 ? '+' : ''}${formatCurrency(totalProfitLoss, true)}`}
          valueClassName={
            totalProfitLoss >= 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }
        />
        <SummaryCard
          label="Total return"
          value={`${totalReturn >= 0 ? '+' : ''}${totalReturn.toFixed(2)}%`}
          valueClassName={
            totalReturn >= 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }
        />
      </div>

      <article className="mt-4 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Add a position</h2>
          <p className="text-sm text-muted-foreground">
            Adding the same asset again recalculates its weighted average cost.
          </p>
        </div>

        <form
          onSubmit={handleAddHolding}
          className="grid items-end gap-3 md:grid-cols-[minmax(0,2fr)_1fr_1fr_auto]"
        >
          <label className="grid gap-1.5 text-sm font-medium">
            Asset
            <select
              value={selectedAsset}
              onChange={(event) => setSelectedAsset(event.target.value)}
              className="h-11 w-full rounded-md border border-input bg-background px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Select crypto or stock</option>
              <optgroup label="Cryptocurrencies">
                {coinMarkets.map((coin) => (
                  <option key={coin.id} value={`crypto:${coin.id}`}>
                    {coin.name} ({coin.symbol.toUpperCase()})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Stocks and ETFs">
                {stockOptions.map((stock) => (
                  <option key={stock.symbol} value={`stock:${stock.symbol}`}>
                    {stock.name} ({stock.symbol})
                  </option>
                ))}
              </optgroup>
            </select>
          </label>

          <label className="grid gap-1.5 text-sm font-medium">
            Quantity
            <input
              type="number"
              min="0"
              step="any"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              placeholder="0"
              className="h-11 rounded-md border border-input bg-background px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>

          <label className="grid gap-1.5 text-sm font-medium">
            Average cost (USD)
            <input
              type="number"
              min="0"
              step="any"
              value={averageCost}
              onChange={(event) => setAverageCost(event.target.value)}
              placeholder="0.00"
              className="h-11 rounded-md border border-input bg-background px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>

          <button
            type="submit"
            disabled={areCoinsPending}
            className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="size-4" aria-hidden="true" />
            Add
          </button>
        </form>

        {formError && <p className="mt-3 text-sm text-destructive">{formError}</p>}
      </article>

      <div className="mt-4">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Holdings</h2>
            <p className="text-sm text-muted-foreground">
              {holdings.length} {holdings.length === 1 ? 'position' : 'positions'}
            </p>
          </div>
          {(areCoinsPending || areStocksPending) && (
            <span className="text-xs text-muted-foreground">Updating prices...</span>
          )}
        </div>

        {positions.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {positions.map((position) => {
              const isPositive = position.profitLoss >= 0
              const allocation = totals.value > 0 ? (position.value / totals.value) * 100 : 0
              const destination =
                position.type === 'crypto'
                  ? `/markets/${position.id}`
                  : `/markets/stocks/${position.symbol}`

              return (
                <article
                  key={`${position.type}:${position.id}`}
                  className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <Link
                      to={destination}
                      className="flex min-w-0 items-center gap-3 hover:underline"
                    >
                      {position.image ? (
                        <img src={position.image} alt="" className="size-10 rounded-full" />
                      ) : (
                        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted text-xs font-bold">
                          {position.symbol.slice(0, 2)}
                        </span>
                      )}
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{position.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {position.symbol} · {formatQuantity(position.quantity)} units
                        </span>
                      </span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => removeHolding(position)}
                      className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      aria-label={`Remove ${position.name} from portfolio`}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Current price</p>
                      <p className="mt-1 font-semibold">{formatCurrency(position.currentPrice)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground">Market value</p>
                      <p className="mt-1 font-semibold">{formatCurrency(position.value)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Average cost</p>
                      <p className="mt-1 font-semibold">{formatCurrency(position.averageCost)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground">Profit/loss</p>
                      <p
                        className={`mt-1 inline-flex items-center justify-end gap-1 font-semibold ${
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
                        {isPositive ? '+' : ''}
                        {formatCurrency(position.profitLoss)} (
                        {position.profitLossPercentage.toFixed(2)}%)
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                      <span>Portfolio allocation</span>
                      <span>{allocation.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-[width] duration-300"
                        style={{ width: `${Math.min(allocation, 100)}%` }}
                      />
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="grid min-h-64 place-items-center rounded-xl border border-dashed border-border p-8 text-center">
            <div>
              <BriefcaseBusiness
                className="mx-auto size-10 text-muted-foreground"
                aria-hidden="true"
              />
              <h2 className="mt-4 text-lg font-semibold">Your portfolio is empty</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Add your first position to start tracking performance.
              </p>
            </div>
          </div>
        )}
      </div>

      {errors.length > 0 && (
        <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          Some portfolio prices are temporarily unavailable: {errors[0]}
        </p>
      )}
    </section>
  )
}

export default PortfolioPage
