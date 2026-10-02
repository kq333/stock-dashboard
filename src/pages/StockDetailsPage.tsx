import { translateError } from '@/lib/translationErrors'
import { formatNumber, getLocale } from '@/lib/formatters'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import WatchlistButton from '@/components/WatchlistButton'
import { useFinnhubStockPrices } from '@/hooks/useFinnhubStockPrices'
import { useWatchlist } from '@/hooks/useWatchlist'
import { useStockDetailsQuery } from '@/services/stockService'

const formatCurrency = (locale: string, value?: number | null) =>
  value === undefined || value === null
    ? '—'
    : new Intl.NumberFormat(locale, {
        currency: 'USD',
        maximumFractionDigits: 2,
        style: 'currency',
      }).format(value)

const formatCompact = (locale: string, value?: number | null) =>
  value === undefined || value === null
    ? '—'
    : new Intl.NumberFormat(locale, {
        maximumFractionDigits: 2,
        notation: 'compact',
      }).format(value)

const StockDetailsPage = () => {
  const { t, i18n } = useTranslation()
  const locale = getLocale(i18n.resolvedLanguage)

  const { symbol = '' } = useParams()
  const normalizedSymbol = symbol.toUpperCase()
  const { data, error, isPending } = useStockDetailsQuery(normalizedSymbol)
  const { prices } = useFinnhubStockPrices([normalizedSymbol])
  const { isInWatchlist, toggleAsset } = useWatchlist()
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
          {t('Back to S&P 500 leaders')}
        </Link>

        {isPending ? (
          <div className="h-72 animate-pulse rounded-xl bg-muted" />
        ) : error || !quote || !profile ? (
          <p className="text-destructive">
            {translateError(error?.message ?? 'Stock details are unavailable.', t)}
          </p>
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
                    <div className="flex flex-wrap items-center gap-3">
                      <h1 className="text-3xl font-bold">{profile.name}</h1>
                      <WatchlistButton
                        assetName={profile.name}
                        isSaved={isInWatchlist({ id: normalizedSymbol, type: 'stock' })}
                        onToggle={() =>
                          toggleAsset({
                            id: normalizedSymbol,
                            name: profile.name,
                            symbol: normalizedSymbol,
                            type: 'stock',
                          })
                        }
                        showLabel
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {profile.exchange} · {profile.finnhubIndustry}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-3xl font-bold">
                    {formatCurrency(locale, livePrice ?? quote.c)}
                  </p>
                  <p
                    className={`font-medium ${
                      quote.dp >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {quote.dp >= 0 ? '+' : ''}
                    {formatNumber(quote.dp, 2, locale)}%
                  </p>
                </div>
              </div>
            </div>

            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                [t('Previous close'), formatCurrency(locale, quote.pc)],
                [t('Opening price'), formatCurrency(locale, quote.o)],
                [t('Day high'), formatCurrency(locale, quote.h)],
                [t('Day low'), formatCurrency(locale, quote.l)],
                [t('Price change'), formatCurrency(locale, quote.d)],
                [
                  t('Market capitalization'),
                  `$${formatCompact(locale, profile.marketCapitalization * 1_000_000)}`,
                ],
                [
                  t('Shares outstanding'),
                  formatCompact(locale, profile.shareOutstanding * 1_000_000),
                ],
                [
                  t('IPO date'),
                  profile.ipo
                    ? new Date(`${profile.ipo}T00:00:00`).toLocaleDateString(locale)
                    : '—',
                ],
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
                {t('Visit')} {profile.name}
                <ExternalLink className="size-4" />
              </a>
            )}

            <p className="text-sm text-muted-foreground">
              {t(
                'Historical stock charts are not included because Finnhub restricts that endpoint on the free plan.',
              )}
            </p>
          </>
        )}
      </div>
    </section>
  )
}

export default StockDetailsPage
