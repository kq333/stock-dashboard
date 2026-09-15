import { useEffect, useRef } from 'react'
import {
  CandlestickSeries,
  ColorType,
  createChart,
  type IChartApi,
  type ISeriesApi,
} from 'lightweight-charts'
import { useBinanceKlines } from '@/hooks/useBinanceKlines'

type CryptoChartProps = {
  height?: number
  symbol: string
  title?: string
}

const getChartColors = () => {
  const isDark = document.documentElement.classList.contains('dark')

  return {
    background: isDark ? '#202020' : '#ffffff',
    grid: isDark ? '#343434' : '#eeeeee',
    text: isDark ? '#d4d4d4' : '#525252',
  }
}

const CryptoChart = ({
  height = 480,
  symbol,
  title = 'Live candlestick chart',
}: CryptoChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const hasFittedContentRef = useRef(false)
  const { candles, error, status } = useBinanceKlines(symbol)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const colors = getChartColors()
    const chart = createChart(container, {
      width: container.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: colors.background },
        textColor: colors.text,
      },
      grid: {
        vertLines: { color: colors.grid },
        horzLines: { color: colors.grid },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: {
        borderVisible: false,
        secondsVisible: false,
        timeVisible: true,
      },
    })

    const series = chart.addSeries(CandlestickSeries, {
      borderVisible: false,
      downColor: '#ef4444',
      upColor: '#22c55e',
      wickDownColor: '#ef4444',
      wickUpColor: '#22c55e',
    })

    chartRef.current = chart
    seriesRef.current = series

    const resizeObserver = new ResizeObserver(([entry]) => {
      chart.applyOptions({ width: entry.contentRect.width })
    })
    const themeObserver = new MutationObserver(() => {
      const nextColors = getChartColors()

      chart.applyOptions({
        layout: {
          background: { type: ColorType.Solid, color: nextColors.background },
          textColor: nextColors.text,
        },
        grid: {
          horzLines: { color: nextColors.grid },
          vertLines: { color: nextColors.grid },
        },
      })
    })

    resizeObserver.observe(container)
    themeObserver.observe(document.documentElement, {
      attributeFilter: ['class'],
      attributes: true,
    })

    return () => {
      resizeObserver.disconnect()
      themeObserver.disconnect()
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
      hasFittedContentRef.current = false
    }
  }, [height])

  useEffect(() => {
    if (!seriesRef.current || candles.length === 0) return

    seriesRef.current.setData(candles)

    if (!hasFittedContentRef.current) {
      chartRef.current?.timeScale().fitContent()
      hasFittedContentRef.current = true
    }
  }, [candles])

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <span
            className={`size-2 rounded-full ${
              status === 'connected'
                ? 'bg-green-500'
                : status === 'connecting'
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
            }`}
          />
          {status}
        </span>
      </div>

      <div className="relative" style={{ minHeight: height }}>
        <div ref={containerRef} className="w-full overflow-hidden rounded-md" />
        {candles.length === 0 && !error && (
          <div className="absolute inset-0 grid place-items-center text-muted-foreground">
            Loading Binance chart...
          </div>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      <p className="mt-3 text-right text-xs text-muted-foreground">
        Charts by{' '}
        <a
          className="underline underline-offset-2 hover:text-foreground"
          href="https://www.tradingview.com/"
          rel="noreferrer"
          target="_blank"
        >
          TradingView
        </a>
      </p>
    </div>
  )
}

export default CryptoChart
