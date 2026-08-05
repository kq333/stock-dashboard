import { useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Landmark } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  useMarketCalendarQuery,
  type EarningsEvent,
  type IpoEvent,
} from '@/services/calendarService'

type CalendarFilter = 'all' | 'earnings' | 'ipos'

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const EMPTY_EARNINGS: EarningsEvent[] = []
const EMPTY_IPOS: IpoEvent[] = []

const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`

const formatCompactCurrency = (value: number | null) => {
  if (value === null) return '—'

  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    maximumFractionDigits: 2,
    notation: 'compact',
    style: 'currency',
  }).format(value)
}

const getHourLabel = (hour: EarningsEvent['hour']) => {
  if (hour === 'bmo') return 'Before market open'
  if (hour === 'amc') return 'After market close'
  if (hour === 'dmh') return 'During market hours'
  return 'Time not announced'
}

const CalendarPage = () => {
  const today = new Date()
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  )
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(today))
  const [filter, setFilter] = useState<CalendarFilter>('all')
  const monthStart = useMemo(
    () => new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1),
    [visibleMonth],
  )
  const monthEnd = useMemo(
    () => new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0),
    [visibleMonth],
  )
  const from = toDateKey(monthStart)
  const to = toDateKey(monthEnd)
  const { data, error, isPending } = useMarketCalendarQuery(from, to)
  const earnings = data?.earnings ?? EMPTY_EARNINGS
  const ipos = data?.ipos ?? EMPTY_IPOS

  const earningsByDate = useMemo(() => {
    const grouped = new Map<string, EarningsEvent[]>()

    earnings.forEach((event) => {
      grouped.set(event.date, [...(grouped.get(event.date) ?? []), event])
    })

    return grouped
  }, [earnings])

  const iposByDate = useMemo(() => {
    const grouped = new Map<string, IpoEvent[]>()

    ipos.forEach((event) => {
      grouped.set(event.date, [...(grouped.get(event.date) ?? []), event])
    })

    return grouped
  }, [ipos])

  const calendarDays = useMemo(() => {
    const mondayOffset = (monthStart.getDay() + 6) % 7
    const totalCells = Math.ceil((mondayOffset + monthEnd.getDate()) / 7) * 7

    return Array.from({ length: totalCells }, (_, index) => {
      const date = new Date(
        visibleMonth.getFullYear(),
        visibleMonth.getMonth(),
        index - mondayOffset + 1,
      )

      return {
        date,
        isCurrentMonth: date.getMonth() === visibleMonth.getMonth(),
        key: toDateKey(date),
      }
    })
  }, [monthEnd, monthStart, visibleMonth])

  const getVisibleEvents = (date: string) => {
    const dayEarnings = filter === 'ipos' ? [] : (earningsByDate.get(date) ?? [])
    const dayIpos = filter === 'earnings' ? [] : (iposByDate.get(date) ?? [])

    return {
      earnings: dayEarnings,
      ipos: dayIpos,
      total: dayEarnings.length + dayIpos.length,
    }
  }

  const selectedEvents = getVisibleEvents(selectedDate)
  const agendaDays = calendarDays.filter(
    ({ isCurrentMonth, key }) => isCurrentMonth && getVisibleEvents(key).total > 0,
  )
  const beforeOpenCount = earnings.filter(({ hour }) => hour === 'bmo').length
  const afterCloseCount = earnings.filter(({ hour }) => hour === 'amc').length

  const changeMonth = (offset: number) => {
    const nextMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + offset, 1)
    setVisibleMonth(nextMonth)
    setSelectedDate(toDateKey(nextMonth))
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Upcoming events
          </p>
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight sm:text-4xl">
            <CalendarDays className="size-8" aria-hidden="true" />
            Market calendar
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            US earnings announcements and upcoming IPOs from Finnhub.
          </p>
        </div>

        <div className="inline-flex rounded-lg border border-border bg-card p-1">
          {(['all', 'earnings', 'ipos'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`cursor-pointer rounded-md px-3 py-2 text-sm font-medium capitalize transition-colors ${
                filter === value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {value === 'ipos' ? 'IPOs' : value}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Earnings events', earnings.length],
          ['IPO events', ipos.length],
          ['Before market open', beforeOpenCount],
          ['After market close', afterCloseCount],
        ].map(([label, value]) => (
          <article
            key={label}
            className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm"
          >
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            {isPending ? (
              <div className="mt-3 h-8 w-20 animate-pulse rounded bg-muted" />
            ) : (
              <p className="mt-2 text-2xl font-bold">{value}</p>
            )}
          </article>
        ))}
      </div>

      <article className="mt-4 overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-border p-4 sm:px-6">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            className="inline-flex size-9 cursor-pointer items-center justify-center rounded-md border border-border transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          <h2 className="text-lg font-semibold">
            {visibleMonth.toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </h2>
          <button
            type="button"
            onClick={() => changeMonth(1)}
            className="inline-flex size-9 cursor-pointer items-center justify-center rounded-md border border-border transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            aria-label="Next month"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </div>

        {isPending ? (
          <div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-4">
            {Array.from({ length: 12 }, (_, index) => (
              <div key={index} className="h-28 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : (
          <>
            <div className="hidden grid-cols-7 border-b border-border text-center text-xs font-medium text-muted-foreground md:grid">
              {WEEK_DAYS.map((day) => (
                <div key={day} className="border-r border-border py-3 last:border-r-0">
                  {day}
                </div>
              ))}
            </div>

            <div className="hidden grid-cols-7 md:grid">
              {calendarDays.map(({ date, isCurrentMonth, key }) => {
                const events = getVisibleEvents(key)
                const isSelected = selectedDate === key
                const isToday = toDateKey(today) === key

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => isCurrentMonth && setSelectedDate(key)}
                    disabled={!isCurrentMonth}
                    className={`min-h-32 border-r border-b border-border p-2 text-left align-top transition-colors last:border-r-0 disabled:cursor-default ${
                      isSelected ? 'bg-muted' : 'hover:bg-muted/50'
                    } ${isCurrentMonth ? '' : 'bg-muted/20 text-muted-foreground/40'}`}
                  >
                    <span
                      className={`grid size-7 place-items-center rounded-full text-sm ${
                        isToday ? 'bg-primary font-semibold text-primary-foreground' : ''
                      }`}
                    >
                      {date.getDate()}
                    </span>

                    <span className="mt-2 block space-y-1">
                      {events.earnings.length > 0 && (
                        <span className="block truncate rounded bg-blue-500/10 px-1.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-300">
                          {events.earnings.length} earnings
                        </span>
                      )}
                      {events.ipos.length > 0 && (
                        <span className="block truncate rounded bg-violet-500/10 px-1.5 py-1 text-xs font-medium text-violet-700 dark:text-violet-300">
                          {events.ipos.length} {events.ipos.length === 1 ? 'IPO' : 'IPOs'}
                        </span>
                      )}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="divide-y divide-border md:hidden">
              {agendaDays.length > 0 ? (
                agendaDays.map(({ date, key }) => {
                  const events = getVisibleEvents(key)

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedDate(key)}
                      className={`flex w-full cursor-pointer items-center justify-between gap-4 p-4 text-left transition-colors ${
                        selectedDate === key ? 'bg-muted' : 'hover:bg-muted/50'
                      }`}
                    >
                      <span>
                        <span className="block font-semibold">
                          {date.toLocaleDateString('en-US', {
                            day: 'numeric',
                            month: 'short',
                            weekday: 'short',
                          })}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {events.earnings.length} earnings · {events.ipos.length} IPOs
                        </span>
                      </span>
                      <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
                    </button>
                  )
                })
              ) : (
                <p className="p-8 text-center text-sm text-muted-foreground">
                  No events found for this month and filter.
                </p>
              )}
            </div>
          </>
        )}
      </article>

      <article className="mt-4 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm">
        <div className="mb-4">
          <p className="text-sm font-medium text-muted-foreground">Selected date</p>
          <h2 className="text-xl font-semibold">
            {new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'long',
              weekday: 'long',
              year: 'numeric',
            })}
          </h2>
        </div>

        {selectedEvents.total > 0 ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {selectedEvents.earnings.slice(0, 50).map((event, index) => (
              <div
                key={`${event.symbol}-${event.date}-${event.quarter}-${index}`}
                className="rounded-lg border border-border p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Link
                      to={`/markets/stocks/${event.symbol}`}
                      className="font-semibold hover:underline"
                    >
                      {event.symbol}
                    </Link>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock3 className="size-3" aria-hidden="true" />
                      {getHourLabel(event.hour)}
                    </p>
                  </div>
                  <span className="rounded bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300">
                    Q{event.quarter} {event.year}
                  </span>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground">EPS estimate</dt>
                    <dd className="font-medium">
                      {event.epsEstimate === null ? '—' : event.epsEstimate.toFixed(2)}
                    </dd>
                  </div>
                  <div className="text-right">
                    <dt className="text-muted-foreground">Revenue estimate</dt>
                    <dd className="font-medium">{formatCompactCurrency(event.revenueEstimate)}</dd>
                  </div>
                </dl>
              </div>
            ))}

            {selectedEvents.ipos.map((event, index) => (
              <div
                key={`${event.symbol}-${event.name}-${event.date}-${index}`}
                className="rounded-lg border border-border p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">{event.name}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Landmark className="size-3" aria-hidden="true" />
                      {event.exchange || 'Exchange not announced'}
                      {event.symbol && ` · ${event.symbol}`}
                    </p>
                  </div>
                  <span className="rounded bg-violet-500/10 px-2 py-1 text-xs font-medium text-violet-700 capitalize dark:text-violet-300">
                    {event.status}
                  </span>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Expected price</dt>
                    <dd className="font-medium">{event.price || '—'}</dd>
                  </div>
                  <div className="text-right">
                    <dt className="text-muted-foreground">Offer value</dt>
                    <dd className="font-medium">{formatCompactCurrency(event.totalSharesValue)}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No events for this date and filter.
          </p>
        )}

        {selectedEvents.earnings.length > 50 && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Showing the first 50 of {selectedEvents.earnings.length} earnings events.
          </p>
        )}
      </article>

      {error && (
        <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          Calendar data is temporarily unavailable: {error.message}
        </p>
      )}
    </section>
  )
}

export default CalendarPage
