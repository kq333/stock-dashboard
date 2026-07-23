import { ArrowLeft, ExternalLink } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useFinnhubStockPrices } from '@/hooks/useFinnhubStockPrices'
import { useStockDetailsQuery } from '@/services/stockService'

const formatCurrency = (value?: number | null) =>
  value === undefined || value === null
    ? '—'
    : new Intl.NumberFormat(undefined, {
        currency: 'USD',
        maximumFractionDigits: 2,
        style: 'currency',
      }).format(value)

const formatCompact = (value?: number | null) =>
  value === undefined || value === null
    ? '—'
    : new Intl.NumberFormat(undefined, {
        maximumFractionDigits: 2,
        notation: 'compact',
      }).format(value)

const StockDetailsPage = () => {
  const { symbol = '' } = useParams()
  const normalizedSymbol = symbol.toUpperCase()
  const { data, error, isPending } = useStockDetailsQuery(normalizedSymbol)
  const { prices } = useFinnhubStockPrices([normalizedSymbol])
  const livePrice = prices[normalizedSymbol]?.price
  const quote = data?.quote
  const profile = data?.profile

  return (
    <section className="p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <Link
          to="/markets/stocks"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to S&amp;P 500 leaders
        </Link>

        {isPending ? (
          <div className="h-72 animate-pulse rounded-xl bg-muted" />
        ) : error || !quote || !profile ? (
          <p className="text-destructive">{error?.message ?? 'Stock details are unavailable.'}</p>
        ) : (
          <>
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm md:p-6">
              <div className="flex flex-wrap items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  {profile.logo && (
                    <img
                      src={profile.logo}
                      alt=""
                      className="size-16 rounded-lg bg-white object-contain p-1"
                    />
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">{normalizedSymbol}</p>
                    <h1 className="text-3xl font-bold">{profile.name}</h1>
                    <p className="text-sm text-muted-foreground">
                      {profile.exchange} · {profile.finnhubIndustry}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-3xl font-bold">{formatCurrency(livePrice ?? quote.c)}</p>
                  <p
                    className={`font-medium ${
                      quote.dp >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {quote.dp >= 0 ? '+' : ''}
                    {quote.dp.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>

            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['Previous close', formatCurrency(quote.pc)],
                ['Open', formatCurrency(quote.o)],
                ['Day high', formatCurrency(quote.h)],
                ['Day low', formatCurrency(quote.l)],
                ['Price change', formatCurrency(quote.d)],
                [
                  'Market capitalization',
                  `$${formatCompact(profile.marketCapitalization * 1_000_000)}`,
                ],
                ['Shares outstanding', formatCompact(profile.shareOutstanding * 1_000_000)],
                ['IPO date', profile.ipo || '—'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-border bg-card p-4">
                  <dt className="text-sm text-muted-foreground">{label}</dt>
                  <dd className="mt-1 text-lg font-semibold">{value}</dd>
                </div>
              ))}
            </dl>

            {profile.weburl && (
              <a
                href={profile.weburl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 font-medium hover:underline"
              >
                Visit {profile.name}
                <ExternalLink className="size-4" />
              </a>
            )}

            <p className="text-sm text-muted-foreground">
              Historical stock charts are not included because Finnhub restricts that endpoint on
              the free plan.
            </p>
          </>
        )}
      </div>
    </section>
  )
}

export default StockDetailsPage
